/* =========================================================
   FEATURED PROJECTS — 3D MOUSE TILT
========================================================= */

let featuredMouseCleanup = [];


/* =========================================================
   INIT
========================================================= */

function initFeaturedMouseMove(container = document) {

  destroyFeaturedMouseMove();


  /* -----------------------------------------
     DESKTOP ONLY
  ----------------------------------------- */

  if (
    !window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches
  ) {
    return;
  }


  /* -----------------------------------------
     FIND CARDS
  ----------------------------------------- */

  const cards =
    container.querySelectorAll(
      ".section_featured .grid_link"
    );


  if (!cards.length) {

    console.log(
      "FEATURED 3D: no cards found"
    );

    return;

  }


  console.log(
    "FEATURED 3D:",
    cards.length,
    "cards"
  );


  /* =========================================================
     EACH CARD
  ========================================================= */

  cards.forEach((card) => {

    const wrap =
      card.querySelector(
        ".visual_wrap"
      );


    if (!wrap) return;


    let bounds = null;


    /* =====================================================
       PERSPECTIVE
    ===================================================== */

    gsap.set(
      card,
      {
        perspective: 1000
      }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    gsap.set(
      wrap,
      {
        rotationX: 0,
        rotationY: 0,
        transformPerspective: 1000,
        transformOrigin: "50% 50%",
        force3D: true
      }
    );


    /* =====================================================
       ROTATION SETTERS
    ===================================================== */

    const rotateX =
      gsap.quickTo(
        wrap,
        "rotationX",
        {
          duration: 0.5,
          ease: "power3.out"
        }
      );


    const rotateY =
      gsap.quickTo(
        wrap,
        "rotationY",
        {
          duration: 0.5,
          ease: "power3.out"
        }
      );


    /* =====================================================
       MOUSE ENTER
    ===================================================== */

    function handleMouseEnter() {

      /*
       * Capture original card bounds
       * before transformation.
       */

      bounds =
        card.getBoundingClientRect();


      /*
       * Keep transformed card above
       * neighboring cards.
       */

      wrap.style.zIndex = "20";

    }


    /* =====================================================
       MOUSE MOVE
    ===================================================== */

    function handleMouseMove(event) {

      if (!bounds) {

        bounds =
          card.getBoundingClientRect();

      }


      /* -----------------------------------------
         NORMALIZE CURSOR

         -1 = left / top
          0 = center
          1 = right / bottom
      ----------------------------------------- */

      const rawX =
        (
          (
            event.clientX -
            bounds.left
          ) /
          bounds.width -
          0.5
        ) * 2;


      const rawY =
        (
          (
            event.clientY -
            bounds.top
          ) /
          bounds.height -
          0.5
        ) * 2;


      const x =
        gsap.utils.clamp(
          -1,
          1,
          rawX
        );


      const y =
        gsap.utils.clamp(
          -1,
          1,
          rawY
        );


      /* -----------------------------------------
         3D TILT

         Mouse left:
         left side recedes

         Mouse right:
         right side recedes

         Mouse top:
         top recedes

         Mouse bottom:
         bottom recedes
      ----------------------------------------- */

      const maxTilt = 7;


      rotateY(
        x * -maxTilt
      );


      rotateX(
        y * maxTilt
      );

    }


    /* =====================================================
       MOUSE LEAVE
    ===================================================== */

    function handleMouseLeave() {

      bounds = null;


      /* -----------------------------------------
         RETURN TO FLAT
      ----------------------------------------- */

      rotateX(0);
      rotateY(0);


      /*
       * Wait for return animation before
       * resetting stacking order.
       */

      gsap.delayedCall(
        0.5,
        () => {

          wrap.style.zIndex = "";

        }
      );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    card.addEventListener(
      "mouseenter",
      handleMouseEnter
    );


    card.addEventListener(
      "mousemove",
      handleMouseMove
    );


    card.addEventListener(
      "mouseleave",
      handleMouseLeave
    );


    /* =====================================================
       CLEANUP
    ===================================================== */

    featuredMouseCleanup.push(
      () => {

        card.removeEventListener(
          "mouseenter",
          handleMouseEnter
        );


        card.removeEventListener(
          "mousemove",
          handleMouseMove
        );


        card.removeEventListener(
          "mouseleave",
          handleMouseLeave
        );


        gsap.killTweensOf(
          wrap
        );


        wrap.style.zIndex = "";


        gsap.set(
          card,
          {
            clearProps: "perspective"
          }
        );


        gsap.set(
          wrap,
          {
            clearProps:
              "rotationX,rotationY,transform,transformOrigin"
          }
        );

      }
    );

  });

}


/* =========================================================
   DESTROY
========================================================= */

function destroyFeaturedMouseMove() {

  featuredMouseCleanup.forEach(
    cleanup => cleanup()
  );


  featuredMouseCleanup = [];

}