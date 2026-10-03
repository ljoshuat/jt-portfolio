/* =========================================================
   WORK FILTER
   Filters the Work grid by Project Service, like 27km.com/work.
   Load site-wide (footer) after GSAP, ScrollTrigger, Barba and
   lenis-init.js, and before page-transition.js. It hooks into
   Barba itself, so it re-runs whenever /work is entered.

   Markup (attributes, so classes stay free for styling):
     [data-work-filter]          wrapper around the filter buttons
       [data-filter="all"]       static "All" button
       [data-filter="<slug>"]    one per Service (CMS list item,
                                 value bound to the Service Slug)
     [data-work-list]            the Projects collection list
       .w-dyn-item               each project card, containing a
         [data-service="<slug>"] hidden nested list of its Services
                                 (value bound to the Service Slug)

   Active button gets .is-active and aria-pressed="true".
   Services with no published projects are hidden automatically.
   ?service=<slug> in the URL preselects a filter.
   [data-work-more] reveals the next group of cards (group size
   from data-page-size on the list, default 6). Filters reset it.
   The sticky bar follows the bottom of .nav-component, and changing
   filters scrolls the grid's first row back into view.
========================================================= */

(() => {
    const ACTIVE = "is-active";
    const NAV = ".nav-component";
    const NAV_BG = "var(--color--bg-primary)";
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  
    function initWorkFilter(scope = document) {
      const bar = scope.querySelector("[data-work-filter]");
      const list = scope.querySelector("[data-work-list]");
  
      if (!bar || !list || bar.dataset.filterReady) return;
      bar.dataset.filterReady = "true";
  
      const buttons = [...bar.querySelectorAll("[data-filter]")];
      const items = [...list.querySelectorAll(".w-dyn-item")].filter(
        (item) => item.parentElement === list
      );
  
      /* Each card's service slugs, read from its nested list */
      const servicesOf = new Map(
        items.map((item) => [
          item,
          [...item.querySelectorAll("[data-service]")].map((el) =>
            el.getAttribute("data-service").trim()
          ),
        ])
      );
  
      /* Show Me More: how many cards per group (data-page-size on
         the list, default 6), and the button that reveals the next */
      const more = scope.querySelector("[data-work-more]");
      const pageSize = parseInt(list.getAttribute("data-page-size"), 10) || 6;
      let limit = pageSize;
  
      let current = "all";
      let busy = null;
  
      /* Buttons: hide services nothing uses, make them accessible */
      buttons.forEach((btn) => {
        const slug = btn.getAttribute("data-filter").trim();
        const used =
          slug === "all" ||
          items.some((item) => servicesOf.get(item).includes(slug));
  
        const holder = btn.closest(".w-dyn-item") || btn;
        if (!used) holder.style.display = "none";
  
        if (btn.tagName !== "BUTTON") {
          btn.setAttribute("role", "button");
          btn.setAttribute("tabindex", "0");
        }
        btn.setAttribute("aria-pressed", "false");
  
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          select(slug);
        });
  
        btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select(slug);
          }
        });
      });
  
      function matches(item, slug) {
        return slug === "all" || servicesOf.get(item).includes(slug);
      }
  
      function setActive(slug) {
        buttons.forEach((btn) => {
          const on = btn.getAttribute("data-filter").trim() === slug;
          btn.classList.toggle(ACTIVE, on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
      }
  
      function setUrl(slug) {
        const url = new URL(window.location.href);
        if (slug === "all") url.searchParams.delete("service");
        else url.searchParams.set("service", slug);
        history.replaceState(history.state, "", url);
      }
  
      function refreshScroll() {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        if (window.lenis && window.lenis.resize) window.lenis.resize();
      }
  
      function matching(slug) {
        return items.filter((item) => matches(item, slug));
      }
  
      /* Show the first `limit` matching cards, hide the rest, and
         show the button only while more are waiting */
      function apply(slug) {
        const shown = matching(slug).slice(0, limit);
        items.forEach((item) => {
          item.style.display = shown.includes(item) ? "" : "none";
        });
        if (more) {
          more.style.display =
            matching(slug).length > limit ? "" : "none";
        }
        refreshScroll();
        return shown;
      }
  
      function showMore() {
        const before = matching(current).slice(0, limit);
        limit += pageSize;
        const added = apply(current).filter((i) => !before.includes(i));
  
        if (!added.length || reduceMotion || typeof gsap === "undefined") {
          return;
        }
  
        gsap.fromTo(
          added,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.06,
            clearProps: "opacity,transform",
          }
        );
      }
  
      if (more) {
        if (more.tagName !== "BUTTON" && more.tagName !== "A") {
          more.setAttribute("role", "button");
          more.setAttribute("tabindex", "0");
        }
        more.addEventListener("click", (e) => {
          e.preventDefault();
          showMore();
        });
        more.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showMore();
          }
        });
      }
  
      /* If the grid's first row has scrolled up under the bar,
         bring it back into view below the nav and the bar */
      function scrollToList() {
        const header = document.querySelector(NAV);
        const navHeight = header ? header.offsetHeight : 0;
        const barBottom = bar.getBoundingClientRect().bottom;
  
        if (list.getBoundingClientRect().top >= barBottom) return;
  
        const offset = -(navHeight + bar.offsetHeight + 16);
  
        if (window.lenisScrollTo) {
          window.lenisScrollTo(list, {
            offset,
            duration: 1,
            immediate: reduceMotion,
          });
        } else {
          const top =
            list.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({
            top,
            behavior: reduceMotion ? "auto" : "smooth",
          });
        }
      }
  
      function select(slug, instant = false) {
        if (slug === current && !instant) return;
        current = slug;
        limit = pageSize;
        setActive(slug);
        if (!instant) {
          setUrl(slug);
          scrollToList();
        }
  
        const hasGsap = typeof gsap !== "undefined";
  
        if (instant || reduceMotion || !hasGsap) {
          apply(slug);
          return;
        }
  
        if (busy) busy.kill();
  
        const visible = items.filter((i) => i.style.display !== "none");
  
        /* Out: dim and drop the current cards, then swap and bring
           the matching ones in with a stagger */
        busy = gsap
          .timeline()
          .to(visible, {
            opacity: 0,
            y: 20,
            duration: 0.3,
            ease: "power2.in",
            stagger: 0.02,
          })
          .add(() => {
            const shown = apply(slug);
            gsap.fromTo(
              shown,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power3.out",
                stagger: 0.06,
                clearProps: "opacity,transform",
              }
            );
          });
      }
  
      /* Initial state: ?service=<slug>, else All */
      const fromUrl = new URLSearchParams(window.location.search).get(
        "service"
      );
      const start =
        fromUrl && buttons.some((b) => b.getAttribute("data-filter") === fromUrl)
          ? fromUrl
          : "all";
  
      select(start, true);
      followNav(bar);
    }
  
    /* Keep the sticky bar just under the nav. The nav slides away
       on scroll down and back on scroll up, so the bar's top follows
       the nav's bottom edge every frame. Stops once Barba removes
       the bar. */
    function followNav(bar) {
      let last = null;
  
      function tick() {
        const header = document.querySelector(NAV);
  
        if (!bar.isConnected) {
          if (header) header.style.backgroundColor = "";
          return;
        }
  
        /* Solid nav once it's over the grid, clear at the very top.
           Set inline so it doesn't depend on published Webflow CSS. */
        if (header) {
          header.style.backgroundColor =
            window.scrollY > 80 ? NAV_BG : "";
        }
  
        /* Tuck 1px under the nav so sub-pixel positions mid-slide
           never leave a hairline gap between the two */
        const top = header
          ? Math.max(0, Math.floor(header.getBoundingClientRect().bottom) - 1)
          : 0;
  
        if (top !== last) {
          bar.style.top = top + "px";
          last = top;
        }
  
        requestAnimationFrame(tick);
      }
  
      requestAnimationFrame(tick);
    }
  
    window.initWorkFilter = initWorkFilter;
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initWorkFilter());
    } else {
      initWorkFilter();
    }
  
    if (typeof barba !== "undefined" && barba.hooks) {
      barba.hooks.after((data) => {
        initWorkFilter(data && data.next && data.next.container
          ? data.next.container
          : document);
      });
    }
  })();
  