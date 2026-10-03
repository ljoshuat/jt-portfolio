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


    /* -----------------------------------------
       MAKE SURE SOURCE IS LOADED
    ----------------------------------------- */

    const source =
      video.querySelector("source");


    if (
      source &&
      source.src &&
      !video.src
    ) {

      video.src = source.src;

    }


    video.load();


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


  cards.forEach((card) => {

    const video =
      card.querySelector(".bunny-video");


    if (!video) return;


    /* Prevent duplicate listeners */

    if (card.dataset.videoInitialized) {
      return;
    }


    card.dataset.videoInitialized = "true";


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