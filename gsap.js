gsap.registerPlugin(ScrollTrigger);

let homeContext = null;


/* =========================================================
   INITIAL BROWSER LOAD
========================================================= */

function initHomeOnLoad() {

  const container = document.querySelector(
    '[data-barba-namespace="home"]'
  );

  if (!container) return;

  console.log("INITIAL HOME LOAD");

  initHome(container, true);
}


if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initHomeOnLoad,
    { once: true }
  );

} else {

  initHomeOnLoad();

}


/* =========================================================
   FAILSAFE
   EMERGENCY ONLY
========================================================= */

window.addEventListener("load", () => {

  setTimeout(() => {

    const loader =
      document.querySelector(".loader");

    if (
      loader &&
      document.documentElement.classList.contains(
        "is-loading"
      )
    ) {

      console.warn(
        "LOADER FAILSAFE TRIGGERED"
      );

      loader.remove();

      document.documentElement.classList.remove(
        "is-loading"
      );

      document.documentElement.classList.remove(
        "has-loader-pre"
      );

      document.body.classList.remove(
        "has-loader"
      );

    }

  }, 10000);

});


/* =========================================================
   HOME INIT
========================================================= */

function initHome(
  container,
  firstLoad = false
) {

  if (!container) {

    console.warn(
      "INIT HOME: no container"
    );

    return;

  }


  console.log("INIT HOME");
  console.log("FIRST LOAD:", firstLoad);


  /* -----------------------------------------
     CLEAN OLD HOME INSTANCE
  ----------------------------------------- */

  if (homeContext) {

    console.log(
      "REVERTING OLD HOME CONTEXT"
    );

    homeContext.revert();

    homeContext = null;

  }


  homeContext = gsap.context(() => {
    initFeaturedMouseMove(
      container
    );

    /* =====================================================
       SESSION STORAGE
       DISABLED WHILE TESTING
    =====================================================

    const hasPlayed =
      sessionStorage.getItem(
        "loaderPlayed"
      );

    ===================================================== */


    /*
     * TESTING:
     * Force loader every refresh.
     */

    const hasPlayed = null;


    console.log(
      "LOADER PLAYED:",
      hasPlayed
    );


    /* =========================================
       FIRST VISIT THIS SESSION
    ========================================= */

    if (
      firstLoad &&
      !hasPlayed
    ) {

      console.log(
        "RUNNING HOME LOADER"
      );

      initLoader(
        container
      );

      return;

    }


    /* =========================================
       REFRESH / BARBA RETURN
    ========================================= */

    console.log(
      "RUNNING HOME WITHOUT LOADER"
    );

    skipLoader(
      container
    );

  }, container);

}


/* =========================================================
   HOME DESTROY
========================================================= */

function destroyHome() {

  console.log(
    "DESTROY HOME"
  );
  destroyFeaturedMouseMove();

  if (
    typeof destroyPrinciples ===
    "function"
  ) {

    destroyPrinciples();

  }


  if (homeContext) {

    homeContext.revert();

    homeContext = null;

  }

}


/* =========================================================
   SKIP LOADER
========================================================= */

function skipLoader(container) {

  console.log(
    "SKIP LOADER"
  );


  const loader =
    document.querySelector(
      ".loader"
    );


  if (loader) {

    loader.remove();

  }


  document.documentElement.classList.remove(
    "is-loading"
  );

  document.documentElement.classList.remove(
    "has-loader-pre"
  );

  document.body.classList.remove(
    "has-loader"
  );


  revealHero(
    container
  );


  initScrollAnimations(
    container
  );


  if (
    typeof initPrinciples ===
    "function"
  ) {

    initPrinciples(
      container
    );

  }


  requestAnimationFrame(() => {

    ScrollTrigger.refresh();

  });

}


/* =========================================================
   LOADER
   J + DOT LOADER
========================================================= */

function initLoader(container) {

  const loader =
    document.querySelector(
      ".loader"
    );


  if (!loader) {

    console.warn(
      "No loader found"
    );

    skipLoader(
      container
    );

    return;

  }


  console.log(
    "LOADER FOUND:",
    loader
  );


  /* =========================================================
     LOCK PAGE
  ========================================================= */

  document.documentElement.classList.add(
    "is-loading"
  );

  document.body.classList.add(
    "has-loader"
  );


  /* =========================================================
     RESET LOADER
  ========================================================= */

  gsap.set(
    loader,
    {
      display: "block",
      opacity: 1,
      yPercent: 0
    }
  );


  /* =========================================================
     ELEMENTS
  ========================================================= */

  const logoWrap =
    loader.querySelector(
      ".loader-logo-wrap"
    );


  const logoSides =
    loader.querySelectorAll(
      ".loader-logo-side"
    );


  const leftSide =
    logoSides[0];


  const rightSide =
    logoSides[1];


  const dot =
    rightSide
      ? rightSide.querySelector(
          ".loader-logo.is-dot"
        )
      : null;


  const leftText =
    leftSide
      ? leftSide.querySelector(
          ".loader-text"
        )
      : null;


  const rightText =
    rightSide
      ? rightSide.querySelector(
          ".loader-text"
        )
      : null;


  const jLogo =
    leftSide
      ? leftSide.querySelector(
          ".loader-logo"
        )
      : null;


  const progressEl =
    loader.querySelector(
      ".logo-progress"
    );


  const heroLayout =
    container.querySelector(
      ".hero-layout"
    );


  /* =========================================================
     DEBUG
  ========================================================= */

  console.log(
    "LOADER SIDES FOUND:",
    logoSides.length
  );

  console.log(
    "LEFT SIDE:",
    leftSide
  );

  console.log(
    "RIGHT SIDE:",
    rightSide
  );

  console.log(
    "J:",
    jLogo
  );

  console.log(
    "DOT:",
    dot
  );


  /* =========================================================
     VALIDATE
  ========================================================= */

  if (
    !logoWrap ||
    !leftSide ||
    !rightSide ||
    !dot ||
    !jLogo
  ) {

    console.warn(
      "NEW LOADER ELEMENTS MISSING",
      {
        logoWrap,
        leftSide,
        rightSide,
        jLogo,
        dot
      }
    );

    skipLoader(
      container
    );

    return;

  }


  /*
  ==========================================================
  OLD LOGO LOADER — SAVED
  ==========================================================

  const top =
    loader.querySelector(
      ".sweep-top"
    );

  const bottom =
    loader.querySelector(
      ".sweep-bottom"
    );


  if (
    !top ||
    !bottom
  ) {

    console.warn(
      "SVG paths missing"
    );

    skipLoader(
      container
    );

    return;

  }

  ==========================================================
  END OLD LOGO LOADER
  ==========================================================
  */


  /* =========================================================
     SPLIT LOADER TEXT INTO CHARACTERS
     PRESERVES BR / EXISTING ELEMENTS
  ========================================================= */

  function splitLoaderText(element) {

    if (
      !element ||
      element.dataset.loaderSplit === "true"
    ) {

      return;

    }


    element.dataset.loaderSplit =
      "true";


    function processNode(node) {

      /*
       * TEXT NODE
       */

      if (node.nodeType === Node.TEXT_NODE) {

        const fragment =
          document.createDocumentFragment();


        [...node.textContent].forEach(
          char => {

            if (char === " ") {

              const space =
                document.createTextNode(" ");

              fragment.appendChild(
                space
              );

              return;

            }


            if (
              char === "\n" ||
              char === "\r"
            ) {

              return;

            }


            const span =
              document.createElement(
                "span"
              );


            span.className =
              "loader-char";


            span.textContent =
              char;


            fragment.appendChild(
              span
            );

          }
        );


        node.replaceWith(
          fragment
        );

        return;

      }


      /*
       * LEAVE BR ELEMENTS ALONE
       */

      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName === "BR"
      ) {

        return;

      }


      /*
       * PROCESS CHILDREN
       */

      if (
        node.nodeType === Node.ELEMENT_NODE
      ) {

        [...node.childNodes].forEach(
          processNode
        );

      }

    }


    [...element.childNodes].forEach(
      processNode
    );

  }


  splitLoaderText(
    leftText
  );


  splitLoaderText(
    rightText
  );


  const leftChars =
    leftText
      ? leftText.querySelectorAll(
          ".loader-char"
        )
      : [];


  const rightChars =
    rightText
      ? rightText.querySelectorAll(
          ".loader-char"
        )
      : [];


  /* =========================================================
     PREP LOADER CHARACTERS
  ========================================================= */

  gsap.set(
    [
      ...leftChars,
      ...rightChars
    ],
    {
      display: "inline-block",
      y: 14,
      opacity: 0,
      filter: "blur(3px)",
      force3D: true
    }
  );


  /* =========================================================
     HIDE HERO
  ========================================================= */

  if (heroLayout) {

    gsap.set(
      heroLayout,
      {
        opacity: 0
      }
    );

  }


  /* =========================================================
     PREP HERO
  ========================================================= */

  const heroHeading =
    container.querySelector(
      ".hero-heading"
    );


  const heroLogo =
    container.querySelector(
      ".hero-logo"
    );


  const heroP =
    container.querySelector(
      ".hero-p-contain"
    );


  if (
    heroHeading &&
    !heroHeading.dataset.split
  ) {

    heroHeading.dataset.split =
      "true";


    heroHeading.innerHTML =
      heroHeading.textContent
        .trim()
        .split(/\s+/)
        .map(
          word =>
            `<span class="hero-word">${word}</span>`
        )
        .join(" ");

  }


  const heroWords =
    heroHeading
      ? heroHeading.querySelectorAll(
          ".hero-word"
        )
      : [];


  const heroItems = [
    ...heroWords
  ];


  if (heroLogo) {

    heroItems.push(
      heroLogo
    );

  }


  gsap.set(
    heroItems,
    {
      opacity: 0,
      y: 60,
      filter: "blur(8px)"
    }
  );


  if (heroP) {

    gsap.set(
      heroP,
      {
        autoAlpha: 0,
        y: 30
      }
    );

  }


  /* =========================================================
     RESET PROGRESS
  ========================================================= */

  if (progressEl) {

    progressEl.textContent =
      "0%";


    gsap.set(
      progressEl,
      {
        opacity: 1,
        visibility: "visible",
        yPercent: 0
      }
    );

  }


  /*
  ==========================================================
  OLD LOGO LOADER — SVG SETUP — SAVED
  ==========================================================

  const lenTop =
    top.getTotalLength();

  const lenBottom =
    bottom.getTotalLength();


  gsap.set(
    top,
    {
      strokeDasharray: lenTop,
      strokeDashoffset: lenTop
    }
  );


  gsap.set(
    bottom,
    {
      strokeDasharray: lenBottom,
      strokeDashoffset: lenBottom
    }
  );


  const fills =
    loader.querySelectorAll(
      ".fill-top, .fill-bottom"
    );


  if (fills.length) {

    gsap.set(
      fills,
      {
        scaleY: 0
      }
    );

  }

  ==========================================================
  END OLD LOGO LOADER SVG SETUP
  ==========================================================
  */


  /* =========================================================
     START STATE
  ========================================================= */

  /*
   * COMPLETE LEFT SIDE
   * starts left + below + invisible.
   */

  gsap.set(
    leftSide,
    {
      x: "-8vw",
      y: 30,
      autoAlpha: 0,
      force3D: true
    }
  );


  /*
   * COMPLETE RIGHT SIDE
   * starts right + below + invisible.
   */

  gsap.set(
    rightSide,
    {
      x: "8vw",
      y: 30,
      autoAlpha: 0,
      force3D: true
    }
  );


  gsap.set(
    logoWrap,
    {
      x: 0,
      y: 0,
      opacity: 1,
      visibility: "visible"
    }
  );


  /* =========================================================
     PROGRESS
  ========================================================= */

  const progress = {
    value: 0
  };


  /* =========================================================
     MAIN LOADER TIMELINE
  ========================================================= */

  const loaderTL =
    gsap.timeline({

      delay: 0.25,

      onStart() {

        console.log(
          "NEW LOADER ANIMATION STARTED"
        );

      },

      onComplete() {

        console.log(
          "NEW LOADER ANIMATION COMPLETE"
        );

        exitLoader();

      }

    });


  /* =========================================================
     STAGE 1
     BOTH COMPLETE SIDES RISE + FADE IN
     
     TEXT CHARACTERS REMAIN HIDDEN.
  ========================================================= */

  loaderTL.to(
    [
      leftSide,
      rightSide
    ],
    {
      y: 0,
      autoAlpha: 1,

      duration: 0.7,

      ease: "power3.out",

      force3D: true
    }
  );


  /* =========================================================
     STAGE 1B
     LEFT TEXT ROLLS UP
  ========================================================= */

  if (leftChars.length) {

    loaderTL.to(
      leftChars,
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",

        duration: 0.45,

        stagger: 0.018,

        ease: "power3.out",

        force3D: true
      },
      0
    );

  }


  /* =========================================================
     STAGE 1C
     RIGHT TEXT ROLLS UP
     
     SLIGHTLY OFFSET FROM LEFT.
  ========================================================= */

  if (rightChars.length) {

    loaderTL.to(
      rightChars,
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",

        duration: 0.45,

        stagger: 0.018,

        ease: "power3.out",

        force3D: true
      },
      0
    );

  }


  /* -----------------------------------------
     SHORT PAUSE
  ----------------------------------------- */

  loaderTL.to(
    {},
    {
      duration: 0.2
    }
  );


  /* =========================================================
     STAGE 2
     COMPLETE SIDES MOVE TOGETHER
     
     FULL TEXT REMAINS VISIBLE.
  ========================================================= */

  loaderTL.to(
    leftSide,
    {
      x: 0,

      duration: 1.7,

      ease: "power4.inOut",

      force3D: true
    }
  );


  loaderTL.to(
    rightSide,
    {
      x: 0,

      duration: 1.7,

      ease: "power4.inOut",

      force3D: true
    },
    "<"
  );


  /* -----------------------------------------
     PROGRESS 0 → 100
  ----------------------------------------- */

  loaderTL.to(
    progress,
    {
      value: 100,

      duration: 1.7,

      ease: "power2.inOut",


      onUpdate() {

        if (!progressEl) return;


        progressEl.textContent =
          Math.round(
            progress.value
          ) + "%";

      },


      onComplete() {

        if (progressEl) {

          progressEl.textContent =
            "100%";

        }

      }

    },
    "<"
  );


  /*
  ==========================================================
  OLD LOGO LOADER — PROGRESS DRAW — SAVED
  ==========================================================

  gsap.to(
    {},
    {
      duration: 1.6,

      ease: "power2.out",

      onUpdate() {

        const progress =
          this.progress() *
          100;


        if (progressEl) {

          progressEl.textContent =
            Math.floor(
              progress
            ) + "%";

        }


        gsap.set(
          top,
          {
            strokeDashoffset:
              lenTop *
              (
                1 -
                progress / 100
              )
          }
        );


        gsap.set(
          bottom,
          {
            strokeDashoffset:
              lenBottom *
              (
                1 -
                progress / 100
              )
          }
        );

      },


      onComplete() {

        if (progressEl) {

          progressEl.textContent =
            "100%";

        }


        animateFill();

        exitLoader();

      }

    }
  );


  function animateFill() {

    if (!fills.length) {

      return;

    }


    gsap.to(
      fills,
      {
        scaleY: 1,
        duration: 0.5,
        ease: "power3.out"
      }
    );

  }

  ==========================================================
  END OLD LOGO LOADER PROGRESS
  ==========================================================
  */


  /* =========================================================
     STAGE 3
     HOLD COMPLETE ASSEMBLED COMPOSITION
  ========================================================= */

  loaderTL.to(
    {},
    {
      duration: 0.5
    }
  );


  /* =========================================================
     EXIT LOADER
  ========================================================= */

  function exitLoader() {

    console.log(
      "EXITING LOADER — DOT ZOOM"
    );


    /* =====================================================
       CALCULATE DOT TAKEOVER
    ===================================================== */

    const dotRect =
      dot.getBoundingClientRect();


    const viewportDiagonal =
      Math.sqrt(
        window.innerWidth ** 2 +
        window.innerHeight ** 2
      );


    const dotSize =
      Math.min(
        dotRect.width,
        dotRect.height
      );


    const takeoverScale =
      (
        viewportDiagonal /
        dotSize
      ) * 1.35;


    console.log(
      "DOT TAKEOVER SCALE:",
      takeoverScale
    );


    /* =====================================================
       DOT SETUP
    ===================================================== */

    gsap.set(
      dot,
      {
        transformOrigin: "50% 50%",
        position: "relative",
        zIndex: 100,
        force3D: true
      }
    );


    /*
     * IMPORTANT:
     *
     * We cannot animate rightSide itself out
     * because the dot lives inside rightSide.
     *
     * J moves/fades
     * complete left text moves/fades
     * complete right text moves/fades
     * progress moves/fades
     *
     * DOT DOES NOTHING.
     */


    const elementsToExit = [
      jLogo,
      leftText,
      rightText,
      progressEl
    ].filter(Boolean);


/* =====================================================
   EXIT TIMELINE
===================================================== */

const exitTL =
  gsap.timeline();


/* =====================================================
   STAGE 4
   EVERYTHING EXCEPT DOT DROPS + FADES
===================================================== */

if (elementsToExit.length) {

  exitTL.to(
    elementsToExit,
    {
      y: 30,
      autoAlpha: 0,

      duration: 0.55,

      ease: "power3.in"
    }
  );

}


/* =====================================================
   PREP HERO UNDER BLACK TAKEOVER
===================================================== */

if (heroLayout) {

  exitTL.set(
    heroLayout,
    {
      opacity: 1
    },
    0
  );

}


/* =====================================================
   STAGE 5
   DOT → FULL BLACK SCREEN

   STARTS AT SAME TIME AS EXIT
===================================================== */

exitTL.to(
  dot,
  {
    scale: takeoverScale,

    duration: 1.3,

    ease: "power4.inOut",

    force3D: true
  },
  0
);


/* =====================================================
   FULL BLACK HOLD
===================================================== */

exitTL.to(
  {},
  {
    duration: 0.15
  }
);


    /* =====================================================
       REMOVE LOADER
    ===================================================== */

    exitTL.call(() => {

      console.log(
        "DOT TAKEOVER COMPLETE"
      );


      /* =====================================================
         SESSION STORAGE
         DISABLED WHILE TESTING
      =====================================================

      sessionStorage.setItem(
        "loaderPlayed",
        "true"
      );

      ===================================================== */


      loader.remove();


      document.documentElement.classList.remove(
        "is-loading"
      );

      document.documentElement.classList.remove(
        "has-loader-pre"
      );

      document.body.classList.remove(
        "has-loader"
      );


      /* -----------------------------------------
         HERO REVEAL
      ----------------------------------------- */

      revealHero(
        container
      );


      /* -----------------------------------------
         SCROLL ANIMATIONS
      ----------------------------------------- */

      initScrollAnimations(
        container
      );


      /* -----------------------------------------
         PRINCIPLES
      ----------------------------------------- */

      if (
        typeof initPrinciples ===
        "function"
      ) {

        initPrinciples(
          container
        );

      }


      /* -----------------------------------------
         REFRESH
      ----------------------------------------- */

      requestAnimationFrame(() => {

        ScrollTrigger.refresh();

      });

    });

  }

}


/* =========================================================
   HERO REVEAL
========================================================= */

function revealHero(container) {

  const heading =
    container.querySelector(
      ".hero-heading"
    );


  console.log(
    "HERO HEADING:",
    heading
  );


  if (!heading) {

    console.warn(
      "No .hero-heading found"
    );

    return;

  }


  /* -----------------------------------------
     SPLIT HEADING
  ----------------------------------------- */

  if (
    !heading.dataset.split
  ) {

    heading.dataset.split =
      "true";


    heading.innerHTML =
      heading.textContent
        .trim()
        .split(/\s+/)
        .map(
          word =>
            `<span class="hero-word">${word}</span>`
        )
        .join(" ");

  }


  /* -----------------------------------------
     ELEMENTS
  ----------------------------------------- */

  const words =
    heading.querySelectorAll(
      ".hero-word"
    );


  const logo =
    container.querySelector(
      ".hero-logo"
    );


  const heroItems = [
    ...words
  ];


  if (logo) {

    heroItems.push(
      logo
    );

  }


  console.log(
    "HERO ITEMS:",
    heroItems.length
  );


  /* -----------------------------------------
     STARTING STATE
  ----------------------------------------- */

  gsap.set(
    heroItems,
    {
      opacity: 0,
      y: 60,
      filter: "blur(8px)"
    }
  );


  const heroP =
    container.querySelector(
      ".hero-p-contain"
    );


  if (heroP) {

    gsap.set(
      heroP,
      {
        autoAlpha: 0,
        y: 30
      }
    );

  }


  /* -----------------------------------------
     ANIMATE
  ----------------------------------------- */

  const tl =
    gsap.timeline();


  tl.to(
    heroItems,
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",

      stagger: 0.06,

      duration: 0.8,

      ease: "power3.out"
    }
  );


  if (heroP) {

    tl.to(
      heroP,
      {
        autoAlpha: 1,
        y: 0,

        duration: 0.8,

        ease: "power3.out"
      },
      "-=0.5"
    );

  }

}


/* =========================================================
   SCROLL ANIMATIONS
========================================================= */

function initScrollAnimations(container) {

  const headings =
    gsap.utils.toArray(
      ".stag-blur",
      container
    );


  console.log(
    "STAG BLUR HEADINGS:",
    headings.length
  );


  headings.forEach(
    heading => {


      /* -----------------------------------------
         PRINCIPLES LEAD IS CONTROLLED
         BY principles-gsap.js
      ----------------------------------------- */

      if (
        heading.classList.contains(
          "principles-lead"
        )
      ) {

        return;

      }


      /* -----------------------------------------
         SPLIT
      ----------------------------------------- */

      if (
        !heading.dataset.split
      ) {

        heading.dataset.split =
          "true";


        const words =
          heading.textContent
            .trim()
            .split(/\s+/);


        heading.innerHTML =
          words
            .map(
              word =>
                `<span class="stag-word">${word}</span>`
            )
            .join(" ");

      }


      const splitWords =
        heading.querySelectorAll(
          ".stag-word"
        );


      if (
        !splitWords.length
      ) {

        return;

      }


      /* -----------------------------------------
         START STATE
      ----------------------------------------- */

      gsap.set(
        splitWords,
        {
          opacity: 0,
          y: 20,
          filter: "blur(6px)"
        }
      );


      /* -----------------------------------------
         SCROLL ANIMATION
      ----------------------------------------- */

      gsap.to(
        splitWords,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",

          stagger: 0.04,

          duration: 0.6,

          ease: "power2.out",

          scrollTrigger: {

            trigger: heading,

            start: "top 35%",

            invalidateOnRefresh:
              true

          }

        }
      );

    }
  );


  /* -----------------------------------------
     RINGS ON TABLET + PHONE
     The ring scroll interaction is desktop
     only, so fade the rings up right after
     the heading above them reveals.
  ----------------------------------------- */

  if (window.innerWidth < 992) {

    const ringsSection =
      container.querySelector(
        ".section_circles"
      );

    const ringsHeading =
      ringsSection &&
      ringsSection.querySelector(
        ".stag-blur"
      );

    const rings =
      ringsSection
        ? ringsSection.querySelectorAll(
            ".circle_scroll-parent, .circle-intersect"
          )
        : [];

    if (rings.length) {

      drawRingLotties(ringsSection);

      gsap.set(
        rings,
        {
          opacity: 0,
          y: 40,
          filter: "blur(6px)"
        }
      );

      gsap.to(
        rings,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",

          stagger: 0.12,

          duration: 0.8,

          delay: 0.5,

          ease: "power2.out",

          onStart: () =>
            drawRingLotties(ringsSection),

          scrollTrigger: {

            trigger:
              ringsHeading || ringsSection,

            start: "top 35%",

            invalidateOnRefresh:
              true

          }

        }
      );

    }

  }


  requestAnimationFrame(() => {

    ScrollTrigger.refresh();

  });

}


/* =========================================================
   RING LOTTIES ON PHONES
   Webflow skips the ring draw-in to its last
   frame on phones. After a Barba return the
   Lotties load after that skip, at different
   times, and can be reset again, so keep
   parking each ring on its drawn frame for a
   few seconds.
========================================================= */

let ringLottieTimer = null;

function drawRingLotties(section) {

  if (
    !section ||
    window.innerWidth >= 768
  ) return;

  const getLottieLib = () =>
    (window.Webflow &&
      Webflow.require &&
      Webflow.require("lottie") &&
      Webflow.require("lottie").lottie) ||
    window.lottie ||
    window.bodymovin;

  const ringEls = Array.from(
    section.querySelectorAll(
      ".circle_lottie-line"
    )
  );

  if (!ringEls.length) return;

  const parkRings = () => {

    const lottieLib = getLottieLib();

    if (
      !lottieLib ||
      !lottieLib.getRegisteredAnimations
    ) return;

    lottieLib
      .getRegisteredAnimations()
      .forEach(anim => {

        const isRing = ringEls.some(
          el =>
            el === anim.wrapper ||
            el.contains(anim.wrapper)
        );

        if (
          !isRing ||
          !anim.isLoaded ||
          !anim.totalFrames
        ) return;

        // Webflow's ring draw ends at 98%.
        const drawnFrame = Math.floor(
          (anim.totalFrames - 1) * 0.98
        );

        if (
          Math.abs(
            anim.currentFrame - drawnFrame
          ) > 0.5
        ) {

          anim.goToAndStop(
            drawnFrame,
            true
          );

        }

      });

  };

  clearInterval(ringLottieTimer);

  let ticks = 0;

  parkRings();

  ringLottieTimer = setInterval(() => {

    parkRings();

    ticks++;

    if (
      ticks >= 24 ||
      !document.contains(section)
    ) {

      clearInterval(ringLottieTimer);

      ringLottieTimer = null;

    }

  }, 250);

}
