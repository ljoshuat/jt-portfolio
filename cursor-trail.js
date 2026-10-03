(() => {

    const TRAIL_COUNT = 6;        // trailing circles behind the dot
    const SIZE = 18;              // dot size in px
    const HOVER_SCALE = 2.4;      // dot size over links
    const FOLLOW = 0.35;          // how tightly the dot follows (0-1)
    const TRAIL_FOLLOW = 0.45;    // how tightly each circle follows the one ahead
    const TRAIL_OPACITY = 0.2;    // how strong the whole trail is (0-1)
    const HIDE_NATIVE_CURSOR = true;
  
    const HOVER_TARGETS =
      "a, button, [role='button'], .mode-item, label, [data-cursor-hover]";
  
    const finePointer =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
    if (!finePointer || reducedMotion || typeof gsap === "undefined") return;
    if (document.querySelector(".cursor-trail")) return;
  
    /* BUILD */
    const wrap = document.createElement("div");
    wrap.className = "cursor-trail";
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.setProperty("--cursor-size", SIZE + "px");
    wrap.style.setProperty("--cursor-hover-size", SIZE * HOVER_SCALE + "px");
  
    /* Trail circles share one faded layer so overlaps don't add up */
    const ghosts = document.createElement("div");
    ghosts.style.cssText =
      "position:absolute;inset:0;opacity:" + TRAIL_OPACITY + ";";
    wrap.appendChild(ghosts);
  
    const circles = [];
    for (let i = TRAIL_COUNT; i >= 0; i -= 1) {
      const el = document.createElement("div");
      el.className = i === 0 ? "cursor-trail_dot" : "cursor-trail_ghost";
      const t = i / (TRAIL_COUNT + 1);
      el.style.setProperty("--cursor-scale", (1 - t * 0.6).toFixed(3));
      el.style.setProperty("--cursor-opacity", (1 - t).toFixed(3));
      (i === 0 ? wrap : ghosts).appendChild(el);
      circles[i] = el;
    }
  
    document.body.appendChild(wrap);
    if (HIDE_NATIVE_CURSOR) {
      document.documentElement.classList.add("has-cursor-trail");
    }
  
    /* FOLLOW THE POINTER */
    const mouse = { x: -100, y: -100 };
    const points = circles.map(() => ({ x: -100, y: -100 }));
    const setters = circles.map((el) => ({
      x: gsap.quickSetter(el, "x", "px"),
      y: gsap.quickSetter(el, "y", "px")
    }));
    let started = false;
  
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!started) {
        started = true;
        points.forEach((p) => { p.x = mouse.x; p.y = mouse.y; });
      }
      wrap.classList.add("is-visible");
    }, { passive: true });
  
    gsap.ticker.add(() => {
      const lag = gsap.ticker.deltaRatio();
      points.forEach((p, i) => {
        const target = i === 0 ? mouse : points[i - 1];
        const amount = 1 - Math.pow(1 - (i === 0 ? FOLLOW : TRAIL_FOLLOW), lag);
        p.x += (target.x - p.x) * amount;
        p.y += (target.y - p.y) * amount;
        setters[i].x(p.x);
        setters[i].y(p.y);
      });
    });
  
    /* HIDE WHEN THE POINTER LEAVES THE WINDOW */
    document.addEventListener("mouseleave", () => {
      wrap.classList.remove("is-visible");
    });
    document.addEventListener("mouseenter", () => {
      if (started) wrap.classList.add("is-visible");
    });
  
    /* GROW OVER LINKS AND BUTTONS (real size change in CSS, stays sharp) */
    function setHover(on) {
      wrap.classList.toggle("is-hovering", on);
    }
  
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest && e.target.closest(HOVER_TARGETS)) setHover(true);
    });
    document.addEventListener("pointerout", (e) => {
      const from = e.target.closest && e.target.closest(HOVER_TARGETS);
      const to = e.relatedTarget && e.relatedTarget.closest &&
        e.relatedTarget.closest(HOVER_TARGETS);
      if (from && !to) setHover(false);
    });
  
    if (typeof barba !== "undefined" && barba.hooks) {
      barba.hooks.after(() => setHover(false));
    }
  
  })();