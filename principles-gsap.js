gsap.registerPlugin(ScrollTrigger);

let principlesContext = null;


/* =========================================================
   INIT PRINCIPLES
========================================================= */

function initPrinciples(container = document) {

  /* -----------------------------------------
     DESKTOP ONLY
  ----------------------------------------- */

  if (window.innerWidth < 992) {
    return;
  }


  /* -----------------------------------------
     FIND PRINCIPLES SECTION
  ----------------------------------------- */

  const section =
    container.querySelector(
      ".section_principles"
    );

  if (!section) {
    return;
  }


  /* -----------------------------------------
     CLEAN OLD INSTANCE
  ----------------------------------------- */

  if (principlesContext) {

    principlesContext.revert();

    principlesContext = null;

  }


  /* -----------------------------------------
     CREATE PRINCIPLES ANIMATIONS
  ----------------------------------------- */

  principlesContext = gsap.context(() => {

    const videos =
      gsap.utils.toArray(
        ".principle_video_wrap",
        section
      );


    const items =
      gsap.utils.toArray(
        ".principles_item_wrap",
        section
      );


    const introHeading =
      section.querySelector(
        ".principles-lead"
      );


    const introWrap =
      section.querySelector(
        ".principles-lead-text-wrap"
      );


    const firstItem =
      items[0];


    if (
      !videos.length ||
      !items.length
    ) {
      return;
    }


    /* =====================================================
       INITIAL VIDEO STATES
    ===================================================== */

    videos.forEach(
      (video, i) => {

        gsap.set(
          video,
          {

            clipPath:
              i === 0
                ? "inset(0% 0% 0% 0%)"
                : "inset(100% 0% 0% 0%)",

            zIndex:
              i + 1

          }
        );

      }
    );


    /* =====================================================
       INTRO HEADING
    ===================================================== */

    if (
      introHeading &&
      introWrap &&
      firstItem
    ) {


      /* -----------------------------------------
         HEADING ITSELF STARTS NORMAL
      ----------------------------------------- */

      gsap.set(
        introHeading,
        {

          y: 0,

          opacity: 1,

          filter:
            "blur(0px)"

        }
      );


      /* -----------------------------------------
         WRAPPER START STATE
      ----------------------------------------- */

      gsap.set(
        introWrap,
        {

          y: 45,

          opacity: 0,

          filter:
            "blur(12px)"

        }
      );


      /* =================================================
         INTRO ENTRANCE
      ================================================= */

      gsap.to(
        introWrap,
        {

          y: 0,

          opacity: 1,

          filter:
            "blur(0px)",

          duration: 1,

          ease:
            "power3.out",

          scrollTrigger: {

            trigger:
              introWrap,

            start:
              "top 80%",

            toggleActions:
              "play none none reverse",

            invalidateOnRefresh:
              true

          }

        }
      );


      /* =================================================
         INTRO EXIT

         Principle 1 pushes the heading away.
      ================================================= */

      gsap.fromTo(
        introHeading,

        {

          y: 0,

          opacity: 1,

          filter:
            "blur(0px)"

        },

        {

          y: -60,

          opacity: 0,

          filter:
            "blur(14px)",

          ease:
            "none",

          immediateRender:
            false,

          scrollTrigger: {

            trigger:
              firstItem,

            start:
              "top 95%",

            end:
              "top 45%",

            scrub:
              0.5,

            invalidateOnRefresh:
              true

          }

        }
      );

    }


    /* =====================================================
       PRINCIPLE VISUAL REVEALS
    ===================================================== */

    items.forEach(
      (item, i) => {

        /*
         * Video 0 is the intro.
         *
         * Principle 1 = video 1
         * Principle 2 = video 2
         * etc.
         */

        const video =
          videos[i + 1];


        if (!video) {
          return;
        }


        /* =================================================
           WIPE VISUAL UP
        ================================================= */

        gsap.to(
          video,
          {

            clipPath:
              "inset(0% 0% 0% 0%)",

            ease:
              "none",

            scrollTrigger: {

              trigger:
                item,

              start:
                "top bottom",

              end:
                "top top",

              scrub:
                true,

              invalidateOnRefresh:
                true

            }

          }
        );

      }
    );

  }, section);


  /* =========================================================
     REFRESH AFTER LAYOUT
  ========================================================= */

  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      ScrollTrigger.refresh();

    });

  });

}


/* =========================================================
   DESTROY PRINCIPLES
========================================================= */

function destroyPrinciples() {

  if (principlesContext) {

    principlesContext.revert();

    principlesContext = null;

  }

}