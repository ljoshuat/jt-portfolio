/* =========================================================
   LAUNCH MODAL
   The yellow "Recently launched!" badge in the corner opens a
   full-screen panel with the launches slider (mouse-slider.js).
   The panel grows out of the badge as a circle and shrinks back
   into it on close.

   Load after lenis-init.js and mouse-slider.js. The badge and the
   panel are meant to sit outside the Barba container (like the
   cursor), so they stay put between pages; the panel just closes
   when a page change starts.

   Markup (attributes, so classes stay free for styling):
     [data-launch-open]         the badge (a button); any number
     [data-launch-modal]        the panel (fixed, full screen)
       [data-launch-close]      close button(s)
       h2 / [data-launch-title] labels the dialog

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

  let modal = null;
  let lastFocus = null;
  let closeTimer = null;
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

  /* The circle grows from the middle of whichever badge was clicked */
  function setOrigin(from) {
    if (!from) return;
    const box = from.getBoundingClientRect();
    modal.style.setProperty("--launch-x", `${box.left + box.width / 2}px`);
    modal.style.setProperty("--launch-y", `${box.top + box.height / 2}px`);
  }

  function open(e) {
    if (!modal || modal.classList.contains(OPEN_CLASS)) return;
    lastFocus = e ? e.currentTarget : document.activeElement;
    setOrigin(lastFocus);
    clearTimeout(closeTimer);

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
    closeTimer = setTimeout(() => modal.classList.remove("is-instant"), 50);

    if (!instant && lastFocus && document.contains(lastFocus)) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function onKey(e) {
    if (!modal.classList.contains(OPEN_CLASS)) return;

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

  /* Launches that also have a case study open it instead */
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

  function init() {
    routeCaseStudies();
    modal = document.querySelector("[data-launch-modal]");
    if (!modal || modal.dataset.launchModalReady) return;
    modal.dataset.launchModalReady = "true";

    const title = modal.querySelector("[data-launch-title], h2");
    if (title) {
      if (!title.id) title.id = "launch-modal-title";
      modal.setAttribute("aria-labelledby", title.id);
    }
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;

    document.querySelectorAll("[data-launch-open]").forEach((btn) => {
      btn.setAttribute("aria-haspopup", "dialog");
      on(btn, "click", open);
    });
    modal.querySelectorAll("[data-launch-close]").forEach((btn) => {
      on(btn, "click", () => close());
    });
    on(document, "keydown", onKey);
  }

  function destroy() {
    close(true);
    cleanup.splice(0).forEach((fn) => fn());
    if (modal) delete modal.dataset.launchModalReady;
    modal = null;
  }

  window.openLaunchModal = () => open();
  window.closeLaunchModal = () => close();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    /* Close straight away when a page change starts */
    barba.hooks.before(() => close(true));

    /* mouse-slider.js tears down every slider on leave and only
       restarts the ones in the new page, so restart ours too */
    barba.hooks.after((data) => {
      routeCaseStudies(
        data && data.next && data.next.container ? data.next.container : document
      );
      if (modal && window.initMouseSliders) window.initMouseSliders(modal);
    });
  }

  window.destroyLaunchModal = destroy;
})();
