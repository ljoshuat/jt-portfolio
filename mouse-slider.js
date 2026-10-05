/* =========================================================
   MOUSE-FOLLOW SLIDER
   A horizontal strip of images that pans with the mouse: move
   the pointer left and the strip slides to its start, move it
   right and it slides to its end, eased so it glides rather than
   snaps. Images drift a little inside their frames (parallax) and
   the strip leans slightly with its speed.

   Phones, tablets and reduced motion get a plain swipeable strip
   (native horizontal scroll with snap), so nothing fights the
   finger or the browser.

   Load site-wide (footer) after GSAP, Barba and lenis-init.js,
   and before page-transition.js. It hooks into Barba itself, so
   it starts whenever a page with a slider is entered and cleans
   up when you leave.

   Markup (attributes, so classes stay free for styling):
     [data-mouse-slider]          the visible area (overflow hidden)
       [data-mouse-slider-track]  the row that moves (e.g. the
                                  Collection List, .w-dyn-items)
         items                    any children; an <img> or <video>
                                  inside each one gets the parallax
       [data-mouse-slider-progress]  optional bar, scaled 0 to 1
                                     (mouse version only)

   Optional attributes on [data-mouse-slider]:
     data-follow="0.08"     how tightly the strip follows (0-1)
     data-parallax="10"     image drift inside its frame, in %
                            (the CSS makes images 130% wide, so
                            keep this at 11 or less)
     data-edge="0.12"       dead zone at each side of the area
                            (0.12 = the outer 12% reach the ends)
     data-fullscreen        the slider fills the page: Lenis is
                            paused while you're on it

   The mouse is read only while it's over the slider, so a slider
   in the middle of a scrolling page (a case study) works too.
   Arrow keys step through the images when the slider is hovered
   or focused.
========================================================= */

(() => {
  const DEFAULT_FOLLOW = 0.08;
  const DEFAULT_PARALLAX = 10; /* % of the image width */
  const DEFAULT_EDGE = 0.12;
  const MAX_SKEW = 4; /* degrees, at full speed */
  const SKEW_SPEED = 2500; /* px per second that counts as full speed */

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let sliders = [];

  function createSlider(wrap) {
    const track = wrap.querySelector("[data-mouse-slider-track]");
    if (!track || !track.children.length) return null;

    wrap.dataset.mouseSliderReady = "true";

    const progressBar = wrap.querySelector("[data-mouse-slider-progress]");
    const follow =
      parseFloat(wrap.getAttribute("data-follow")) || DEFAULT_FOLLOW;
    const parallax = wrap.hasAttribute("data-parallax")
      ? parseFloat(wrap.getAttribute("data-parallax")) || 0
      : DEFAULT_PARALLAX;
    const edge = wrap.hasAttribute("data-edge")
      ? Math.min(0.45, Math.max(0, parseFloat(wrap.getAttribute("data-edge")) || 0))
      : DEFAULT_EDGE;
    const fullscreen = wrap.hasAttribute("data-fullscreen");

    let items = [];
    let media = [];
    let max = 0; /* how far the track can move, in px */
    let wrapLeft = 0;
    let wrapWidth = 0;

    let target = 0; /* 0 = start, 1 = end */
    let current = 0;
    let lastX = 0;
    let skew = 0;
    let mode = null; /* "follow" (mouse) or "swipe" (native scroll) */

    /* ---------------------------------------------
       MEASURE
    --------------------------------------------- */

    function measure() {
      items = Array.from(track.children);
      media = items.map((item) => item.querySelector("img, video"));
      const box = wrap.getBoundingClientRect();
      wrapLeft = box.left;
      wrapWidth = box.width;
      max = Math.max(0, track.scrollWidth - wrap.clientWidth);
    }

    /* ---------------------------------------------
       MOUSE (desktop)
    --------------------------------------------- */

    function onPointerMove(e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (!wrapWidth) return;

      /* Map the pointer across the area (minus the dead zones)
         onto the strip, so both ends are easy to reach */
      const x = (e.clientX - wrapLeft) / wrapWidth;
      target = clamp((x - edge) / (1 - edge * 2));
    }

    function onKey(e) {
      if (!wrap.matches(":hover") && !wrap.contains(document.activeElement)) {
        return;
      }
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();

      if (mode === "swipe") {
        const step = items[0] ? items[0].offsetWidth : wrap.clientWidth / 2;
        wrap.scrollBy({ left: dir * step, behavior: "smooth" });
        return;
      }

      /* Step to the next or previous image's left edge */
      const offsets = items.map((item) =>
        max ? clamp(item.offsetLeft / max) : 0
      );
      const now = current;
      const next =
        dir > 0
          ? offsets.find((o) => o > now + 0.001)
          : offsets.slice().reverse().find((o) => o < now - 0.001);
      target = next === undefined ? (dir > 0 ? 1 : 0) : next;
    }

    /* ---------------------------------------------
       RENDER LOOP
    --------------------------------------------- */

    const setX = gsapSetter(track, "x", "px");
    const setSkew = gsapSetter(track, "skewX", "deg");
    const mediaSetters = new Map();

    function tick() {
      if (!wrap.isConnected) {
        destroy();
        return;
      }
      if (mode !== "follow") return;

      const lag =
        typeof gsap !== "undefined" && gsap.ticker
          ? gsap.ticker.deltaRatio()
          : 1;
      const amount = 1 - Math.pow(1 - follow, lag);
      current += (target - current) * amount;
      if (Math.abs(target - current) < 0.0001) current = target;

      const x = -current * max;
      setX(x);

      /* Lean with the speed, then settle */
      const velocity = ((x - lastX) / Math.max(lag, 0.001)) * 60;
      lastX = x;
      const skewTarget =
        Math.max(-1, Math.min(1, velocity / SKEW_SPEED)) * MAX_SKEW;
      skew += (skewTarget - skew) * 0.1;
      if (Math.abs(skew) < 0.01) skew = 0;
      setSkew(skew);

      /* Each image drifts against the motion, more the further
         it sits from the middle of the area */
      if (parallax) {
        const mid = wrapWidth / 2;
        items.forEach((item, i) => {
          const m = media[i];
          if (!m) return;
          const center = item.offsetLeft + x + item.offsetWidth / 2;
          const offset = Math.max(-1, Math.min(1, (center - mid) / wrapWidth));
          let set = mediaSetters.get(m);
          if (!set) {
            set = gsapSetter(m, "xPercent", "");
            mediaSetters.set(m, set);
          }
          set(-offset * parallax);
        });
      }

      if (progressBar) progressBar.style.transform = `scaleX(${current})`;
    }

    /* ---------------------------------------------
       MODE: follow (mouse) or swipe (touch / reduced)
    --------------------------------------------- */

    function setMode() {
      const next =
        canHover.matches && !reduceMotion.matches ? "follow" : "swipe";
      if (next === mode) return;
      mode = next;

      wrap.setAttribute("data-mouse-slider-mode", mode);

      if (mode === "swipe") {
        /* Hand the strip back to the browser */
        track.style.transform = "";
        media.forEach((m) => m && (m.style.transform = ""));
        current = target = 0;
        lastX = skew = 0;
      } else {
        wrap.scrollLeft = 0;
      }

      measure();
      if (progressBar) progressBar.style.transform = "scaleX(0)";
    }

    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;

    const onWindowChange = () => measure();
    /* Re-read the area's position each time the mouse comes in,
       in case the layout around it moved */
    const onPointerEnter = () => {
      const box = wrap.getBoundingClientRect();
      wrapLeft = box.left;
      wrapWidth = box.width;
    };

    wrap.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("load", onWindowChange);
    wrap.addEventListener("pointerenter", onPointerEnter);
    canHover.addEventListener("change", setMode);
    reduceMotion.addEventListener("change", setMode);
    if (resize) {
      resize.observe(wrap);
      resize.observe(track);
    }

    if (fullscreen) {
      if (window.stopLenis) window.stopLenis("mouse-slider");
      window.scrollTo(0, 0);
    }

    setMode();

    const useTicker = typeof gsap !== "undefined" && gsap.ticker;
    let raf = null;

    function rafLoop() {
      tick();
      raf = requestAnimationFrame(rafLoop);
    }

    if (useTicker) gsap.ticker.add(tick);
    else raf = requestAnimationFrame(rafLoop);

    /* Fade the strip in once it's laid out */
    if (typeof gsap !== "undefined" && !reduceMotion.matches) {
      gsap.fromTo(
        items,
        { opacity: 0, yPercent: 8 },
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.06,
          clearProps: "opacity,transform",
        }
      );
    }

    function destroy() {
      if (useTicker) gsap.ticker.remove(tick);
      if (raf) cancelAnimationFrame(raf);

      wrap.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("load", onWindowChange);
      wrap.removeEventListener("pointerenter", onPointerEnter);
      canHover.removeEventListener("change", setMode);
      reduceMotion.removeEventListener("change", setMode);
      if (resize) resize.disconnect();

      if (fullscreen && window.startLenis) window.startLenis("mouse-slider");
      delete wrap.dataset.mouseSliderReady;
      sliders = sliders.filter((s) => s.wrap !== wrap);
    }

    return { wrap, destroy };
  }

  /* ---------------------------------------------
     HELPERS
  --------------------------------------------- */

  function clamp(v) {
    return Math.max(0, Math.min(1, v));
  }

  /* gsap.quickSetter when GSAP is there, plain transforms otherwise */
  function gsapSetter(el, prop, unit) {
    if (typeof gsap !== "undefined" && gsap.quickSetter) {
      return gsap.quickSetter(el, prop, unit);
    }
    const state = (el._msState = el._msState || { x: 0, skewX: 0, xPercent: 0 });
    return (v) => {
      state[prop] = v;
      el.style.transform =
        `translateX(${state.xPercent}%) translate3d(${state.x}px,0,0) skewX(${state.skewX}deg)`;
    };
  }

  /* ---------------------------------------------
     START / BARBA
  --------------------------------------------- */

  function initMouseSliders(scope = document) {
    scope.querySelectorAll("[data-mouse-slider]").forEach((wrap) => {
      if (wrap.dataset.mouseSliderReady) return;
      const slider = createSlider(wrap);
      if (slider) sliders.push(slider);
    });
  }

  function destroyMouseSliders() {
    sliders.slice().forEach((s) => s.destroy());
  }

  window.initMouseSliders = initMouseSliders;
  window.destroyMouseSliders = destroyMouseSliders;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initMouseSliders());
  } else {
    initMouseSliders();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    /* Leaving: hand scrolling back to Lenis before the next page */
    barba.hooks.before(() => destroyMouseSliders());

    barba.hooks.after((data) => {
      initMouseSliders(
        data && data.next && data.next.container
          ? data.next.container
          : document
      );
    });
  }
})();
