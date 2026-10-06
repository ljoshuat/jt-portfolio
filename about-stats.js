/* =========================================================
   ABOUT STATS CARDS
   Hover: an accent fill sweeps in from the side the cursor
   enters. Its curved leading edge breaks into halftone dots that
   grow until they merge into solid color, so the card rests on a
   solid fill (text stays readable). It leaves out the exit side. Numbers count up when the grid scrolls in.

   Markup (Webflow):
   div[data-stat-card]
     div[data-stat-icon="years|sites|team|flip"]  (svg injected)
     span[data-stat-count]  25   (text = target number)
     span                   +    (optional suffix, plain text)
     div                    label

   Load site-wide (footer). No dependencies. Barba-safe.
========================================================= */
(() => {
  const ICONS = {
    years:
      '<path d="M11 6V11L14 13M21 11C21 16.52 16.52 21 11 21C5.48 21 1 16.52 1 11C1 5.48 5.48 1 11 1C16.52 1 21 5.48 21 11Z"/>',
    sites:
      '<path d="M1 7H21M4.5 4H4.51M7.5 4H7.51M3 21H19C20.1 21 21 20.1 21 19V3C21 1.9 20.1 1 19 1H3C1.9 1 1 1.9 1 3V19C1 20.1 1.9 21 3 21Z"/>',
    team:
      '<path d="M15 21V19C15 16.79 13.21 15 11 15H5C2.79 15 1 16.79 1 19V21M21 21V19C21 17.14 19.73 15.57 18 15.13M14.5 1.13C16.23 1.57 17.5 3.14 17.5 5C17.5 6.86 16.23 8.43 14.5 8.87M12 5C12 7.21 10.21 9 8 9C5.79 9 4 7.21 4 5C4 2.79 5.79 1 8 1C10.21 1 12 2.79 12 5Z"/>',
    flip:
      '<path d="M4 13C4 8.03 7.13 4 11 4C14.87 4 18 8.03 18 13M18 13L15 10M18 13L21 10M8 21H14M11 21V17"/>',
  };

  const reduceMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = () => window.matchMedia("(hover: hover)").matches;

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Halftone edge. Dots sit on a fixed grid; each dot's size comes from
  // how far it is behind the moving edge, and at full size they overlap
  // into solid color. `e` (0-100) is how far the edge
  // has travelled in from `side`, `c` bows it in the direction of travel.
  const DOT = { spacing: 9, max: 0.75, ramp: 26 };

  function drawFill(ctx, w, h, dpr, color, side, e, c) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (e <= 0.01) return;
    ctx.fillStyle = color;
    if (e >= 99.9) { ctx.fillRect(0, 0, w, h); return; }
    const sp = DOT.spacing, rMax = sp * DOT.max;
    // Push the edge past 100 so a full card has full dots right to the far side.
    const edge = (e / 100) * (100 + DOT.ramp);
    ctx.beginPath();
    for (let y = sp / 2; y < h; y += sp) {
      for (let x = sp / 2; x < w; x += sp) {
        const px = (x / w) * 100, py = (y / h) * 100;
        // u: distance from the anchor side; v: position along that side (0-1)
        let u, v;
        if (side === "left") { u = px; v = py / 100; }
        else if (side === "right") { u = 100 - px; v = py / 100; }
        else if (side === "top") { u = py; v = px / 100; }
        else { u = 100 - py; v = px / 100; }
        const at = edge + 2 * v * (1 - v) * c;
        const k = Math.min(1, Math.max(0, (at - u) / DOT.ramp));
        if (k <= 0.04) continue;
        const rad = rMax * Math.sqrt(k);
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  function nearestSide(el, x, y) {
    const r = el.getBoundingClientRect();
    const d = {
      left: x - r.left,
      right: r.right - x,
      top: y - r.top,
      bottom: r.bottom - y,
    };
    return Object.keys(d).reduce((a, b) => (d[a] <= d[b] ? a : b));
  }

  const instances = [];

  function setupCard(card) {
    const iconEl = card.querySelector("[data-stat-icon]");
    if (iconEl && !iconEl.querySelector("svg")) {
      const name = iconEl.getAttribute("data-stat-icon");
      if (ICONS[name]) {
        iconEl.innerHTML =
          '<svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          ICONS[name] +
          "</svg>";
      }
    }

    let canvas = card.querySelector(".about_stat-fill");
    if (canvas && canvas.tagName.toLowerCase() !== "canvas") { canvas.remove(); canvas = null; }
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.classList.add("about_stat-fill");
      // Inline so it works without a Webflow class for injected markup.
      canvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0";
      card.prepend(canvas);
    }
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1;
    const size = () => {
      const r = card.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    };
    const accent = () => getComputedStyle(card).getPropertyValue("--color--accent").trim() || "#daf40a";
    const paint = (side, e, c) => drawFill(ctx, w, h, dpr, accent(), side, e, c);
    size();

    // e: 0 = empty, 100 = full. Each hover tweens e and picks a side.
    const state = { side: "left", e: 0, raf: 0 };

    function run(side, to, duration) {
      cancelAnimationFrame(state.raf);
      const from = state.e;
      state.side = side;
      const start = performance.now();
      const span = to - from;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const k = ease(t);
        state.e = from + span * k;
        // Bow the edge forward while moving, flat at rest.
        const bow = Math.sin(Math.PI * t) * 28 * Math.sign(span || 1);
        paint(side, state.e, bow);
        if (t < 1) state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    }

    const onEnter = (ev) => {
      if (reduceMotion()) {
        card.classList.add("is-hover");
        state.e = 100;
        paint("left", 100, 0);
        return;
      }
      card.classList.add("is-hover");
      // From empty, grow from the entry side. Mid-animation, keep the
      // current anchor so the shape never jumps.
      const side = state.e <= 1 ? nearestSide(card, ev.clientX, ev.clientY) : state.side;
      run(side, 100, 650);
    };

    const onLeave = (ev) => {
      card.classList.remove("is-hover");
      if (reduceMotion()) {
        state.e = 0;
        paint("left", 0, 0);
        return;
      }
      // When full, collapse out through the exit side (anchor there and
      // shrink toward it). A full fill looks the same from any anchor, so
      // this never jumps. Mid-animation, retract the way it came.
      let side = state.side;
      if (state.e >= 99) side = nearestSide(card, ev.clientX, ev.clientY);
      run(side, 0, 550);
    };

    if (canHover()) {
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
    }

    // Keep the grid sharp on resize and the color right on theme switch.
    const ro = new ResizeObserver(() => { size(); paint(state.side, state.e, 0); });
    ro.observe(card);
    const mo = new MutationObserver(() => paint(state.side, state.e, 0));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect(); mo.disconnect();
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
    };
  }

  function setupCounts(scope) {
    const els = [...scope.querySelectorAll("[data-stat-count]")];
    if (!els.length) return () => {};
    const targets = els.map((el) => {
      const raw = el.getAttribute("data-stat-target") || el.textContent.trim();
      el.setAttribute("data-stat-target", raw);
      return parseFloat(raw.replace(/,/g, "")) || 0;
    });
    const fmt = (n) => Math.round(n).toLocaleString("en-US");

    if (reduceMotion() || !("IntersectionObserver" in window)) {
      els.forEach((el, i) => (el.textContent = fmt(targets[i])));
      return () => {};
    }

    els.forEach((el) => (el.textContent = "0"));
    const rafs = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const el = entry.target;
          const target = targets[els.indexOf(el)];
          const start = performance.now();
          const dur = 1400;
          const tick = (now) => {
            const t = Math.min(1, (now - start) / dur);
            el.textContent = fmt(target * (1 - Math.pow(1 - t, 3)));
            if (t < 1) rafs.set(el, requestAnimationFrame(tick));
          };
          rafs.set(el, requestAnimationFrame(tick));
        });
      },
      { threshold: 0.4 }
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      rafs.forEach((id) => cancelAnimationFrame(id));
    };
  }

  function init(scope) {
    scope = scope || document;
    const cards = scope.querySelectorAll("[data-stat-card]");
    if (!cards.length) return;
    const cleanups = [...cards].map(setupCard);
    cleanups.push(setupCounts(scope));
    instances.push(() => cleanups.forEach((fn) => fn()));
  }

  function destroyAll() {
    while (instances.length) instances.pop()();
  }

  window.AboutStats = { init, destroyAll };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => destroyAll());
    barba.hooks.after((data) => init((data && data.next && data.next.container) || document));
  }
})();
