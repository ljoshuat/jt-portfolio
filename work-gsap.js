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


    if (imageWrap && visualSection) {

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


  if (outerItems.length) {

    gsap.fromTo(
      outerItems,

      {
        yPercent: 8
      },

      {
        yPercent: -15,

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