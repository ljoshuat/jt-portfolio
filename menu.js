(() => {

  const menu = document.querySelector(".menu-wrap");
  const toggles = document.querySelectorAll(".menu-toggle");
  const items = document.querySelectorAll(".menu-item");

  if (!menu || !toggles.length) return;

  let open = false;


  /* =========================================
     SET INITIAL ITEM STATE
  ========================================= */

  gsap.set(items, {
    opacity: 0,
    y: 40
  });


  /* =========================================
     ICON STATE
  ========================================= */

  function setToggleState(isOpen) {

    toggles.forEach((toggle) => {

      const lineOne =
        toggle.querySelector(".line-one");

      const lineTwo =
        toggle.querySelector(".line-two");

      const label =
        toggle.querySelector(".toggle-label");


      if (lineOne) {
        lineOne.classList.remove(
          "is-open",
          "is-close"
        );
      }

      if (lineTwo) {
        lineTwo.classList.remove(
          "is-open",
          "is-close"
        );
      }


      /*
       Force CSS animation restart
      */

      if (lineOne) {
        void lineOne.offsetWidth;
      }

      if (lineTwo) {
        void lineTwo.offsetWidth;
      }


      if (lineOne) {
        lineOne.classList.add(
          isOpen ? "is-open" : "is-close"
        );
      }

      if (lineTwo) {
        lineTwo.classList.add(
          isOpen ? "is-open" : "is-close"
        );
      }


      if (label) {
        label.textContent =
          isOpen ? "Close" : "Menu";
      }

    });

  }


  /* =========================================
     OPEN
  ========================================= */

  function openMenu() {

    if (open) return;

    open = true;

    menu.classList.add("is-open");

    setToggleState(true);


    gsap.timeline({
      delay: 0.8
    })
    .to(items, {

      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.12

    });

  }


  /* =========================================
     CLOSE
  ========================================= */

  function closeMenu(immediate = false) {

    if (!open && !menu.classList.contains("is-open")) {
      return;
    }

    open = false;

    menu.classList.remove("is-open");

    setToggleState(false);


    if (immediate) {

      gsap.killTweensOf(items);

      gsap.set(items, {
        opacity: 0,
        y: 40
      });

      return;

    }


    gsap.to(items, {

      opacity: 0,
      y: 40,
      duration: 0.3,
      ease: "power2.in"

    });

  }


  /* =========================================
     TOGGLE
  ========================================= */

  toggles.forEach((toggle) => {

    toggle.addEventListener("click", () => {

      if (open) {
        closeMenu();
      } else {
        openMenu();
      }

    });

  });


  /* =========================================
     EXPOSE TO BARBA
  ========================================= */

  window.closeSiteMenu = function() {
    closeMenu(true);
  };

})();
