/* =========================================================
   ABOUT STATS CARDS
   Hover: an accent fill sweeps in from the side the cursor
   enters, with a curved leading edge, and leaves out the
   side it exits. Numbers count up when the grid scrolls in.

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

  // Fill shape anchored at `side`, its edge `e` (0-100) in from that side,
  // the edge bowed by `c` in the direction of travel.
  function pathFor(side, e, c) {
    const f = (n) => n.toFixed(2);
    switch (side) {
      case "left":
        return `M0 0H${f(e)}Q${f(e + c)} 50 ${f(e)} 100H0Z`;
      case "right":
        return `M100 0H${f(100 - e)}Q${f(100 - e - c)} 50 ${f(100 - e)} 100H100Z`;
      case "top":
        return `M0 0V${f(e)}Q50 ${f(e + c)} 100 ${f(e)}V0Z`;
      default:
        return `M0 100V${f(100 - e)}Q50 ${f(100 - e - c)} 100 ${f(100 - e)}V100Z`;
    }
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

    let svg = card.querySelector(".about_stat-fill");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("aria-hidden", "true");
      svg.classList.add("about_stat-fill");
      // Inline so it works without a Webflow class for injected markup.
      svg.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;fill:var(--color--accent)";
      svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
      card.prepend(svg);
    }
    const path = svg.querySelector("path");
    path.setAttribute("d", pathFor("left", 0, 0));

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
        path.setAttribute("d", pathFor(side, state.e, bow));
        if (t < 1) state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    }

    const onEnter = (ev) => {
      if (reduceMotion()) {
        card.classList.add("is-hover");
        path.setAttribute("d", pathFor("left", 100, 0));
        state.e = 100;
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
        path.setAttribute("d", pathFor("left", 0, 0));
        state.e = 0;
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

    return () => {
      cancelAnimationFrame(state.raf);
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
