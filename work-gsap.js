gsap.registerPlugin(ScrollTrigger);

let workContext = null;


/* =========================================================
   INIT WORK
========================================================= */

function initWork(container = document) {

  if (!container) {
    console.warn("WORK: container not found");
    return;
  }


  /* -----------------------------------------
     CLEAN OLD INSTANCE
  ----------------------------------------- */

  if (workContext) {

    workContext.revert();
    workContext = null;

  }


  /* -----------------------------------------
     CREATE WORK CONTEXT
  ----------------------------------------- */

  workContext = gsap.context(() => {


    /* =====================================================
       HERO VISUAL SCALE
    ===================================================== */

    const imageWrap =
      container.querySelector(
        ".cms-page_img-wrap"
      );

    const visualSection =
      container.querySelector(
        ".section_hero-visual"
      );


    /*
     * Mobile: skip the scale-up so the hero
     * loads full width in the viewport.
     */

    const isMobile =
      window.matchMedia("(max-width: 767px)").matches;


    if (imageWrap && isMobile) {

      gsap.set(imageWrap, {
        scale: 1
      });

    }


    if (imageWrap && visualSection && !isMobile) {

      gsap.set(imageWrap, {
        scale: 0.68,
        transformOrigin: "center top"
      });


      gsap.to(imageWrap, {

        scale: 1,

        ease: "none",

        scrollTrigger: {

          trigger: visualSection,

          start: "top 85%",

          end: "top top",

          scrub: true,

          invalidateOnRefresh: true

        }

      });

    }


    /* =====================================================
       THREE COLUMN GALLERY
    ===================================================== */

    const galleries =
      container.querySelectorAll(
        ".work-gallery-grid"
      );


    galleries.forEach((gallery) => {

      /*
       * Wait for gallery images before
       * measuring ScrollTrigger positions.
       */

      waitForImages(
        gallery,
        () => {

          createGalleryParallax(
            gallery
          );

          ScrollTrigger.refresh();

        }
      );

    });


    /* =====================================================
       DEPTH PARALLAX
    ===================================================== */

    /*
     * Any element with data-depth="1.2" drifts
     * against the scroll inside its section.
     * Higher numbers move further, so they read
     * as closer to the viewer. Off on phones and
     * for reduced motion.
     */

    const depthItems =
      container.querySelectorAll(
        "[data-depth]"
      );

    const allowDepth =
      window.matchMedia(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)"
      ).matches;


    if (depthItems.length && allowDepth) {

      depthItems.forEach((item) => {

        const depth =
          parseFloat(item.dataset.depth) || 1;

        const section =
          item.closest("section") || item.parentElement;


        gsap.fromTo(
          item,

          {
            y: () => depth * 70
          },

          {
            y: () => depth * -70,

            ease: "none",

            scrollTrigger: {

              trigger: section,

              start: "top bottom",

              end: "bottom top",

              scrub: true,

              invalidateOnRefresh: true

            }

          }
        );

      });

    }


  }, container);


  /* -----------------------------------------
     INITIAL REFRESH
  ----------------------------------------- */

  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      ScrollTrigger.refresh();

    });

  });

}


/* =========================================================
   CREATE GALLERY PARALLAX
========================================================= */

function createGalleryParallax(gallery) {

  const left =
    gallery.querySelector(
      ".work-gallery-item.is-left"
    );

  const center =
    gallery.querySelector(
      ".work-gallery-item.is-center"
    );

  const right =
    gallery.querySelector(
      ".work-gallery-item.is-right"
    );


  /* -----------------------------------------
     LEFT + RIGHT
  ----------------------------------------- */

  const outerItems =
    [left, right].filter(Boolean);


  /*
   * Optional strength per gallery:
   * data-parallax="1.4" on .work-gallery-grid
   * moves the outer columns 40% more.
   */

  const strength =
    parseFloat(gallery.dataset.parallax) || 1;


  if (outerItems.length) {

    gsap.fromTo(
      outerItems,

      {
        yPercent: 8 * strength
      },

      {
        yPercent: -15 * strength,

        ease: "none",

        scrollTrigger: {

          trigger: gallery,

          start: "top bottom",

          end: "bottom top",

          scrub: true,

          invalidateOnRefresh: true

        }

      }
    );

  }


  /* -----------------------------------------
     CENTER
  ----------------------------------------- */

  if (center) {

    gsap.fromTo(
      center,

      {
        yPercent: 3
      },

      {
        yPercent: -5,

        ease: "none",

        scrollTrigger: {

          trigger: gallery,

          start: "top bottom",

          end: "bottom top",

          scrub: true,

          invalidateOnRefresh: true

        }

      }
    );

  }

}


/* =========================================================
   WAIT FOR IMAGES
========================================================= */

function waitForImages(element, callback) {

  const images =
    Array.from(
      element.querySelectorAll("img")
    );


  if (!images.length) {

    callback();
    return;

  }


  const pending =
    images.filter(
      image => !image.complete
    );


  if (!pending.length) {

    callback();
    return;

  }


  let loaded = 0;


  const imageReady = () => {

    loaded++;


    if (loaded === pending.length) {

      requestAnimationFrame(() => {

        callback();

      });

    }

  };


  pending.forEach((image) => {

    image.addEventListener(
      "load",
      imageReady,
      { once: true }
    );

    image.addEventListener(
      "error",
      imageReady,
      { once: true }
    );

  });

}


/* =========================================================
   DESTROY WORK
========================================================= */

function destroyWork() {

  if (workContext) {

    workContext.revert();
    workContext = null;

  }

}


/* =========================================================
   INITIAL HARD LOAD
========================================================= */

function initWorkOnLoad() {

  const container =
    document.querySelector(
      '[data-barba-namespace="project"]'
    );


  if (!container) return;


  initWork(container);

}


if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initWorkOnLoad,
    { once: true }
  );

} else {

  initWorkOnLoad();

}