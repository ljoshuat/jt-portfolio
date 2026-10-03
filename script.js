gsap.registerPlugin(ScrollTrigger);


/* =========================================================
   GLOBAL HEADER STATE
========================================================= */

let headerScrollTrigger = null;


/* =========================================================
   THEME  (dark / light / vibe)
   Each mode is a class on <body>; dark is the default (no class).
   vibe-theme needs the Vibe variable mode applied in Webflow.
========================================================= */

const THEME_CLASSES = {
  dark: null,
  light: "light-theme",
  vibe: "vibe-theme"
};

function initTheme() {

  const items =
    document.querySelectorAll(
      ".mode-item"
    );

  const body =
    document.body;


  /* -----------------------------------------
     APPLY A MODE (removes the others)
  ----------------------------------------- */

  function applyTheme(mode) {

    if (!(mode in THEME_CLASSES)) {

      mode = "dark";

    }


    Object.values(THEME_CLASSES).forEach((cls) => {

      if (cls) body.classList.remove(cls);

    });


    const cls =
      THEME_CLASSES[mode];

    if (cls) body.classList.add(cls);

  }


  /* -----------------------------------------
     SAVED THEME
  ----------------------------------------- */

  applyTheme(
    localStorage.getItem(
      "site-mode"
    )
  );


  /* -----------------------------------------
     CHANGE THEME
  ----------------------------------------- */

  function changeTheme(mode) {

    body.classList.add(
      "theme-transition"
    );


    applyTheme(mode);


    localStorage.setItem(
      "site-mode",
      mode
    );


    setTimeout(() => {

      body.classList.remove(
        "theme-transition"
      );

    }, 1600);

  }


  /* -----------------------------------------
     WHICH MODE DOES A BUTTON SET?
  ----------------------------------------- */

  function modeFromCircle(circle) {

    if (circle.classList.contains("is-vibe")) return "vibe";

    if (circle.classList.contains("is-light")) return "light";

    return "dark";

  }


  /* -----------------------------------------
     MODE ITEMS
  ----------------------------------------- */

  items.forEach((item) => {

    if (
      item.dataset.themeInitialized ===
      "true"
    ) {

      return;

    }


    item.dataset.themeInitialized =
      "true";


    const circle =
      item.querySelector(
        ".circle"
      );


    if (!circle) return;


    /* HOVER IN */

    item.addEventListener(
      "mouseenter",
      () => {

        gsap.to(
          circle,
          {
            scale: 1,
            duration: 0.25,
            ease: "power2.out",
            overwrite: true
          }
        );

      }
    );


    /* HOVER OUT */

    item.addEventListener(
      "mouseleave",
      () => {

        gsap.to(
          circle,
          {
            scale: 0.5,
            duration: 0.25,
            ease: "power2.out",
            overwrite: true
          }
        );

      }
    );


    /* CLICK */

    item.addEventListener(
      "click",
      () => {

        changeTheme(
          modeFromCircle(circle)
        );

      }
    );

  });

}


/* =========================================================
   RESET HEADER
========================================================= */

function resetHeader() {

  const header =
    document.querySelector(
      ".nav-component"
    );


  if (!header) return;


  /* -----------------------------------------
     STOP CURRENT HEADER ANIMATION
  ----------------------------------------- */

  gsap.killTweensOf(
    header
  );


  /* -----------------------------------------
     SHOW HEADER
  ----------------------------------------- */

  gsap.set(
    header,
    {
      yPercent: 0
    }
  );

}


/* =========================================================
   HEADER SCROLL
========================================================= */

function initHeaderScroll() {

  const header =
    document.querySelector(
      ".nav-component"
    );


  if (!header) return;


  /* -----------------------------------------
     KILL OLD HEADER SCROLLTRIGGER
  ----------------------------------------- */

  if (headerScrollTrigger) {

    headerScrollTrigger.kill();

    headerScrollTrigger = null;

  }


  /* -----------------------------------------
     STOP EXISTING HEADER TWEENS
  ----------------------------------------- */

  gsap.killTweensOf(
    header
  );


  /* -----------------------------------------
     START VISIBLE
  ----------------------------------------- */

  gsap.set(
    header,
    {
      yPercent: 0
    }
  );


  let isHidden = false;


  /* -----------------------------------------
     SHOW HEADER
  ----------------------------------------- */

  function showHeader() {

    if (!isHidden) return;


    isHidden = false;


    gsap.to(
      header,
      {
        yPercent: 0,

        duration: 0.5,

        ease: "power3.out",

        overwrite: true
      }
    );

  }


  /* -----------------------------------------
     HIDE HEADER
  ----------------------------------------- */

  function hideHeader() {

    if (isHidden) return;


    isHidden = true;


    gsap.to(
      header,
      {
        yPercent: -110,

        duration: 0.5,

        ease: "power3.inOut",

        overwrite: true
      }
    );

  }


  /* -----------------------------------------
     SCROLL DIRECTION
  ----------------------------------------- */

  headerScrollTrigger =
    ScrollTrigger.create({

      start: 0,

      end: "max",

      onUpdate(self) {

        const scrollY =
          self.scroll();


        /* -------------------------------------
           ALWAYS SHOW NEAR TOP
        ------------------------------------- */

        if (scrollY <= 80) {

          showHeader();

          return;

        }


        /* -------------------------------------
           SCROLL DOWN
        ------------------------------------- */

        if (self.direction === 1) {

          hideHeader();

        }


        /* -------------------------------------
           SCROLL UP
        ------------------------------------- */

        else {

          showHeader();

        }

      }

    });

}


/* =========================================================
   DESTROY HEADER SCROLL
========================================================= */

function destroyHeaderScroll() {

  if (headerScrollTrigger) {

    headerScrollTrigger.kill();

    headerScrollTrigger = null;

  }


  const header =
    document.querySelector(
      ".nav-component"
    );


  if (header) {

    gsap.killTweensOf(
      header
    );

  }

}


/* =========================================================
   EXPOSE GLOBAL FUNCTIONS TO BARBA
========================================================= */

window.initHeaderScroll =
  initHeaderScroll;

window.destroyHeaderScroll =
  destroyHeaderScroll;

window.resetHeader =
  resetHeader;


/* =========================================================
   INITIAL PAGE LOAD
========================================================= */

function initGlobalNav() {

  initTheme();

  initHeaderScroll();

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initGlobalNav,
    {
      once: true
    }
  );

} else {

  initGlobalNav();

}



document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     HEADER LOGO PIXEL HOVER
  ========================================================= */

  const logoWrap =
    document.querySelector(".header-logo-wrap");

  if (!logoWrap) return;


  const pixel =
    logoWrap.querySelector("svg path:first-child");

  if (!pixel) return;


  /* -----------------------------------------
     DEFAULT STATE
  ----------------------------------------- */

  gsap.set(pixel, {
    x: 0,
    transformOrigin: "center center"
  });


  /* -----------------------------------------
     HOVER IN
  ----------------------------------------- */

  logoWrap.addEventListener("mouseenter", () => {

    gsap.to(pixel, {
      x: 18,
      duration: 0.45,
      ease: "power3.out",
      overwrite: true
    });

  });


  /* -----------------------------------------
     HOVER OUT
  ----------------------------------------- */

  logoWrap.addEventListener("mouseleave", () => {

    gsap.to(pixel, {
      x: 0,
      duration: 0.35,
      ease: "back.out(2.5)",
      overwrite: true
    });

  });

});
