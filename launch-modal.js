/* =========================================================
   LAUNCH MODAL
   The yellow "Recently launched!" badge in the corner opens a
   full-screen panel with the launches slider (mouse-slider.js).
   Opening: a circle in the badge's color grows out of the badge
   and floods the screen, then the panel opens over it the same
   way. Closing runs it backwards into the badge.

   Built as a Webflow component ("Recently Launched") so it can sit
   on any page. Components can't hold a CMS list, so the cards live
   on their own page (/launches) and the panel loads them from
   there: the panel's data-launch-source names that page, and the
   script copies its [data-launches] section in. It starts loading
   when the badge is hovered or focused (or shortly after the page
   settles), so the cards are usually there by the time it opens.
   If the panel already holds a [data-launches] section, nothing
   is fetched.

   Load after lenis-init.js and mouse-slider.js, site-wide. Place the
   component inside the page (Barba container); the script moves it
   to <body> so the panel can cover the nav, and removes it on leave.

   Markup (attributes, so classes stay free for styling):
     [data-launch-open]          the badge (a button)
     [data-launch-modal]         the panel (fixed, full screen)
       data-launch-source="/launches"   page that holds the cards
       [data-launch-close]       close button(s)
       [data-launch-content]     where the cards go (optional;
                                 defaults to the panel itself)

   The badge tucks away while the site footer (or anything marked
   [data-launch-hide]) is on screen, so it never covers the footer
   CTA or links.

   A badge inside the site menu (.menu-wrap) works too: it closes
   the menu as the panel opens. Its styles live with it in the nav.

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
  let portaled = null;
  let wipe = null;
  let footerWatch = null;
  const cleanup = [];

  function on(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    cleanup.push(() => el.removeEventListener(type, fn, opts));
  }

  /* The page's own badges (not the one in the site menu) */
  function cornerBadges() {
    return Array.from(document.querySelectorAll("[data-launch-open]")).filter(
      (btn) => !btn.closest(".menu-wrap")
    );
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
    [modal, wipe].forEach((el) => {
      if (!el) return;
      el.style.setProperty("--launch-x", `${box.left + box.width / 2}px`);
      el.style.setProperty("--launch-y", `${box.top + box.height / 2}px`);
    });
  }

  function open(e) {
    if (!modal || modal.classList.contains(OPEN_CLASS)) return;
    lastFocus = e ? e.currentTarget : document.activeElement;
    setOrigin(lastFocus);

    /* From the menu: the menu slides away under the flood. Focus goes
       back to the corner badge on close, since the menu one is gone. */
    if (lastFocus && lastFocus.closest && lastFocus.closest(".menu-wrap")) {
      if (window.closeSiteMenu) window.closeSiteMenu();
      lastFocus = cornerBadges()[0] || null;
    }
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

    if (instant) {
      modal.classList.add("is-instant");
      if (wipe) wipe.classList.add("is-instant");
    }
    modal.classList.remove(OPEN_CLASS);
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;
    document.documentElement.classList.remove(ROOT_CLASS);
    if (window.startLenis) window.startLenis(LENIS_REASON);

    clearTimeout(closeTimer);
    const closing = modal;
    const closingWipe = wipe;
    closeTimer = setTimeout(() => {
      closing.classList.remove("is-instant");
      if (closingWipe) closingWipe.classList.remove("is-instant");
    }, 50);

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
     TUCK AWAY OVER THE FOOTER
  --------------------------------------------- */

  const HIDE_TARGETS = "footer, .footer, [data-launch-hide]";
  const TUCKED_CLASS = "is-tucked";

  function watchFooter() {
    if (!("IntersectionObserver" in window)) return;
    const targets = Array.from(document.querySelectorAll(HIDE_TARGETS)).filter(
      (el) => !el.closest("[data-launch-root], [data-launch-modal]")
    );
    if (!targets.length) return;

    const showing = new Set();
    footerWatch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) showing.add(entry.target);
        else showing.delete(entry.target);
      });
      const tuck = showing.size > 0;
      cornerBadges().forEach((btn) => {
        btn.classList.toggle(TUCKED_CLASS, tuck);
        /* Out of the tab order while it's hidden */
        if (tuck) btn.setAttribute("tabindex", "-1");
        else btn.removeAttribute("tabindex");
      });
    });
    targets.forEach((el) => footerWatch.observe(el));
  }

  /* ---------------------------------------------
     START / BARBA
  --------------------------------------------- */

  function init() {
    routeCaseStudies();

    modal = document.querySelector("[data-launch-modal]");
    if (!modal || modal.dataset.launchModalReady) return;
    modal.dataset.launchModalReady = "true";

    /* The component sits inside the Barba container, whose stacking
       context keeps it under the nav. Lift it to <body> so it can sit
       on top; destroy() removes it again when the page changes. */
    const root = modal.closest("[data-launch-root]") || modal;
    if (root.parentElement !== document.body) {
      document.body.appendChild(root);
      portaled = root;
    }

    /* The badge-colored circle that floods the screen first; the
       panel then opens on top of it (styles: .launch-wipe) */
    wipe = document.createElement("div");
    wipe.className = "launch-wipe";
    wipe.setAttribute("aria-hidden", "true");
    modal.before(wipe);

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
    watchFooter();

    /* Or once the page has settled */
    idleTimer = setTimeout(loadCards, 2500);
  }

  function destroy() {
    close(true);
    clearTimeout(idleTimer);
    cleanup.splice(0).forEach((fn) => fn());
    if (footerWatch) footerWatch.disconnect();
    footerWatch = null;
    if (modal) delete modal.dataset.launchModalReady;
    /* It was lifted out of the old page, so it leaves with it */
    if (portaled) portaled.remove();
    else if (wipe) wipe.remove();
    portaled = null;
    wipe = null;
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
