/* =========================================================
   PROJECT CARDS SCROLL INTO VIEW
   Home Selected Projects and the /work list: each card fades
   up as it enters the screen, and cards that enter together
   cascade in order.

   Animates the inner .grid_link, not the grid item, so items
   keep their staggered offset and the /work filter can still
   fade items in and out.

   Uses an IntersectionObserver, so cards shown later by the
   filter or View More still reveal when they come into view.
   Load site-wide (footer) after GSAP. Hooks into Barba itself.
========================================================= */

(() => {

  const CARDS = ".section_featured .grid_link";


  function initCardReveal(scope = document) {

    if (typeof gsap === "undefined") return;

    if (!("IntersectionObserver" in window)) return;

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


    const observer = new IntersectionObserver(
      (entries) => {

        const entering = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target);

        if (!entering.length) return;

        entering.forEach((card) => observer.unobserve(card));

        gsap.to(entering, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.15,
          ease: "power2.out",
          clearProps: "filter"
        });

      },
      {
        rootMargin: "0px 0px -12% 0px"
      }
    );

    cards.forEach((card) => observer.observe(card));

  }


  window.initCardReveal = initCardReveal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initCardReveal());
  } else {
    initCardReveal();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.after((data) => {
      initCardReveal(
        (data && data.next && data.next.container) || document
      );
    });
  }

})();
