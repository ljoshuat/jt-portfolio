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
       Loader plays once per browser session.
    ===================================================== */

    let hasPlayed = null;

    try {
      hasPlayed =
        sessionStorage.getItem(
          "loaderPlayed"
        );
    } catch (e) {}


    /*
     * PREVIEW: ?grid plays the loader every time,
     * with the tonal badge grid behind it.
     */
    if (loaderGridPreview()) {
      hasPlayed = null;
    }


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
   LOADER VARIANT
   "words" (DESIGN. BUILD. LAUNCH.) is the default since
   2026-10-15. The J + dot loader is kept intact: add
   ?loader=classic to the URL, or data-loader="classic" to
   .loader in Webflow, to play it instead.
========================================================= */

function loaderVariant(loader) {
  if (/[?&]loader=classic(&|$)/.test(window.location.search)) {
    return "classic";
  }
  if (loader && loader.dataset.loader === "classic") {
    return "classic";
  }
  return "words";
}


/* =========================================================
   LOADER GRID (PREVIEW)
   Tonal badge grid behind the J + dot loader, with a few
   cells glowing up and settling back while it runs.
   Only on when the URL has ?grid. Colors come from the
   active theme (dark, light-theme, vibe-theme).
========================================================= */

function loaderGridPreview() {
  // Calm-lights grid is the default loader. Add ?nogrid to the URL to see the old one.
  return !/[?&]nogrid(=|&|$)/.test(window.location.search);
}


/*
 * Recolor one loader element to the theme text color:
 * text color always, fill/stroke on SVG shapes that use
 * them, and background where the element has one (the dot).
 */
function themeInk(el, color) {
  const cs = getComputedStyle(el);
  const props = { color };
  const hasBg =
    cs.backgroundColor &&
    cs.backgroundColor !== "transparent" &&
    !/rgba\(.*,\s*0\)$/.test(cs.backgroundColor);
  if (hasBg) props.backgroundColor = color;
  if (el instanceof SVGElement) {
    if (cs.fill && cs.fill !== "none") props.fill = color;
    if (cs.stroke && cs.stroke !== "none") props.stroke = color;
  }
  gsap.set(el, props);
}


// The badge cell: the tonal grid's tile and the shape the dot morphs into.
const LOADER_BADGE_PATH =
  "M66.5861 176.845C79.1247 126.353 108.201 81.5103 149.182 49.461C190.164 17.4117 240.693 0 292.718 0H538.905L472.315 268.155C459.777 318.647 430.7 363.49 389.719 395.539C348.737 427.588 298.208 445 246.183 445H0L66.5861 176.845Z";


function buildLoaderGrid(loader) {

  const NS = "http://www.w3.org/2000/svg";

  const BADGE = LOADER_BADGE_PATH;


  /* -----------------------------------------
     THEME COLORS
  ----------------------------------------- */

  function toRGB(value) {
    const probe = document.createElement("span");
    probe.style.color = value;
    document.body.appendChild(probe);
    const m = getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0];
    probe.remove();
    return m.slice(0, 3).map(Number);
  }

  function mix(a, b, t) {
    return "rgb(" + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",") + ")";
  }

  const bodyStyle = getComputedStyle(document.body);
  const token = name => bodyStyle.getPropertyValue(name).trim();

  let bgValue = getComputedStyle(loader).backgroundColor;
  if (!bgValue || /rgba\(.*,\s*0\)$/.test(bgValue) || bgValue === "transparent") {
    bgValue = token("--color--bg-primary") || "#0A0F12";
  }

  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

  const bg = toRGB(bgValue);
  const isDark = lum(bg) < 128;

  /*
   * The loader can sit on a different color than the theme
   * (light loader on the dark theme), so the shape color is
   * whichever theme color stands out most against it.
   */
  const fg = [
    toRGB(token("--color--text-primary") || "#F7F7F7"),
    toRGB(token("--color--bg-primary") || "#0A0F12"),
    isDark ? [247, 247, 247] : [10, 15, 18]
  ].sort((a, b) => Math.abs(lum(b) - lum(bg)) - Math.abs(lum(a) - lum(bg)))[0];

  /* Accent glows only where they read, otherwise ink. */
  const accent = toRGB(token("--color--accent") || "#DAF40A");
  const accentReads = Math.abs(lum(accent) - lum(bg)) > 90;

  const tones = isDark
    ? [mix(bg, fg, 0.04), mix(bg, fg, 0.07), mix(bg, fg, 0.10)]
    : [mix(bg, fg, 0.05), mix(bg, fg, 0.08), mix(bg, fg, 0.11)];
  const lit = mix(bg, fg, isDark ? 0.17 : 0.2);
  const glow = accentReads
    ? mix(bg, accent, isDark ? 0.9 : 0.75)
    : mix(bg, fg, 0.35);


  /* -----------------------------------------
     GRID
     Same lattice as the Figma tonal pattern.
  ----------------------------------------- */

  const W = window.innerWidth;
  const H = window.innerHeight;

  const w = Math.max(150, Math.min(340, W / 5.5));
  const s = w / 539;
  const h = 445 * s;
  const px = 0.796 * w;
  const py = h * 1.002;
  const shift = -0.206 * w;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "loader-grid");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  Object.assign(svg.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: "-1",
    pointerEvents: "none"
  });

  const defs = document.createElementNS(NS, "defs");
  const cellPath = document.createElementNS(NS, "path");
  cellPath.setAttribute("id", "loader-grid-cell");
  cellPath.setAttribute("d", BADGE);
  cellPath.setAttribute("transform", "scale(" + s + ")");
  defs.appendChild(cellPath);
  svg.appendChild(defs);

  const cells = [];
  const rows = Math.ceil(H / py) + 2;

  for (let r = -1; r < rows; r++) {
    const off = ((r * shift) % px + px) % px - px * 1.5;
    for (let x = off; x < W + px; x += px) {
      const use = document.createElementNS(NS, "use");
      use.setAttribute("href", "#loader-grid-cell");
      use.setAttribute("x", x.toFixed(1));
      use.setAttribute("y", (r * py).toFixed(1));
      const base = tones[Math.floor(Math.random() * tones.length)];
      use.style.fill = base;
      svg.appendChild(use);
      cells.push({
        el: use,
        base,
        cx: x + w / 2,
        cy: r * py + h / 2
      });
    }
  }

  /* Grid sits behind the logo, above the loader background. */
  gsap.set(loader, { isolation: "isolate" });
  loader.insertBefore(svg, loader.firstChild);


  /* -----------------------------------------
     ANIMATE
  ----------------------------------------- */

  function play(runTime) {

    const tl = gsap.timeline();
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      return tl;
    }

    const maxD = Math.hypot(W / 2, H / 2);

    cells.forEach(c => {
      gsap.set(c.el, { opacity: 0 });
      tl.to(
        c.el,
        {
          opacity: 1,
          duration: 0.6,
          ease: "power1.out"
        },
        0.6 * Math.hypot(c.cx - W / 2, c.cy - H / 2) / maxD
      );
    });

    const pool = cells.slice().sort(() => Math.random() - 0.5);
    const glows = Math.max(5, Math.round(cells.length * 0.2));
    const picks = pool.slice(0, glows);

    /* Always exactly three accent tiles, spread apart on screen
       and lit on an even beat across the run. */
    const ACCENTS = 3;
    const onScreen = c =>
      c.cx > w * 0.35 && c.cx < W - w * 0.35 && c.cy > h * 0.35 && c.cy < H - h * 0.35;
    const visible = pool.filter(onScreen);
    const candidates = visible.length >= ACCENTS ? visible : pool;
    const dist = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy);
    const accents = [candidates[0]];
    while (accents.length < ACCENTS) {
      // Farthest-point pick, random among the near-farthest.
      const ranked = candidates
        .filter(c => !accents.includes(c))
        .map(c => ({ c, d: Math.min(...accents.map(a => dist(a, c))) }))
        .sort((a, b) => b.d - a.d);
      const best = ranked.filter(r => r.d >= ranked[0].d * 0.85);
      accents.push(best[Math.floor(Math.random() * best.length)].c);
    }
    const rest = picks.filter(c => !accents.includes(c));

    // One accent per beat. Each flash fades out before the next one
    // starts, so two never overlap.
    const beat = runTime / ACCENTS;
    const flash = Math.min(0.7, beat * 0.9);
    accents.forEach((c, k) => {
      const at = 0.5 + k * beat;
      tl.to(c.el, { fill: glow, duration: flash * 0.4, ease: "sine.out" }, at)
        .to(c.el, { fill: c.base, duration: flash * 0.5, ease: "sine.in" }, at + flash * 0.5);
    });

    rest.forEach((c, i) => {
      const at = 0.5 + (i / rest.length) * runTime + Math.random() * 0.2;
      tl.to(c.el, { fill: lit, duration: 0.5, ease: "sine.inOut" }, at)
        .to(c.el, { fill: c.base, duration: 0.9, ease: "sine.inOut" }, at + 0.65);
    });

    return tl;
  }

  return { svg, play };
}


/* =========================================================
   DOT → BADGE MORPH
   On the dot takeover the words loader's dot grows into
   the badge (the tonal grid's cell). Both outlines use the
   same commands (M L C C L L C C Z) so the numbers can be
   tweened, and the takeover scale is checked against the
   badge so its rounded corners still cover the screen.
   Works in the dot's own coordinates (DOT_PATH's viewBox).
========================================================= */

function dotBadgeMorph(path) {

  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // The dot: M270.33 0H346.33L324.229 89H248.229Z
  const BL = [248.229, 89], TL = [270.33, 0], TR = [346.33, 0], BR = [324.229, 89];
  const from = [
    BL, lerp(BL, TL, 0.6),
    lerp(BL, TL, 0.73), lerp(BL, TL, 0.87), TL,
    lerp(TL, TR, 0.15), lerp(TL, TR, 0.3), lerp(TL, TR, 0.45),
    TR, lerp(TR, BR, 0.6),
    lerp(TR, BR, 0.73), lerp(TR, BR, 0.87), BR,
    lerp(BR, BL, 0.15), lerp(BR, BL, 0.3), lerp(BR, BL, 0.45)
  ];

  // The badge (LOADER_BADGE_PATH), 89 tall and centered on the dot.
  const k = 89 / 445;
  const ox = (BL[0] + TR[0]) / 2 - 538.905 * k / 2;
  const to = [
    [0, 445], [66.5861, 176.845],
    [79.1247, 126.353], [108.201, 81.5103], [149.182, 49.461],
    [190.164, 17.4117], [240.693, 0], [292.718, 0],
    [538.905, 0], [472.315, 268.155],
    [459.777, 318.647], [430.7, 363.49], [389.719, 395.539],
    [348.737, 427.588], [298.208, 445], [246.183, 445]
  ].map(([x, y]) => [ox + x * k, y * k]);

  const d = p => {
    const f = i => p[i][0].toFixed(3) + " " + p[i][1].toFixed(3);
    return "M" + f(0) + "L" + f(1) +
      "C" + f(2) + " " + f(3) + " " + f(4) +
      "C" + f(5) + " " + f(6) + " " + f(7) +
      "L" + f(8) + "L" + f(9) +
      "C" + f(10) + " " + f(11) + " " + f(12) +
      "C" + f(13) + " " + f(14) + " " + f(15) + "Z";
  };

  // The badge's outline as a polygon, for the cover check.
  const bez = (a, b, c, e, t) => {
    const u = 1 - t;
    return [0, 1].map(i => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * e[i]);
  };
  const outline = [to[0], to[1]];
  [[1, 4], [4, 7], [9, 12], [12, 15]].forEach(([a, e], n) => {
    for (let i = 1; i <= 8; i++) outline.push(bez(to[a], to[a + 1], to[a + 2], to[e], i / 8));
    if (n === 1) outline.push(to[8], to[9]);
  });

  const inside = ([x, y]) => outline.every((a, i) => {
    const b = outline[(i + 1) % outline.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) >= 0;
  });

  const state = { t: 0 };
  const svg = path.ownerSVGElement;
  if (svg) svg.style.overflow = "visible";

  return {
    // Scale (of the dot's on-screen box) at which the badge covers the screen.
    coverScale(rect) {
      const px = rect.width / (TR[0] - BL[0]);
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const corners = [[0, 0], [window.innerWidth, 0], [0, window.innerHeight], [window.innerWidth, window.innerHeight]];
      const covers = s => corners.every(([x, y]) =>
        inside([(BL[0] + TR[0]) / 2 + (x - cx) / (px * s), 44.5 + (y - cy) / (px * s)]));
      let lo = 1, hi = 1;
      while (!covers(hi) && hi < 1e5) hi *= 2;
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2;
        covers(mid) ? (hi = mid) : (lo = mid);
      }
      return hi;
    },
    tween(vars) {
      return gsap.to(state, Object.assign({
        t: 1,
        onUpdate: () => path.setAttribute("d", d(from.map((a, i) => lerp(a, to[i], state.t))))
      }, vars));
    }
  };
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


  let dot =
    rightSide
      ? rightSide.querySelector(
          ".loader-logo.is-dot"
        )
      : null;


  let leftText =
    leftSide
      ? leftSide.querySelector(
          ".loader-text"
        )
      : null;


  let rightText =
    rightSide
      ? rightSide.querySelector(
          ".loader-text"
        )
      : null;


  let jLogo =
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


  /* =========================================================
     LOADER GRID (PREVIEW, ?grid ONLY)
     The loader takes the theme's colors: dark by default,
     light in light-theme, lime in vibe-theme. J, dot and
     text use the theme text color so they read on it.
  ========================================================= */

  let loaderGrid = null;
  let themeBg = null;

  if (loaderGridPreview()) {

    const themeStyle = getComputedStyle(document.body);
    themeBg =
      themeStyle.getPropertyValue("--color--bg-primary").trim() || "#0A0F12";
    const themeText =
      themeStyle.getPropertyValue("--color--text-primary").trim() || "#F7F7F7";

    gsap.set(loader, { backgroundColor: themeBg, color: themeText });

    [jLogo, dot, leftText, rightText, progressEl].forEach(el => {
      if (!el) return;
      themeInk(el, themeText);
      el.querySelectorAll("*").forEach(child => themeInk(child, themeText));
    });

    loaderGrid = buildLoaderGrid(loader);
    loaderGrid.play(loaderVariant(loader) === "words" ? 3.6 : 2.2);

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
     WORDS LOADER (DEFAULT)
     DESIGN. BUILD. LAUNCH. roll up through one line in the
     center. The dot from the mark is their period: it stays
     on the line, then flies into the J's dot as the J rolls
     in. The exit below is the same dot takeover, so the
     J + dot elements are swapped for the new ones here.
  ========================================================= */

  const J_PATH =
    "M87.951 0H236.33L196.392 160.829C179.777 222.007 123.847 267 57.408 267H0L22.101 178H56.748C82.455 178 104.149 160.814 110.495 137.446L118.811 103.961C128.657 94.685 141.925 89 156.521 89H65.85Z";

  const DOT_PATH =
    "M270.33 0H346.33L324.229 89H248.229Z";

  function runWordsLoader() {

    const themeStyle = getComputedStyle(document.body);
    const token = name => themeStyle.getPropertyValue(name).trim();
    const textColor = token("--color--text-primary") || "#F7F7F7";
    // Lime on dark; the theme maps the accent to ink on light and vibe.
    const dotColor = token("--color--accent") || "#DAF40A";
    const display =
      (leftText && getComputedStyle(leftText).fontFamily) ||
      '"Druk Wide Web", Verdana, sans-serif';
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!document.getElementById("loader-words-style")) {
      const style = document.createElement("style");
      style.id = "loader-words-style";
      style.textContent =
        // Centered on the small viewport height so phone toolbars don't shift it.
        ".loader-words{position:absolute;inset:0;z-index:2;pointer-events:none;--lw-size:min(11vw,8rem)}" +
        ".loader-words-line{position:absolute;left:0;right:0;top:50%;top:50svh;transform:translateY(-50%);height:1.12em;overflow:hidden;font-weight:700;font-size:var(--lw-size);line-height:1.12;text-transform:uppercase;white-space:nowrap}" +
        ".loader-word{position:absolute;inset:0;display:flex;justify-content:center;align-items:baseline}" +
        ".loader-word-stop{display:inline-block;width:.31em;height:.28em;margin-left:.07em}" +
        ".loader-words-mark{position:absolute;left:50%;top:50%;top:50svh;width:calc(var(--lw-size) * 2.6);aspect-ratio:346.4/267;transform:translate(-50%,-50%);overflow:hidden}" +
        ".loader-words-mark svg{display:block;width:100%;height:100%;fill:currentColor}" +
        ".loader-words-dot{position:absolute;left:0;top:0;width:0;height:0}" +
        ".loader-words-dot-ink{position:relative;width:100%;height:100%}" +
        ".loader-words-dot svg{display:block;width:100%;height:100%;fill:currentColor}";
      document.head.appendChild(style);
    }

    const stage = document.createElement("div");
    stage.className = "loader-words";
    stage.setAttribute("aria-hidden", "true");
    stage.innerHTML =
      '<div class="loader-words-line">' +
      ["Design", "Build", "Launch"]
        .map(w => '<div class="loader-word">' + w + '<i class="loader-word-stop"></i></div>')
        .join("") +
      "</div>" +
      '<div class="loader-words-mark"><svg viewBox="0 0 346.4 267"><path d="' + J_PATH + '"/></svg></div>' +
      '<div class="loader-words-dot"><div class="loader-words-dot-ink">' +
      '<svg viewBox="248.229 0 98.101 89" preserveAspectRatio="none"><path d="' + DOT_PATH + '"/></svg>' +
      "</div></div>";
    loader.appendChild(stage);

    const line = stage.querySelector(".loader-words-line");
    const words = [...stage.querySelectorAll(".loader-word")];
    const stops = words.map(w => w.querySelector(".loader-word-stop"));
    const markBox = stage.querySelector(".loader-words-mark");
    const markSvg = markBox.querySelector("svg");
    const jPath = markSvg.querySelector("path");
    const dotBox = stage.querySelector(".loader-words-dot");
    const dotInk = stage.querySelector(".loader-words-dot-ink");

    gsap.set(stage, { color: textColor });
    gsap.set(line, { fontFamily: display });
    gsap.set(dotBox, { color: dotColor });

    // The old J + dot stay in the page, hidden.
    gsap.set([leftSide, rightSide], { autoAlpha: 0 });

    // Hand the exit the new pieces.
    dot = dotInk;
    jLogo = markSvg;
    leftText = null;
    rightText = null;

    // Shrink the words if LAUNCH. would not fit the screen.
    function fit() {
      stage.style.removeProperty("--lw-size");
      const widest = Math.max(...words.map(w => {
        const r = w.lastElementChild.getBoundingClientRect();
        const l = w.firstChild;
        const range = document.createRange();
        range.selectNodeContents(l);
        return r.right - range.getBoundingClientRect().left;
      }));
      const room = window.innerWidth * 0.88;
      if (widest > room) {
        const size = parseFloat(getComputedStyle(line).fontSize);
        stage.style.setProperty("--lw-size", (size * room / widest).toFixed(1) + "px");
      }
    }

    // Measured when each move starts, so a late font swap is fine.
    function stopBox(i) {
      const o = stage.getBoundingClientRect();
      const l = line.getBoundingClientRect();
      const s = stops[i];
      return {
        x: l.left - o.left + s.offsetLeft,
        y: l.top - o.top + s.offsetTop,
        width: s.offsetWidth,
        height: s.offsetHeight
      };
    }

    // The dot inside the mark spans x 248.229 to 346.33, y 0 to 89.
    function markDotBox() {
      const o = stage.getBoundingClientRect();
      const m = markBox.getBoundingClientRect();
      const k = m.width / 346.4;
      return {
        x: m.left - o.left + 248.229 * k,
        y: m.top - o.top,
        width: 98.101 * k,
        height: 89 * k
      };
    }

    const to = box => ({
      x: () => box().x,
      y: () => box().y,
      width: () => box().width,
      height: () => box().height
    });

    const progress = { value: 0 };
    const count = duration => ({
      value: 100,
      duration,
      ease: "power1.inOut",
      onUpdate() {
        if (progressEl) {
          progressEl.textContent = Math.round(progress.value) + "%";
        }
      }
    });

    gsap.set(words, { yPercent: 110 });
    gsap.set(jPath, { y: 280 });
    gsap.set(dot, { autoAlpha: 0, scale: 0.2, transformOrigin: "50% 50%" });

    const wordsTL = gsap.timeline({
      onComplete() {
        exitLoader();
      }
    });

    wordsTL.call(fit, null, 0);

    if (reduce) {
      gsap.set(words, { autoAlpha: 0 });
      gsap.set(jPath, { y: 0 });
      wordsTL.set(dotBox, to(markDotBox), 0)
        .set(dot, { autoAlpha: 1, scale: 1 }, 0)
        .to(progress, count(1.2), 0)
        .to({}, { duration: 0.4 });
      return;
    }

    const roll = 0.62;
    const hold = 0.5;
    const ease = "power3.inOut";

    // DESIGN. arrives and the dot pops in as its period.
    wordsTL.to(words[0], { yPercent: 0, duration: roll, ease: "power3.out" }, 0.15)
      .set(dotBox, to(() => stopBox(0)), 0.5)
      .to(dot, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.5)" }, 0.5);

    let t = 0.15 + roll + hold;

    // Each word rolls up and out as the next rolls in; the dot slides to the new end.
    for (let i = 1; i < words.length; i++) {
      wordsTL.to(words[i - 1], { yPercent: -110, duration: roll, ease }, t)
        .to(words[i], { yPercent: 0, duration: roll, ease }, t)
        .to(dotBox, { ...to(() => stopBox(i)), duration: roll, ease }, t);
      t += roll + hold;
    }

    // LAUNCH. rolls out, the J rolls up, and the dot lands as the J's dot.
    wordsTL.to(words[words.length - 1], { yPercent: -110, duration: roll, ease }, t)
      .to(jPath, { y: 0, duration: 0.8, ease: "power3.out" }, t + 0.3)
      .to(dotBox, { ...to(markDotBox), duration: 0.8, ease: "power3.inOut" }, t + 0.05);

    t += 0.95;

    wordsTL.to(progress, count(t), 0);

    // Hold the finished mark, then the dot takeover.
    wordsTL.to({}, { duration: 0.45 }, t);
  }


  if (loaderVariant(loader) === "words") {

    runWordsLoader();

  } else {

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


  }
  /* END J + DOT LOADER (classic) */


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


    let takeoverScale =
      (
        viewportDiagonal /
        dotSize
      ) * 1.35;


    /*
     * Words loader: the dot grows into the badge on the
     * way up, so the scale has to cover with the badge's
     * rounded corners too.
     */
    const dotPath =
      dot.querySelector("path");

    const badgeMorph =
      dotPath && dotPath.getAttribute("d") === DOT_PATH
        ? dotBadgeMorph(dotPath)
        : null;

    if (badgeMorph) {
      takeoverScale = Math.max(
        takeoverScale,
        badgeMorph.coverScale(dotRect) * 1.1
      );
    }


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


/*
 * Grid fades out under the dot takeover, and the dot
 * shifts to the theme background so it hands off cleanly.
 */
if (loaderGrid) {

  exitTL.to(
    loaderGrid.svg,
    {
      autoAlpha: 0,
      duration: 0.7,
      ease: "power2.in"
    },
    0
  );

  const dotInk = [dot, ...dot.querySelectorAll("*")].filter(el => {
    const cs = getComputedStyle(el);
    return el instanceof SVGElement
      ? cs.fill && cs.fill !== "none"
      : cs.backgroundColor && !/rgba\(.*,\s*0\)$/.test(cs.backgroundColor) && cs.backgroundColor !== "transparent";
  });

  dotInk.forEach(el => {
    exitTL.to(
      el,
      el instanceof SVGElement
        ? { fill: themeBg, duration: 0.6, ease: "power2.in" }
        : { backgroundColor: themeBg, duration: 0.6, ease: "power2.in" },
      // Hold the color a beat longer so the badge reads.
      badgeMorph ? 0.2 : 0
    );
  });

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

if (badgeMorph) {

  exitTL.add(
    badgeMorph.tween({
      duration: 0.5,
      ease: "power2.inOut"
    }),
    0
  );

}


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
      ===================================================== */

      try {
        sessionStorage.setItem(
          "loaderPlayed",
          "true"
        );
      } catch (e) {}


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


  /* -----------------------------------------
     [HELLO, I'M JOSH] ABOVE THE HEADING
     Fades in first, then the heading follows.
  ----------------------------------------- */

  const heroEyebrow =
    container.querySelector(
      '[data-mobile-copy="hello"]'
    );


  if (heroEyebrow) {

    gsap.set(
      heroEyebrow,
      {
        autoAlpha: 0,
        y: 20
      }
    );

    tl.to(
      heroEyebrow,
      {
        autoAlpha: 1,
        y: 0,

        duration: 0.6,

        ease: "power3.out"
      }
    );

  }


  tl.to(
    heroItems,
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",

      stagger: 0.06,

      duration: 0.8,

      ease: "power3.out"
    },
    heroEyebrow ? "-=0.3" : 0
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


  /* -----------------------------------------
     HERO VIDEO
     Fades up and in like the heading, right
     after it, on every screen size.
  ----------------------------------------- */

  const demoVid =
    container.querySelector(
      ".section_demo-vid"
    );


  if (demoVid) {

    gsap.set(
      demoVid,
      {
        opacity: 0,
        y: 60,
        filter: "blur(8px)"
      }
    );

    tl.to(
      demoVid,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",

        duration: 0.8,

        ease: "power3.out",

        onComplete: () =>
          gsap.set(demoVid, {
            clearProps: "transform,filter"
          })
      },
      "-=0.4"
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


  /* Word tweens by heading, so a catch-up
     below can speed one up. */
  const stagTweens = new Map();


  headings.forEach(
    heading => {


      /* -----------------------------------------
         PRINCIPLES LEAD IS CONTROLLED
         BY principles-gsap.js ON DESKTOP.
         principles-gsap.js doesn't run below 992,
         so phones and tablets get the same word
         blur-up as "I partner with..." below,
         started a little lower (top 70%).
      ----------------------------------------- */

      const isLead =
        heading.classList.contains(
          "principles-lead"
        );

      if (
        isLead &&
        window.innerWidth >= 992
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

      const wordsTween = gsap.to(
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

            start: isLead
              ? "top 70%"
              : "top 35%",

            invalidateOnRefresh:
              true

          }

        }
      );

      stagTweens.set(heading, wordsTween);

    }
  );


  /* -----------------------------------------
     PHONE EYEBROWS AROUND THE RINGS HEADING
     [Welcome…] fades in just before the
     heading's words, [Since 2003] once they finish.
     Only shown on phones (data-mobile-copy).
  ----------------------------------------- */

  /* Reveals that wait on a delay, so the
     catch-up under the rings can hurry them. */
  const delayedReveals = [];

  [
    ["welcome", false],
    ["since", true]
  ].forEach(([name, afterHeading]) => {

    const eyebrow =
      container.querySelector(
        `[data-mobile-copy="${name}"]`
      );

    if (!eyebrow) return;

    const heading =
      eyebrow.parentElement &&
      eyebrow.parentElement.querySelector(
        ".stag-blur"
      );

    const delay =
      afterHeading
        ? stagRevealTime(heading)
        : 0;

    const eyebrowTween = gsap.fromTo(
      eyebrow,
      {
        autoAlpha: 0,
        y: 20
      },
      {
        autoAlpha: 1,
        y: 0,

        duration: 0.6,

        delay,

        ease: "power2.out",

        /* ScrollTrigger's default "play" skips a
           tween's delay; "restart" keeps it. Once,
           so it can't replay. */

        scrollTrigger: {

          trigger: heading || eyebrow,

          start: "top 35%",

          toggleActions:
            "restart none none none",

          once: true,

          invalidateOnRefresh:
            true

        }

      }
    );

    if (delay) delayedReveals.push(eyebrowTween);

  });


  /* -----------------------------------------
     RINGS ON TABLET + PHONE
     The ring scroll interaction is desktop
     only, so fade the rings up right after
     the heading above them (and the phone
     [Since 2003] under it) reveals.
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

      const ringsTween = gsap.to(
        rings,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",

          /* Top-down: the center ring's label sits
             highest, then the side rings with the
             overlap shape that sits across them. */
          stagger: (i, el) =>
            el.classList.contains("center")
              ? 0
              : 0.12,

          duration: 0.8,

          delay:
            window.innerWidth < 768
              ? stagRevealTime(ringsHeading) + 0.3
              : 0.5,

          ease: "power2.out",

          onStart: () =>
            drawRingLotties(ringsSection),

          /* "restart" so the delay holds
             (see the eyebrows above). */

          scrollTrigger: {

            trigger:
              ringsHeading || ringsSection,

            start: "top 35%",

            toggleActions:
              "restart none none none",

            once: true,

            invalidateOnRefresh:
              true

          }

        }
      );

      delayedReveals.push(ringsTween);

    }


    /* Catch-up: if a fast scroll brings the next
       section close while the heading's words,
       [Since 2003] or the rings are still waiting,
       hurry them (in order) so nothing below shows
       before them. */

    if (ringsSection && delayedReveals.length) {

      ScrollTrigger.create({

        trigger: ringsSection,

        /* 150px before the next section shows,
           but never before the heading starts. */
        start: () => {

          const headingTrigger =
            stagTweens.get(ringsHeading) &&
            stagTweens.get(ringsHeading).scrollTrigger;

          const nextShows =
            ringsSection.getBoundingClientRect().bottom +
            window.scrollY -
            window.innerHeight;

          return Math.max(
            headingTrigger ? headingTrigger.start + 60 : 0,
            nextShows - 150
          );

        },

        invalidateOnRefresh: true,

        once: true,

        onEnter: () => {

          const wordsTween =
            stagTweens.get(ringsHeading);

          if (
            wordsTween &&
            wordsTween.progress() < 1
          ) {

            if (wordsTween.scrollTrigger) {
              wordsTween.scrollTrigger.kill(false, true);
            }

            wordsTween.timeScale(3).play();

          }

          delayedReveals.forEach((tween, i) => {

            if (
              tween.progress() > 0 ||
              tween.isActive()
            ) return;

            if (tween.scrollTrigger) {
              tween.scrollTrigger.kill(false, true);
            }

            tween
              .timeScale(1.5)
              .delay(0.15 + i * 0.15)
              .restart(true);

          });

        }

      });

    }

  }


  initLowerHomeFadeUps(container, stagTweens);


  requestAnimationFrame(() => {

    ScrollTrigger.refresh();

  });

}


/* =========================================================
   LOWER HOME FADE-UPS
   From the principles down (principle number,
   title, video, text, logos, Kind Words, footer)
   each block fades up as it scrolls in. They
   queue in page order, so nothing lower starts
   before everything above it has, and the last
   footer items still play at the very bottom.
   Desktop gets the same from the logos down;
   its principles have their own sticky scroll
   (principles-gsap.js).
========================================================= */

function initLowerHomeFadeUps(container, stagTweens) {

  if (
    !container.querySelector(".section_principles")
  ) return;

  const desktop = window.innerWidth >= 992;

  const items = gsap.utils.toArray(
    [
      ...(desktop ? [] : [
        ".section_principles .principles_item_wrap > *",
        ".section_principles .principles_item_layout > *"
      ]),
      ".section_logos .heading-wrap",
      ".section_logos .logo-wrap",
      ".section_testimonial .testimonial_wrap > *",
      ".footer .work-together-wrap",
      ".footer .footer-layout > :not(.work-together-wrap)"
    ].join(", "),
    container
  ).filter(el =>
    !el.classList.contains("principles_item_layout") &&
    el.getBoundingClientRect().height > 0
  ).sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return ra.top - rb.top || ra.left - rb.left;
  });

  if (!items.length) return;

  const tweens = items.map(el =>
    gsap.fromTo(
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

        onComplete: () =>
          gsap.set(el, {
            clearProps: "transform"
          })
      }
    )
  );

  /* Side-by-side items (a logo row, the footer
     columns) start together. */
  const tops = items.map(el =>
    Math.round(el.getBoundingClientRect().top)
  );

  let next = 0;
  let lastStart = 0;

  /* The principles wait for the Great Work
     words above them to finish. */
  const leadHeading =
    container.querySelector(".principles-lead");

  const leadTween =
    leadHeading && stagTweens.get(leadHeading);

  const waitForLead = () => {

    if (!leadTween) return;

    if (leadTween.progress() === 0) {

      if (leadTween.scrollTrigger) {
        leadTween.scrollTrigger.kill(false, true);
      }

      leadTween.play();

    }

    const leadStart =
      gsap.ticker.time - leadTween.totalTime();

    lastStart = Math.max(
      lastStart,
      leadStart + stagRevealTime(leadHeading) - 0.1
    );

  };

  const revealThrough = index => {

    if (next === 0) waitForLead();

    while (next <= index) {

      const i = next++;
      const tween = tweens[i];
      const now = gsap.ticker.time;
      const sameRow =
        i > 0 && Math.abs(tops[i] - tops[i - 1]) < 8;
      const at = Math.max(
        now,
        sameRow ? lastStart : lastStart + 0.1
      );

      lastStart = at;

      gsap.delayedCall(at - now, () => tween.play());

    }

  };

  items.forEach((el, i) => {

    ScrollTrigger.create({

      trigger: el,

      /* 85% down the screen, or the bottom of
         the page for footer items that never
         get that high. */
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

    });

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

/* How long a .stag-blur heading's word stagger
   takes to finish (0.04s stagger, 0.6s per word),
   so lines under it can wait their turn. */
function stagRevealTime(heading) {

  const words =
    heading
      ? heading.querySelectorAll(".stag-word").length
      : 0;

  return words
    ? (words - 1) * 0.04 + 0.6
    : 0.6;

}


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


/* =========================================================
   BADGE STORY (JT CREATIVE CASE STUDY)
   Hover a part of the badge to light it, fade the
   section up as it scrolls in, and stamp the launch
   badge lime. Runs on load and again whenever a page
   transition brings the section in.
========================================================= */

function initBadgeStory() {

  const root =
    document.getElementById(
      "jt-badge-story"
    );

  if (!root || root.dataset.jtbInit) return;

  root.dataset.jtbInit = "true";
  root.classList.add("is-js");

  const reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* Anatomy hover */

  const rows =
    root.querySelectorAll(
      ".jtb-part"
    );

  function setPart(part) {
    if (part) root.setAttribute("data-part", part);
    else root.removeAttribute("data-part");
    rows.forEach(row =>
      row.classList.toggle(
        "is-on",
        row.getAttribute("data-part") === part
      )
    );
  }

  rows.forEach(row => {
    const part = row.getAttribute("data-part");
    // Remember the state before a tap: on touch, focus fires before
    // click and would otherwise make the first tap toggle straight off.
    let before;
    let mouse = false;
    row.addEventListener("pointerdown", e => {
      before = root.getAttribute("data-part");
      mouse = e.pointerType === "mouse";
    });
    row.addEventListener("pointerenter", e => {
      if (e.pointerType === "mouse") setPart(part);
    });
    row.addEventListener("pointerleave", e => {
      if (e.pointerType === "mouse") setPart(null);
    });
    row.addEventListener("focus", () => setPart(part));
    row.addEventListener("blur", () => setPart(null));
    row.addEventListener("click", () => {
      const was = before !== undefined ? before : root.getAttribute("data-part");
      before = undefined;
      if (mouse) { mouse = false; setPart(part); return; }
      setPart(was === part ? null : part);
    });
  });

  root.querySelectorAll(".jtb-hero path").forEach(el => {
    const part = el.getAttribute("data-part");
    el.addEventListener("mouseenter", () => setPart(part));
    el.addEventListener("mouseleave", () => setPart(null));
  });


  /* Scroll reveal, launch badge stamps last */

  const launch =
    root.querySelector(
      ".jtb-step:nth-child(3)"
    );

  function goLive() {
    if (!launch || launch.classList.contains("is-live")) return;
    launch.classList.add("is-live");
    if (!reduce) launch.classList.add("is-stamp");
  }

  const items =
    root.querySelectorAll(
      "[data-rise]"
    );

  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("is-in"));
    goLive();
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries
      .filter(entry => entry.isIntersecting)
      .forEach((entry, i) => {
        const el = entry.target;
        el.style.transitionDelay = (i * 0.12) + "s";
        el.classList.add("is-in");
        io.unobserve(el);
        if (el === launch) setTimeout(goLive, 700 + i * 120);
      });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.15
  });

  items.forEach(el => io.observe(el));

}


/*
 * Page transitions swap the content without running
 * the page's own scripts, so watch for the section
 * arriving instead of relying on a hook.
 */
/* =========================================================
   BRAND SECTIONS (TYPOGRAPHY, WHICH MARK)
   Fade each row or card up as it scrolls in.
========================================================= */

function initBrandSections() {

  document.querySelectorAll(".jtx:not([data-jtx-init])").forEach(root => {

    root.setAttribute("data-jtx-init", "true");
    root.classList.add("is-js");

    const items =
      root.querySelectorAll(
        "[data-rise]"
      );

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      items.forEach(el => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries
        .filter(entry => entry.isIntersecting)
        .forEach((entry, i) => {
          entry.target.style.transitionDelay = (i * 0.1) + "s";
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
    }, {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.15
    });

    items.forEach(el => io.observe(el));

  });

}


function initLogoSheet() {
  document.querySelectorAll("#jt-logo-sheet:not([data-jtl-init])").forEach(root => {
    root.dataset.jtlInit = "true";
    const build = root.querySelector(".jtl-build");
    if (!build || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("is-js");
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        root.classList.add("is-drawn");
        io.disconnect();
      });
    }, { threshold: 0.35 });
    io.observe(build);
  });
}

(function watchBadgeStory() {

  function initAll() {
    initBadgeStory();
    initBrandSections();
    // initLogoSheet(); on hold until Josh wants the construction draw-in live
  }

  function start() {
    initAll();
    new MutationObserver(initAll).observe(
      document.body,
      { childList: true, subtree: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
