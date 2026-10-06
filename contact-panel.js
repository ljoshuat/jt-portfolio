/* =========================================================
   CONTACT PANEL
   The "Get in touch" side shelf: slides in from the right over a
   dimmed overlay with the contact form (a real Webflow form, so
   submissions land in Webflow's form inbox).

   The panel lives in the "Global Component" (outside the Barba
   container, on every page). The script lifts it to <body> so it
   can cover the nav, and keeps it there across page changes.

   Markup (attributes, so classes stay free for styling):
     [data-contact-panel]   the panel root (fixed, full screen)
       [data-contact-close] close button(s) and the overlay
       [data-contact-dialog] the shelf itself (gets focus trap)

   Openers: anything with [data-contact-open], or a link to
   "#contact". A link inside the site menu closes the menu first.
   Visiting a URL ending in #contact opens it on load.

   Closes on the X, an overlay click, Escape or a page change. Tab
   stays inside while open; focus goes back to the opener on close.
   After a successful send the form resets the next time the panel
   closes, so it is ready again.

   Load after lenis-init.js, site-wide.
========================================================= */

(function () {
  const OPEN_CLASS = "is-open";
  const ROOT_CLASS = "is-contact-open";
  const LENIS_REASON = "contact-panel";
  const CLOSE_MS = 900;
  /* These fade in one after another as the shelf lands */
  const REVEAL = ".contact_title, .contact_field, .contact_submit";

  let panel = null;
  let dialog = null;
  let lastFocus = null;
  let resetTimer = null;

  function isOpen() {
    return !!panel && panel.classList.contains(OPEN_CLASS);
  }

  function focusables() {
    return Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
  }

  /* Number the bits that fade/draw in, so CSS can stagger them */
  function indexReveals() {
    panel.querySelectorAll(REVEAL).forEach((el) => el.classList.add("contact_reveal"));
    panel.querySelectorAll(".contact_reveal").forEach((el, i) => {
      el.style.setProperty("--i", i);
    });
    panel.querySelectorAll(".contact_icon").forEach((icon, i) => {
      icon.querySelectorAll("[data-draw]").forEach((path) => {
        path.setAttribute("pathLength", "1");
        path.style.setProperty("--i", i);
      });
    });
  }

  /* ---------------------------------------------
     OPEN / CLOSE
  --------------------------------------------- */

  function open(opener) {
    if (!panel || isOpen()) return;
    clearTimeout(resetTimer);

    lastFocus = opener || document.activeElement;

    /* From the site menu: close it the normal way (its toggle) */
    const menu = document.querySelector(".menu-wrap.is-open");
    if (menu) {
      const toggle = document.querySelector(".menu-toggle");
      if (toggle) toggle.click();
      else if (window.closeSiteMenu) window.closeSiteMenu();
    }

    panel.removeAttribute("inert");
    panel.setAttribute("aria-hidden", "false");
    /* Force a frame so the slide-in transition runs */
    void panel.offsetWidth;
    panel.classList.add(OPEN_CLASS);
    document.documentElement.classList.add(ROOT_CLASS);
    if (window.stopLenis) window.stopLenis(LENIS_REASON);

    /* Focus the first field once the shelf is mostly in */
    setTimeout(() => {
      if (!isOpen()) return;
      const first = dialog.querySelector("input:not([type=hidden]):not([type=radio]), textarea");
      (first || dialog).focus({ preventScroll: true });
    }, 550);
  }

  function close() {
    if (!isOpen()) return;

    panel.classList.remove(OPEN_CLASS);
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
    document.documentElement.classList.remove(ROOT_CLASS);
    if (window.startLenis) window.startLenis(LENIS_REASON);

    if (lastFocus && document.contains(lastFocus) && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;

    if (location.hash === "#contact") {
      history.replaceState(null, "", location.pathname + location.search);
    }

    /* After a send, put the form back once the shelf is out of view */
    resetTimer = setTimeout(resetIfSent, CLOSE_MS);
  }

  function resetIfSent() {
    if (!panel || isOpen()) return;
    const block = panel.querySelector(".w-form");
    if (!block) return;
    const form = block.querySelector("form");
    const done = block.querySelector(".w-form-done");
    const fail = block.querySelector(".w-form-fail");
    const sent = done && getComputedStyle(done).display !== "none";
    if (!sent) return;
    form.reset();
    form.style.display = "";
    done.style.display = "";
    if (fail) fail.style.display = "";
    const submit = form.querySelector('[type="submit"]');
    if (submit && submit.dataset.label) submit.value = submit.dataset.label;
  }

  /* ---------------------------------------------
     EVENTS
  --------------------------------------------- */

  function onClick(e) {
    const opener = e.target.closest('[data-contact-open], a[href="#contact"], a[href$="/#contact"]');
    if (opener && (!panel || !panel.contains(opener))) {
      if (!panel) return;
      e.preventDefault();
      open(opener);
      return;
    }
    if (panel && isOpen() && e.target.closest("[data-contact-close]")) {
      e.preventDefault();
      close();
    }
  }

  function onKey(e) {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------
     START / BARBA
  --------------------------------------------- */

  function init() {
    const found = Array.from(document.querySelectorAll("[data-contact-panel]"));
    if (!found.length) return;

    /* Keep one panel (the one already on <body> if there is one) */
    const keep = found.find((el) => el.parentElement === document.body) || found[0];
    found.forEach((el) => { if (el !== keep) el.remove(); });

    if (keep === panel) return;
    panel = keep;
    dialog = panel.querySelector("[data-contact-dialog]") || panel;

    if (panel.parentElement !== document.body) document.body.appendChild(panel);

    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
    /* Lenis is stopped while open; this lets the shelf scroll itself */
    panel.setAttribute("data-lenis-prevent", "");

    const submit = panel.querySelector('[type="submit"]');
    if (submit) submit.dataset.label = submit.value;

    /* Placeholders are set as data-placeholder in Webflow */
    panel.querySelectorAll("[data-placeholder]").forEach((field) => {
      if (!field.getAttribute("placeholder")) {
        field.setAttribute("placeholder", field.getAttribute("data-placeholder"));
      }
    });

    indexReveals();

    if (location.hash === "#contact") open(null);
  }

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => close());
    barba.hooks.after(() => init());
  }

  window.openContactPanel = () => open(null);
  window.closeContactPanel = close;
})();
