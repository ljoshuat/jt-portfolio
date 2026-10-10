/* =========================================================
   SNIPPETS INFINITE COLLAGE
   An endless, scattered field of snippets that pans in every
   direction. It drifts on its own (like the old vertical scroll),
   the canvas leans toward the mouse, and wheel, trackpad, drag
   and arrow keys pan it, with an inertial glide on release.

   The world is procedural: each grid cell picks its snippet, size
   and jitter from a hash of its coordinates, so the field is
   different everywhere but the same when you pan back. Only the
   tiles on screen exist in the DOM; the rest are recycled.

   Load site-wide (footer) after GSAP, Barba and lenis-init.js.
   It hooks into Barba itself, like snippets-scroll.js.

   Markup: put data-snippets-collage on the Snippets section
   (instead of data-snippets). The CMS list inside it is only read
   for its images; the script hides it and draws the tiles itself.
     [data-snippets-collage]
       ... any Collection List with the snippet images inside ...
       optional data-snippets-video="https://...mp4" on an item

   Optional attributes on [data-snippets-collage]:
     data-speed="70"      drift speed, px per second (default 70)
     data-direction="up"  "up", "down", "left" or "right" to start
     data-mouse="0.14"    how far the canvas leans toward the mouse,
                          as a share of the screen (0 turns it off)
     data-shuffle="false" same start every visit

   Reduced motion: no drift, no mouse lean, no glide; it still pans.
========================================================= */

(() => {
  /* Motion values from the reference effect (kept as is) */
  const EASE_FACTOR = 0.09; /* lerp factor per frame */
  const FLING_MULT = 14; /* inertia multiplier on drag release */
  const CELL_RATIO = 2.1; /* world-cell pitch / base tile width */
  const BASE_MIN = 150; /* min base tile width (px) */
  const BASE_MAX = 260; /* max base tile width (px) */
  const BASE_VP_RATIO = 0.24; /* base = min(vw, vh) x this */
  const INIT_X = 2444; /* opening pan */
  const INIT_Y = 47;
  const WIDTHS = [0.68, 0.9, 1.0, 1.0, 1.3, 1.65];
  const RESIZE_DEBOUNCE = 150;

  /* Our additions */
  const DEFAULT_SPEED = 70; /* same drift as the old Snippets scroll */
  const DRIFT_WAIT = 0.6; /* s of stillness before the drift returns */
  const DRIFT_RAMP = 1.2; /* s for the drift to get back to speed */
  const MOUSE_RANGE = 0.14; /* share of the screen the canvas leans */
  const MOUSE_EASE = 0.05; /* lerp factor for the lean */
  const KEY_STEP = 120;
  const MAX_TALL = 1.5; /* tall pieces: height at most base x this */

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let active = null;

  function hash2(x, y) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
    return (h ^ (h >>> 16)) >>> 0;
  }

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  /* DRAG CURSOR: the Snippets DRAG badge, with left and right
     arrows added since the collage pans every way */
  const DRAG_CURSOR_SIZE = 96;
  const DRAG_CURSOR_FILL = 60;
  const DRAG_CURSOR_BLUR = 18;
  const DRAG_CURSOR_SVG =
      '<svg viewBox="0 0 163 163" width="100%" height="100%" aria-hidden="true">' +
      '<circle cx="81.5" cy="81.5" r="81.5" style="fill:color-mix(in srgb,var(--color--accent,#e3ff00) ' + DRAG_CURSOR_FILL + '%,transparent);transition:fill .4s ease"/>' +
      '<g style="fill:var(--color--bg-primary,#000);transition:fill .4s ease">' +
      '<g transform="translate(82.2 81.7) scale(.78) translate(-82.2 -81.7)"><path d="M41 74.26H50.86C52.3 74.26 53.5533 74.36 54.62 74.56C55.7 74.7467 56.6267 75.0067 57.4 75.34C58.1867 75.6733 58.8333 76.0667 59.34 76.52C59.8467 76.9733 60.2467 77.4667 60.54 78C60.8467 78.52 61.06 79.06 61.18 79.62C61.3 80.18 61.36 80.74 61.36 81.3V81.9C61.36 82.4333 61.3 82.9867 61.18 83.56C61.0733 84.12 60.8733 84.6667 60.58 85.2C60.2867 85.7333 59.8867 86.24 59.38 86.72C58.8733 87.2 58.2333 87.62 57.46 87.98C56.6867 88.34 55.76 88.6267 54.68 88.84C53.6 89.04 52.3333 89.14 50.88 89.14H41V74.26ZM45.66 85.56H50.5C51.82 85.56 52.8733 85.4333 53.66 85.18C54.4467 84.9133 55.0467 84.5933 55.46 84.22C55.8867 83.8333 56.16 83.42 56.28 82.98C56.4133 82.5267 56.48 82.1067 56.48 81.72V81.6C56.48 81.2267 56.42 80.82 56.3 80.38C56.18 79.9267 55.9133 79.5067 55.5 79.12C55.0867 78.7333 54.48 78.4133 53.68 78.16C52.8933 77.9067 51.8333 77.78 50.5 77.78H45.66V85.56Z"/><path d="M67.6131 80.56H74.6731C75.3398 80.56 75.8198 80.42 76.1131 80.14C76.4065 79.86 76.5531 79.5133 76.5531 79.1V79.08C76.5531 78.6933 76.4065 78.36 76.1131 78.08C75.8331 77.7867 75.3531 77.64 74.6731 77.64H67.6131V80.56ZM67.6131 89.14H62.9531V74.26H74.9531C76.1931 74.26 77.2265 74.36 78.0531 74.56C78.8798 74.76 79.5398 75.04 80.0331 75.4C80.5398 75.7467 80.8931 76.1533 81.0931 76.62C81.3065 77.0867 81.4131 77.5867 81.4131 78.12V78.36C81.4131 78.8933 81.3131 79.3467 81.1131 79.72C80.9265 80.0933 80.6865 80.4133 80.3931 80.68C80.1131 80.9333 79.8131 81.1333 79.4931 81.28C79.1731 81.4267 78.8931 81.54 78.6531 81.62C79.0265 81.7267 79.3865 81.8733 79.7331 82.06C80.0798 82.2467 80.3798 82.4867 80.6331 82.78C80.8865 83.06 81.0865 83.3867 81.2331 83.76C81.3931 84.1333 81.4731 84.56 81.4731 85.04V87.22C81.4731 87.82 81.4998 88.2467 81.5531 88.5C81.6198 88.74 81.6865 88.92 81.7531 89.04V89.14H77.0131C76.9465 89.0467 76.8931 88.9333 76.8531 88.8C76.8131 88.6667 76.7931 88.4667 76.7931 88.2V86.48C76.7931 85.5733 76.5598 84.9133 76.0931 84.5C75.6398 84.0733 74.8398 83.86 73.6931 83.86H67.6131V89.14Z"/><path d="M92.54 77.48L89.78 83.06H95.42L92.54 77.48ZM97.14 86.42H88.12L86.78 89.14H82.04L89.56 74.26H95.6L103.56 89.14H98.54L97.14 86.42Z"/><path d="M112.507 89.4C111.161 89.4 109.981 89.2867 108.967 89.06C107.954 88.82 107.081 88.5067 106.348 88.12C105.614 87.7333 105.007 87.2867 104.527 86.78C104.047 86.2733 103.661 85.7467 103.368 85.2C103.088 84.64 102.888 84.08 102.768 83.52C102.648 82.9467 102.588 82.4133 102.588 81.92V81.36C102.588 80.88 102.634 80.3667 102.728 79.82C102.834 79.26 103.021 78.7067 103.287 78.16C103.567 77.6133 103.941 77.0933 104.408 76.6C104.888 76.0933 105.501 75.6467 106.247 75.26C106.994 74.8733 107.894 74.5667 108.948 74.34C110.001 74.1133 111.241 74 112.668 74H113.527C114.914 74 116.121 74.0933 117.147 74.28C118.174 74.4667 119.048 74.7133 119.768 75.02C120.488 75.3267 121.081 75.68 121.548 76.08C122.014 76.4667 122.381 76.8667 122.647 77.28C122.914 77.6933 123.101 78.1067 123.208 78.52C123.314 78.9333 123.374 79.3067 123.387 79.64V79.66H118.427C118.401 79.58 118.328 79.4267 118.208 79.2C118.088 78.96 117.841 78.72 117.467 78.48C117.107 78.2267 116.581 78.0067 115.887 77.82C115.207 77.6333 114.288 77.54 113.128 77.54C111.994 77.54 111.061 77.6533 110.327 77.88C109.594 78.1067 109.014 78.4067 108.588 78.78C108.174 79.1533 107.881 79.58 107.707 80.06C107.547 80.54 107.467 81.04 107.467 81.56V81.78C107.467 82.26 107.568 82.74 107.768 83.22C107.968 83.7 108.288 84.1333 108.728 84.52C109.181 84.8933 109.761 85.2 110.467 85.44C111.187 85.6667 112.061 85.78 113.088 85.78C114.194 85.78 115.114 85.6933 115.848 85.52C116.594 85.3333 117.188 85.12 117.628 84.88C118.068 84.64 118.381 84.4067 118.567 84.18C118.754 83.94 118.848 83.7667 118.848 83.66V83.62H113.007V80.8H123.488V89.14H120.688C120.674 89.0067 120.647 88.84 120.607 88.64C120.567 88.44 120.521 88.2333 120.467 88.02C120.414 87.7933 120.354 87.58 120.287 87.38C120.221 87.1667 120.154 86.98 120.088 86.82C119.928 87.0067 119.681 87.2467 119.348 87.54C119.014 87.8333 118.561 88.12 117.988 88.4C117.428 88.6667 116.727 88.9 115.887 89.1C115.061 89.3 114.074 89.4 112.927 89.4H112.507Z"/></g><g transform="translate(0 -4)"><path d="M82.9109 42.5993C82.1362 41.8003 80.8834 41.8003 80.1169 42.5993L67.5811 55.5192C66.8063 56.3182 66.8063 57.6102 67.5811 58.4007C68.3558 59.1912 69.6085 59.1997 70.375 58.4007L81.5015 46.9258L92.6281 58.4007C93.4028 59.1997 94.6555 59.1997 95.422 58.4007C96.1885 57.6017 96.1968 56.3097 95.422 55.5192L82.9109 42.5993Z"/></g><g transform="translate(0 4)"><path d="M80.0891 120.401C80.8638 121.2 82.1166 121.2 82.8831 120.401L95.419 107.481C96.1937 106.682 96.1937 105.39 95.419 104.599C94.6442 103.809 93.3915 103.8 92.625 104.599L81.4985 116.074L70.372 104.599C69.5972 103.8 68.3445 103.8 67.578 104.599C66.8115 105.398 66.8032 106.69 67.578 107.481L80.0891 120.401Z"/></g><g transform="translate(25 0) rotate(90 81.5 81.5)"><path d="M82.9109 42.5993C82.1362 41.8003 80.8834 41.8003 80.1169 42.5993L67.5811 55.5192C66.8063 56.3182 66.8063 57.6102 67.5811 58.4007C68.3558 59.1912 69.6085 59.1997 70.375 58.4007L81.5015 46.9258L92.6281 58.4007C93.4028 59.1997 94.6555 59.1997 95.422 58.4007C96.1885 57.6017 96.1968 56.3097 95.422 55.5192L82.9109 42.5993Z"/></g><g transform="translate(-25 0) rotate(-90 81.5 81.5)"><path d="M82.9109 42.5993C82.1362 41.8003 80.8834 41.8003 80.1169 42.5993L67.5811 55.5192C66.8063 56.3182 66.8063 57.6102 67.5811 58.4007C68.3558 59.1912 69.6085 59.1997 70.375 58.4007L81.5015 46.9258L92.6281 58.4007C93.4028 59.1997 94.6555 59.1997 95.422 58.4007C96.1885 57.6017 96.1968 56.3097 95.422 55.5192L82.9109 42.5993Z"/></g>' +
    "</g></svg>";

  function makeDragCursor(root) {
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    if (!finePointer) return null;

    const el = document.createElement("div");
    el.className = "snippets-cursor";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = DRAG_CURSOR_SVG;
    el.style.cssText =
      "display:block;position:fixed;top:0;left:0;z-index:2147483646;pointer-events:none;" +
      "width:" + DRAG_CURSOR_SIZE + "px;height:" + DRAG_CURSOR_SIZE + "px;" +
      "margin:" + -DRAG_CURSOR_SIZE / 2 + "px 0 0 " + -DRAG_CURSOR_SIZE / 2 + "px;" +
      "opacity:0;transform:translate3d(-200px,-200px,0) scale(0.6);" +
      "transition:opacity .25s ease;will-change:transform;" +
      "border-radius:50%;-webkit-backdrop-filter:blur(" + DRAG_CURSOR_BLUR + "px);" +
      "backdrop-filter:blur(" + DRAG_CURSOR_BLUR + "px);";
    document.body.appendChild(el);
    root.style.cursor = "none";

    const pos = { x: -200, y: -200 };
    const target = { x: -200, y: -200 };
    let scale = 0.6;
    let targetScale = 0.6;
    let shown = false;
    let started = false;
    let raf = null;

    function setTrail(hidden) {
      const trail = document.querySelector(".cursor-trail");
      if (trail) trail.style.visibility = hidden ? "hidden" : "";
    }

    function show(on) {
      if (on === shown) return;
      shown = on;
      el.style.opacity = on ? "1" : "0";
      targetScale = on ? 1 : 0.6;
      setTrail(on);
    }

    function onMove(e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!started) {
        started = true;
        pos.x = target.x;
        pos.y = target.y;
      }
      const over = document.elementFromPoint(e.clientX, e.clientY);
      show(!!(over && root.contains(over)) && !menuOpen());
    }

    function onLeave() {
      show(false);
    }

    function loop() {
      pos.x += (target.x - pos.x) * 0.35;
      pos.y += (target.y - pos.y) * 0.35;
      scale += (targetScale - scale) * 0.25;
      el.style.transform =
        "translate3d(" + pos.x + "px," + pos.y + "px,0) scale(" +
        scale.toFixed(3) + ")";
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return {
      press(down) {
        if (shown) targetScale = down ? 0.85 : 1;
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("mouseleave", onLeave);
        setTrail(false);
        root.style.cursor = "";
        el.remove();
      },
    };
  }

  function menuOpen() {
    const menu = document.querySelector(".menu-wrap");
    return !!(menu && menu.classList.contains("is-open"));
  }

  /* Read the snippets from the CMS list: image, alt, optional video */
  function readSnippets(root) {
    const out = [];
    let imgs = root.querySelectorAll(".w-dyn-item img");
    if (!imgs.length) imgs = root.querySelectorAll("img");
    imgs.forEach((img) => {
      if (img.closest("[data-collage-stage]")) return;
      if (img.classList.contains("w-dyn-bind-empty")) return;
      const src = img.currentSrc || img.getAttribute("src");
      if (!src) return;
      const holder = img.closest("[data-snippets-video]");
      const video = holder
        ? (holder.getAttribute("data-snippets-video") || "").trim()
        : "";
      out.push({ src, alt: img.alt || "", video, ratio: 1 });
    });
    return out;
  }

  function shuffled(n) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  function initCollage(scope = document) {
    const root = scope.querySelector("[data-snippets-collage]");
    if (!root || root.dataset.collageReady) return;

    const snippets = readSnippets(root);
    const N = snippets.length;
    if (!N) return;

    if (active) active.destroy();
    root.dataset.collageReady = "true";

    const speed = parseFloat(root.getAttribute("data-speed")) || DEFAULT_SPEED;
    const mouseAttr = parseFloat(root.getAttribute("data-mouse"));
    const mouseRange = isNaN(mouseAttr) ? MOUSE_RANGE : mouseAttr;
    const shuffle = root.getAttribute("data-shuffle") !== "false";
    const startDir = {
      up: [0, 1],
      down: [0, -1],
      left: [1, 0],
      right: [-1, 0],
    }[root.getAttribute("data-direction") || "up"] || [0, 1];

    const ease = reduceMotion ? 1 : EASE_FACTOR;

    /* Hide the CMS list; it is only the image pool */
    const pool = Array.from(root.children).filter(
      (el) => el.querySelector("img") && !el.matches(".section_hero")
    );
    pool.forEach((el) => {
      el.setAttribute("data-collage-pool", "");
      el.style.display = "none";
    });

    /* Every visit starts on a different patch, in a different order */
    const order = shuffle ? shuffled(N) : shuffled(N).sort((a, b) => a - b);
    const salt = shuffle ? Math.floor(Math.random() * 100000) : 0;

    /* Learn each snippet's real shape, so nothing gets cropped */
    let pending = N;
    const ready = new Promise((resolve) => {
      const done = () => {
        if (--pending <= 0) resolve();
      };
      snippets.forEach((s) => {
        const probe = new Image();
        probe.onload = () => {
          if (probe.naturalWidth && probe.naturalHeight) {
            s.ratio = probe.naturalWidth / probe.naturalHeight;
          }
          done();
        };
        probe.onerror = done;
        probe.src = s.src;
      });
      setTimeout(resolve, 2500);
    });

    /* Stage + vignette */
    const stage = document.createElement("div");
    stage.setAttribute("data-collage-stage", "");
    stage.setAttribute("aria-hidden", "true");
    stage.style.cssText =
      "position:absolute;inset:0;z-index:1;will-change:transform;opacity:0;";
    const vignette = document.createElement("div");
    vignette.setAttribute("aria-hidden", "true");
    vignette.style.cssText =
      "position:absolute;inset:0;z-index:2;pointer-events:none;" +
      "background:radial-gradient(125% 125% at 50% 50%,transparent 52%," +
      "color-mix(in srgb,var(--color--bg-primary,#0a0f12) 82%,transparent) 100%);" +
      "transition:background .4s ease;";
    root.appendChild(stage);
    root.appendChild(vignette);

    if (!root.hasAttribute("aria-label")) {
      root.setAttribute(
        "aria-label",
        "Snippets: an endless collage. Scroll, drag or use the arrow keys to look around."
      );
    }
    root.style.touchAction = "none";
    root.style.userSelect = "none";
    root.style.webkitUserSelect = "none";

    /* ---------------------------------------------
       LAYOUT
    --------------------------------------------- */

    let base = 0;
    let CELL = 0;

    function measure() {
      const vw = root.clientWidth;
      const vh = root.clientHeight;
      base = Math.round(
        Math.max(BASE_MIN, Math.min(BASE_MAX, Math.min(vw, vh) * BASE_VP_RATIO))
      );
      CELL = Math.round(base * CELL_RATIO);
    }

    /* Which snippet a cell shows. A linear pattern through a shuffled
       order means neighbours (across, down and diagonal) never show the
       same piece, even with only a dozen snippets. */
    function snippetFor(ci, cj) {
      return order[mod(ci * 7 + cj * 3 + salt, N)];
    }

    function itemFor(ci, cj) {
      const seed = hash2(ci, cj);
      const r = (s) => hash2(seed, s);
      if (r(0) % 100 < 6) return null;
      const idx = snippetFor(ci, cj);
      const wMul = WIDTHS[r(1) % WIDTHS.length];
      const ratio = snippets[idx].ratio || 1;
      let w = Math.round(base * wMul);
      let h = Math.round(w / ratio);
      /* Tall pieces would tower over the rest: shrink them to fit */
      if (h > base * MAX_TALL) {
        h = Math.round(base * MAX_TALL);
        w = Math.round(h * ratio);
      }
      const jx = (r(3) % 1000) / 1000 - 0.5;
      const jy = (r(4) % 1000) / 1000 - 0.5;
      const cx = (ci + 0.5 + jx * 0.6) * CELL;
      const cy = (cj + 0.5 + jy * 0.6) * CELL;
      return {
        x: Math.round(cx - w / 2),
        y: Math.round(cy - h / 2),
        w,
        h,
        img: idx,
        lg: wMul >= 1.3,
      };
    }

    /* ---------------------------------------------
       TILE POOL (only on-screen tiles exist)
    --------------------------------------------- */

    const tiles = new Map();
    const free = [];

    const videoIO =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const v = entry.target;
                if (entry.isIntersecting && !reduceMotion) {
                  const p = v.play();
                  if (p && p.catch) p.catch(() => {});
                } else v.pause();
              });
            },
            { root }
          )
        : null;

    function setMedia(el, s) {
      const want = s.video && !reduceMotion ? "video" : "img";
      let media = el.firstChild;
      if (!media || media.tagName.toLowerCase() !== want) {
        if (media) {
          if (videoIO && media.tagName === "VIDEO") videoIO.unobserve(media);
          media.remove();
        }
        media = document.createElement(want);
        media.className = "snippets-collage_media";
        media.draggable = false;
        media.style.cssText =
          "display:block;width:100%;height:100%;object-fit:cover;" +
          "pointer-events:none;transform:scale(1.001);";
        if (want === "video") {
          media.muted = true;
          media.loop = true;
          media.playsInline = true;
          media.setAttribute("muted", "");
          media.setAttribute("playsinline", "");
          media.preload = "metadata";
          if (videoIO) videoIO.observe(media);
        } else {
          media.alt = "";
          media.decoding = "async";
        }
        el.appendChild(media);
      }
      if (want === "video") {
        if (media.getAttribute("src") !== s.video) {
          media.poster = s.src;
          media.setAttribute("src", s.video);
        }
      } else if (media.getAttribute("src") !== s.src) {
        media.setAttribute("src", s.src);
      }
    }

    function acquire(item) {
      let el = free.pop();
      if (!el) {
        el = document.createElement("div");
        el.className = "snippets-collage_tile";
        stage.appendChild(el);
      }
      el.style.cssText =
        "position:absolute;top:0;left:0;display:block;overflow:hidden;" +
        "width:" + item.w + "px;height:" + item.h + "px;" +
        "border-radius:" +
        (item.lg ? "var(--spacing--radius-md,1rem)" : "var(--spacing--radius-sm,.5rem)") +
        ";background:var(--color--bg-secondary,#18191a);" +
        "box-shadow:0 10px 30px -12px rgba(10,15,18,.65);will-change:transform;";
      setMedia(el, snippets[item.img]);
      return el;
    }

    function release(el) {
      el.style.display = "none";
      const v = el.firstChild;
      if (v && v.tagName === "VIDEO") v.pause();
      free.push(el);
    }

    function clearTiles() {
      tiles.forEach((rec) => release(rec.el));
      tiles.clear();
    }

    /* ---------------------------------------------
       PAN STATE
       tgt/cur: the pan (reference lerp). drift: the auto movement,
       a direction that follows the visitor's last push. lean: the
       eased offset toward the mouse, added on top when drawing.
    --------------------------------------------- */

    const jumpX = shuffle ? Math.floor(Math.random() * 40000) - 20000 : 0;
    const jumpY = shuffle ? Math.floor(Math.random() * 40000) - 20000 : 0;
    let tgtX = INIT_X + jumpX;
    let tgtY = INIT_Y + jumpY;
    let curX = tgtX;
    let curY = tgtY;

    let dirX = startDir[0];
    let dirY = startDir[1];
    let driftAmt = 1;
    let idle = DRIFT_WAIT;

    let leanX = 0;
    let leanY = 0;
    let leanTX = 0;
    let leanTY = 0;

    function interacted(dx, dy) {
      idle = 0;
      driftAmt = 0;
      const len = Math.hypot(dx, dy);
      if (len > 0.5) {
        dirX = dx / len;
        dirY = dy / len;
      }
    }

    function render() {
      const vw = root.clientWidth;
      const vh = root.clientHeight;
      const px = curX + leanX;
      const py = curY + leanY;
      const pad = Math.ceil((base * 1.65 + 0.6 * CELL) / CELL) + 1;
      const i0 = Math.floor(px / CELL) - pad;
      const i1 = Math.floor((px + vw) / CELL) + pad;
      const j0 = Math.floor(py / CELL) - pad;
      const j1 = Math.floor((py + vh) / CELL) + pad;

      const seen = new Set();

      for (let ci = i0; ci <= i1; ci++) {
        for (let cj = j0; cj <= j1; cj++) {
          const it = itemFor(ci, cj);
          if (!it) continue;
          const x = it.x - px;
          const y = it.y - py;
          if (x + it.w <= 0 || x >= vw || y + it.h <= 0 || y >= vh) continue;

          const key = ci + "|" + cj;
          seen.add(key);
          let rec = tiles.get(key);
          if (!rec) {
            rec = { el: acquire(it) };
            tiles.set(key, rec);
          }
          rec.el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
        }
      }

      tiles.forEach((rec, key) => {
        if (!seen.has(key)) {
          release(rec.el);
          tiles.delete(key);
        }
      });
    }

    let last = performance.now();

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!root.isConnected) {
        destroy();
        return;
      }

      /* Auto drift: waits while the visitor is busy, then eases back in */
      if (!reduceMotion && !dragging) {
        idle += dt;
        if (idle >= DRIFT_WAIT) driftAmt = Math.min(1, driftAmt + dt / DRIFT_RAMP);
        const d = speed * driftAmt * dt;
        tgtX += dirX * d;
        tgtY += dirY * d;
      }

      curX += (tgtX - curX) * ease;
      curY += (tgtY - curY) * ease;

      if (!reduceMotion) {
        leanX += (leanTX - leanX) * MOUSE_EASE;
        leanY += (leanTY - leanY) * MOUSE_EASE;
      }

      render();
    }

    /* ---------------------------------------------
       INPUT
    --------------------------------------------- */

    function onWheel(e) {
      if (menuOpen()) return;
      if (e.cancelable) e.preventDefault();
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? root.clientHeight : 1;
      let dx = e.deltaX * unit;
      let dy = e.deltaY * unit;
      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }
      tgtX += dx;
      tgtY += dy;
      interacted(dx, dy);
    }

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    const cursor = makeDragCursor(root);

    function onPointerDown(e) {
      if (menuOpen()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = velY = 0;
      root.classList.add("is-dragging");
      if (!cursor) root.style.cursor = "grabbing";
      if (cursor) cursor.press(true);
      root.setPointerCapture(e.pointerId);
      interacted(0, 0);
    }

    function onPointerMove(e) {
      if (!dragging) {
        /* Mouse lean: the canvas follows the pointer around the screen */
        if (e.pointerType === "mouse" && !reduceMotion && mouseRange) {
          const r = root.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
          leanTX = nx * r.width * mouseRange;
          leanTY = ny * r.height * mouseRange;
        }
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      tgtX -= dx;
      tgtY -= dy;
      curX = tgtX;
      curY = tgtY;
      velX = dx;
      velY = dy;
      idle = 0;
    }

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      root.classList.remove("is-dragging");
      if (!cursor) root.style.cursor = "grab";
      if (cursor) cursor.press(false);
      if (e.pointerId != null && root.hasPointerCapture(e.pointerId)) {
        root.releasePointerCapture(e.pointerId);
      }
      if (!reduceMotion) {
        tgtX -= velX * FLING_MULT;
        tgtY -= velY * FLING_MULT;
      }
      interacted(-velX, -velY);
    }

    function onLeave() {
      leanTX = 0;
      leanTY = 0;
    }

    function onKey(e) {
      if (menuOpen()) return;
      if (e.target.closest && e.target.closest("input, textarea, select")) return;
      const step = {
        ArrowDown: [0, KEY_STEP],
        ArrowUp: [0, -KEY_STEP],
        ArrowRight: [KEY_STEP, 0],
        ArrowLeft: [-KEY_STEP, 0],
        PageDown: [0, KEY_STEP * 3],
        PageUp: [0, -KEY_STEP * 3],
      }[e.key];
      if (!step) return;
      e.preventDefault();
      tgtX += step[0];
      tgtY += step[1];
      interacted(step[0], step[1]);
    }

    let rt = null;
    function onResize() {
      clearTimeout(rt);
      rt = setTimeout(() => {
        clearTiles();
        measure();
      }, RESIZE_DEBOUNCE);
    }

    if (!cursor) root.style.cursor = "grab";
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    if (window.stopLenis) window.stopLenis("snippets");
    window.scrollTo(0, 0);

    measure();

    const useTicker = typeof gsap !== "undefined" && gsap.ticker;
    let raf = null;
    let running = false;

    function rafLoop() {
      tick();
      raf = requestAnimationFrame(rafLoop);
    }

    /* Start once the shapes are known, then fade the field in */
    ready.then(() => {
      if (destroyed) return;
      running = true;
      last = performance.now();
      render();
      if (useTicker) gsap.ticker.add(tick);
      else raf = requestAnimationFrame(rafLoop);
      if (typeof gsap !== "undefined" && !reduceMotion) {
        gsap.to(stage, { opacity: 1, duration: 0.8, ease: "power2.out" });
      } else stage.style.opacity = "1";
    });

    let destroyed = false;

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (running && useTicker) gsap.ticker.remove(tick);
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", endDrag);
      root.removeEventListener("pointercancel", endDrag);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      clearTimeout(rt);
      if (cursor) cursor.destroy();
      if (videoIO) videoIO.disconnect();
      stage.remove();
      vignette.remove();
      pool.forEach((el) => {
        el.style.display = "";
        el.removeAttribute("data-collage-pool");
      });
      delete root.dataset.collageReady;
      if (window.startLenis) window.startLenis("snippets");
      if (active && active.root === root) active = null;
    }

    active = { root, destroy };
  }

  window.initSnippetsCollage = initCollage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initCollage());
  } else {
    initCollage();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => {
      if (active) active.destroy();
    });
    barba.hooks.after((data) => {
      initCollage(
        data && data.next && data.next.container ? data.next.container : document
      );
    });
  }
})();
