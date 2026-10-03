/* =========================================================
   JT VIDEO PLAYER

   Works with any .jt-player embed on any page.
   Uses event delegation on the document, so it keeps
   working after Barba page transitions with no re-init.
========================================================= */

(() => {

  if (window.jtVideoPlayer) return;

  window.jtVideoPlayer = true;


  const IDLE_MS = 2500;


  /* -----------------------------------------
     HELPERS
  ----------------------------------------- */

  function formatTime(seconds) {

    if (!isFinite(seconds)) return "0:00";

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    return m + ":" + String(s).padStart(2, "0");

  }


  function part(player, name) {

    return player.querySelector('[data-jt="' + name + '"]');

  }


  /* -----------------------------------------
     SET UP A PLAYER ON FIRST PLAY
  ----------------------------------------- */

  function setup(player) {

    if (player.jt) return player.jt;

    const video = player.querySelector(".jt-player_video");

    if (!video.src && player.dataset.src) {
      video.src = player.dataset.src;
    }

    const fill = part(player, "fill");
    const buffer = part(player, "buffer");
    const track = part(player, "track");
    const current = part(player, "current");
    const duration = part(player, "duration");

    let idleTimer;


    function wake() {

      player.classList.add("is-active");

      clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        player.classList.remove("is-active");
      }, IDLE_MS);

    }


    function render() {

      const pct = video.duration
        ? (video.currentTime / video.duration) * 100
        : 0;

      fill.style.width = pct + "%";
      current.textContent = formatTime(video.currentTime);
      track.setAttribute("aria-valuenow", Math.round(pct));

    }


    video.addEventListener("loadedmetadata", () => {
      duration.textContent = formatTime(video.duration);
    });

    video.addEventListener("timeupdate", render);

    video.addEventListener("progress", () => {

      if (!video.duration || !video.buffered.length) return;

      const end = video.buffered.end(video.buffered.length - 1);

      buffer.style.width = (end / video.duration) * 100 + "%";

    });

    video.addEventListener("play", () => {
      player.classList.remove("is-paused");
      part(player, "toggle").setAttribute("aria-label", "Pause");
      wake();
    });

    video.addEventListener("pause", () => {
      player.classList.add("is-paused");
      part(player, "toggle").setAttribute("aria-label", "Play");
    });

    /* Back to the cover and play button when it ends */

    video.addEventListener("ended", () => {
      clearTimeout(idleTimer);
      player.classList.remove("is-started", "is-active");
      player.classList.add("is-paused");
      video.currentTime = 0;
      render();
    });

    video.addEventListener("volumechange", () => {
      player.classList.toggle("is-muted", video.muted);
      part(player, "mute").setAttribute(
        "aria-label",
        video.muted ? "Unmute" : "Mute"
      );
    });


    /* ---------- SCRUBBING ---------- */

    function seekTo(clientX) {

      const rect = track.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);

      if (video.duration) {
        video.currentTime = ratio * video.duration;
        render();
      }

    }

    track.addEventListener("pointerdown", (e) => {

      player.classList.add("is-seeking");
      track.setPointerCapture(e.pointerId);
      seekTo(e.clientX);

    });

    track.addEventListener("pointermove", (e) => {

      if (player.classList.contains("is-seeking")) {
        seekTo(e.clientX);
      }

    });

    track.addEventListener("pointerup", () => {
      player.classList.remove("is-seeking");
    });

    track.addEventListener("keydown", (e) => {

      if (e.key === "ArrowRight") video.currentTime += 5;
      if (e.key === "ArrowLeft") video.currentTime -= 5;

    });


    /* ---------- SHOW / HIDE CONTROLS ---------- */

    player.addEventListener("pointermove", wake);
    player.addEventListener("pointerdown", wake);

    player.addEventListener("pointerleave", () => {
      clearTimeout(idleTimer);
      player.classList.remove("is-active");
    });


    player.jt = { video, wake };

    return player.jt;

  }


  /* -----------------------------------------
     CLICKS
  ----------------------------------------- */

  document.addEventListener("click", (e) => {

    const player = e.target.closest(".jt-player");

    if (!player) return;

    const { video } = setup(player);


    /* First play from the cover */

    if (e.target.closest(".jt-player_big-play")) {

      player.classList.add("is-started");
      video.muted = false;
      video.play().catch(() => {});

      return;

    }


    const action = e.target.closest("[data-jt]");
    const name = action && action.dataset.jt;


    if (name === "toggle") {

      video.paused ? video.play() : video.pause();

    } else if (name === "mute") {

      video.muted = !video.muted;

    } else if (name === "fullscreen") {

      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }

    } else if (!e.target.closest(".jt-player_controls")) {

      /* Click on the video itself toggles play */

      video.paused ? video.play() : video.pause();

    }

  });


  /* -----------------------------------------
     SPACE BAR WHEN THE PLAYER HAS FOCUS
  ----------------------------------------- */

  document.addEventListener("keydown", (e) => {

    if (e.key !== " ") return;

    const player = e.target.closest && e.target.closest(".jt-player");

    if (!player || !player.jt || e.target.closest("button")) return;

    e.preventDefault();

    const { video } = player.jt;

    video.paused ? video.play() : video.pause();

  });


  /* -----------------------------------------
     PAUSE WHEN LEAVING THE PAGE
     (tab hidden, or a Barba page transition)
  ----------------------------------------- */

  function pauseAll() {

    document.querySelectorAll(".jt-player.is-started").forEach((player) => {
      if (player.jt) player.jt.video.pause();
    });

  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAll();
  });

  function hookBarba() {

    if (window.barba && barba.hooks) {
      barba.hooks.beforeLeave(pauseAll);
    }

  }

  if (document.readyState === "complete") {
    hookBarba();
  } else {
    window.addEventListener("load", hookBarba, { once: true });
  }

})();
