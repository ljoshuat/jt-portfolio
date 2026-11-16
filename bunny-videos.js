/* =========================================================
   BUNNY VIDEOS
========================================================= */

function isHoverVideo(video) {

  return (
    video.classList.contains("bunny-hover") &&
    !video.hasAttribute("autoplay") &&
    !!video.closest(".video-card")
  );

}


/* Take the source off so nothing downloads,
   keeping it in data-src for later. */

function parkVideo(video) {

  if (video.dataset.parked) return;

  const sources = Array.from(
    video.querySelectorAll("source")
  );

  const url =
    video.getAttribute("src") ||
    (sources[0] && sources[0].getAttribute("src")) ||
    "";

  if (!url) return;

  video.dataset.parked = "true";
  video.dataset.src = url;
  video.preload = "none";

  sources.forEach((s) => {
    s.dataset.src = s.getAttribute("src") || "";
    s.removeAttribute("src");
  });

  video.removeAttribute("src");

  // Stops a download the page already started.
  video.load();

}


/* Put the source back and start loading. */

function unparkVideo(video) {

  if (!video.dataset.parked) return;

  delete video.dataset.parked;

  const sources = Array.from(
    video.querySelectorAll("source")
  );

  if (sources.length) {

    sources.forEach((s) => {
      if (s.dataset.src) s.setAttribute("src", s.dataset.src);
    });

  } else {

    video.setAttribute("src", video.dataset.src);

  }

  video.preload = "auto";
  video.load();

}


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
       HOVER VIDEOS WAIT

       The page HTML starts every card hover clip
       downloading (21 of them on a case study
       page, mostly 1080p), which starved the
       page's own autoplay videos: the Westlake
       studio mosaic sat on its first frame. The
       clips now give up their source until their
       card nears the viewport (see HOVER VIDEOS).
    ----------------------------------------- */

    if (isHoverVideo(video)) {

      parkVideo(video);

      return;

    }


    /* Autoplay videos get the bandwidth. */

    if (video.hasAttribute("autoplay")) {

      video.preload = "auto";

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

      const sources = Array.from(
        video.querySelectorAll("source")
      );

      const source =
        sources.find(
          (s) =>
            !s.media ||
            !window.matchMedia ||
            window.matchMedia(s.media).matches
        ) || sources[0];

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
       Hover videos load as their card nears the
       viewport, so the page doesn't download
       every one up front.
    ----------------------------------------- */

    const warm = () => {

      unparkVideo(video);

      return video
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

    };

    if ("IntersectionObserver" in window) {

      const io = new IntersectionObserver(
        (entries) => {

          if (entries.some((e) => e.isIntersecting)) {

            io.disconnect();
            warm();

          }

        },
        { rootMargin: "300px 0px" }
      );

      io.observe(card);

    } else {

      warm();

    }


    /* -----------------------------------------
       HOVER IN
    ----------------------------------------- */

    card.addEventListener(
      "mouseenter",
      () => {

        unparkVideo(video);

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


  nudgeAutoplay(container);

}


/* =========================================================
   AUTOPLAY NUDGE

   A muted autoplay video that was still loading
   when the browser tried to start it can sit
   paused on its first frame. Each one gets
   play() again when it has data and when it
   scrolls into view. Sliders, slideshows and the
   JT player run their own playback and are left
   alone.
========================================================= */

function nudgeAutoplay(container = document) {

  const SKIP =
    ".jt-player, [data-mouse-slider], [data-card-slideshow]";

  const tryPlay = (video) => {

    if (!video.paused || video.closest(SKIP)) return;

    video.muted = true;

    const p = video.play();

    if (p && p.catch) p.catch(() => {});

  };

  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) tryPlay(e.target);
            });
          },
          { threshold: 0.1 }
        )
      : null;

  container
    .querySelectorAll("video[autoplay]")
    .forEach((video) => {

      if (video.dataset.nudged) return;

      video.dataset.nudged = "true";

      ["loadeddata", "canplay"].forEach((ev) =>
        video.addEventListener(ev, () => tryPlay(video))
      );

      if (io) io.observe(video);

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