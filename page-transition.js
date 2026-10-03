gsap.registerPlugin(ScrollTrigger);


if (
  "scrollRestoration" in history
) {

  history.scrollRestoration =
    "manual";

}


/* =========================================================
   GET INCOMING WEBFLOW PAGE ID
========================================================= */

function getNextWebflowPageId(data) {

  if (!data.next.html) {

    return null;

  }


  const parser =
    new DOMParser();


  const nextDocument =
    parser.parseFromString(
      data.next.html,
      "text/html"
    );


  return nextDocument.documentElement.getAttribute(
    "data-wf-page"
  );

}


/* =========================================================
   RESTART WEBFLOW
========================================================= */

function restartWebflow() {

  if (!window.Webflow) {

    console.warn(
      "Webflow runtime not found"
    );

    return;

  }


  Webflow.destroy();

  Webflow.ready();


  document.dispatchEvent(
    new Event(
      "readystatechange"
    )
  );


  window.dispatchEvent(
    new Event(
      "resize"
    )
  );

}


/* =========================================================
   BARBA
========================================================= */

barba.init({

  preventRunning: true,


  transitions: [

    {

      name:
        "page-transition",


      /* =========================================
         BEFORE LEAVE
      ========================================= */

      beforeLeave(data) {

        const namespace =
          data.current.container.dataset.barbaNamespace;


        /* -----------------------------------------
           CLOSE MENU
        ----------------------------------------- */

        if (
          typeof window.closeSiteMenu ===
          "function"
        ) {

          window.closeSiteMenu();

        }


        /* -----------------------------------------
           DESTROY HEADER SCROLL WATCHER

           Header itself stays where it currently
           is during the outgoing animation.
        ----------------------------------------- */

        if (
          typeof window.destroyHeaderScroll ===
          "function"
        ) {

          window.destroyHeaderScroll();

        }


        /* -----------------------------------------
           HOME CLEANUP
        ----------------------------------------- */

        if (
          namespace === "home" &&
          typeof destroyHome ===
          "function"
        ) {

          destroyHome();

        }


        /*
         * IMPORTANT:
         *
         * Work cleanup does NOT happen here.
         *
         * Otherwise workContext.revert()
         * can visually reset the hero media
         * before the page fades away.
         */


        /* -----------------------------------------
           PRINCIPLES CLEANUP
        ----------------------------------------- */

        if (
          typeof destroyPrinciples ===
          "function"
        ) {

          destroyPrinciples();

        }

      },


      /* =========================================
         LEAVE

         OLD PAGE:
         DOWN + FADE OUT
      ========================================= */

      leave(data) {

        return gsap.to(
          data.current.container,
          {

            y: 60,

            opacity: 0,

            duration: 0.5,

            ease:
              "power3.in"

          }
        );

      },


      /* =========================================
         AFTER LEAVE

         OLD PAGE IS NOW INVISIBLE
      ========================================= */

      afterLeave(data) {

        const namespace =
          data.current.container.dataset.barbaNamespace;


        /* -----------------------------------------
           WORK CLEANUP
        ----------------------------------------- */

        if (
          namespace === "project" &&
          typeof destroyWork ===
          "function"
        ) {

          destroyWork();

        }

      },


      /* =========================================
         BEFORE ENTER

         NEW PAGE REMAINS HIDDEN
      ========================================= */

      beforeEnter(data) {

        const namespace =
          data.next.container.dataset.barbaNamespace;


        /* -----------------------------------------
           WEBFLOW PAGE ID
        ----------------------------------------- */

        const nextPageId =
          getNextWebflowPageId(
            data
          );


        if (nextPageId) {

          document.documentElement.setAttribute(
            "data-wf-page",
            nextPageId
          );

        }


        /* -----------------------------------------
           SCROLL TO TOP
        ----------------------------------------- */

        window.scrollTo(
          0,
          0
        );


        /* -----------------------------------------
           RESET GLOBAL HEADER

           Header lives outside Barba.
        ----------------------------------------- */

        if (
          typeof window.resetHeader ===
          "function"
        ) {

          window.resetHeader();

        }


        /* -----------------------------------------
           HIDE INCOMING PAGE
        ----------------------------------------- */

        gsap.set(
          data.next.container,
          {

            y: 60,

            opacity: 0

          }
        );


        /* -----------------------------------------
           PREPARE HOME HERO
        ----------------------------------------- */

        if (
          namespace === "home" &&
          typeof prepareHomeHero ===
          "function"
        ) {

          prepareHomeHero(
            data.next.container
          );

        }


        /* -----------------------------------------
           PREPARE WORK IMAGE
        ----------------------------------------- */

        if (
          namespace === "project"
        ) {

          const imageWrap =
            data.next.container.querySelector(
              ".cms-page_img-wrap"
            );


          if (imageWrap) {

            gsap.set(
              imageWrap,
              {

                scale: 0.68,

                transformOrigin:
                  "center top"

              }
            );

          }

        }

      },


      /* =========================================
         ENTER

         DON'T REVEAL YET
      ========================================= */

      enter() {

        /*
         * Incoming page remains hidden until
         * afterEnter() initializes everything.
         */

        return Promise.resolve();

      },


      /* =========================================
         AFTER ENTER
      ========================================= */

      afterEnter(data) {

        const container =
          data.next.container;


        const namespace =
          container.dataset.barbaNamespace;


        /* -----------------------------------------
           REMOVE TEMP Y POSITION

           Keep opacity at zero while the new
           page initializes.
        ----------------------------------------- */

        gsap.set(
          container,
          {

            y: 0,

            opacity: 0

          }
        );


        /* -----------------------------------------
           WEBFLOW
        ----------------------------------------- */

        restartWebflow();


        /* -----------------------------------------
           VIDEOS
        ----------------------------------------- */

        if (
          typeof initBunnyVideos ===
          "function"
        ) {

          initBunnyVideos(
            container
          );

        }


        /* -----------------------------------------
           WORK
        ----------------------------------------- */

        if (
          namespace === "project" &&
          typeof initWork ===
          "function"
        ) {

          initWork(
            container
          );

        }


        /* -----------------------------------------
           HOME
        ----------------------------------------- */

        if (
          namespace === "home" &&
          typeof initHome ===
          "function"
        ) {

          initHome(
            container,
            false
          );

        }


        /* -----------------------------------------
           PRINCIPLES
        ----------------------------------------- */

        if (
          typeof initPrinciples ===
          "function"
        ) {

          initPrinciples(
            container
          );

        }


        /* -----------------------------------------
           WAIT FOR LAYOUT
        ----------------------------------------- */

        requestAnimationFrame(
          () => {


            /* -------------------------------------
               FIRST REFRESH
            ------------------------------------- */

            ScrollTrigger.refresh();


            /*
             * Give Webflow, video, Work,
             * Principles and ScrollTrigger
             * another frame to settle.
             */

            requestAnimationFrame(
              () => {


                /* ---------------------------------
                   ENTRANCE START POSITION

                   Still invisible.
                --------------------------------- */

                gsap.set(
                  container,
                  {

                    y: 60

                  }
                );


                /* ---------------------------------
                   REVEAL NEW PAGE
                --------------------------------- */

                gsap.to(
                  container,
                  {

                    y: 0,

                    opacity: 1,

                    duration: 0.75,

                    ease:
                      "power3.out",


                    onComplete() {


                      /* -----------------------------
                         REMOVE BARBA PROPERTIES
                      ----------------------------- */

                      gsap.set(
                        container,
                        {

                          clearProps:
                            "transform,opacity"

                        }
                      );


                      /* -----------------------------
                         REFRESH FINAL PAGE LAYOUT
                      ----------------------------- */

                      ScrollTrigger.refresh();


                      /* -----------------------------
                         REBUILD HEADER SCROLL

                         Do this AFTER all page
                         ScrollTriggers are ready.
                      ----------------------------- */

                      if (
                        typeof window.initHeaderScroll ===
                        "function"
                      ) {

                        window.initHeaderScroll();

                      }

                    }

                  }
                );

              }
            );

          }
        );

      }

    }

  ]

});