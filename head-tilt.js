/* ==========================================================
   HEAD TILT
   Halftone dot portrait that turns toward the cursor in 3D.
   A depth map pushes nearer parts of the face (nose, brow)
   further than the edges, the eyes lead a little, and the
   shading shifts with the turn. Dots use --color--accent and
   follow the Dark/Light/Vibe switch.

   Markup (Webflow):
     <div data-head-tilt
          data-src="https://.../head-tilt-face.png"
          data-depth="https://.../head-tilt-depth.png"></div>
   Give the div a size in Designer (e.g. width 100%, height 90vh).

   Optional attributes on [data-head-tilt]:
     data-turn          how far the head turns, 0-40 (default 18)
     data-spacing       grid gap in px between dot centers (default 5)
     data-spacing-small gap on phones, under 768px wide (default 3)
     data-eyes          "false" to stop the eyes leading the turn
     data-light         "false" to keep the shading fixed

   The face and depth images must be the same size and framing.
   With no cursor (or on touch) it drifts slowly on its own.
   Reduced motion = still portrait. Load site-wide (footer)
   after Barba; re-inits on Barba page changes.
   ========================================================== */
(() => {
  const DEFAULTS = { turn: 18, spacing: 5, spacingSmall: 3 };
  // Eye centers and head center as fractions of the source image
  const EYES = [[0.4389, 0.3112], [0.6, 0.3133]];
  const HEAD = [0.5222, 0.3313];
  const EASE = 0.12;       // how quickly the head catches up to the cursor
  const IDLE_MS = 2500;    // drift on its own after this long without the cursor
  const MIN_DOT = 0.05;    // tones below this (0-1) draw nothing

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smallScreen = window.matchMedia("(max-width: 767px)");

  const instances = new Set();

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

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /* Image -> Float32Arrays of gray (0-1) and alpha (0-1) */
  function pixels(img) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const n = c.width * c.height;
    const gray = new Float32Array(n), alpha = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      gray[i] = d[i * 4] / 255;
      alpha[i] = d[i * 4 + 3] / 255;
    }
    return { w: c.width, h: c.height, gray, alpha };
  }

  function create(el) {
    const src = el.getAttribute("data-src");
    const depthSrc = el.getAttribute("data-depth");
    if (!src || !depthSrc) return null;
    const num = (name, fallback) => {
      const v = parseFloat(el.getAttribute("data-" + name));
      return Number.isFinite(v) ? v : fallback;
    };
    const opts = {
      turn: num("turn", DEFAULTS.turn),
      spacingLarge: Math.max(3, num("spacing", DEFAULTS.spacing)),
      spacingSmall: Math.max(2.5, num("spacing-small", DEFAULTS.spacingSmall)),
      eyes: el.getAttribute("data-eyes") !== "false",
      light: el.getAttribute("data-light") !== "false"
    };

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;";
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let face = null, dep = null; // source pixels
    let SW = 0, SH = 0;
    let w = 0, h = 0, dpr = 1, spacing = opts.spacingLarge;
    let scale = 1, ox = 0, oy = 0; // source -> box (contain fit)
    let color = "#daf40a";
    let lightDots = true; // true = bright pixels make big dots
    let raf = 0;
    let visible = true;
    let destroyed = false;
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    let lastMove = -1e9;
    let lastKey = "";

    // Bilinear sample, 0 outside
    function sample(arr, x, y) {
      if (x < 0 || y < 0 || x >= SW - 1 || y >= SH - 1) return 0;
      const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * SW + x0;
      const a = arr[i] + (arr[i + 1] - arr[i]) * fx;
      const b = arr[i + SW] + (arr[i + SW + 1] - arr[i + SW]) * fx;
      return a + (b - a) * fy;
    }

    function readTheme() {
      color = getComputedStyle(el).getPropertyValue("--color--accent").trim() || "#daf40a";
      // Light dots on a dark page show light; dark dots on a light page show shadow
      const bg = getComputedStyle(el).getPropertyValue("--color--bg-primary").trim() || backgroundOf(el);
      lightDots = luminance(color) > luminance(bg);
      lastKey = "";
    }

    function resize() {
      const rect = el.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      spacing = smallScreen.matches ? opts.spacingSmall : opts.spacingLarge;
      if (SW) {
        scale = Math.min(w / SW, h / SH);
        ox = (w - SW * scale) / 2;
        oy = (h - SH * scale) / 2;
      }
      lastKey = "";
      wake();
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      const strength = opts.turn;
      const tx = cur.x, ty = cur.y * 0.7;
      const max = spacing * 0.56;
      const inv = 1 / scale;
      const ex = EYES.map(([x, y]) => [x * SW, y * SH]);
      ctx.beginPath();
      for (let y = spacing / 2; y < h; y += spacing) {
        for (let x = spacing / 2; x < w; x += spacing) {
          const ix = (x - ox) * inv, iy = (y - oy) * inv;
          // Parallax: nearer surfaces move further toward the cursor.
          // Two passes so the depth used is the depth of the point that lands here.
          let d = sample(dep, ix, iy);
          let px = ix - (d - 0.35) * strength * tx, py = iy - (d - 0.35) * strength * ty;
          d = sample(dep, px, py);
          px = ix - (d - 0.35) * strength * tx;
          py = iy - (d - 0.35) * strength * ty;
          if (opts.eyes) {
            for (const [cx, cy] of ex) {
              const dx = (px - cx) / 15, dy = (py - cy) / 9;
              const m = Math.exp(-(dx * dx + dy * dy) * 1.6);
              if (m > 0.01) { px -= m * 5 * tx; py -= m * 3 * ty; }
            }
          }
          const a = sample(face.alpha, px, py);
          if (a < 0.1) continue;
          const g = sample(face.gray, px, py);
          let v = (lightDots ? g : 1 - g) * a;
          if (opts.light) {
            const nx = sample(dep, px + 2, py) - sample(dep, px - 2, py);
            const ny = sample(dep, px, py + 2) - sample(dep, px, py - 2);
            v *= 1 + 9 * (nx * tx + ny * ty);
          }
          v = Math.min(1, Math.max(0, v));
          if (v < MIN_DOT) continue;
          const rad = Math.sqrt(v) * max;
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    function tick(t) {
      raf = 0;
      if (destroyed || !visible || !face) return;
      const animate = !reducedMotion.matches;
      if (animate) {
        // With no cursor for a moment, drift slowly so the head stays alive
        if (t - lastMove > IDLE_MS) {
          target.x = Math.sin(t / 1900) * 0.8;
          target.y = Math.sin(t / 2700) * 0.45;
        }
        cur.x += (target.x - cur.x) * EASE;
        cur.y += (target.y - cur.y) * EASE;
      } else {
        cur.x = cur.y = 0;
      }
      const key = cur.x.toFixed(3) + cur.y.toFixed(3) + w + h + spacing + lightDots + color;
      if (key !== lastKey) {
        draw();
        lastKey = key;
      }
      if (animate) raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (!raf && visible && !destroyed) raf = requestAnimationFrame(tick);
    }

    /* Cursor anywhere on the page aims the head, measured from the head itself */
    function onMove(e) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const rect = canvas.getBoundingClientRect();
      const hx = rect.left + ox + HEAD[0] * SW * scale;
      const hy = rect.top + oy + HEAD[1] * SH * scale;
      const span = Math.max(260, Math.min(window.innerWidth, window.innerHeight) * 0.6);
      target.x = Math.max(-1, Math.min(1, (e.clientX - hx) / span));
      target.y = Math.max(-1, Math.min(1, (e.clientY - hy) / span));
      lastMove = performance.now();
      wake();
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    /* Theme switch: watch class changes on <html> and <body> */
    const themeObserver = new MutationObserver(() => {
      readTheme();
      wake();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    let resizeTimer = 0;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });
    resizeObserver.observe(el);

    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    viewObserver.observe(el);

    readTheme();
    Promise.all([loadImage(src), loadImage(depthSrc)]).then(([f, d]) => {
      if (destroyed) return;
      face = pixels(f);
      dep = pixels(d).gray;
      SW = face.w;
      SH = face.h;
      resize();
    }).catch(() => {});

    return {
      el,
      destroy() {
        destroyed = true;
        cancelAnimationFrame(raf);
        clearTimeout(resizeTimer);
        themeObserver.disconnect();
        resizeObserver.disconnect();
        viewObserver.disconnect();
        window.removeEventListener("pointermove", onMove);
        canvas.remove();
      }
    };
  }

  function init(root = document) {
    root.querySelectorAll("[data-head-tilt]").forEach((el) => {
      if (el._headTilt) return;
      const inst = create(el);
      if (inst) {
        el._headTilt = inst;
        instances.add(inst);
      }
    });
  }

  function destroyAll() {
    instances.forEach((inst) => {
      inst.destroy();
      delete inst.el._headTilt;
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

  window.HeadTilt = { init, destroyAll };
})();
