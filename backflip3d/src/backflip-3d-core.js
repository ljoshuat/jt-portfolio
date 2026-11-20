/* =========================================================
   BACKFLIP 3D DOTS
   A rigged 3D model of Josh does a backflip, drawn as halftone
   dots in --color--accent. Scroll through [data-backflip-track]
   drives both the flip and a camera that swings around him.

   Markup (same hooks as backflip.js):
   section[data-backflip-track]            (tall, e.g. 420vh)
     div (sticky)
       canvas[data-backflip3d]             data-src = GLB url
                                           data-spacing (default 4)
   Needs three (ESM) + GLTFLoader. Exposes window.Backflip3D.
========================================================= */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
// Scroll -> clip time. Gives the airborne part more of the scroll.
const TIME_KEYS = [[0, 0], [0.22, 0.3], [0.72, 0.6], [1, 1]];
function remap(p) {
  for (let i = 1; i < TIME_KEYS.length; i++) {
    const [p0, t0] = TIME_KEYS[i - 1], [p1, t1] = TIME_KEYS[i];
    if (p <= p1) return lerp(t0, t1, (p - p0) / (p1 - p0));
  }
  return 1;
}

const HALFTONE = {
  uniforms: {
    tScene: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },    // canvas size in device px
    uCell: { value: 8 },                         // dot spacing in device px
    uColor: { value: new THREE.Color("#d8f400") },
    uGain: { value: 1.9 },
    uInvert: { value: 0 },                       // 1 on light theme: darker = bigger dot
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tScene;
    uniform vec2 uRes;
    uniform float uCell;
    uniform vec3 uColor;
    uniform float uGain;
    uniform float uInvert;
    varying vec2 vUv;
    void main() {
      vec2 px = vUv * uRes;
      vec2 cell = floor(px / uCell);
      vec2 center = (cell + 0.5) * uCell;
      // the scene target is one texel per dot, so this is the cell's average
      vec4 s = texture2D(tScene, (cell + 0.5) / (uRes / uCell));
      float lum = dot(s.rgb, vec3(0.299, 0.587, 0.114));
      float t = clamp(pow(lum * uGain, 0.85), 0.0, 1.0);
      float v = mix(t, 0.06 + 0.8 * pow(1.0 - clamp(lum * 1.5, 0.0, 1.0), 1.3), uInvert);
      v = max(v, 0.2) * s.a;   // every covered cell keeps at least a small dot
      float r = sqrt(v) * uCell * 0.56;
      float d = length(px - center);
      float a = 1.0 - smoothstep(r - 0.75, r + 0.75, d);
      if (r < 0.35) a = 0.0;
      gl_FragColor = vec4(uColor * a, a);
    }
  `,
};

const EDGES = {
  uniforms: { tN: { value: null }, tP: { value: null }, uOp: { value: 0 }, uPx: { value: new THREE.Vector2(1, 1) }, uW: { value: 1 }, uCont: { value: 0 }, uColor: { value: new THREE.Color("#d8f400") } },
  vertexShader: HALFTONE.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tN;
    uniform sampler2D tP;
    uniform float uOp;
    uniform vec2 uPx;
    uniform float uW;
    uniform float uCont;
    uniform vec3 uColor;
    varying vec2 vUv;
    // uPx is one texel of the 2x supersampled normal buffer
    vec4 S(vec2 uv) { return texture2D(tN, uv); }
    float edgeAt(vec2 uv) {
      vec4 c = S(uv);
      vec4 r = S(uv + vec2(uPx.x * uW, 0.0)), u = S(uv + vec2(0.0, uPx.y * uW));
      float sil = max(abs(c.a - r.a), abs(c.a - u.a));
      float m = min(c.a, min(r.a, u.a));
      float crease = (length(c.rgb - r.rgb) + length(c.rgb - u.rgb)) * 1.4 * m;
      float e = max(sil, smoothstep(0.12, 0.32, crease));
      if (uCont > 0.0) {
        // cross-contours: faint iso-lines of the shading that wrap round the form
        vec3 L = normalize(vec3(-0.45, 0.75, 0.5));
        float k = 6.0;
        float bc = floor(dot(c.rgb * 2.0 - 1.0, L) * k);
        float br = floor(dot(r.rgb * 2.0 - 1.0, L) * k);
        float bu = floor(dot(u.rgb * 2.0 - 1.0, L) * k);
        float iso = (bc != br || bc != bu) ? 1.0 : 0.0;
        e = max(e, iso * 0.45 * uCont * m);
      }
      return e;
    }
    void main() {
      // average a 3x3 grid of sub-samples across the output pixel: smooth, anti-aliased lines
      vec2 h = uPx * 0.67;
      float e = 0.0;
      for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) e += edgeAt(vUv + vec2(float(i), float(j)) * h);
      e = clamp(e / 9.0 * 1.6, 0.0, 1.0);
      vec4 photo = vec4(0.0);
      if (uOp > 0.0) { vec4 t = texture2D(tP, vUv); photo = vec4(pow(t.rgb, vec3(1.0 / 2.2)), t.a) * uOp; }
      gl_FragColor = mix(photo, vec4(uColor, 1.0), e);
    }
  `,
};

function accentOf(el) {
  return getComputedStyle(el).getPropertyValue("--color--accent").trim() || "#d8f400";
}

export async function mount(canvas, opts = {}) {
  if (canvas.__bf3d) return canvas.__bf3d;
  const track = canvas.closest("[data-backflip-track]") || canvas.parentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  // Gray, matte look: the texture only feeds brightness.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x505050, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(-2.5, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(3, 2, -3);
  scene.add(rim);
  // Soft light from the camera so the far leg and dark shorts never drop out
  const fill = new THREE.DirectionalLight(0xffffff, 0.9);
  fill.position.set(0, 0.3, 1);
  camera.add(fill);
  scene.add(camera);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // A page can hand over the GLB bytes directly (canvas.glbBuffer) instead of a URL.
  const gltf = canvas.glbBuffer
    ? await loader.parseAsync(canvas.glbBuffer, "")
    : await loader.loadAsync(opts.src || canvas.dataset.src);
  if (!canvas.isConnected) { renderer.dispose(); throw new Error("backflip3d: canvas left the page"); }
  const model = gltf.scene;
  // Two looks per mesh: textured (feeds the dots, and the Photo style) and a
  // single-color sculpt in the accent (Solid style).
  const meshes = [];
  const solidMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05 });
  model.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      const m = o.material;
      o.userData.texMat = new THREE.MeshLambertMaterial({ map: m.map || null, color: m.color || 0xffffff });
      o.material = o.userData.texMat;
      meshes.push(o);
    }
  });
  scene.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const clip = gltf.animations[0];
  const action = clip ? mixer.clipAction(clip) : null;
  if (action) { action.play(); action.paused = true; }
  const duration = clip ? clip.duration : 1;
  // Clip window used for the scroll (set after inspecting the clip).
  const T0 = parseFloat(canvas.dataset.t0 || 0) * duration;
  const T1 = parseFloat(canvas.dataset.t1 || 1) * duration;

  // Hip bone for camera follow
  let hips = null;
  model.traverse((o) => { if (!hips && o.isBone && /hip|pelvis/i.test(o.name)) hips = o; });
  const hipPos = new THREE.Vector3();
  const follow = new THREE.Vector3();
  let followInit = false;

  // Low-res target: one texel per dot
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const post = new THREE.ShaderMaterial({ ...HALFTONE, uniforms: THREE.UniformsUtils.clone(HALFTONE.uniforms), transparent: true, depthTest: false });
  post.uniforms.tScene.value = rt.texture;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
  const postScene = new THREE.Scene();
  postScene.add(quad);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const state = { progress: reduce ? 0.62 : 0, spacing: parseFloat(canvas.dataset.spacing) || 4, mode: opts.mode || canvas.dataset.mode || "lines", w: 0, h: 0 };

  // ---- Vector style: contour lines + pen-tool anchors on the joints ----
  const normalMat = new THREE.MeshNormalMaterial();
  const rtN = new THREE.WebGLRenderTarget(1, 1);
  const edges = new THREE.ShaderMaterial({ ...EDGES, uniforms: THREE.UniformsUtils.clone(EDGES.uniforms), transparent: true, depthTest: false });
  edges.uniforms.tN.value = rtN.texture;
  const rtP = new THREE.WebGLRenderTarget(1, 1);
  rtP.texture.colorSpace = THREE.SRGBColorSpace;
  edges.uniforms.tP.value = rtP.texture;
  const edgeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edges);
  const edgeScene = new THREE.Scene();
  edgeScene.add(edgeQuad);
  const overlay = document.createElement("canvas");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;";
  canvas.insertAdjacentElement("afterend", overlay);
  const ctx = overlay.getContext("2d");
  // Sit the overlay exactly on the canvas, whatever the parent's layout
  function placeOverlay() {
    const st = overlay.style;
    st.left = canvas.offsetLeft + "px"; st.top = canvas.offsetTop + "px";
    st.width = canvas.offsetWidth + "px"; st.height = canvas.offsetHeight + "px";
  }
  const bone = {};
  model.traverse((o) => { if (o.isBone) bone[o.name] = o; });
  // chains: each anchor's handles follow the line from its previous to its next joint
  const CHAINS = [
    ["Hips", "Spine01", "Spine02", "neck", "Head", "head_end"],
    ["neck", "LeftArm", "LeftForeArm", "LeftHand"],
    ["neck", "RightArm", "RightForeArm", "RightHand"],
    ["Hips", "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase"],
    ["Hips", "RightUpLeg", "RightLeg", "RightFoot", "RightToeBase"],
  ];
  const SKIP = new Set(["Spine01", "head_end"]);
  const v3 = new THREE.Vector3();
  function project(name) {
    const b = bone[name]; if (!b) return null;
    b.getWorldPosition(v3).project(camera);
    return [(v3.x * 0.5 + 0.5) * state.w, (-v3.y * 0.5 + 0.5) * state.h];
  }
  function drawAnchors(col) {
    const dpr = renderer.getPixelRatio();
    if (overlay.width !== Math.round(state.w * dpr) || overlay.height !== Math.round(state.h * dpr)) {
      overlay.width = Math.round(state.w * dpr); overlay.height = Math.round(state.h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, state.w, state.h);
    const stroke = "#" + col.getHexString();
    const fill = getComputedStyle(document.body).backgroundColor || "#0b1013";
    const pts = {}; const minmax = [Infinity, Infinity, -Infinity, -Infinity];
    const anchors = [];
    CHAINS.forEach((ch) => {
      const P = ch.map(project);
      P.forEach((p, i) => {
        if (!p) return;
        pts[ch[i]] = p;
        minmax[0] = Math.min(minmax[0], p[0]); minmax[1] = Math.min(minmax[1], p[1]);
        minmax[2] = Math.max(minmax[2], p[0]); minmax[3] = Math.max(minmax[3], p[1]);
        if (i === 0 || SKIP.has(ch[i])) return;
        const a = P[i - 1], b = P[i + 1] || null;
        let tx = (b ? b[0] : p[0]) - a[0], ty = (b ? b[1] : p[1]) - a[1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const dPrev = Math.hypot(p[0] - a[0], p[1] - a[1]);
        const dNext = b ? Math.hypot(b[0] - p[0], b[1] - p[1]) : dPrev;
        const h = Math.max(6, Math.min(dPrev, dNext) * 0.32);
        anchors.push({ p, tx, ty, h, end: !b });
      });
    });
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = stroke;
    // pen paths: smooth bezier curves through every chain, using the same handles
    ctx.globalAlpha = 0.8;
    CHAINS.forEach((ch) => {
      const P = ch.map((n) => pts[n]).filter(Boolean);
      if (P.length < 2) return;
      const T = P.map((p, i) => {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
        let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1;
        return [tx / l, ty / l];
      });
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      for (let i = 0; i < P.length - 1; i++) {
        const d = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) * 0.36;
        ctx.bezierCurveTo(P[i][0] + T[i][0] * d, P[i][1] + T[i][1] * d, P[i + 1][0] - T[i + 1][0] * d, P[i + 1][1] - T[i + 1][1] * d, P[i + 1][0], P[i + 1][1]);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // handles
    anchors.forEach(({ p, tx, ty, h, end }) => {
      const a = end ? [p[0], p[1]] : [p[0] - tx * h, p[1] - ty * h];
      const b = [p[0] + tx * h, p[1] + ty * h];
      if (end) { a[0] = p[0] - tx * h; a[1] = p[1] - ty * h; }
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      [a, b].forEach((q) => { ctx.beginPath(); ctx.arc(q[0], q[1], 2.4, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); });
    });
    // anchor boxes; the hips anchor reads as the selected point
    anchors.forEach(({ p }, i) => {
      const s = 6;
      ctx.fillStyle = fill;
      ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
      ctx.strokeRect(p[0] - s / 2 + 0.5, p[1] - s / 2 + 0.5, s - 1, s - 1);
    });
    if (pts.Hips) { const p = pts.Hips, s = 7; ctx.fillStyle = stroke; ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); }
    // selection box with corner and edge handles
    const pad = 30;
    // keep the box and its 6px handles inside the canvas so nothing gets clipped
    const m = 5;
    const x0 = Math.max(m, minmax[0] - pad), y0 = Math.max(m, minmax[1] - pad - 10);
    const x1 = Math.min(state.w - m - 1, minmax[2] + pad), y1 = Math.min(state.h - m - 1, minmax[3] + pad);
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(x1 - x0), Math.round(y1 - y0));
    ctx.globalAlpha = 1;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    [[x0, y0], [mx, y0], [x1, y0], [x1, my], [x1, y1], [mx, y1], [x0, y1], [x0, my]].forEach(([x, y]) => {
      ctx.fillStyle = fill; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 7, 7);
      ctx.strokeRect(Math.round(x) - 2.5, Math.round(y) - 2.5, 6, 6);
    });
  }

  let camLift = -1;
  function resize() {
    camLift = -1;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    state.w = Math.max(1, Math.round(r.width));
    state.h = Math.max(1, Math.round(r.height));
    placeOverlay();
    renderer.setPixelRatio(dpr);
    renderer.setSize(state.w, state.h, false);
    const cell = state.spacing * dpr;
    post.uniforms.uCell.value = cell;
    post.uniforms.uRes.value.set(state.w * dpr, state.h * dpr);
    rt.setSize(Math.ceil((state.w * dpr) / cell), Math.ceil((state.h * dpr) / cell));
    camera.aspect = state.w / state.h;
    camera.updateProjectionMatrix();
    draw();
  }

  function readProgress() {
    if (reduce) return;
    const r = track.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    state.progress = clamp(-r.top / (total || 1));
    track.style.setProperty("--bf-progress", state.progress.toFixed(4));
    if (opts.onProgress) opts.onProgress(state.progress, track);
  }

  function draw() {
    const p = state.progress;
    if (action) { action.time = lerp(T0, T1, remap(p)); mixer.update(0); }
    model.updateMatrixWorld(true);

    if (hips) hips.getWorldPosition(hipPos); else hipPos.set(0, 1, 0);
    const target = new THREE.Vector3(hipPos.x * 0.7, lerp(1.0, hipPos.y, 0.45) + 0.1, hipPos.z * 0.7);
    follow.copy(target);

    // Camera swings from his side (profile) round to a three-quarter front
    const a = ease(clamp(p));
    const az = THREE.MathUtils.degToRad(lerp(parseFloat(canvas.dataset.az0 ?? 90), parseFloat(canvas.dataset.az1 ?? 25), a));
    const el = THREE.MathUtils.degToRad(lerp(6, 14, Math.sin(Math.PI * a)));
    const portrait = state.h > state.w;
    const dist = portrait ? 5.2 : 5.4;
    camera.position.set(
      follow.x + Math.sin(az) * Math.cos(el) * dist,
      follow.y + Math.sin(el) * dist,
      follow.z + Math.cos(az) * Math.cos(el) * dist,
    );
    camera.lookAt(follow);
    // On tall (phone) stages sit the figure a little higher in the frame
    const lift = portrait ? Math.round(state.h * 0.05) : 0;
    if (lift !== camLift) {
      camLift = lift;
      if (lift) camera.setViewOffset(state.w, state.h, 0, lift, state.w, state.h); else camera.clearViewOffset();
    }

    const col = post.uniforms.uColor.value.set(accentOf(canvas));
    post.uniforms.uInvert.value = (0.299 * col.r + 0.587 * col.g + 0.114 * col.b) < 0.35 ? 1 : 0;
    const vector = state.mode === "lines" || state.mode === "overlay" || state.mode === "clean" || state.mode === "contour";
    const bare = state.mode === "clean" || state.mode === "contour";
    overlay.style.display = vector && !bare ? "" : "none";
    if (vector) {
      const dpr = renderer.getPixelRatio();
      const W = Math.round(state.w * dpr), H = Math.round(state.h * dpr);
      if (rtP.width !== W || rtP.height !== H) { rtN.setSize(W * 2, H * 2); rtP.setSize(W, H); }
      const withPhoto = state.mode === "overlay";
      edges.uniforms.uOp.value = withPhoto ? 0.6 : 0;
      if (withPhoto) {
        meshes.forEach((o) => (o.material = o.userData.texMat));
        renderer.setRenderTarget(rtP); renderer.clear();
        renderer.render(scene, camera);
      }
      edges.uniforms.uPx.value.set(1 / (W * 2), 1 / (H * 2));
      edges.uniforms.uW.value = 1.5;
      edges.uniforms.uCont.value = state.mode === "contour" ? 1 : 0;
      edges.uniforms.uColor.value.copy(col);
      scene.overrideMaterial = normalMat;
      renderer.setRenderTarget(rtN); renderer.setClearColor(0x000000, 0); renderer.clear();
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      renderer.setRenderTarget(null); renderer.clear();
      renderer.render(edgeScene, postCam);
      if (!bare) drawAnchors(col);
      return;
    }
    if (state.mode !== "dots") {
      const solid = state.mode === "solid";
      if (solid) solidMat.color.copy(col).multiplyScalar(0.5);
      meshes.forEach((o) => (o.material = solid ? solidMat : o.userData.texMat));
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(scene, camera);
      return;
    }
    meshes.forEach((o) => (o.material = o.userData.texMat));
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(postScene, postCam);
  }

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; readProgress(); draw(); });
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  window.addEventListener("scroll", onScroll, { passive: true });
  const mo = new MutationObserver(() => draw());
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  readProgress();
  resize();

  const api = {
    clipDuration: duration,
    setProgress(p) { state.progress = clamp(p); draw(); },
    setSpacing(s) { state.spacing = s; resize(); },
    setMode(m) { state.mode = m; draw(); },
    destroy() {
      ro.disconnect(); mo.disconnect(); window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf); overlay.remove();
      renderer.dispose(); rt.dispose(); rtN.dispose(); rtP.dispose(); delete canvas.__bf3d;
    },
  };
  canvas.__bf3d = api;
  return api;
}

