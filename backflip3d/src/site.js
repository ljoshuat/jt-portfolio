/* =========================================================
   BACKFLIP 3D (site build)
   Takes over canvas[data-backflip] in the About "How I Lead"
   track: a rigged 3D model of Josh flips as you scroll, drawn
   as accent lines with pen-tool anchors, camera swinging round.
   Keeps the old hooks: --bf-progress on the track, .is-active on
   [data-backflip-step], the [data-backflip-cue] scroll cue.
   If WebGL or the model fails, the 2D dot flip loads instead.
   Loaded by backflip-3d.js. Barba-safe.
========================================================= */
import { mount } from "./backflip-3d-core.js";

const cfg = window.__BF3D || {};
const PHASES = [[0], [0.2], [0.385], [0.745]];

function onProgress(p, track) {
  const steps = track.querySelectorAll("[data-backflip-step]");
  if (steps.length) {
    let idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
    if (steps.length === PHASES.length) PHASES.forEach(([at], i) => { if (p >= at) idx = i; });
    steps.forEach((el, i) => el.classList.toggle("is-active", i === idx));
  }
}

// Scroll cue, same rules as the 2D flip: [data-backflip-cue] gets .is-pinned
// while the track is pinned, and .is-on when the page rests at the start
// (before the first pass) or on the landing.
function cueFor(track) {
  const cue = track.querySelector("[data-backflip-cue]");
  if (!cue) return () => {};
  let started = false, timer = 0;
  const pinned = () => { const r = track.getBoundingClientRect(); return r.top <= 1 && r.bottom >= window.innerHeight - 1; };
  const prog = () => { const r = track.getBoundingClientRect(); const t = r.height - window.innerHeight; return t > 0 ? Math.min(1, Math.max(0, -r.top / t)) : 0; };
  const check = () => { const p = prog(); if (p > 0.04) started = true; cue.classList.toggle("is-on", pinned() && ((p <= 0.04 && !started) || p >= 0.985)); };
  const rest = () => { cue.classList.remove("is-on"); cue.classList.toggle("is-pinned", pinned()); clearTimeout(timer); timer = setTimeout(check, 900); };
  window.addEventListener("scroll", rest, { passive: true });
  rest();
  return () => { clearTimeout(timer); window.removeEventListener("scroll", rest); };
}

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { return false; }
}

let fellBack = false;
function fallback() {
  if (fellBack || !cfg.fallback) return;
  fellBack = true;
  // swap each 3D canvas for a fresh 2D one so the dot flip can claim it
  document.querySelectorAll("canvas[data-backflip]").forEach((c) => {
    if (c.__bf3d) return;
    const n = c.cloneNode(false);
    c.replaceWith(n);
  });
  const s = document.createElement("script");
  s.src = cfg.fallback;
  document.body.appendChild(s);
}

const live = [];
function init(scope) {
  const canvases = [...(scope || document).querySelectorAll("canvas[data-backflip]")];
  if (!canvases.length) return;
  if (!webglOK()) return fallback();
  canvases.forEach((c) => {
    if (c.__bf3d || c.__bf3dLoading) return;
    c.__bf3dLoading = true;
    // the 3D renderer needs a fresh canvas (a 2D context may already exist)
    let canvas = c;
    try { if (c.getContext && c.__backflip) { canvas = c.cloneNode(false); c.replaceWith(canvas); } } catch (e) {}
    const track = canvas.closest("[data-backflip-track]") || canvas.parentElement;
    // the corner phase label is retired (it read as a stock eyebrow)
    track.querySelectorAll("[data-backflip-phase]").forEach((el) => el.remove());
    mount(canvas, { src: cfg.glb, onProgress, mode: canvas.dataset.mode || "lines" })
      .then((api) => { const stopCue = cueFor(track); live.push({ destroy() { stopCue(); api.destroy(); } }); })
      .catch((err) => { console.warn("[backflip3d]", err); if (canvas.isConnected) fallback(); })
      .finally(() => { delete c.__bf3dLoading; });
  });
}
function destroyAll() { while (live.length) live.pop().destroy(); }

window.Backflip3D = { init, destroyAll, mount };
init();
if (typeof barba !== "undefined" && barba.hooks) {
  barba.hooks.before(() => destroyAll());
  barba.hooks.after((data) => init((data && data.next && data.next.container) || document));
}
