(() => {
    const NBSP = String.fromCharCode(160);
  
    function findText(el) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
      });
      return walker.nextNode();
    }
  
    function row(text, under) {
      const line = document.createElement("span");
      line.style.display = "block";
      line.style.whiteSpace = "nowrap";
      if (under) {
        line.style.position = "absolute";
        line.style.left = "0";
        line.style.top = "100%";
      }
      [...text].forEach((char) => {
        const letter = document.createElement("span");
        letter.style.display = "inline-block";
        letter.textContent = char === " " ? NBSP : char;
        line.appendChild(letter);
      });
      return line;
    }
  
    function rollText(el) {
      if (el.dataset.rollReady || typeof gsap === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const textNode = findText(el);
      if (!textNode) return;
      el.dataset.rollReady = "true";
  
      const text = textNode.textContent.trim();
      const mask = document.createElement("span");
      mask.setAttribute("aria-hidden", "true");
      mask.style.cssText =
        "position:relative;display:inline-block;overflow:hidden;vertical-align:top";
      const top = row(text, false);
      const bottom = row(text, true);
      mask.append(top, bottom);
      if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", text);
      textNode.parentNode.replaceChild(mask, textNode);
  
      const settings = { yPercent: -100, duration: 0.45, ease: "power3.inOut", stagger: 0.025 };
      const roll = gsap.timeline({ paused: true })
        .to(top.children, settings, 0)
        .to(bottom.children, settings, 0);
  
      el.addEventListener("mouseenter", () => roll.play());
      el.addEventListener("mouseleave", () => roll.reverse());
      el.addEventListener("focus", () => roll.play());
      el.addEventListener("blur", () => roll.reverse());
    }
  
    function initTextRoll(scope = document) {
      scope.querySelectorAll("[data-text-roll]").forEach(rollText);
    }
  
    window.initTextRoll = initTextRoll;
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initTextRoll());
    } else {
      initTextRoll();
    }
  
    if (typeof barba !== "undefined" && barba.hooks) {
      barba.hooks.after((data) => {
        initTextRoll(data && data.next && data.next.container ? data.next.container : document);
      });
    }
  })();