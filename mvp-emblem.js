// MVP Edition emblem: chrome 3D badge (three.js), transparent background.
// Add an empty div with data-mvp-emblem to a page and give it a size (3:1 frames it well).
// Options as attributes: data-auto-rotate="false", data-interactive="false".
// three.js is only downloaded on pages that have an emblem.
(() => {
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
  const ORBIT_URL = "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/controls/OrbitControls.js/+esm";
  let libPromise = null;
  let mounted = [];

  function loadLib() {
    if (!libPromise) {
      libPromise = Promise.all([import(THREE_URL), import(ORBIT_URL)]).then(
        ([THREE, orbit]) => createMount(THREE, orbit.OrbitControls)
      );
    }
    return libPromise;
  }

  function createMount(THREE, OrbitControls) {
    function buildEmblem() {
      // Source SVG paths (viewBox 756 x 81)
      const PLATE = "M743.59,81H12.41c-3.91,0-7.85-2.81-8.63-6.31-5.04-22.57-5.04-45.81,0-68.38C4.56,2.81,8.51,0,12.41,0h731.17c3.910,0,7.85,2.81,8.63,6.31,5.04,22.57,5.04,45.81,0,68.38-.78,3.5-4.73,6.31-8.63,6.31Z";
      const PANEL = "M734.35,75.45H21.67l-10.35-10.35V15.9c4.04-4.04,6.31-6.31,10.35-10.35h712.68c4.04,4.04,6.31,6.31,10.35,10.35v49.21c-4.04,4.04-6.31,6.31-10.35,10.35Z";
      const MVP = [
        "M32.25,60.66V18.61h24.77l20.81,19.87,20.55-19.870h24.17v42.05h-25.71v-25.37l-19.01,18.32-19.35-18.32v25.37h-26.23Z",
        "M190.74,60.66h-32.59l-27.26-42.05h26.23l17.8,27.43,16.51-27.43h25.8l-26.49,42.05Z",
        "M251.37,60.66h-25.71V18.61h66.48c5.9,0,10.16,1.32,12.77,3.96,2.61,2.64,3.91,5.85,3.91,9.63-.06,3.38-1.55,6.25-4.470,8.6-2.92,2.35-6.97,3.530-12.13,3.53h-39.22l8-8.26h19.09c1.32,0,2.290-.4,2.92-1.2.63-.8.95-1.69.95-2.67s-.32-1.86-.95-2.67c-.63-.8-1.61-1.2-2.92-1.2h-28.72v32.34Z"
      ];
      const EDITION = [
        "M328.54,52.54v-22.83h24.5v4.03h-18.88v4.98h11v3.93h-11v5.62h19.17v4.27h-24.79Z",
        "M393.77,52.54v-22.83h15.37c4.41,0,7.8.98,10.16,2.94,2.36,1.96,3.55,4.76,3.55,8.4,0,3.830-1.25,6.71-3.76,8.62-2.5,1.92-6.29,2.87-11.35,2.87h-13.97ZM399.39,48.27h7.17c3.92,0,6.66-.57,8.23-1.71,1.56-1.14,2.35-3.07,2.35-5.77,0-2.36-.65-4.11-1.95-5.26-1.3-1.15-3.3-1.73-5.99-1.73h-9.81v14.48Z",
        "M463.64,52.54v-22.83h5.54v22.83h-5.54Z",
        "M525.36,33.79v18.75h-5.56v-18.75h-11.02v-4.09h27.63v4.09h-11.05Z",
        "M576,52.54v-22.83h5.54v22.83h-5.54Z",
        "M623.56,35.09c0-2.07.4-3.49,1.21-4.25.81-.76,2.38-1.13,4.72-1.13h17.67c2.36,0,3.93.38,4.73,1.13.8.76,1.2,2.17,1.2,4.25v12.05c0,2.09-.41,3.52-1.23,4.27-.82.76-2.39,1.13-4.71,1.13h-17.67c-2.34,0-3.91-.38-4.72-1.130-.81-.76-1.21-2.18-1.21-4.27v-12.05ZM629.13,48.16h18.4v-14.26h-18.4v14.26Z",
        "M695.12,52.54v-22.83h3.82l19.38,15.16v-15.16h5.04v22.83h-3.85l-19.33-15.4v15.4h-5.06Z"
      ];
      const DOTS = [[11.32,7.07],[11.32,74.34],[744.7,7.07],[744.7,74.34]];
      
      // Real-world size: 300 mm wide badge
      const S = 0.30 / 756, CX = 378, CY = 40.5;
      const X = x => (x - CX) * S, Y = y => (CY - y) * S;
      
      // Minimal SVG path parser → array of THREE.Path subpaths
      function parse(d) {
        const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g);
        const subs = []; let p = null, i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lc = null;
        const n = () => parseFloat(toks[i++]);
        const isNum = () => i < toks.length && !/[a-zA-Z]/.test(toks[i]);
        while (i < toks.length) {
          if (!isNum()) cmd = toks[i++];
          const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
          const ox = rel ? x : 0, oy = rel ? y : 0;
          if (C === 'M') { x = n() + ox; y = n() + oy; p = new THREE.Path(); p.moveTo(X(x), Y(y)); subs.push(p); sx = x; sy = y; cmd = rel ? 'l' : 'L'; lc = null; }
          else if (C === 'L') { x = n() + ox; y = n() + oy; p.lineTo(X(x), Y(y)); lc = null; }
          else if (C === 'H') { x = n() + ox; p.lineTo(X(x), Y(y)); lc = null; }
          else if (C === 'V') { y = n() + oy; p.lineTo(X(x), Y(y)); lc = null; }
          else if (C === 'C' || C === 'S') {
            let x1, y1;
            if (C === 'C') { x1 = n() + ox; y1 = n() + oy; }
            else { x1 = lc ? 2 * x - lc[0] : x; y1 = lc ? 2 * y - lc[1] : y; }
            const x2 = n() + ox, y2 = n() + oy, ex = n() + ox, ey = n() + oy;
            p.bezierCurveTo(X(x1), Y(y1), X(x2), Y(y2), X(ex), Y(ey));
            lc = [x2, y2]; x = ex; y = ey;
          }
          else if (C === 'Z') { p.lineTo(X(sx), Y(sy)); x = sx; y = sy; lc = null; }
        }
        return subs;
      }
      function shapeFrom(d) {
        const [outer, ...holes] = parse(d);
        const s = new THREE.Shape(outer.getPoints(24));
        holes.forEach(h => s.holes.push(new THREE.Path(h.getPoints(24))));
        return s;
      }
      
      const mat = {
        black: new THREE.MeshStandardMaterial({ name: 'chrome_satin', color: 0xD8DEF0, roughness: 0.2, metalness: 1.0 }),
        letter: new THREE.MeshStandardMaterial({ name: 'chrome', color: 0xF2F5FF, roughness: 0.03, metalness: 1.0 }),
        green: new THREE.MeshPhysicalMaterial({ name: 'black_enamel', color: 0x03050c, roughness: 0.5, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.06 }),
        dark: new THREE.MeshStandardMaterial({ name: 'back_black', color: 0x111111, roughness: 0.6, metalness: 0.0 }),
      };
      
      const model = new THREE.Group(); model.name = 'mvp_edition_emblem';
      const T_PLATE = 0.005, B = 0.0008;              // plate thickness + bevel
      const zFront = T_PLATE / 2 + B;
      
      // Plate (centered on z)
      const plateGeo = new THREE.ExtrudeGeometry(shapeFrom(PLATE), { depth: T_PLATE, bevelEnabled: true, bevelThickness: B, bevelSize: B, bevelSegments: 4, curveSegments: 32 });
      plateGeo.translate(0, 0, -T_PLATE / 2);
      const plate = new THREE.Mesh(plateGeo, mat.black); plate.name = 'plate'; model.add(plate);
      
      // Raised green panel
      const T_PANEL = 0.0012;
      const panelGeo = new THREE.ExtrudeGeometry(shapeFrom(PANEL), { depth: T_PANEL, bevelEnabled: true, bevelThickness: 0.0003, bevelSize: 0.0003, bevelSegments: 2 });
      panelGeo.translate(0, 0, zFront - 0.0002);
      const panel = new THREE.Mesh(panelGeo, mat.green); panel.name = 'panel'; model.add(panel);
      const zPanel = zFront - 0.0002 + T_PANEL + 0.0003;
      
      // Embossed lettering
      function letters(list, name, depth) {
        const g = new THREE.Group(); g.name = name;
        list.forEach((d, k) => {
          const geo = new THREE.ExtrudeGeometry(shapeFrom(d), { depth, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0003, bevelSegments: 4 });
          geo.translate(0, 0, zPanel - 0.0003);
          const m = new THREE.Mesh(geo, mat.letter); m.name = `${name}_${k + 1}`; g.add(m);
        });
        model.add(g);
      }
      letters(MVP, 'lettering_mvp', 0.0018);
      letters(EDITION, 'lettering_edition', 0.0012);
      
      // Corner rivets
      DOTS.forEach(([dx, dy], k) => {
        const r = 2.77 * S;
        const geo = new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        geo.rotateX(Math.PI / 2);
        geo.scale(1, 1, 0.55);
        const m = new THREE.Mesh(geo, mat.letter); m.name = `rivet_${k + 1}`;
        m.position.set(X(dx), Y(dy), zFront - 0.0001);
        model.add(m);
      });
      
      // Back face: dark panel inset so the reverse reads finished
      const backGeo = new THREE.ExtrudeGeometry(shapeFrom(PANEL), { depth: 0.0004, bevelEnabled: false });
      backGeo.translate(0, 0, -zFront - 0.0003);
      const back = new THREE.Mesh(backGeo, mat.dark); back.name = 'back_panel'; model.add(back);
      
      
      return { model, mat };
    }

    // Off-screen studio for chrome reflections only (never visible)
    function buildEnv(renderer) {
      const env = new THREE.Scene();
      env.background = new THREE.Color(0x000000);
      const plane = (w, h, x, y, z, hex, k) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
      };
      // Large gradient card behind the camera: flat chrome faces mirror this (bright sky, dark horizon, cool floor)
      {
        const cv = document.createElement('canvas'); cv.width = 16; cv.height = 512;
        const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
        gr.addColorStop(0.00, '#f2f5ff'); gr.addColorStop(0.16, '#7486b8');
        gr.addColorStop(0.26, '#121a30'); gr.addColorStop(0.32, '#020306'); gr.addColorStop(0.40, '#33427a');
        gr.addColorStop(0.52, '#d4ddf6'); gr.addColorStop(0.62, '#5e72b0'); gr.addColorStop(0.78, '#141c3a'); gr.addColorStop(1.00, '#03040a');
        g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
        const card = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.6), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
        card.position.set(-0.25, 0.05, 1.4); card.lookAt(0, 0.05, 0); card.rotateZ(-0.06); env.add(card);
      }
      plane(4, 0.5, 0, 1.4, 1.2, 0xffffff, 14);      // top softbox: hard highlight along upper edges
      plane(0.18, 2.4, -1.6, 0.3, 1.0, 0xffffff, 10); // left strip
      plane(0.12, 2.4, 1.9, 0.2, 0.6, 0xc4d0ff, 3);   // right strip (dimmer, for falloff)
      plane(3, 2, -2.4, 0.2, -1.2, 0x6a6cff, 1.8);    // blue-violet kicker
      plane(3, 2, 2.4, 0.2, -1.2, 0x2f6bff, 2.4);     // blue kicker
      plane(5, 0.4, 0, -1.1, 1.4, 0x4a5fa8, 0.9);     // low floor bounce
      const pmrem = new THREE.PMREMGenerator(renderer);
      const tex = pmrem.fromScene(env, 0.01).texture;
      pmrem.dispose();
      return tex;
    }

    function mountEmblem(container, { autoRotate = true, interactive = true, pixelRatio = 2 } = {}) {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const { model, mat } = buildEmblem();
      const envTex = buildEnv(renderer);
      Object.values(mat).forEach(m => { m.envMap = envTex; });
      mat.black.envMapIntensity = 1.2; mat.letter.envMapIntensity = 2.0;
      mat.green.envMapIntensity = 0.9; mat.dark.envMapIntensity = 0.3;
      new THREE.Box3().setFromObject(model).getCenter(model.position).negate();
      scene.add(model);
      const key = new THREE.DirectionalLight(0xeef2ff, 3.2); key.position.set(-0.9, 1.0, 0.6); scene.add(key);
      const rimA = new THREE.DirectionalLight(0x7a7cff, 2.4); rimA.position.set(-1, 0.2, -0.5); scene.add(rimA);
      const rimB = new THREE.DirectionalLight(0x3a72ff, 2.8); rimB.position.set(1, -0.3, -0.3); scene.add(rimB);

      const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
      const controls = new OrbitControls(camera, renderer.domElement);
      renderer.domElement.style.touchAction = 'pan-y'; // keep vertical page scroll on touch
      controls.enableDamping = true;
      controls.enableZoom = false; controls.enablePan = false;
      controls.enabled = interactive;
      controls.minAzimuthAngle = -0.35; controls.maxAzimuthAngle = 0.35;
      controls.minPolarAngle = Math.PI * 0.42; controls.maxPolarAngle = Math.PI * 0.58;
      controls.rotateSpeed = 0.4;

      const fit = () => {
        const w = container.clientWidth || 1, h = container.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        const halfW = 0.165, halfH = 0.03;
        const vFov = camera.fov * Math.PI / 180, hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const d = Math.max(halfW / Math.tan(hFov / 2), halfH / Math.tan(vFov / 2)) * 1.15;
        const dir = camera.position.lengthSq() ? camera.position.clone().normalize() : new THREE.Vector3(0, 0.04, 1).normalize();
        camera.position.copy(dir.multiplyScalar(d));
        controls.update();
      };
      const ro = new ResizeObserver(fit); ro.observe(container); fit();

      let raf = 0, visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(container);
      const timer = new THREE.Timer();
      const tick = () => {
        raf = requestAnimationFrame(tick); if (!visible) return;
        timer.update(); const t = timer.getElapsed();
        if (autoRotate) { model.rotation.y = Math.sin(t * 0.45) * 0.22; model.rotation.x = Math.sin(t * 0.3) * 0.05; }
        controls.update(); renderer.render(scene, camera);
      };
      tick();

      return {
        dispose() {
          cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose();
          scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
          Object.values(mat).forEach(m => m.dispose()); envTex.dispose();
          renderer.dispose(); renderer.domElement.remove();
        },
      };
    }

    return mountEmblem;
  }

  // Barba removes the old page after the transition; free emblems no longer in the DOM.
  function destroyEmblems(all = true) {
    mounted = mounted.filter(({ el, emblem }) => {
      if (!all && el.isConnected) return true;
      emblem.dispose();
      delete el.dataset.emblemReady;
      return false;
    });
  }

  function initEmblems(root = document) {
    const els = [...root.querySelectorAll("[data-mvp-emblem]")].filter(
      (el) => !el.dataset.emblemReady
    );
    if (!els.length) return;
    els.forEach((el) => (el.dataset.emblemReady = "true"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    loadLib()
      .then((mountEmblem) => {
        els.forEach((el) => {
          if (!el.isConnected) return;
          const emblem = mountEmblem(el, {
            autoRotate: !reduced && el.dataset.autoRotate !== "false",
            interactive: el.dataset.interactive !== "false",
          });
          mounted.push({ el, emblem });
        });
      })
      .catch((err) => {
        els.forEach((el) => delete el.dataset.emblemReady);
        libPromise = null;
        console.warn("MVP emblem failed to load", err);
      });
  }

  window.initEmblems = initEmblems;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initEmblems());
  } else {
    initEmblems();
  }

  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.after((data) => {
      destroyEmblems(false);
      const next = data && data.next;
      initEmblems(next && next.container ? next.container : document);
    });
  }
})();
