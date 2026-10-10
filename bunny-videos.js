/* =========================================================
   BUNNY VIDEOS
========================================================= */

function initBunnyVideos(container = document) {

  console.log("INIT BUNNY VIDEOS");


  /* =========================================================
     ALL VIDEOS
  ========================================================= */

  const videos = container.querySelectorAll(
    "video"
  );


  videos.forEach((video) => {

    video.muted = true;
    video.playsInline = true;


    /* Card hover videos never play on touch
       screens (see HOVER VIDEOS), so don't
       download them there. */

    if (
      window.matchMedia &&
      window.matchMedia("(hover: none)").matches &&
      video.classList.contains("bunny-hover") &&
      video.closest(".video-card")
    ) {

      video.preload = "none";

      // Stop a download the page already started.
      if (
        video.networkState !==
        HTMLMediaElement.NETWORK_EMPTY
      ) {

        video
          .querySelectorAll("source")
          .forEach((s) => s.removeAttribute("src"));

        video.removeAttribute("src");

        video.load();

      }

      return;

    }


    /* -----------------------------------------
       MAKE SURE SOURCE IS LOADED

       Only start a load when the browser hasn't
       picked a source yet. Re-assigning src or
       calling load() on a video that is already
       loading throws away what it has buffered,
       which made the homepage video late after
       a Barba return.
    ----------------------------------------- */

    if (
      video.networkState ===
      HTMLMediaElement.NETWORK_EMPTY
    ) {

      const source =
        video.querySelector("source");

      if (
        source &&
        source.src &&
        !video.src
      ) {

        video.src = source.src;

      } else {

        video.load();

      }

    }


    /* -----------------------------------------
       AUTOPLAY VIDEOS
    ----------------------------------------- */

    if (
      video.autoplay ||
      video.hasAttribute("autoplay")
    ) {

      video.play().catch(() => {});

    }

  });


  /* =========================================================
     HOVER VIDEOS
  ========================================================= */

  const cards = container.querySelectorAll(
    ".video-card"
  );


  /* Touch screens (phones, tablets) have no real
     hover: a tap fires mouseenter with no
     mouseleave, which left the hover video
     running over the thumbnail (often still
     black). They keep the thumbnail, and the
     videos aren't warmed or played. */

  const noHover =
    window.matchMedia &&
    window.matchMedia("(hover: none)").matches;


  cards.forEach((card) => {

    const video =
      card.querySelector(".bunny-video");


    if (!video) return;


    /* Prevent duplicate listeners */

    if (card.dataset.videoInitialized) {
      return;
    }


    card.dataset.videoInitialized = "true";


    if (
      noHover &&
      video.classList.contains("bunny-hover")
    ) {

      video.pause();

      return;

    }


    /* -----------------------------------------
       WARM VIDEO
    ----------------------------------------- */

    video
      .play()
      .then(() => {

        /*
         If this is NOT an autoplay video,
         reset it after warming.
        */

        if (!video.hasAttribute("autoplay")) {

          video.pause();
          video.currentTime = 0;

        }

      })
      .catch(() => {});


    /* -----------------------------------------
       HOVER IN
    ----------------------------------------- */

    card.addEventListener(
      "mouseenter",
      () => {

        video.play().catch(() => {});

      }
    );


    /* -----------------------------------------
       HOVER OUT
    ----------------------------------------- */

    card.addEventListener(
      "mouseleave",
      () => {

        video.pause();
        video.currentTime = 0;

      }
    );

  });

}


/* =========================================================
   TAP TO PLAY (iPhone Low Power Mode)

   Low Power Mode blocks autoplay, so iOS shows its own
   play button on each video. A tap on that button often
   lands on whatever sits on top of the video instead, so
   nothing plays. Any tap now starts the paused autoplay
   videos on screen (a tap is a user gesture, which iOS
   allows), plus any video right under the finger.
   Sliders, slideshows and the JT player run their own
   playback and are left alone.
========================================================= */

(() => {

  if (window.jtTapToPlay) return;

  window.jtTapToPlay = true;


  const SKIP =
    ".jt-player, [data-mouse-slider], [data-card-slideshow]";


  function onScreen(video) {

    const r = video.getBoundingClientRect();

    return (
      r.width > 0 &&
      r.height > 0 &&
      r.bottom > 0 &&
      r.right > 0 &&
      r.top < window.innerHeight &&
      r.left < window.innerWidth
    );

  }


  function start(video) {

    if (!video.paused || video.closest(SKIP)) return;

    video.muted = true;
    video.playsInline = true;

    const p = video.play();

    if (p && p.catch) p.catch(() => {});

  }


  document.addEventListener(
    "click",
    (e) => {

      if (document.elementsFromPoint) {

        document
          .elementsFromPoint(e.clientX, e.clientY)
          .forEach((el) => {
            if (el.tagName === "VIDEO" && el.hasAttribute("autoplay")) {
              start(el);
            }
          });

      }

      document
        .querySelectorAll("video[autoplay]")
        .forEach((video) => {
          if (onScreen(video)) start(video);
        });

    },
    true
  );

})();


/* =========================================================
   INITIAL BROWSER LOAD
========================================================= */

function initBunnyVideosOnLoad() {

  initBunnyVideos(document);

}


if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initBunnyVideosOnLoad,
    { once: true }
  );

} else {

  initBunnyVideosOnLoad();

}