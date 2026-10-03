/* =========================================================
   SNIPPETS INFINITE SCROLL
   A loose grid of images that drifts upward on its own, forever.
   Wheel, trackpad, touch drag and arrow keys speed it up or
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
  
      /* Touch: the grid follows the finger, then keeps the fling */
      let touchY = 0;
      let touchT = 0;
      let touchV = 0;
  
      function onTouchStart(e) {
        if (menuOpen()) return;
        dragging = true;
        boost = 0;
        touchY = e.touches[0].clientY;
        touchT = performance.now();
        touchV = 0;
      }
  
      function onTouchMove(e) {
        if (!dragging) return;
        if (e.cancelable) e.preventDefault();
  
        const now = performance.now();
        const ty = e.touches[0].clientY;
        const dy = ty - touchY;
        const dt = Math.max((now - touchT) / 1000, 0.001);
  
        y = wrapY(y + dy);
        touchV = touchV * 0.2 + (-dy / dt) * 0.8; /* smoothed px/s */
        touchY = ty;
        touchT = now;
      }
  
      function onTouchEnd() {
        if (!dragging) return;
        dragging = false;
  
        /* Stale finger (held still before lifting) = no fling */
        if (performance.now() - touchT > 100) touchV = 0;
  
        if (Math.abs(touchV) > 20) {
          dir = touchV > 0 ? 1 : -1;
          boost = clampBoost(touchV - speed * dir);
        }
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
        document.removeEventListener("keydown", onKey);
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
  