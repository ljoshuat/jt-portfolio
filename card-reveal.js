/* =========================================================
   PROJECT CARDS SCROLL INTO VIEW
   Home Selected Projects and the /work list: each card fades
   up as it enters the screen, and cards that enter together
   cascade in order.

   Animates the inner .grid_link, not the grid item, so items
   keep their staggered offset and the /work filter can still
   fade items in and out.

   Uses ScrollTrigger.batch, so cards scrolled past quickly
   still reveal, and cards hidden by the filter or View More
   never get stuck hidden (the filter fades those in itself).
   Load site-wide (footer) after GSAP and ScrollTrigger.
   Hooks into Barba itself.
========================================================= */

(() => {

  const CARDS = ".section_featured .grid_link";

  let triggers = [];


  function initCardReveal(scope = document) {

    if (
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined"
    ) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }

    const cards = [...scope.querySelectorAll(CARDS)].filter(
      (card) => !card.dataset.cardReveal
    );

    if (!cards.length) return;


    cards.forEach((card) => {

      card.dataset.cardReveal = "true";

      gsap.set(card, {
        opacity: 0,
        y: 60,
        filter: "blur(6px)"
      });

    });


    triggers = triggers.concat(ScrollTrigger.batch(cards, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.15,
          ease: "power2.out",
          clearProps: "filter"
        });
      }
    }));

  }


  window.initCardReveal = initCardReveal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initCardReveal());
  } else {
    initCardReveal();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    /* Drop the old page's triggers before the next page comes in */
    barba.hooks.before(() => {
      triggers.forEach((trigger) => trigger.kill());
      triggers = [];
    });

    barba.hooks.after((data) => {
      initCardReveal(
        (data && data.next && data.next.container) || document
      );
    });
  }

})();
