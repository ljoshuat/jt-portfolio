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
     data-mouse="0.1"     how far the canvas leans toward the mouse,
                          as a share of the screen (0 turns it off)
     data-shuffle="false" same start every visit

   Click or tap a piece (without dragging) to open it large, with its
   name, previous / next and Esc to close. Hovering a piece lifts it,
   turns the cursor badge into "View" (data-view-text on the
   section changes the wording) and pauses the drift. A lime line
   along the bottom says "[ Click, drag or scroll ]" ("[ Tap or drag ]"
   on touch; data-hint / data-hint-touch change the wording). The CMS list stays in
   the page, visually hidden, so screen readers still get every piece
   and its alt text. Arrow keys pan only while the collage has focus;
   Enter opens the piece in the middle.

   Names: data-snippets-name on a Collection Item if set, otherwise the
   alt text up to its first colon ("Rolling Mammoth logo: ...").

   Reduced motion: no drift, no mouse lean, no glide; it still pans.
========================================================= */

(() => {
  /* Motion values from the reference effect (kept as is) */
  const EASE_FACTOR = 0.09; /* lerp factor per frame */
  const FLING_MULT = 14; /* inertia multiplier on drag release */
  const CELL_RATIO = 1.78; /* world-cell pitch / base tile width (reference 2.1) */
  const BASE_MIN = 220; /* min base tile width, px (reference 150) */
  const BASE_MAX = 500; /* max base tile width, px (reference 260) */
  const BASE_VW_RATIO = 0.22; /* floor from the window width */
  const BASE_VP_RATIO = 0.4; /* base = min(vw, vh) x this (reference 0.24) */
  const INIT_X = 2444; /* opening pan */
  const INIT_Y = 47;
  const WIDTHS = [0.68, 0.9, 1.0, 1.0, 1.3, 1.65];
  const RESIZE_DEBOUNCE = 150;

  /* Our additions */
  const DEFAULT_SPEED = 70; /* same drift as the old Snippets scroll */
  const DRIFT_WAIT = 0.6; /* s of stillness before the drift returns */
  const DRIFT_RAMP = 1.2; /* s for the drift to get back to speed */
  const MOUSE_RANGE = 0.1; /* share of the screen the canvas leans */
  const MOUSE_EASE = 0.05; /* lerp factor for the lean */
  const KEY_STEP = 120;
  const MAX_TALL = 1.5; /* tall pieces: height at most base x this */
  const MIN_TILE = 300; /* smallest tile width, px */
  const MIN_GAP = 0.12; /* smallest space between tiles, x base */

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

  /* DRAG CURSOR: the Snippets badge (frosted accent circle), with a
     dot and arrows on all four sides since the collage pans every way */
  const DRAG_CURSOR_SIZE = 96;
  const DRAG_CURSOR_FILL = 60;
  const DRAG_CURSOR_BLUR = 18;
  const DRAG_CURSOR_SVG =
      '<svg viewBox="0 0 163 163" width="100%" height="100%" aria-hidden="true">' +
      '<circle cx="81.5" cy="81.5" r="81.5" style="fill:color-mix(in srgb,var(--color--accent,#e3ff00) ' + DRAG_CURSOR_FILL + '%,transparent);transition:fill .4s ease"/>' +
      '<g style="fill:var(--color--bg-primary,#000);transition:fill .4s ease">' +
      '<g transform="translate(81.5 81.5) scale(.8) translate(-81.5 -81.5)"><g transform="translate(0 -28)"><path d="M82.9109 42.5993C82.1362 41.8003 80.8834 41.8003 80.1169 42.5993L67.5811 55.5192C66.8063 56.3182 66.8063 57.6102 67.5811 58.4007C68.3558 59.1912 69.6085 59.1997 70.375 58.4007L81.5015 46.9258L92.6281 58.4007C93.4028 59.1997 94.6555 59.1997 95.422 58.4007C96.1885 57.6017 96.1968 56.3097 95.422 55.5192L82.9109 42.5993Z"/></g><g transform="translate(0 28)"><path d="M80.0891 120.401C80.8638 121.2 82.1166 121.2 82.8831 120.401L95.419 107.481C96.1937 106.682 96.1937 105.39 95.419 104.599C94.6442 103.809 93.3915 103.8 92.625 104.599L81.4985 116.074L70.372 104.599C69.5972 103.8 68.3445 103.8 67.578 104.599C66.8115 105.398 66.8032 106.69 67.578 107.481L80.0891 120.401Z"/></g><g transform="translate(30 0) rotate(90 81.5 81.5)"><path d="M82.9109 42.5993C82.1362 41.8003 80.8834 41.8003 80.1169 42.5993L67.5811 55.5192C66.8063 56.3182 66.8063 57.6102 67.5811 58.4007C68.3558 59.1912 69.6085 59.1997 70.375 58.4007L81.5015 46.9258L92.6281 58.4007C93.4028 59.1997 94.6555 59.1997 95.422 58.4007C96.1885 57.6017 96.1968 56.3097 95.422 55.5192L82.9109 42.5993Z"/></g><g transform="translate(-30 0) rotate(-90 81.5 81.5)"><path d="M82.9109 42.5993C82.1362 41.8003 80.8834 41.8003 80.1169 42.5993L67.5811 55.5192C66.8063 56.3182 66.8063 57.6102 67.5811 58.4007C68.3558 59.1912 69.6085 59.1997 70.375 58.4007L81.5015 46.9258L92.6281 58.4007C93.4028 59.1997 94.6555 59.1997 95.422 58.4007C96.1885 57.6017 96.1968 56.3097 95.422 55.5192L82.9109 42.5993Z"/></g></g><circle cx="81.5" cy="81.5" r="8"/>' +
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

    /* Over a piece, the arrows swap for "Click to view" */
    const viewText = document.createElement("span");
    viewText.className = "sc-cursor-text";
    viewText.textContent = root.getAttribute("data-view-text") || "View";
    el.appendChild(viewText);
    let viewing = false;

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
      hide() {
        show(false);
      },
      setView(on) {
        if (on === viewing) return;
        viewing = on;
        el.classList.toggle("is-view", on);
        if (shown) targetScale = on ? 1.12 : 1;
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
      const named = img.closest("[data-snippets-name]");
      const alt = img.alt || "";
      const title = (
        (named && named.getAttribute("data-snippets-name")) ||
        alt.split(":")[0]
      ).trim();
      out.push({ src, alt, title, video, ratio: 1 });
    });
    return out;
  }

  const STYLE_ID = "snippets-collage-style";
  const STYLES = `
[data-snippets-collage]:focus{outline:none}
[data-snippets-collage]:focus-visible{outline:2px solid var(--color--accent,#DAF40A);outline-offset:-6px}
[data-snippets-collage].sc-no-ring:focus-visible{outline:none}
.snippets-collage_tile{transition:box-shadow .4s ease}
.snippets-collage_tile .snippets-collage_media{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.snippets-collage_tile.is-hover{box-shadow:0 26px 50px -18px rgba(10,15,18,.85)!important}
.snippets-collage_tile.is-hover .snippets-collage_media{transform:scale(1.05)!important}
.snippets-cursor svg g{transition:opacity .2s ease,fill .4s ease}
.snippets-cursor.is-view svg g{opacity:0}
.sc-cursor-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 16%;text-align:center;color:var(--color--bg-primary,#0A0F12);font-size:15px;font-weight:600;line-height:1;letter-spacing:.1em;text-transform:uppercase;opacity:0;transition:opacity .2s ease}
.snippets-cursor.is-view .sc-cursor-text{opacity:1}
.sc-hint{position:absolute;left:50%;bottom:calc(1.5rem + env(safe-area-inset-bottom,0px));z-index:3;transform:translateX(-50%);pointer-events:none;color:var(--color--accent,#DAF40A);font-size:.8rem;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;transition:color .4s ease}
.sc-lb{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:clamp(4rem,8vw,6rem) clamp(1rem,6vw,6rem);background:color-mix(in srgb,var(--color--bg-primary,#0A0F12) 86%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);opacity:0;visibility:hidden;transition:opacity .35s ease,visibility 0s linear .35s}
.sc-lb.is-open{opacity:1;visibility:visible;transition:opacity .35s ease}
.sc-lb_figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:1rem;max-width:100%;max-height:100%;transform:scale(.94);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.sc-lb.is-open .sc-lb_figure{transform:none}
.sc-lb_frame{display:flex;justify-content:center;align-items:center;max-width:100%;min-width:0}
.sc-lb_media{display:block;margin:0 auto;max-width:min(100%,1400px);max-height:calc(100vh - 12rem);max-height:calc(100dvh - 12rem);width:auto;height:auto;border-radius:var(--spacing--radius-md,16px);box-shadow:0 30px 80px -30px rgba(10,15,18,.9)}
.sc-lb_caption{display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem 1rem;color:var(--color--text-primary,#F7F7F7);font-size:clamp(.8rem,.9vw,.95rem);letter-spacing:.08em;text-transform:uppercase;text-align:center}
.sc-lb_count{color:var(--color--text-muted,#7D7D7D);font-variant-numeric:tabular-nums}
.sc-lb_btn{position:absolute;display:grid;place-items:center;width:3rem;height:3rem;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--color--accent,#DAF40A) 70%,transparent);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);color:var(--color--bg-primary,#0A0F12);cursor:pointer;transition:transform .25s ease}
.sc-lb_btn:hover{transform:scale(1.08)}
.sc-lb_btn:focus-visible{outline:2px solid var(--color--text-primary,#F7F7F7);outline-offset:3px}
.sc-lb_btn svg{width:1.1rem;height:1.1rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sc-lb_close{top:calc(1.25rem + env(safe-area-inset-top,0px));right:1.25rem}
.sc-lb_prev{left:1.25rem;top:50%;margin-top:-1.5rem}
.sc-lb_next{right:1.25rem;top:50%;margin-top:-1.5rem}
@media (max-width:767px){.sc-lb_prev,.sc-lb_next{top:auto;margin-top:0;bottom:calc(1.25rem + env(safe-area-inset-bottom,0px))}.sc-lb_prev{left:calc(50% - 3.75rem)}.sc-lb_next{right:calc(50% - 3.75rem)}.sc-lb_media{max-height:calc(100dvh - 14rem)}}
@media (prefers-reduced-motion:reduce){.sc-lb,.sc-lb_figure,.snippets-collage_tile .snippets-collage_media{transition:none}}
`;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }

  const ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };

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

    addStyles();

    /* The CMS list is the image pool. It stays in the page, visually
       hidden, so screen readers still list every piece with its alt */
    const pool = Array.from(root.children).filter(
      (el) => el.querySelector("img") && !el.matches(".section_hero")
    );
    const poolCss = pool.map((el) => el.style.cssText);
    pool.forEach((el) => {
      el.setAttribute("data-collage-pool", "");
      el.style.cssText +=
        ";position:absolute;width:1px;height:1px;margin:-1px;padding:0;" +
        "overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);" +
        "white-space:nowrap;border:0;transform:none;";
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
        "Snippets collage. Drag, scroll or use the arrow keys to look around, and press Enter to open the piece in the middle."
      );
    }
    const hadTabindex = root.hasAttribute("tabindex");
    if (!hadTabindex) root.tabIndex = 0;
    if (!root.hasAttribute("role")) root.setAttribute("role", "region");

    /* How to use it, in lime along the bottom (touch gets its own words) */
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const hint = document.createElement("div");
    hint.className = "sc-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = coarse
      ? root.getAttribute("data-hint-touch") || "[ Tap or drag ]"
      : root.getAttribute("data-hint") || "[ Click, drag or scroll ]";
    root.appendChild(hint);
    function dropHint() {}
    root.style.touchAction = "none";
    root.style.userSelect = "none";
    root.style.webkitUserSelect = "none";

    /* ---------------------------------------------
       LAYOUT
    --------------------------------------------- */

    let base = 0;
    let CELL = 0;
    let minW = 0;

    function measure() {
      const vw = root.clientWidth;
      const vh = root.clientHeight;
      base = Math.round(
        Math.max(
          BASE_MIN,
          Math.min(
            BASE_MAX,
            /* short, wide windows size from the width instead */
            Math.max(Math.min(vw, vh) * BASE_VP_RATIO, vw * BASE_VW_RATIO)
          )
        )
      );
      CELL = Math.round(base * CELL_RATIO);
      /* Smallest tile: MIN_TILE px, or 70% of a phone's width */
      minW = Math.min(MIN_TILE, vw * 0.7);
    }

    /* Which snippet a cell shows: a repeating pattern through a
       shuffled order, with the step chosen so the same piece comes
       back as far away as the number of snippets allows (about
       3.6 cells apart with 13 snippets, further with more). */
    const step = (() => {
      const reach = Math.min(N, 16);
      let best = 1;
      let bestDist = -1;
      for (let k = 1; k < N; k++) {
        let near = Infinity;
        for (let dx = -reach; dx <= reach; dx++) {
          for (let dy = -reach; dy <= reach; dy++) {
            if ((dx || dy) && mod(dx + k * dy, N) === 0) {
              near = Math.min(near, dx * dx + dy * dy);
            }
          }
        }
        if (near > bestDist) {
          bestDist = near;
          best = k;
        }
      }
      return best;
    })();

    function snippetFor(ci, cj) {
      return order[mod(ci + cj * step + salt, N)];
    }

    function itemFor(ci, cj) {
      const seed = hash2(ci, cj);
      const r = (s) => hash2(seed, s);
      if (r(0) % 100 < 6) return null;
      const idx = snippetFor(ci, cj);
      const wMul = WIDTHS[r(1) % WIDTHS.length];
      const ratio = snippets[idx].ratio || 1;
      let w = Math.max(minW, Math.round(base * wMul));
      let h = Math.round(w / ratio);
      /* Tall pieces would tower over the rest: shrink them to fit,
         but never narrower than the minimum */
      if (h > base * MAX_TALL) {
        h = Math.max(Math.round(base * MAX_TALL), Math.round(minW / ratio));
        w = Math.round(h * ratio);
      }
      /* Always leave room in the cell for the gap */
      const room = CELL - base * MIN_GAP;
      if (w > room || h > room) {
        const k = Math.min(room / w, room / h);
        w = Math.round(w * k);
        h = Math.round(h * k);
      }
      /* Jitter only as far as the tile still fits inside its own cell
         with a gap, so pieces scatter but never overlap */
      const jx = (r(3) % 1000) / 1000 - 0.5;
      const jy = (r(4) % 1000) / 1000 - 0.5;
      const gap = base * MIN_GAP;
      const cx = (ci + 0.5) * CELL + jx * Math.max(0, CELL - w - gap);
      const cy = (cj + 0.5) * CELL + jy * Math.max(0, CELL - h - gap);
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
          "display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit;" +
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
        /* no fill behind the image: a light fill bled through as a
           hairline at the rounded corners */
        ";background:transparent;isolation:isolate;" +
        "-webkit-mask-image:-webkit-radial-gradient(white,black);" +
        "box-shadow:0 10px 30px -12px rgba(10,15,18,.65);will-change:transform;";
      el.dataset.idx = item.img;
      setMedia(el, snippets[item.img]);
      return el;
    }

    function release(el) {
      el.style.display = "none";
      if (el === hoverEl) setHover(null);
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

      /* Keep the hover right while pieces drift under a still cursor */
      if (mouseIn && !dragging && !lbOpen) updateHover();

      /* Hovering a piece (or the lightbox being open) holds the drift */
      if (hoverEl || lbOpen) {
        idle = 0;
        driftAmt = Math.max(0, driftAmt - dt / 0.35);
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
      if (menuOpen() || lbOpen) return;
      if (e.cancelable) e.preventDefault();
      dropHint();
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

    /* ---------------------------------------------
       HOVER: lift the piece, show its name, hold the drift
    --------------------------------------------- */

    let hoverEl = null;
    let mouseIn = false;
    let mouseX = 0;
    let mouseY = 0;

    function tileAt(x, y) {
      const hit = document.elementFromPoint(x, y);
      const tile = hit && hit.closest && hit.closest(".snippets-collage_tile");
      return tile && stage.contains(tile) ? tile : null;
    }

    function setHover(tile) {
      if (tile === hoverEl) return;
      if (hoverEl) hoverEl.classList.remove("is-hover");
      hoverEl = tile;
      if (hoverEl) hoverEl.classList.add("is-hover");
      if (cursor) cursor.setView(!!hoverEl);
    }

    function updateHover() {
      setHover(tileAt(mouseX, mouseY));
    }

    let dragging = false;
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let travel = 0;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    const cursor = makeDragCursor(root);

    function onPointerDown(e) {
      if (menuOpen() || lbOpen) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dropHint();
      dragging = true;
      setHover(null);
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      downT = performance.now();
      travel = 0;
      velX = velY = 0;
      root.classList.add("is-dragging");
      if (!cursor) root.style.cursor = "grabbing";
      if (cursor) cursor.press(true);
      root.setPointerCapture(e.pointerId);
      interacted(0, 0);
    }

    function onPointerMove(e) {
      if (e.pointerType === "mouse") {
        mouseIn = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
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
      travel += Math.abs(dx) + Math.abs(dy);
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

      /* A click or tap (barely moved, quick) opens the piece */
      const isTap =
        e.type === "pointerup" &&
        travel < 8 &&
        Math.hypot(e.clientX - downX, e.clientY - downY) < 8 &&
        performance.now() - downT < 600;
      if (isTap) {
        const tile = tileAt(e.clientX, e.clientY);
        if (tile) {
          openLightbox(+tile.dataset.idx, tile);
          return;
        }
      }

      if (!reduceMotion) {
        tgtX -= velX * FLING_MULT;
        tgtY -= velY * FLING_MULT;
      }
      interacted(-velX, -velY);
      if (e.pointerType === "mouse") updateHover();
    }

    function onLeave() {
      leanTX = 0;
      leanTY = 0;
      mouseIn = false;
      setHover(null);
    }

    /* Keys work while the collage itself has focus */
    function onKey(e) {
      if (menuOpen() || lbOpen || e.target !== root) return;
      if (e.key === "Enter" || e.key === " ") {
        const r = root.getBoundingClientRect();
        let best = null;
        let bestD = Infinity;
        tiles.forEach((rec) => {
          const t = rec.el.getBoundingClientRect();
          const d = Math.hypot(
            t.left + t.width / 2 - (r.left + r.width / 2),
            t.top + t.height / 2 - (r.top + r.height / 2)
          );
          if (d < bestD) {
            bestD = d;
            best = rec.el;
          }
        });
        if (best) {
          e.preventDefault();
          openLightbox(+best.dataset.idx, best, true);
        }
        return;
      }
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

    /* ---------------------------------------------
       LIGHTBOX: the piece large, with name, prev / next, Esc
    --------------------------------------------- */

    let lbOpen = false;
    let lbIndex = 0;
    let lbReturn = null;
    let lbOpenedAt = 0;
    let lb = null;

    function buildLightbox() {
      lb = document.createElement("div");
      lb.className = "sc-lb";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-label", "Snippet");
      lb.innerHTML =
        '<figure class="sc-lb_figure"><div class="sc-lb_frame"></div>' +
        '<figcaption class="sc-lb_caption"><span class="sc-lb_title"></span>' +
        '<span class="sc-lb_count"></span></figcaption></figure>' +
        '<button type="button" class="sc-lb_btn sc-lb_close" aria-label="Close">' + ICON.close + "</button>" +
        '<button type="button" class="sc-lb_btn sc-lb_prev" aria-label="Previous snippet">' + ICON.prev + "</button>" +
        '<button type="button" class="sc-lb_btn sc-lb_next" aria-label="Next snippet">' + ICON.next + "</button>";
      lb.querySelector(".sc-lb_close").addEventListener("click", closeLightbox);
      lb.querySelector(".sc-lb_prev").addEventListener("click", () => showSnippet(lbIndex - 1));
      lb.querySelector(".sc-lb_next").addEventListener("click", () => showSnippet(lbIndex + 1));
      lb.addEventListener("click", (e) => {
        /* ignore the click that follows the tap which opened it */
        if (performance.now() - lbOpenedAt < 400) return;
        if (e.target === lb || e.target.classList.contains("sc-lb_figure")) closeLightbox();
      });
      if (N < 2) {
        lb.querySelector(".sc-lb_prev").hidden = true;
        lb.querySelector(".sc-lb_next").hidden = true;
      }
      document.body.appendChild(lb);
    }

    /* prev / next walk the same shuffled order as the field */
    function showSnippet(i) {
      const pos = mod(order.indexOf(lbIndex) + (i - lbIndex), N);
      lbIndex = order[pos];
      const s = snippets[lbIndex];
      const frame = lb.querySelector(".sc-lb_frame");
      frame.textContent = "";
      let media;
      if (s.video && !reduceMotion) {
        media = document.createElement("video");
        media.src = s.video;
        media.poster = s.src;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.autoplay = true;
        media.setAttribute("muted", "");
        media.setAttribute("playsinline", "");
        if (s.alt) media.setAttribute("aria-label", s.alt);
        const p = media.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        media = document.createElement("img");
        media.src = s.src;
        media.alt = s.alt;
      }
      media.className = "sc-lb_media";
      frame.appendChild(media);
      lb.querySelector(".sc-lb_title").textContent = s.title;
      lb.querySelector(".sc-lb_count").textContent = pos + 1 + " / " + N;
      lb.setAttribute("aria-label", s.title || "Snippet");
    }

    /* Focus ring on the collage only for keyboard users: after a
       mouse-opened lightbox closes, focus comes back without the ring
       until the visitor presses Tab */
    let lbByKey = false;
    function onTabKey(e) {
      if (e.key === "Tab") root.classList.remove("sc-no-ring");
    }

    function openLightbox(idx, fromEl, byKey) {
      if (!lb) buildLightbox();
      lbByKey = !!byKey;
      lbOpen = true;
      lbOpenedAt = performance.now();
      lbReturn = document.activeElement;
      setHover(null);
      if (cursor) cursor.hide();
      lbIndex = idx;
      showSnippet(idx);
      lb.classList.add("is-open");
      lb.querySelector(".sc-lb_close").focus({ preventScroll: true });
      document.addEventListener("keydown", onLightboxKey, true);
    }

    function closeLightbox() {
      if (!lbOpen) return;
      lbOpen = false;
      lb.classList.remove("is-open");
      const v = lb.querySelector("video");
      if (v) v.pause();
      document.removeEventListener("keydown", onLightboxKey, true);
      if (!lbByKey) root.classList.add("sc-no-ring");
      const back = lbReturn && lbReturn.isConnected ? lbReturn : root;
      if (back && back.focus) back.focus({ preventScroll: true });
      idle = 0;
    }

    function onLightboxKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showSnippet(lbIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showSnippet(lbIndex - 1);
      } else if (e.key === "Tab") {
        /* keep focus inside the dialog */
        const btns = Array.from(lb.querySelectorAll("button")).filter((b) => !b.hidden);
        const at = btns.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey ? at - 1 : at + 1;
        btns[mod(next, btns.length)].focus();
      }
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
    root.addEventListener("keydown", onKey);
    document.addEventListener("keydown", onTabKey);
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
      root.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onTabKey);
      root.classList.remove("sc-no-ring");
      document.removeEventListener("keydown", onLightboxKey, true);
      if (lb) lb.remove();
      if (hint) hint.remove();
      if (!hadTabindex) root.removeAttribute("tabindex");
      window.removeEventListener("resize", onResize);
      clearTimeout(rt);
      if (cursor) cursor.destroy();
      if (videoIO) videoIO.disconnect();
      stage.remove();
      vignette.remove();
      pool.forEach((el, i) => {
        el.style.cssText = poolCss[i];
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
