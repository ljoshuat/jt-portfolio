/* =========================================================
   WORK PAGE ROWS SCROLL INTO VIEW
   Every row on a work (case study) page fades up as it
   scrolls in, the same way the lower homepage does
   (gsap.js, LOWER HOME FADE-UPS): opacity 0 -> 1 and
   40px -> 0 over 0.8s, power3.out, starting 85% down the
   screen. Rows queue in page order, so nothing lower
   starts before everything above it has, and rows side
   by side start together.

   The hero stays as it is (work-gsap.js scales it).
   Gallery columns and data-depth layers keep the
   parallax work-gsap.js gives them: depth layers rise
   through yPercent, which adds on top of it.

   Load site-wide (footer) after GSAP and ScrollTrigger.
   Hooks into Barba itself, so it also runs when a work
   page is reached by clicking through from another page.
========================================================= */

(() => {

  const PAGE = '[data-barba-namespace="project"]';

  /* Sections whose rows fade up: details, galleries,
     next projects and the footer. The hero and hero
     visual are left alone. */
  const SECTIONS =
    "section:not(.section_proj-hero):not(.section_hero-visual), footer.footer";

  let cleanups = [];
  let tweens = [];


  /* Layout wrappers that hold several rows: split them
     into their own rows. */
  const GROUPS =
    ".media-2-column, .visual-wrap-layout, .section-padding-bottom";

  /* Galleries: each image fades up on its own. The
     columns themselves keep their parallax drift
     (work-gsap.js), so only the images inside move. */
  const GALLERY = ".work-gallery-grid";
  const GALLERY_PIECES =
    ".work-gallery-stack > *, .work-gallery-item > :not(.work-gallery-stack)";

  /* A wrapper holding only one of these is the row. */
  const MEDIA = "img, video, picture, iframe, .visual";


  /* The rows inside an element: step down through
     single-child wrappers (padding, container) to where
     the content splits into several blocks, use those
     blocks, and split layout groups and galleries
     further. */
  function rowsOf(el) {

    if (el.matches(GALLERY)) {
      return [...el.querySelectorAll(GALLERY_PIECES)];
    }

    while (
      el.children.length === 1 &&
      !el.matches(".visual-wrap") &&
      !el.firstElementChild.matches(MEDIA)
    ) {
      el = el.firstElementChild;

      if (el.matches(GALLERY)) return rowsOf(el);
    }

    if (el.matches(".visual-wrap") || el.children.length <= 1) {
      return [el];
    }

    return [...el.children]
      .filter((row) => !row.matches("script, style, link"))
      .flatMap((row) =>
        row.matches(GROUPS) || row.matches(GALLERY)
          ? rowsOf(row)
          : [row]
      );

  }


  /* Lazy images change the page height as they load,
     so re-measure the start points when one does, but
     only once the page has stopped scrolling: a refresh
     mid-scroll stops iPhone momentum scrolling dead. */
  let refreshTimer = null;
  let lastScroll = 0;

  window.addEventListener(
    "scroll",
    () => { lastScroll = performance.now(); },
    { passive: true }
  );

  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function check() {
      if (performance.now() - lastScroll < 300) {
        refreshTimer = setTimeout(check, 150);
        return;
      }
      ScrollTrigger.refresh();
    }, 150);
  }


  function initWorkReveal(scope = document) {

    if (
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined"
    ) {
      return;
    }

    const page =
      scope.matches && scope.matches(PAGE)
        ? scope
        : scope.querySelector(PAGE);

    if (!page) return;

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }

    const items = [...page.querySelectorAll(SECTIONS)]
      .flatMap(rowsOf)
      .filter((el) =>
        !el.dataset.workReveal &&
        /* Skip hidden blocks (display: none). Images
           still loading count, even at zero height. */
        el.getClientRects().length > 0
      )
      .sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return ra.top - rb.top || ra.left - rb.left;
      });

    if (!items.length) return;

    const rowTweens = items.map((el) => {

      el.dataset.workReveal = "true";

      /* data-depth layers already own transform y for
         their parallax (work-gsap.js), so they rise 40px
         through yPercent instead, which GSAP adds on top
         of y. */
      if (el.matches("[data-depth]")) {

        gsap.set(el, { opacity: 0 });

        const rise = { px: 40 };
        let tween = null;

        return {
          play: () => {
            /* Re-read the height every frame, as a lazy
               image may still be loading. */
            tween = gsap.to(rise, {
              px: 0,
              duration: 0.8,
              ease: "power3.out",
              onUpdate: () => {
                gsap.set(el, {
                  opacity: 1 - rise.px / 40,
                  yPercent:
                    (rise.px / Math.max(el.offsetHeight, 1)) * 100
                });
              }
            });
          },
          kill: () => tween && tween.kill()
        };

      }

      /* Gallery images may carry the phone drift
         (yPercent), so keep their transform. */
      const keepTransform = !!el.closest(GALLERY);

      return gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,

          duration: 0.8,

          ease: "power3.out",

          paused: true,

          onComplete: () => {
            if (!keepTransform) {
              gsap.set(el, {
                clearProps: "transform"
              });
            }
          }
        }
      );

    });

    tweens = tweens.concat(rowTweens);

    /* Side-by-side rows start together (measured when
       they reveal, after their images have loaded). */
    const topOf = (el) =>
      el.getBoundingClientRect().top + window.scrollY;

    let next = 0;
    let lastStart = 0;

    const revealThrough = (index) => {

      while (next <= index) {

        const i = next++;
        const now = gsap.ticker.time;
        const sameRow =
          i > 0 && Math.abs(topOf(items[i]) - topOf(items[i - 1])) < 8;
        const at = Math.max(
          now,
          sameRow ? lastStart : lastStart + 0.1
        );

        lastStart = at;

        tweens.push(
          gsap.delayedCall(at - now, () => rowTweens[i].play())
        );

      }

    };

    /* Watch where each row really is on screen. Lazy
       images have no height until they load, so start
       points measured up front sit far too high on a
       phone and rows lower down "reveal" off screen
       before anyone reaches them. An IntersectionObserver
       always reads the live layout. A row reveals once
       its top passes 85% down the screen, or once it is
       already above the screen. */
    const observer = new IntersectionObserver((entries) => {

      entries.forEach((entry) => {

        if (
          entry.isIntersecting ||
          entry.boundingClientRect.top < 0
        ) {
          observer.unobserve(entry.target);
          revealThrough(items.indexOf(entry.target));
        }

      });

    }, { rootMargin: "0px 0px -15% 0px" });

    /* Rows that never get 85% up the screen (the footer)
       reveal when the page reaches the bottom. */
    const atBottom = () => {
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
      ) {
        revealThrough(items.length - 1);
        window.removeEventListener("scroll", atBottom);
      }
    };

    /* Wait two frames before watching: after a page
       transition the old page's scroll position can
       hold for a moment. */
    requestAnimationFrame(() => requestAnimationFrame(() => {

      if (!page.isConnected) return;

      page.querySelectorAll("img").forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", refreshSoon, { once: true });
        }
      });

      items.forEach((el) => observer.observe(el));

      window.addEventListener("scroll", atBottom, { passive: true });

    }));

    cleanups.push(() => {
      observer.disconnect();
      window.removeEventListener("scroll", atBottom);
    });

  }


  function destroyWorkReveal() {

    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];

    tweens.forEach((tween) => tween.kill());
    tweens = [];

  }


  window.initWorkReveal = initWorkReveal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initWorkReveal());
  } else {
    initWorkReveal();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    /* Drop the old page's triggers before the next page comes in */
    barba.hooks.before(destroyWorkReveal);

    barba.hooks.after((data) => {
      initWorkReveal(
        (data && data.next && data.next.container) || document
      );
    });
  }

})();
