/* ==========================================================
   HALFTONE PORTRAIT
   Turns an image into a grid of halftone dots on a canvas.
   Dots use --color--accent, so they follow the Dark/Light/Vibe
   switch like the cursor trail. On mouse devices the dots
   liquify away from the pointer and spring back.

   Markup (Webflow):
     <div data-halftone data-src="https://.../josh-cutout.png"></div>
   Give the div a size in Designer (e.g. width 100%, height 90vh).

   Optional attributes on [data-halftone]:
     data-spacing   grid gap in px between dot centers (default 9)
     data-radius    pointer reach in px (default 140)
     data-strength  how far dots get pushed, 0-2 (default 1)
     data-mode      "push" (default) or "swirl"
     data-fit       "contain" (default) or "cover"
     data-contrast  boosts tone contrast, 0.5-2 (default 1.15)

   Works best with a cutout PNG (transparent background):
   transparent pixels get no dots. Load site-wide (footer)
   after Barba; re-inits on Barba page changes.
   ========================================================== */
(() => {
  const DEFAULTS = {
    spacing: 9,
    radius: 140,
    strength: 1,
    mode: "push",
    fit: "contain",
    contrast: 1.15
  };
  const SPRING = 0.085;      // pull toward target (higher = snappier)
  const DAMPING = 0.82;      // velocity kept each frame (higher = wobblier)
  const POINTER_EASE = 0.22; // pointer smoothing
  const MIN_DOT = 0.06;      // tones below this (0-1) draw nothing
  const THEME_FADE = 0.12;   // dot size easing when the theme flips

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const instances = new Set();

  function readOptions(el) {
    const num = (name, fallback) => {
      const v = parseFloat(el.getAttribute("data-" + name));
      return Number.isFinite(v) ? v : fallback;
    };
    return {
      src: el.getAttribute("data-src"),
      spacing: Math.max(4, num("spacing", DEFAULTS.spacing)),
      radius: num("radius", DEFAULTS.radius),
      strength: num("strength", DEFAULTS.strength),
      mode: el.getAttribute("data-mode") || DEFAULTS.mode,
      fit: el.getAttribute("data-fit") || DEFAULTS.fit,
      contrast: num("contrast", DEFAULTS.contrast)
    };
  }

  /* Relative luminance of any CSS color, via a 1px canvas */
  const probe = document.createElement("canvas").getContext("2d", {
    willReadFrequently: true
  });
  function luminance(color) {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "#000";
    probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  /* Fallback when --color--bg-primary is missing: first opaque ancestor */
  function backgroundOf(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg)) return bg;
    }
    return "#000";
  }

  function create(el) {
    const opts = readOptions(el);
    if (!opts.src) return null;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;";
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    let dots = [];        // flat: hx, hy, x, y, vx, vy, tone, size, alpha
    const STRIDE = 9;
    let w = 0, h = 0, dpr = 1;
    let color = "#fff";
    let lightDots = true; // true = bright pixels make big dots
    let raf = 0;
    let visible = true;
    let settled = false;
    let introStart = 0;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    const ripples = [];   // touch taps: { x, y, t }

    function readTheme() {
      color = getComputedStyle(el).getPropertyValue("--color--accent").trim() || "#daf40a";
      // Light dots on a dark page show light; dark dots on a light page show shadow
      const bg = getComputedStyle(el).getPropertyValue("--color--bg-primary").trim() || backgroundOf(el);
      lightDots = luminance(color) > luminance(bg);
    }

    function build() {
      if (!img.naturalWidth) return;
      const rect = el.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Fit the image into the box, then sample one pixel per grid cell
      const s = opts.spacing;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = opts.fit === "cover"
        ? Math.max(w / iw, h / ih)
        : Math.min(w / iw, h / ih);
      const dw = iw * scale, dh = ih * scale;
      const ox = (w - dw) / 2, oy = (h - dh) / 2;
      const cols = Math.floor(w / s), rows = Math.floor(h / s);
      const sample = document.createElement("canvas");
      sample.width = cols;
      sample.height = rows;
      const sctx = sample.getContext("2d", { willReadFrequently: true });
      sctx.drawImage(img, ox / s, oy / s, dw / s, dh / s);
      const data = sctx.getImageData(0, 0, cols, rows).data;

      const startX = (w - (cols - 1) * s) / 2;
      const startY = (h - (rows - 1) * s) / 2;
      const next = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const i = (r * cols + c) * 4;
          const a = data[i + 3] / 255;
          if (a < 0.1) continue;
          let lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          lum = Math.min(1, Math.max(0, (lum - 0.5) * opts.contrast + 0.5));
          const hx = startX + c * s, hy = startY + r * s;
          next.push(hx, hy, hx, hy, 0, 0, lum, 0, a);
        }
      }
      dots = next;
      settled = false;
      if (!introStart) introStart = performance.now();
      wake();
    }

    function tick(now) {
      raf = 0;
      if (!visible || !dots.length) return;

      const animate = !reducedMotion.matches;
      const R = opts.radius;
      const push = R * 0.4 * opts.strength;
      const maxSize = opts.spacing * 0.5;
      const intro = animate ? Math.min(1, (now - introStart) / 1200) : 1;

      pointer.x += (pointer.tx - pointer.x) * POINTER_EASE;
      pointer.y += (pointer.ty - pointer.y) * POINTER_EASE;

      for (let k = ripples.length - 1; k >= 0; k -= 1) {
        if (now - ripples[k].t > 900) ripples.splice(k, 1);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.beginPath();

      let moving = intro < 1 || pointer.active || ripples.length > 0;
      const cx = w / 2, cy = h / 2, maxD = Math.hypot(cx, cy);

      for (let i = 0; i < dots.length; i += STRIDE) {
        const hx = dots[i], hy = dots[i + 1];
        let tx = hx, ty = hy, grow = 0;

        if (animate && pointer.active) {
          const dx = hx - pointer.x, dy = hy - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < R) {
            const f = 1 - d / R;
            const ease = f * f * (3 - 2 * f); // smoothstep
            const nx = d ? dx / d : 0, ny = d ? dy / d : 0;
            if (opts.mode === "swirl") {
              tx += (nx * 0.35 - ny) * push * ease;
              ty += (ny * 0.35 + nx) * push * ease;
            } else {
              tx += nx * push * ease;
              ty += ny * push * ease;
            }
            grow = ease * 0.35; // dots bunch up and darken at the ring
          }
        }

        for (let k = 0; k < ripples.length; k += 1) {
          const rp = ripples[k];
          const age = (now - rp.t) / 900;
          const ring = age * R * 2.2;
          const dx = hx - rp.x, dy = hy - rp.y;
          const d = Math.hypot(dx, dy) || 1;
          const band = 1 - Math.min(1, Math.abs(d - ring) / (R * 0.5));
          const amp = band * (1 - age) * push * 0.45;
          tx += (dx / d) * amp;
          ty += (dy / d) * amp;
        }

        // Spring each dot toward its target
        let x = dots[i + 2], y = dots[i + 3];
        let vx = dots[i + 4], vy = dots[i + 5];
        if (animate) {
          vx = (vx + (tx - x) * SPRING) * DAMPING;
          vy = (vy + (ty - y) * SPRING) * DAMPING;
          x += vx;
          y += vy;
          if (Math.abs(vx) + Math.abs(vy) > 0.01 || Math.abs(tx - x) + Math.abs(ty - y) > 0.05) {
            moving = true;
          }
        } else {
          x = tx; y = ty; vx = vy = 0;
        }
        dots[i + 2] = x; dots[i + 3] = y;
        dots[i + 4] = vx; dots[i + 5] = vy;

        // Tone -> dot size, flipped for dark-on-light themes
        const tone = (lightDots ? dots[i + 6] : 1 - dots[i + 6]) * dots[i + 8];
        const goal = tone < MIN_DOT ? 0 : Math.sqrt(tone) * maxSize;
        let size = dots[i + 7];
        size += (goal - size) * (animate ? THEME_FADE : 1);
        if (Math.abs(goal - size) > 0.02) moving = true;
        dots[i + 7] = size;

        // Intro: dots bloom out from the center
        let reveal = 1;
        if (intro < 1) {
          const d = Math.hypot(hx - cx, hy - cy) / maxD;
          reveal = Math.min(1, Math.max(0, intro * 1.6 - d * 0.6));
          reveal = reveal * reveal * (3 - 2 * reveal);
        }

        const rad = size * (1 + grow) * reveal;
        if (rad < 0.25) continue;
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
      }
      ctx.fill();

      settled = !moving;
      if (!settled) raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    }

    /* Pointer */
    function local(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMove(e) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const p = local(e);
      if (!pointer.active) {
        pointer.x = p.x;
        pointer.y = p.y;
      }
      pointer.tx = p.x;
      pointer.ty = p.y;
      pointer.active = true;
      wake();
    }
    function onLeave() {
      pointer.active = false;
      wake();
    }
    function onDown(e) {
      // Touch / phones: a tap sends a ripple through the dots
      if (e.pointerType === "mouse") return;
      const p = local(e);
      ripples.push({ x: p.x, y: p.y, t: performance.now() });
      wake();
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);

    /* Theme switch: watch class changes on <html> and <body> */
    const themeObserver = new MutationObserver(() => {
      readTheme();
      wake();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    /* Resize + visibility */
    let resizeTimer = 0;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 120);
    });
    resizeObserver.observe(el);

    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    viewObserver.observe(el);

    readTheme();
    img.onload = build;
    img.src = opts.src;

    return {
      el,
      opts,
      destroy() {
        cancelAnimationFrame(raf);
        clearTimeout(resizeTimer);
        themeObserver.disconnect();
        resizeObserver.disconnect();
        viewObserver.disconnect();
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("pointerdown", onDown);
        canvas.remove();
      }
    };
  }

  function init(root = document) {
    root.querySelectorAll("[data-halftone]").forEach((el) => {
      if (el._halftone) return;
      const inst = create(el);
      if (inst) {
        el._halftone = inst;
        instances.add(inst);
      }
    });
  }

  function destroyAll() {
    instances.forEach((inst) => {
      inst.destroy();
      delete inst.el._halftone;
    });
    instances.clear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => destroyAll());
    barba.hooks.after((data) => init(data && data.next && data.next.container || document));
  }

  window.HalftonePortrait = { init, destroyAll };
})();
