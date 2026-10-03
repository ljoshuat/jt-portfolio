(() => {
    const clean = (path) => path.replace(/\/+$/, "") || "/";
    let lastHeading = "";
  
    function randomHeading(section) {
      const el = section.querySelector("[data-view-more-heading]");
      const options = (section.dataset.viewMoreHeadings || "")
        .split("|").map((t) => t.trim()).filter(Boolean);
      if (!el || !options.length) return;
      const fresh = options.filter((t) => t !== lastHeading);
      const pool = fresh.length ? fresh : options;
      lastHeading = pool[Math.floor(Math.random() * pool.length)];
      el.textContent = lastHeading;
    }
  
    function pathOf(item) {
      const link = item.querySelector("a[href]");
      if (!link) return "";
      return clean(new URL(link.getAttribute("href"), location.origin).pathname);
    }
  
    function pick(items, index, count) {
      if (index < 0) return items.slice(0, count);
      const picked = [];
      const n = items.length;
      for (let step = 1; picked.length < count && step < n; step += 1) {
        const prev = items[(index - step + n) % n];
        const next = items[(index + step) % n];
        if (!picked.includes(prev)) picked.push(prev);
        if (picked.length < count && !picked.includes(next)) picked.push(next);
      }
      return picked;
    }
  
    function rollLink(link) {
      if (link.dataset.rollReady || typeof gsap === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const textNode = [...link.childNodes].find(
        (node) => node.nodeType === 3 && node.textContent.trim()
      );
      if (!textNode) return;
      link.dataset.rollReady = "true";
  
      const text = textNode.textContent.trim();
      const row = (under) => {
        const line = document.createElement("span");
        line.style.display = "block";
        if (under) {
          line.style.position = "absolute";
          line.style.left = "0";
          line.style.top = "100%";
        }
        [...text].forEach((char) => {
          const letter = document.createElement("span");
          letter.style.display = "inline-block";
          letter.textContent = char === " " ? " " : char;
          line.appendChild(letter);
        });
        return line;
      };
  
      const mask = document.createElement("span");
      mask.setAttribute("aria-hidden", "true");
      mask.style.cssText =
        "position:relative;display:inline-block;overflow:hidden;vertical-align:top";
      const top = row(false);
      const bottom = row(true);
      mask.append(top, bottom);
      link.setAttribute("aria-label", text);
      link.replaceChild(mask, textNode);
  
      const settings = { yPercent: -100, duration: 0.45, ease: "power3.inOut", stagger: 0.025 };
      const roll = gsap.timeline({ paused: true })
        .to(top.children, settings, 0)
        .to(bottom.children, settings, 0);
  
      link.addEventListener("mouseenter", () => roll.play());
      link.addEventListener("mouseleave", () => roll.reverse());
      link.addEventListener("focus", () => roll.play());
      link.addEventListener("blur", () => roll.reverse());
    }
  
    function initViewMore(scope = document, path = location.pathname) {
      const here = clean(path);
      scope.querySelectorAll("[data-view-more]").forEach((section) => {
        const list = section.querySelector("[data-view-more-list]");
        randomHeading(section);
        section.querySelectorAll(".view-more_all").forEach(rollLink);
        if (!list) return;
  
        const count = parseInt(section.dataset.viewMoreCount, 10) || 2;
        const all = [...list.querySelectorAll(".w-dyn-item")];
        const items = all.filter((item) => pathOf(item));
        const index = items.findIndex((item) => pathOf(item) === here);
        const shown = pick(items, index, count);
  
        all.forEach((item) => {
          item.style.display = shown.includes(item) ? "" : "none";
          item.style.order = shown.includes(item) ? shown.indexOf(item) : "";
        });
        section.style.display = shown.length ? "" : "none";
      });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
  
    window.initViewMore = initViewMore;
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initViewMore());
    } else {
      initViewMore();
    }
  
    if (typeof barba !== "undefined" && barba.hooks) {
      barba.hooks.after((data) => {
        const next = data && data.next;
        initViewMore(
          next && next.container ? next.container : document,
          next && next.url && next.url.path ? next.url.path : location.pathname
        );
      });
    }
  })();