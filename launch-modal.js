/* =========================================================
   LAUNCH MODAL
   The yellow "Recently launched!" badge in the corner opens a
   full-screen panel with the launches slider (mouse-slider.js).
   The panel grows out of the badge as a circle and shrinks back
   into it on close.

   Built as a Webflow component ("Recently Launched") so it can sit
   on any page. Components can't hold a CMS list, so the cards live
   on their own page (/launches) and the panel loads them from
   there: the panel's data-launch-source names that page, and the
   script copies its [data-launches] section in. It starts loading
   when the badge is hovered or focused (or shortly after the page
   settles), so the cards are usually there by the time it opens.
   If the panel already holds a [data-launches] section, nothing
   is fetched.

   Load after lenis-init.js and mouse-slider.js, site-wide.

   Markup (attributes, so classes stay free for styling):
     [data-launch-open]          the badge (a button)
     [data-launch-modal]         the panel (fixed, full screen)
       data-launch-source="/launches"   page that holds the cards
       [data-launch-close]       close button(s)
       [data-launch-content]     where the cards go (optional;
                                 defaults to the panel itself)

   Closes on the close button, Escape, or a page change. Tab stays
   inside the panel while it's open. Reduced motion: plain fade.

   Case studies: a card link carrying data-case-study (bound to the
   Launches "Case study link" field) goes to that page in the same
   tab instead of the live site. Empty = live site, new tab.
========================================================= */

(function () {
  const OPEN_CLASS = "is-open";
  const ROOT_CLASS = "is-launch-open";
  const LENIS_REASON = "launch-modal";

  /* Fetched cards are kept for the visit, so later pages (Barba)
     don't fetch again */
  const sourceCache = {};

  let modal = null;
  let lastFocus = null;
  let closeTimer = null;
  let idleTimer = null;
  const cleanup = [];

  function on(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    cleanup.push(() => el.removeEventListener(type, fn, opts));
  }

  function focusables() {
    return Array.from(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  /* ---------------------------------------------
     CASE STUDY ROUTING
  --------------------------------------------- */

  function routeCaseStudies(scope = document) {
    scope.querySelectorAll("a[data-case-study]").forEach((link) => {
      const url = link.getAttribute("data-case-study").trim();
      if (!url) return;
      link.setAttribute("href", url);
      link.removeAttribute("target");
      link.removeAttribute("rel");
      const card = link.closest("[data-cursor-text]");
      if (card) card.setAttribute("data-cursor-text", "View case study");
    });
  }

  /* ---------------------------------------------
     LOAD THE CARDS FROM THE SOURCE PAGE
  --------------------------------------------- */

  function fetchSection(url) {
    if (!sourceCache[url]) {
      sourceCache[url] = fetch(url, { credentials: "same-origin" })
        .then((res) => {
          if (!res.ok) throw new Error(`launch-modal: ${url} ${res.status}`);
          return res.text();
        })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const section = doc.querySelector("[data-launches]");
          if (!section) throw new Error(`launch-modal: no [data-launches] on ${url}`);
          return section.outerHTML;
        })
        .catch((err) => {
          delete sourceCache[url];
          throw err;
        });
    }
    return sourceCache[url];
  }

  function loadCards() {
    if (!modal) return Promise.resolve();
    if (modal.querySelector("[data-launches]")) return Promise.resolve();
    const url = modal.getAttribute("data-launch-source");
    if (!url) return Promise.resolve();

    const target = modal.querySelector("[data-launch-content]") || modal;
    const forModal = modal;

    modal.classList.add("is-loading");
    return fetchSection(url)
      .then((markup) => {
        /* The page may have changed (Barba) while this was loading */
        if (forModal !== modal || modal.querySelector("[data-launches]")) return;
        target.insertAdjacentHTML("beforeend", markup);
        const section = target.querySelector("[data-launches]");
        routeCaseStudies(section);
        if (window.initMouseSliders) window.initMouseSliders(section);
      })
      .catch((err) => console.warn(err))
      .finally(() => forModal.classList.remove("is-loading"));
  }

  /* ---------------------------------------------
     OPEN / CLOSE
  --------------------------------------------- */

  /* The circle grows from the middle of whichever badge was clicked */
  function setOrigin(from) {
    if (!from || !from.getBoundingClientRect) return;
    const box = from.getBoundingClientRect();
    if (!box.width) return;
    modal.style.setProperty("--launch-x", `${box.left + box.width / 2}px`);
    modal.style.setProperty("--launch-y", `${box.top + box.height / 2}px`);
  }

  function open(e) {
    if (!modal || modal.classList.contains(OPEN_CLASS)) return;
    lastFocus = e ? e.currentTarget : document.activeElement;
    setOrigin(lastFocus);
    clearTimeout(closeTimer);
    loadCards();

    modal.inert = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add(OPEN_CLASS);
    document.documentElement.classList.add(ROOT_CLASS);
    if (window.stopLenis) window.stopLenis(LENIS_REASON);

    const closeBtn = modal.querySelector("[data-launch-close]");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function close(instant) {
    if (!modal || !modal.classList.contains(OPEN_CLASS)) return;

    if (instant) modal.classList.add("is-instant");
    modal.classList.remove(OPEN_CLASS);
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;
    document.documentElement.classList.remove(ROOT_CLASS);
    if (window.startLenis) window.startLenis(LENIS_REASON);

    clearTimeout(closeTimer);
    const closing = modal;
    closeTimer = setTimeout(() => closing.classList.remove("is-instant"), 50);

    if (!instant && lastFocus && document.contains(lastFocus)) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function onKey(e) {
    if (!modal || !modal.classList.contains(OPEN_CLASS)) return;

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }

    /* Keep Tab inside the panel */
    if (e.key === "Tab") {
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ---------------------------------------------
     START / BARBA
  --------------------------------------------- */

  function init() {
    routeCaseStudies();

    modal = document.querySelector("[data-launch-modal]");
    if (!modal || modal.dataset.launchModalReady) return;
    modal.dataset.launchModalReady = "true";

    const title = modal.querySelector("[data-launch-title], h2");
    if (title && !title.id) title.id = "launch-modal-title";
    if (title) modal.setAttribute("aria-labelledby", title.id);
    else modal.setAttribute("aria-label", "Recently launched");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;

    document.querySelectorAll("[data-launch-open]").forEach((btn) => {
      btn.setAttribute("aria-haspopup", "dialog");
      on(btn, "click", open);
      /* Start loading the cards as soon as someone heads for the badge */
      on(btn, "pointerenter", loadCards, { once: true });
      on(btn, "focus", loadCards, { once: true });
    });
    modal.querySelectorAll("[data-launch-close]").forEach((btn) => {
      on(btn, "click", () => close());
    });
    on(document, "keydown", onKey);

    /* Or once the page has settled */
    idleTimer = setTimeout(loadCards, 2500);
  }

  function destroy() {
    close(true);
    clearTimeout(idleTimer);
    cleanup.splice(0).forEach((fn) => fn());
    if (modal) delete modal.dataset.launchModalReady;
    modal = null;
  }

  window.openLaunchModal = () => open();
  window.closeLaunchModal = () => close();
  window.destroyLaunchModal = destroy;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    /* Close straight away when a page change starts */
    barba.hooks.before(() => destroy());

    /* The new page may have its own badge (component), or none */
    barba.hooks.after(() => init());
  }
})();
