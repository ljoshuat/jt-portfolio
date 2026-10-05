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
     * Phones and tablets (991px and below,
     * which covers an iPhone turned sideways):
     * skip the scale-up so the hero sits full
     * width and still. matchMedia re-checks on
     * rotate or resize and undoes the desktop
     * tween when the screen narrows.
     */

    if (imageWrap && visualSection) {

      const heroMedia = gsap.matchMedia();

      heroMedia.add("(min-width: 992px)", () => {

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

      });


      heroMedia.add("(max-width: 991px)", () => {

        gsap.set(imageWrap, {
          scale: 1
        });

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

  /*
   * Phones: the head CSS reflows a stacked
   * gallery (Fan Zone) into 2 columns, each
   * stack's 1st image on the left and 2nd on
   * the right. The column wrappers no longer
   * render, so drift the images instead. The
   * right column sits about half an image
   * lower and travels further, so the two
   * columns slide past each other.
   */

  const stacks =
    gallery.querySelectorAll(".work-gallery-stack");

  if (
    stacks.length &&
    !gallery.classList.contains("is-2col") &&
    window.matchMedia("(max-width: 767px)").matches
  ) {

    const leftImages = [];
    const rightImages = [];

    stacks.forEach((stack) => {

      const images = stack.children;

      if (images[0]) leftImages.push(images[0]);
      if (images[1]) rightImages.push(images[1]);

    });


    /*
     * Room below the grid for the lowered
     * right column, so it never runs into
     * the next section.
     */

    if (rightImages[0]) {

      gsap.set(gallery, {
        paddingBottom: rightImages[0].offsetHeight * 0.5
      });

    }


    [
      [leftImages, 15, -25],
      [rightImages, 75, 25]
    ].forEach(([images, from, to]) => {

      if (!images.length) return;

      gsap.fromTo(
        images,

        {
          yPercent: from
        },

        {
          yPercent: to,

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

    });

    return;

  }


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