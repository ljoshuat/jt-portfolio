/* =========================================================
   LENIS SMOOTH SCROLL
   Load after GSAP, ScrollTrigger, Barba and Lenis,
   and before script.js / page-transition.js.

   - Lenis is driven by the GSAP ticker so ScrollTrigger
     and Lenis stay in sync.
   - Same-page anchor links glide with Lenis.
     Per-link offset: data-lenis-offset="-80"
     Skip a link:     data-lenis-ignore
   - Scrollable panels inside menus/modals:
     add data-lenis-prevent so they scroll natively.
   - Scrolling pauses while the menu is open and while
     the home page loader is showing.
   - Visitors with "reduce motion" on get native scroll.
   - Hooks into Barba automatically (no edits needed in
     page-transition.js).

   Globals for your other scripts:
     window.lenis           (null when reduced motion)
     window.stopLenis(reason)
     window.startLenis(reason)
     window.lenisScrollTo(target, options)
========================================================= */

(() => {

    const ANCHOR_OFFSET = 0;
  
    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
  
  
    let lenis = null;
  
  
    /* -----------------------------------------
       STOP / START WITH REASONS
       Lenis only restarts when every reason
       (menu, loader, your own) is cleared.
    ----------------------------------------- */
  
    const stopReasons =
      new Set();
  
    function stopLenis(reason = "manual") {
  
      stopReasons.add(reason);
  
      if (lenis) lenis.stop();
  
    }
  
    function startLenis(reason = "manual") {
  
      stopReasons.delete(reason);
  
      if (lenis && stopReasons.size === 0) {
  
        lenis.start();
  
      }
  
    }
  
  
    /* -----------------------------------------
       SCROLL TO (works with or without Lenis)
    ----------------------------------------- */
  
    function lenisScrollTo(target, options = {}) {
  
      if (lenis) {
  
        lenis.scrollTo(target, options);
  
        return;
  
      }
  
  
      let top = target;
  
      if (typeof target === "string") {
  
        target = document.querySelector(target);
  
      }
  
      if (target instanceof Element) {
  
        top =
          target.getBoundingClientRect().top +
          window.scrollY;
  
      }
  
      window.scrollTo({
        top: top + (options.offset || 0),
        behavior: "auto"
      });
  
    }
  
  
    window.stopLenis = stopLenis;
  
    window.startLenis = startLenis;
  
    window.lenisScrollTo = lenisScrollTo;
  
    window.lenis = null;
  
  
    /* -----------------------------------------
       REDUCED MOTION: NATIVE SCROLL ONLY
    ----------------------------------------- */
  
    if (
      prefersReducedMotion ||
      typeof Lenis === "undefined"
    ) {
  
      return;
  
    }
  
  
    /* -----------------------------------------
       CREATE LENIS
    ----------------------------------------- */
  
    let isTransitioning = false;
  
  
    lenis =
      new Lenis({
  
        /* block wheel/touch during Barba transitions
           without hiding the scrollbar */
        virtualScroll(data) {
  
          if (!isTransitioning) return true;
  
          if (data.event.cancelable) {
  
            data.event.preventDefault();
  
          }
  
          return false;
  
        },
  
        lerp: 0.1,
  
        wheelMultiplier: 1,
  
        smoothWheel: true,
  
        /* touch keeps native momentum on phones */
        syncTouch: false,
  
        autoRaf: false
  
      });
  
  
    window.lenis = lenis;
  
  
    /* -----------------------------------------
       GSAP + SCROLLTRIGGER SYNC
    ----------------------------------------- */
  
    if (typeof ScrollTrigger !== "undefined") {
  
      lenis.on(
        "scroll",
        ScrollTrigger.update
      );
  
    }
  
  
    if (typeof gsap !== "undefined") {
  
      gsap.ticker.add((time) => {
  
        lenis.raf(time * 1000);
  
      });
  
  
      gsap.ticker.lagSmoothing(0);
  
    } else {
  
      function raf(time) {
  
        lenis.raf(time);
  
        requestAnimationFrame(raf);
  
      }
  
      requestAnimationFrame(raf);
  
    }
  
  
    /* -----------------------------------------
       SAME-PAGE ANCHOR LINKS
       Capture phase so Webflow's own anchor
       scroll doesn't fight Lenis.
    ----------------------------------------- */
  
    document.addEventListener(
      "click",
      (event) => {
  
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
  
          return;
  
        }
  
  
        const link =
          event.target.closest &&
          event.target.closest("a[href*='#']");
  
        if (!link) return;
  
        if (link.hasAttribute("data-lenis-ignore")) return;
  
  
        const url =
          new URL(
            link.href,
            window.location.href
          );
  
        if (
          url.origin !== window.location.origin ||
          url.pathname !== window.location.pathname ||
          url.hash.length < 2
        ) {
  
          return;
  
        }
  
  
        let target = null;
  
        try {
  
          target =
            document.getElementById(
              decodeURIComponent(url.hash.slice(1))
            );
  
        } catch (error) {
  
          return;
  
        }
  
        if (!target) return;
  
  
        event.preventDefault();
  
        event.stopPropagation();
  
  
        const offset =
          parseFloat(
            link.getAttribute("data-lenis-offset")
          );
  
        lenis.scrollTo(
          target,
          {
            offset: isNaN(offset) ? ANCHOR_OFFSET : offset
          }
        );
  
  
        if (window.location.hash !== url.hash) {
  
          history.pushState(
            history.state,
            "",
            url.hash
          );
  
        }
  
      },
      true
    );
  
  
    /* -----------------------------------------
       WATCH A CLASS AND STOP WHILE IT'S ON
    ----------------------------------------- */
  
    function stopWhileClass(element, className, reason) {
  
      if (!element) return;
  
  
      function check() {
  
        if (element.classList.contains(className)) {
  
          stopLenis(reason);
  
        } else {
  
          startLenis(reason);
  
        }
  
      }
  
  
      const observer =
        new MutationObserver(check);
  
      observer.observe(
        element,
        {
          attributes: true,
          attributeFilter: ["class"]
        }
      );
  
  
      check();
  
  
      return observer;
  
    }
  
  
    /* MENU OPEN */
  
    stopWhileClass(
      document.querySelector(".menu-wrap"),
      "is-open",
      "menu"
    );
  
  
    /* -----------------------------------------
       PAGE LOADER (home only)
       is-loading is added on every page but only
       the home loader removes it, so only pause
       when the home loader is actually showing.
       Failsafe: never stay paused past 8s.
    ----------------------------------------- */
  
    const html =
      document.documentElement;
  
    if (
      html.classList.contains("is-loading") &&
      html.classList.contains("has-loader-pre")
    ) {
  
      const loaderObserver =
        stopWhileClass(
          html,
          "is-loading",
          "loader"
        );
  
  
      setTimeout(() => {
  
        loaderObserver.disconnect();
  
        startLenis("loader");
  
      }, 8000);
  
    }
  
  
    /* -----------------------------------------
       BARBA PAGE TRANSITIONS
    ----------------------------------------- */
  
    if (
      typeof barba !== "undefined" &&
      barba.hooks
    ) {
  
      /* -----------------------------------------
         BEFORE: kill momentum, lock wheel/touch
         so it can't fight scrollTo(0, 0) in
         your beforeEnter
      ----------------------------------------- */
  
      barba.hooks.before(() => {
  
        isTransitioning = true;
  
        lenis.reset();
  
      });
  
  
      /* -----------------------------------------
         AFTER: runs right after your afterEnter.
         Unlock, re-measure, sit at the top, then
         jump to a #hash once your two-frame
         ScrollTrigger.refresh() has run.
      ----------------------------------------- */
  
      barba.hooks.after((data) => {
  
        isTransitioning = false;
  
        lenis.resize();
  
        lenis.scrollTo(
          0,
          {
            immediate: true,
            force: true
          }
        );
  
  
        /* Barba drops the #hash from the address bar,
           so read it from the link it followed */
  
        const trigger =
          data && data.trigger;
  
        const hash =
          (
            (trigger && trigger.href && new URL(trigger.href, window.location.href).hash) ||
            window.location.hash ||
            ""
          ).replace(/^#/, "");
  
        if (!hash) return;
  
  
        let target = null;
  
        try {
  
          target =
            document.getElementById(
              decodeURIComponent(hash)
            );
  
        } catch (error) {
  
          return;
  
        }
  
        if (!target) return;
  
  
        requestAnimationFrame(() => {
  
          requestAnimationFrame(() => {
  
            lenis.resize();
  
  
            /* offsetTop ignores the reveal's y: 60 */
  
            let top = 0;
  
            for (let el = target; el; el = el.offsetParent) {
  
              top += el.offsetTop;
  
            }
  
  
            lenis.scrollTo(
              top,
              {
                immediate: true,
                force: true
              }
            );
  
          });
  
        });
  
      });
  
    }
  
  })();
  