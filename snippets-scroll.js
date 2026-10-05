/* =========================================================
   SNIPPETS INFINITE SCROLL
   A loose grid of images that drifts upward on its own, forever.
   Wheel, trackpad, touch or mouse drag and arrow keys speed it up or
   reverse it; it then settles back to a slow drift in whichever
   direction the visitor last scrolled. Modelled on buckit.design/snippets.

   Load site-wide (footer) after GSAP, Barba and lenis-init.js,
   and before page-transition.js. It hooks into Barba itself, so
   it starts whenever the Snippets page is entered and cleans up
   when you leave. No GSAP Observer or ScrollTrigger needed.

   Markup (attributes, so classes stay free for styling):
     [data-snippets]            full-viewport wrapper (overflow hidden)
       [data-snippets-track]    holds the copies of the list
         Collection List Wrapper (or any one block) with the images

   The script copies the list until the screen is covered twice,
   so you only build one list. Copies get aria-hidden.

   Videos (optional): give a card data-snippets-video="https://...mp4"
   and the script swaps its image for a muted, looping clip, using
   the image as the poster frame. Clips only play while on screen.
   Cards without a link are left alone, so with no links set this
   does nothing at all.

   Optional attributes on [data-snippets]:
     data-speed="70"     drift speed in px per second (default 70)
     data-direction="up" or "down" for the starting drift

   Lenis: the page doesn't scroll, so Lenis is paused here with
   window.stopLenis("snippets") and restarted when you leave.
   Reduced motion: no auto drift, but the visitor can still scroll it.
========================================================= */

(() => {
    const DEFAULT_SPEED = 70;
    const MAX_BOOST = 4000; /* px per second, caps fling speed */
    const SETTLE = 2.5; /* how fast a boost fades (higher = sooner) */
    const WHEEL_FORCE = 3; /* wheel pixels -> px/s of boost */
    const KEY_STEP = 120; /* arrow / page keys, in wheel pixels */
    const WIDE_RATIO = 1.5; /* width / height at or above this = "wide" */
  
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  
    let active = null;
  
    /* Tag each image's (or video's) item with its shape (wide / tall /
       square) so the CSS can give wide pieces a bigger slot. Runs once
       the media knows its real size. */
    function tagShape(media) {
      const item = media.parentElement;
      if (!item) return;
  
      const isVideo = media.tagName === "VIDEO";
  
      const set = () => {
        const w = isVideo ? media.videoWidth : media.naturalWidth;
        const h = isVideo ? media.videoHeight : media.naturalHeight;
        if (!w || !h) return;
        const ratio = w / h;
        item.setAttribute(
          "data-snippets-shape",
          ratio >= WIDE_RATIO ? "wide" : ratio < 0.8 ? "tall" : "square"
        );
      };
  
      if (isVideo) {
        if (media.readyState >= 1) set();
        else media.addEventListener("loadedmetadata", set, { once: true });
      } else if (media.complete) set();
      else media.addEventListener("load", set, { once: true });
    }
  
    /* Swap the image for a clip on cards that have a video link. The
       image becomes the poster, so the card looks right before the clip
       loads (and for visitors who prefer reduced motion). */
    function addVideos(root) {
      root.querySelectorAll("[data-snippets-video]").forEach((item) => {
        const url = (item.getAttribute("data-snippets-video") || "").trim();
        if (!url || item.querySelector("video")) return;
  
        const img = item.querySelector("img");
        const video = document.createElement("video");
        video.src = url;
        video.className = img ? img.className : "snippets_image";
        video.setAttribute("muted", "");
        video.setAttribute("loop", "");
        video.setAttribute("playsinline", "");
        video.setAttribute("preload", "metadata");
        video.muted = true;
  
        if (img) {
          const empty = img.classList.contains("w-dyn-bind-empty");
          if (!empty && (img.currentSrc || img.src)) {
            video.poster = img.currentSrc || img.src;
          }
          if (img.alt) video.setAttribute("aria-label", img.alt);
          img.replaceWith(video);
        } else {
          item.appendChild(video);
        }
      });
    }
  
    /* DRAG CURSOR: on mouse devices the pointer becomes a round
       "DRAG" badge (with up/down arrows) while it's over the grid.
       It uses the theme colours (Color/accent fill, Color/bg-primary
       lettering), so it follows Dark, Light and Vibe like the circle
       cursor, which is hidden while the badge shows. The fill is
       see-through with a blur behind it (frosted glass). */
    const DRAG_CURSOR_SIZE = 96; /* px */
    const DRAG_CURSOR_FILL = 60; /* % of the accent colour that shows */
    const DRAG_CURSOR_BLUR = 18; /* px of blur behind the badge */
    const DRAG_CURSOR_SVG =
      '<svg viewBox="0 0 163 163" width="100%" height="100%" aria-hidden="true">' +
      '<circle cx="81.5" cy="81.5" r="81.5" style="fill:color-mix(in srgb,var(--color--accent,#e3ff00) ' + DRAG_CURSOR_FILL + '%,transparent);transition:fill .4s ease"/>' +
      '<g style="fill:var(--color--bg-primary,#000);transition:fill .4s ease">' +
      '<path d="M41 74.26H50.86C52.3 74.26 53.5533 74.36 54.62 74.56C55.7 74.7467 56.6267 75.0067 57.4 75.34C58.1867 75.6733 58.8333 76.0667 59.34 76.52C59.8467 76.9733 60.2467 77.4667 60.54 78C60.8467 78.52 61.06 79.06 61.18 79.62C61.3 80.18 61.36 80.74 61.36 81.3V81.9C61.36 82.4333 61.3 82.9867 61.18 83.56C61.0733 84.12 60.8733 84.6667 60.58 85.2C60.2867 85.7333 59.8867 86.24 59.38 86.72C58.8733 87.2 58.2333 87.62 57.46 87.98C56.6867 88.34 55.76 88.6267 54.68 88.84C53.6 89.04 52.3333 89.14 50.88 89.14H41V74.26ZM45.66 85.56H50.5C51.82 85.56 52.8733 85.4333 53.66 85.18C54.4467 84.9133 55.0467 84.5933 55.46 84.22C55.8867 83.8333 56.16 83.42 56.28 82.98C56.4133 82.5267 56.48 82.1067 56.48 81.72V81.6C56.48 81.2267 56.42 80.82 56.3 80.38C56.18 79.9267 55.9133 79.5067 55.5 79.12C55.0867 78.7333 54.48 78.4133 53.68 78.16C52.8933 77.9067 51.8333 77.78 50.5 77.78H45.66V85.56Z"/>' +
      '<path d="M67.6131 80.56H74.6731C75.3398 80.56 75.8198 80.42 76.1131 80.14C76.4065 79.86 76.5531 79.5133 76.5531 79.1V79.08C76.5531 78.6933 76.4065 78.36 76.1131 78.08C75.8331 77.7867 75.3531 77.64 74.6731 77.64H67.6131V80.56ZM67.6131 89.14H62.9531V74.26H74.9531C76.1931 74.26 77.2265 74.36 78.0531 74.56C78.8798 74.76 79.5398 75.04 80.0331 75.4C80.5398 75.7467 80.8931 76.1533 81.0931 76.62C81.3065 77.0867 81.4131 77.5867 81.4131 78.12V78.36C81.4131 78.8933 81.3131 79.3467 81.1131 79.72C80.9265 80.0933 80.6865 80.4133 80.3931 80.68C80.1131 80.9333 79.8131 81.1333 79.4931 81.28C79.1731 81.4267 78.8931 81.54 78.6531 81.62C79.0265 81.7267 79.3865 81.8733 79.7331 82.06C80.0798 82.2467 80.3798 82.4867 80.6331 82.78C80.8865 83.06 81.0865 83.3867 81.2331 83.76C81.3931 84.1333 81.4731 84.56 81.4731 85.04V87.22C81.4731 87.82 81.4998 88.2467 81.5531 88.5C81.6198 88.74 81.6865 88.92 81.7531 89.04V89.14H77.0131C76.9465 89.0467 76.8931 88.9333 76.8531 88.8C76.8131 88.6667 76.7931 88.4667 76.7931 88.2V86.48C76.7931 85.5733 76.5598 84.9133 76.0931 84.5C75.6398 84.0733 74.8398 83.86 73.6931 83.86H67.6131V89.14Z"/>' +
      '<path d="M92.54 77.48L89.78 83.06H95.42L92.54 77.48ZM97.14 86.42H88.12L86.78 89.14H82.04L89.56 74.26H95.6L103.56 89.14H98.54L97.14 86.42Z"/>' +
      '<path d="M112.507 89.4C111.161 89.4 109.981 89.2867 108.967 89.06C107.954 88.82 107.081 88.5067 106.348 88.12C105.614 87.7333 105.007 87.2867 104.527 86.78C104.047 86.2733 103.661 85.7467 103.368 85.2C103.088 84.64 102.888 84.08 102.768 83.52C102.648 82.9467 102.588 82.4133 102.588 81.92V81.36C102.588 80.88 102.634 80.3667 102.728 79.82C102.834 79.26 103.021 78.7067 103.287 78.16C103.567 77.6133 103.941 77.0933 104.408 76.6C104.888 76.0933 105.501 75.6467 106.247 75.26C106.994 74.8733 107.894 74.5667 108.948 74.34C110.001 74.1133 111.241 74 112.668 74H113.527C114.914 74 116.121 74.0933 117.147 74.28C118.174 74.4667 119.048 74.7133 119.768 75.02C120.488 75.3267 121.081 75.68 121.548 76.08C122.014 76.4667 122.381 76.8667 122.647 77.28C122.914 77.6933 123.101 78.1067 123.208 78.52C123.314 78.9333 123.374 79.3067 123.387 79.64V79.66H118.427C118.401 79.58 118.328 79.4267 118.208 79.2C118.088 78.96 117.841 78.72 117.467 78.48C117.107 78.2267 116.581 78.0067 115.887 77.82C115.207 77.6333 114.288 77.54 113.128 77.54C111.994 77.54 111.061 77.6533 110.327 77.88C109.594 78.1067 109.014 78.4067 108.588 78.78C108.174 79.1533 107.881 79.58 107.707 80.06C107.547 80.54 107.467 81.04 107.467 81.56V81.78C107.467 82.26 107.568 82.74 107.768 83.22C107.968 83.7 108.288 84.1333 108.728 84.52C109.181 84.8933 109.761 85.2 110.467 85.44C111.187 85.6667 112.061 85.78 113.088 85.78C114.194 85.78 115.114 85.6933 115.848 85.52C116.594 85.3333 117.188 85.12 117.628 84.88C118.068 84.64 118.381 84.4067 118.567 84.18C118.754 83.94 118.848 83.7667 118.848 83.66V83.62H113.007V80.8H123.488V89.14H120.688C120.674 89.0067 120.647 88.84 120.607 88.64C120.567 88.44 120.521 88.2333 120.467 88.02C120.414 87.7933 120.354 87.58 120.287 87.38C120.221 87.1667 120.154 86.98 120.088 86.82C119.928 87.0067 119.681 87.2467 119.348 87.54C119.014 87.8333 118.561 88.12 117.988 88.4C117.428 88.6667 116.727 88.9 115.887 89.1C115.061 89.3 114.074 89.4 112.927 89.4H112.507Z"/>' +
      '<path d="M82.9109 42.5993C82.1362 41.8003 80.8834 41.8003 80.1169 42.5993L67.5811 55.5192C66.8063 56.3182 66.8063 57.6102 67.5811 58.4007C68.3558 59.1912 69.6085 59.1997 70.375 58.4007L81.5015 46.9258L92.6281 58.4007C93.4028 59.1997 94.6555 59.1997 95.422 58.4007C96.1885 57.6017 96.1968 56.3097 95.422 55.5192L82.9109 42.5993Z"/>' +
      '<path d="M80.0891 120.401C80.8638 121.2 82.1166 121.2 82.8831 120.401L95.419 107.481C96.1937 106.682 96.1937 105.39 95.419 104.599C94.6442 103.809 93.3915 103.8 92.625 104.599L81.4985 116.074L70.372 104.599C69.5972 103.8 68.3445 103.8 67.578 104.599C66.8115 105.398 66.8032 106.69 67.578 107.481L80.0891 120.401Z"/>' +
      "</g></svg>";
  
    function makeDragCursor(wrap) {
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
      wrap.style.cursor = "none";
  
      const pos = { x: -200, y: -200 };
      const target = { x: -200, y: -200 };
      let scale = 0.6;
      let targetScale = 0.6;
      let shown = false;
      let started = false;
      let raf = null;
  
      /* The site's circle cursor (cursor-trail.js), hidden while the
         badge shows; it's looked up each time in case it loads late */
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
        /* Only over the grid: the nav and menu get the normal cursor */
        const over = document.elementFromPoint(e.clientX, e.clientY);
        show(!!(over && wrap.contains(over)) && !menuIsOpen());
      }
  
      function onLeave() {
        show(false);
      }
  
      function menuIsOpen() {
        const menu = document.querySelector(".menu-wrap");
        return menu && menu.classList.contains("is-open");
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
        /* squeeze a little while the mouse button is down */
        press(down) {
          if (shown) targetScale = down ? 0.85 : 1;
        },
        destroy() {
          cancelAnimationFrame(raf);
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("mouseleave", onLeave);
          setTrail(false);
          wrap.style.cursor = "";
          el.remove();
        },
      };
    }
  
    function initSnippets(scope = document) {
      const wrap = scope.querySelector("[data-snippets]");
      if (!wrap || wrap.dataset.snippetsReady) return;
  
      const track = wrap.querySelector("[data-snippets-track]");
      const source = track && track.firstElementChild;
      if (!source) return;
  
      if (active) active.destroy();
      wrap.dataset.snippetsReady = "true";
  
      const speed = parseFloat(wrap.getAttribute("data-speed")) || DEFAULT_SPEED;
      const startDir = wrap.getAttribute("data-direction") === "down" ? -1 : 1;
  
      /* Content offset in px (always between -loop and 0), the
         drift direction (1 = content moves up) and the extra speed
         from the visitor's last scroll, which fades back to 0 */
      let y = 0;
      let dir = startDir;
      let boost = 0;
      let loop = 0;
      let dragging = false;
  
      /* ---------------------------------------------
         COPIES: enough to cover the screen twice
      --------------------------------------------- */
  
      const copies = [source];
      addVideos(source);
      source.querySelectorAll("img, video").forEach(tagShape);
  
      /* Clips play only while they're on screen */
      const videoIO =
        typeof IntersectionObserver !== "undefined"
          ? new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  const v = entry.target;
                  if (entry.isIntersecting && !reduceMotion) {
                    const p = v.play();
                    if (p && p.catch) p.catch(() => {});
                  } else {
                    v.pause();
                  }
                });
              },
              { root: wrap, rootMargin: "200px 0px" }
            )
          : null;
  
      function watchVideos(root) {
        root.querySelectorAll("video").forEach((v) => {
          v.muted = true;
          if (videoIO) videoIO.observe(v);
          else if (!reduceMotion) v.play().catch(() => {});
        });
      }
  
      watchVideos(source);
  
      function addCopy() {
        const copy = source.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.setAttribute("data-snippets-copy", "");
        copy.querySelectorAll("a, button, [tabindex]").forEach((el) => {
          el.setAttribute("tabindex", "-1");
        });
        copy.querySelectorAll("img").forEach((img) => {
          img.setAttribute("alt", "");
          img.loading = "eager";
          tagShape(img);
        });
        copy.querySelectorAll("video").forEach((v) => {
          v.removeAttribute("aria-label");
          tagShape(v);
        });
        track.appendChild(copy);
        watchVideos(copy);
        copies.push(copy);
      }
  
      /* One loop = the distance from the top of one copy to the
         top of the next, so the gap between copies is included */
      function measure() {
        if (copies.length < 2) addCopy();
        loop = copies[1].offsetTop - copies[0].offsetTop;
        if (loop <= 0) return;
  
        const needed = Math.ceil(wrap.clientHeight / loop) + 1;
        while (copies.length < needed + 1) addCopy();
  
        y = wrapY(y);
      }
  
      function wrapY(value) {
        if (loop <= 0) return 0;
        return ((value % loop) - loop) % loop;
      }
  
      /* ---------------------------------------------
         RENDER LOOP
      --------------------------------------------- */
  
      function render() {
        track.style.transform = `translate3d(0, ${y}px, 0)`;
      }
  
      let last = performance.now();
  
      function tick() {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
  
        if (!wrap.isConnected) {
          destroy();
          return;
        }
  
        if (!dragging) {
          const drift = reduceMotion ? 0 : speed * dir;
          y = wrapY(y - (drift + boost) * dt);
          boost *= Math.exp(-SETTLE * dt);
          if (Math.abs(boost) < 0.5) boost = 0;
        }
  
        render();
      }
  
      /* ---------------------------------------------
         INPUT
      --------------------------------------------- */
  
      function menuOpen() {
        const menu = document.querySelector(".menu-wrap");
        return menu && menu.classList.contains("is-open");
      }
  
      function push(pixels) {
        if (!pixels) return;
        boost = clampBoost(boost + pixels * WHEEL_FORCE);
        dir = pixels > 0 ? 1 : -1;
      }
  
      function clampBoost(v) {
        return Math.max(-MAX_BOOST, Math.min(MAX_BOOST, v));
      }
  
      function onWheel(e) {
        if (menuOpen()) return;
        if (e.cancelable) e.preventDefault();
  
        /* deltaMode 1 = lines (Firefox mouse wheels), 2 = pages */
        const unit =
          e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? wrap.clientHeight : 1;
        push(e.deltaY * unit);
      }
  
      /* Drag (finger or mouse): the grid follows the pointer, then
         keeps the fling */
      let touchY = 0;
      let touchT = 0;
      let touchV = 0;
  
      function dragStart(clientY) {
        dragging = true;
        boost = 0;
        touchY = clientY;
        touchT = performance.now();
        touchV = 0;
      }
  
      function dragMove(clientY) {
        const now = performance.now();
        const dy = clientY - touchY;
        const dt = Math.max((now - touchT) / 1000, 0.001);
  
        y = wrapY(y + dy);
        touchV = touchV * 0.2 + (-dy / dt) * 0.8; /* smoothed px/s */
        touchY = clientY;
        touchT = now;
      }
  
      function dragEnd() {
        dragging = false;
  
        /* Stale pointer (held still before letting go) = no fling */
        if (performance.now() - touchT > 100) touchV = 0;
  
        if (Math.abs(touchV) > 20) {
          dir = touchV > 0 ? 1 : -1;
          boost = clampBoost(touchV - speed * dir);
        }
      }
  
      function onTouchStart(e) {
        if (menuOpen()) return;
        dragStart(e.touches[0].clientY);
      }
  
      function onTouchMove(e) {
        if (!dragging) return;
        if (e.cancelable) e.preventDefault();
        dragMove(e.touches[0].clientY);
      }
  
      function onTouchEnd() {
        if (!dragging) return;
        dragEnd();
      }
  
      /* Mouse: click and drag up or down, same feel as a finger */
      let mouseDown = false;
      const cursor = makeDragCursor(wrap);
  
      function onMouseDown(e) {
        if (e.button !== 0 || menuOpen()) return;
        e.preventDefault(); /* no text selection or image ghost */
        mouseDown = true;
        wrap.classList.add("is-dragging");
        if (cursor) cursor.press(true);
        dragStart(e.clientY);
      }
  
      function onMouseMove(e) {
        if (!mouseDown) return;
        dragMove(e.clientY);
      }
  
      function onMouseUp() {
        if (!mouseDown) return;
        mouseDown = false;
        wrap.classList.remove("is-dragging");
        if (cursor) cursor.press(false);
        dragEnd();
      }
  
      function onKey(e) {
        if (menuOpen()) return;
        if (e.target.closest && e.target.closest("input, textarea, select")) {
          return;
        }
  
        const step = {
          ArrowDown: KEY_STEP,
          ArrowUp: -KEY_STEP,
          PageDown: KEY_STEP * 3,
          PageUp: -KEY_STEP * 3,
          " ": e.shiftKey ? -KEY_STEP * 3 : KEY_STEP * 3,
        }[e.key];
  
        if (!step) return;
        e.preventDefault();
        push(step);
      }
  
      /* ---------------------------------------------
         START / STOP
      --------------------------------------------- */
  
      const resize =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => measure())
          : null;
  
      const onLoad = () => measure();
  
      wrap.addEventListener("wheel", onWheel, { passive: false });
      wrap.addEventListener("touchstart", onTouchStart, { passive: true });
      wrap.addEventListener("touchmove", onTouchMove, { passive: false });
      wrap.addEventListener("touchend", onTouchEnd);
      wrap.addEventListener("touchcancel", onTouchEnd);
      wrap.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      document.addEventListener("keydown", onKey);
      window.addEventListener("load", onLoad);
      if (resize) {
        resize.observe(wrap);
        resize.observe(source);
      }
  
      if (window.stopLenis) window.stopLenis("snippets");
      window.scrollTo(0, 0);
  
      measure();
      render();
  
      const useTicker = typeof gsap !== "undefined" && gsap.ticker;
      let raf = null;
  
      function rafLoop() {
        tick();
        raf = requestAnimationFrame(rafLoop);
      }
  
      if (useTicker) gsap.ticker.add(tick);
      else raf = requestAnimationFrame(rafLoop);
  
      /* Fade the grid in once it's laid out */
      if (typeof gsap !== "undefined" && !reduceMotion) {
        gsap.fromTo(
          track,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: "power2.out" }
        );
      }
  
      function destroy() {
        if (useTicker) gsap.ticker.remove(tick);
        if (raf) cancelAnimationFrame(raf);
  
        wrap.removeEventListener("wheel", onWheel);
        wrap.removeEventListener("touchstart", onTouchStart);
        wrap.removeEventListener("touchmove", onTouchMove);
        wrap.removeEventListener("touchend", onTouchEnd);
        wrap.removeEventListener("touchcancel", onTouchEnd);
        wrap.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("keydown", onKey);
        if (cursor) cursor.destroy();
        window.removeEventListener("load", onLoad);
        if (resize) resize.disconnect();
        if (videoIO) videoIO.disconnect();
        wrap.querySelectorAll("video").forEach((v) => v.pause());
  
        if (window.startLenis) window.startLenis("snippets");
        if (active && active.wrap === wrap) active = null;
      }
  
      active = { wrap, destroy };
    }
  
    window.initSnippets = initSnippets;
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initSnippets());
    } else {
      initSnippets();
    }
  
    if (typeof barba !== "undefined" && barba.hooks) {
      /* Leaving: hand scrolling back to Lenis before the next page */
      barba.hooks.before(() => {
        if (active) active.destroy();
      });
  
      barba.hooks.after((data) => {
        initSnippets(
          data && data.next && data.next.container
            ? data.next.container
            : document
        );
      });
    }
  })();
  