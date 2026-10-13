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
   Only the row wrappers move, never the gallery items
   or data-depth layers work-gsap.js drifts, so the
   parallax keeps working inside a faded row.

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

  /* Blocks that fade up as one row, never split into
     their children (the 3-column gallery drifts its
     columns with parallax). */
  const WHOLE =
    ".work-gallery-grid, .work-gallery-stack, .visual-wrap";

  /* Media: a wrapper holding only one of these is the row. */
  const MEDIA = "img, video, picture, iframe, .visual";

  let triggers = [];
  let tweens = [];


  /* The rows of a section: step down through single-child
     wrappers (padding, container) to where the content
     splits into several blocks, and use those blocks. */
  function rowsOf(section) {

    let el = section;

    while (
      el.children.length === 1 &&
      !el.matches(WHOLE) &&
      !el.firstElementChild.matches(MEDIA)
    ) {
      el = el.firstElementChild;
    }

    if (el.matches(WHOLE) || el.children.length <= 1) {
      return [el];
    }

    return [...el.children].filter(
      (row) => !row.matches("script, style, link")
    );

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
        el.getBoundingClientRect().height > 0
      )
      .sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return ra.top - rb.top || ra.left - rb.left;
      });

    if (!items.length) return;

    const rowTweens = items.map((el) => {

      el.dataset.workReveal = "true";

      return gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 40
        },
        {
          opacity: 1,
          y: 0,

          duration: 0.8,

          ease: "power3.out",

          paused: true,

          /* data-depth layers keep their parallax
             transform, so only tidy up plain rows. */
          onComplete: () => {
            if (!el.matches("[data-depth]")) {
              gsap.set(el, {
                clearProps: "transform"
              });
            }
          }
        }
      );

    });

    tweens = tweens.concat(rowTweens);

    /* Side-by-side rows start together. */
    const tops = items.map((el) =>
      Math.round(el.getBoundingClientRect().top)
    );

    let next = 0;
    let lastStart = 0;

    const revealThrough = (index) => {

      while (next <= index) {

        const i = next++;
        const now = gsap.ticker.time;
        const sameRow =
          i > 0 && Math.abs(tops[i] - tops[i - 1]) < 8;
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

    /* Wait two frames before watching the scroll: after
       a page transition ScrollTrigger can still hold the
       old page's scroll position for a moment, which
       would reveal rows far below the screen at once. */
    requestAnimationFrame(() => requestAnimationFrame(() => {

      if (!page.isConnected) return;

      ScrollTrigger.update();

      items.forEach((el, i) => {

        triggers.push(ScrollTrigger.create({

          trigger: el,

          /* 85% down the screen, or the bottom of the
             page for rows that never get that high. */
          start: () =>
            Math.min(
              el.getBoundingClientRect().top +
                window.scrollY -
                window.innerHeight * 0.85,
              ScrollTrigger.maxScroll(window) - 2
            ),

          once: true,

          invalidateOnRefresh: true,

          onEnter: () => revealThrough(i)

        }));

      });

    }));

  }


  function destroyWorkReveal() {

    triggers.forEach((trigger) => trigger.kill());
    triggers = [];

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
