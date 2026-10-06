/* =========================================================
   BACKFLIP DOTS
   A side-view person does a standing back tuck, drawn as
   halftone dots in --color--accent. Progress (0-1) comes from
   scroll through the parent [data-backflip-track].

   The body is built from shaded, tapered shapes (tee, joggers,
   sneakers, short swept-up hair) so the dots read as a person,
   not a stick figure. Feet stay planted on the ground.

   Markup:
   section[data-backflip-track]          (tall, e.g. 420vh)
     div (sticky)
       canvas[data-backflip]             (data-spacing, default 4)
       [data-backflip-phase]             (optional label)
     [data-backflip-step] x 4            (optional, gets .is-active)
   The track also gets --bf-progress (0-1) for CSS.

   Load site-wide (footer). No dependencies. Barba-safe.
========================================================= */
(() => {
  const D2R = Math.PI / 180;
  // 0 = down, 90 = forward (facing right), 180 = up. Screen y points down.
  const dir = (a) => [Math.sin(a * D2R), Math.cos(a * D2R)];
  const add = (p, a, l) => { const v = dir(a); return [p[0] + v[0] * l, p[1] + v[1] * l]; };
  const lerp = (a, b, t) => a + (b - a) * t;

  // Figure units, roughly cm. Standing height ~180.
  const LEN = { pelvis: 22, chest: 32, neck: 6, upper: 30, fore: 27, thigh: 44, shin: 43 };

  // Keyframes. Angles in degrees.
  // lean: whole torso tips forward; spine: chest curls toward knees; nod: chin to chest
  // sh: arm angle from the torso (0 down, 90 forward, 180 overhead, negative behind)
  // el: elbow bend; hip: thigh toward chest; knee: shin folds back
  // point: 0 = foot flat on the floor, 1 = toes pointed; rot: backward rotation
  const KEYS = [
    { p: 0.0, lean: 0, spine: 0, nod: 0, sh: 6, el: 12, hip: 0, knee: 0, point: 0, rot: 0 },
    { p: 0.12, lean: 3, spine: 2, nod: 0, sh: 70, el: 10, hip: 4, knee: 8, point: 0, rot: 0 },
    { p: 0.3, lean: 36, spine: 10, nod: 6, sh: -55, el: 16, hip: 80, knee: 96, point: 0, rot: 0 },
    { p: 0.385, lean: -4, spine: -10, nod: -18, sh: 172, el: 6, hip: -6, knee: 2, point: 0.9, rot: 6 },
    { p: 0.46, lean: 0, spine: 18, nod: 4, sh: 150, el: 22, hip: 75, knee: 75, point: 1, rot: 80 },
    { p: 0.53, lean: 0, spine: 42, nod: 22, sh: 48, el: 30, hip: 128, knee: 148, point: 0.8, rot: 155 },
    { p: 0.6, lean: 0, spine: 42, nod: 22, sh: 46, el: 32, hip: 130, knee: 150, point: 0.8, rot: 245 },
    { p: 0.675, lean: 0, spine: 14, nod: 4, sh: 110, el: 26, hip: 58, knee: 52, point: 0.5, rot: 322 },
    { p: 0.745, lean: 8, spine: 4, nod: 0, sh: 105, el: 14, hip: 32, knee: 44, point: 0, rot: 360 },
    { p: 0.83, lean: 32, spine: 12, nod: 4, sh: 84, el: 12, hip: 84, knee: 100, point: 0, rot: 360 },
    { p: 0.93, lean: 2, spine: 0, nod: -6, sh: 168, el: 6, hip: 2, knee: 2, point: 0, rot: 360 },
    { p: 1.0, lean: 0, spine: -3, nod: -6, sh: 174, el: 4, hip: 0, knee: 0, point: 0, rot: 360 },
  ];
  const FIELDS = ["lean", "spine", "nod", "sh", "el", "hip", "knee", "point", "rot"];
  const FLIGHT = [0.385, 0.745];
  const PEAK = 80; // how high the hips rise above a straight line during flight
  const TRAVEL = -16; // a back tuck lands a little behind where it took off
  const PHASES = [
    [0.0, "Set"],
    [0.2, "Load"],
    [0.385, "Rotate"],
    [0.745, "Stick"],
  ];

  // Material brightness (dots get bigger with brightness)
  const MAT = { skin: 1, tee: 0.9, pants: 0.76, shoe: 1, hair: 0.5 };
  const FAR = 0.55; // far-side limbs are dimmer
  // Light from upper left, a bit toward the viewer
  const LIGHT = (() => { const v = [-0.45, -0.75, 0.5]; const m = Math.hypot(...v); return v.map((n) => n / m); })();

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }

  function pose(p) {
    p = Math.min(1, Math.max(0, p));
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[Math.max(0, i - 1)], b = KEYS[i], c = KEYS[i + 1], d = KEYS[Math.min(KEYS.length - 1, i + 2)];
    const t = (p - b.p) / (c.p - b.p || 1);
    const q = {};
    FIELDS.forEach((k) => (q[k] = catmull(a[k], b[k], c[k], d[k], t)));
    q.point = Math.min(1, Math.max(0, q.point));
    return q;
  }

  // Forward kinematics from the hip joint at (0,0)
  function skeleton(q) {
    const R = q.rot;
    const dLow = R - q.lean; // pelvis segment, as a "down" angle
    const dUp = dLow - q.spine; // chest segment
    const dHead = dUp - q.nod;
    const hip = [0, 0];
    const waist = add(hip, dLow + 180, LEN.pelvis);
    const shoulder = add(waist, dUp + 180, LEN.chest);
    const neck = add(shoulder, dUp + 180, LEN.neck);
    const head = add(add(neck, dHead + 180, 12), dHead + 90, 1.5);
    const ua = dUp + q.sh;
    const elbow = add(shoulder, ua, LEN.upper);
    const fa = ua + q.el;
    const wrist = add(elbow, fa, LEN.fore);
    const th = dLow + q.hip;
    const knee = add(hip, th, LEN.thigh);
    const shin = th - q.knee;
    const ankle = add(knee, shin, LEN.shin);
    const foot = lerp(R + 90, shin + 90 - 55, q.point);
    const down = foot - 90;
    const heel = add(add(ankle, down, 3.5), foot, -4);
    const toe = add(add(ankle, down, 3.5), foot, 20);
    return { R, dLow, dUp, dHead, ua, fa, th, shin, foot, hip, waist, shoulder, neck, head, elbow, wrist, knee, ankle, heel, toe };
  }

  // Lowest point of the body (largest y), used to put it on the floor
  function lowest(s) {
    const pts = [
      add(s.heel, s.foot - 90, 4.5), add(s.toe, s.foot - 90, 3.5),
      add(s.knee, s.shin, 0), add(s.wrist, s.fa, 10), add(s.head, s.dHead, 13), add(s.head, s.dHead + 180, 13),
      add(s.waist, s.dUp + 180, 0), add(s.shoulder, s.dUp + 180, 10),
    ];
    return Math.max(...pts.map((p) => p[1] + 4));
  }

  // Where the hips sit in ground space. Feet stay planted on the floor
  // before takeoff and after landing; in flight the hips follow an arc.
  function placement(p) {
    const s = skeleton(pose(p));
    const before = (pp) => { const k = skeleton(pose(pp)); return { x: -k.ankle[0], y: -lowest(k) }; };
    const after = (pp) => { const k = skeleton(pose(pp)); return { x: TRAVEL - k.ankle[0], y: -lowest(k) }; };
    let x, y;
    if (p <= FLIGHT[0]) ({ x, y } = before(p));
    else if (p >= FLIGHT[1]) ({ x, y } = after(p));
    else {
      const a = before(FLIGHT[0]), b = after(FLIGHT[1]);
      const t = (p - FLIGHT[0]) / (FLIGHT[1] - FLIGHT[0]);
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t) - PEAK * Math.sin(Math.PI * t);
    }
    const stand = -lowest(skeleton(pose(0)));
    return { s, x, y, air: Math.max(0, stand - y - 4) };
  }

  // ---------- drawing helpers (offscreen, figure units) ----------
  const gray = (v) => { const n = Math.round(Math.min(1, Math.max(0, v)) * 255); return `rgb(${n},${n},${n})`; };

  // Brightness across a cylinder whose cross axis is `f` (screen vector)
  function cylinderStops(f, albedo) {
    const stops = [];
    for (let i = 0; i <= 8; i++) {
      const t = -1 + i / 4;
      const z = Math.sqrt(Math.max(0, 1 - t * t));
      const n = [t * f[0], t * f[1], z];
      const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      stops.push([i / 8, albedo * (0.3 + 0.7 * lam)]);
    }
    return stops;
  }

  // Closed smooth path through points (midpoint quadratic curves)
  function smoothPath(ctx, pts) {
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[n - 1], pts[0]);
    ctx.beginPath();
    ctx.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) {
      const b = pts[i], c = pts[(i + 1) % n];
      m = mid(b, c);
      ctx.quadraticCurveTo(b[0], b[1], m[0], m[1]);
    }
    ctx.closePath();
  }

  // A tapered limb from a to b. profile: [[t, frontRadius, backRadius], ...]
  // "front" is the side 90deg counter to the limb direction (shin front, palm side).
  function limbShape(a, b, profile) {
    const ang = Math.atan2(b[0] - a[0], b[1] - a[1]) / D2R; // back to our 0 = down convention
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const front = [], back = [];
    profile.forEach(([t, rf, rb]) => {
      const c = add(a, ang, L * t);
      front.push(add(c, ang + 90, rf));
      back.push(add(c, ang - 90, rb));
    });
    const r1 = profile[0], r2 = profile[profile.length - 1];
    const endCap = [], startCap = [];
    for (let k = 1; k < 4; k++) {
      const u = k / 4;
      endCap.push(add(b, ang + 90 - 180 * u, lerp(r2[1], r2[2], u)));
      startCap.push(add(a, ang - 90 - 180 * u, lerp(r1[2], r1[1], u)));
    }
    return { pts: [...front, ...endCap, ...back.reverse(), ...startCap], ang, mid: add(a, ang, L / 2), r: Math.max(...profile.map((q) => Math.max(q[1], q[2]))) };
  }

  function makeDrawer(g) {
    function fillShaded(shape, albedo, outline) {
      const f = dir(shape.ang + 90);
      const a = add(shape.mid, shape.ang - 90, shape.r), b = add(shape.mid, shape.ang + 90, shape.r);
      const grad = g.createLinearGradient(a[0], a[1], b[0], b[1]);
      cylinderStops(f, albedo).forEach(([o, v]) => grad.addColorStop(o, gray(v)));
      smoothPath(g, shape.pts);
      if (outline) { g.strokeStyle = "#000"; g.lineWidth = outline; g.stroke(); }
      g.fillStyle = grad;
      g.fill();
    }

    // Shapes in one group share an outline drawn under all of them, so a
    // limb reads as one piece instead of separate segments.
    let batch = null;
    function limb(a, b, profile, albedo) {
      const shape = limbShape(a, b, profile);
      if (batch) batch.push([shape, albedo]);
      else fillShaded(shape, albedo, 0);
    }
    function group(outline, fn) {
      batch = [];
      fn();
      const items = batch;
      batch = null;
      if (outline) items.forEach(([shape]) => {
        smoothPath(g, shape.pts); g.strokeStyle = "#000"; g.lineWidth = outline; g.stroke();
      });
      items.forEach(([shape, albedo]) => fillShaded(shape, albedo, 0));
    }

    function arm(s, k) {
      limb(s.shoulder, s.elbow, [[0, 5.6, 5.6], [0.45, 4.9, 5.4], [1, 3.9, 3.9]], MAT.skin * k);
      // tee sleeve over the top of the upper arm
      const sleeveEnd = add(s.shoulder, s.ua, LEN.upper * 0.42);
      limb(s.shoulder, sleeveEnd, [[0, 6.6, 6.6], [1, 6, 6]], MAT.tee * k);
      limb(s.elbow, s.wrist, [[0, 3.9, 4], [0.35, 4.1, 4.4], [1, 2.7, 2.7]], MAT.skin * k);
      const hand = add(s.wrist, s.fa, 9);
      limb(s.wrist, hand, [[0, 2.9, 2.9], [0.5, 3.4, 3.2], [1, 2.5, 2.5]], MAT.skin * k);
    }

    function leg(s, k) {
      limb(s.knee, s.ankle, [[0, 5.6, 5.8], [0.3, 5.2, 7.2], [0.8, 3.9, 4.2], [1, 3.8, 3.8]], MAT.pants * k);
      limb(s.hip, s.knee, [[0, 9.6, 10.4], [0.35, 8.6, 8.8], [1, 6, 5.8]], MAT.pants * k);
      limb(s.heel, s.toe, [[0, 4.6, 4.4], [0.55, 4.2, 4], [1, 3.2, 3]], MAT.shoe * k);
    }

    function torso(s) {
      const fl = s.dLow + 90, fu = s.dUp + 90; // forward directions of each segment
      const lowMid = add(s.hip, s.dLow + 180, LEN.pelvis * 0.5);
      const upMid = add(s.waist, s.dUp + 180, LEN.chest * 0.55);
      const top = add(s.shoulder, s.dUp + 180, 4);
      const butt = add(s.hip, s.dLow, 5);
      // front side, bottom to top, then back side, top to bottom
      const pts = [
        add(butt, fl, 7), add(s.hip, fl, 9), add(lowMid, fl, 8.5), add(s.waist, fl, 9.2),
        add(upMid, fl === fu ? fl : fu, 11.5), add(s.shoulder, fu, 8.5), add(top, fu, 5.5),
        add(top, fu, -7), add(s.shoulder, fu, -9.5), add(upMid, fu, -10), add(s.waist, fl, -8.6),
        add(lowMid, fl, -9.8), add(s.hip, fl, -11.2), add(butt, fl, -9),
      ];
      const shape = { pts, ang: s.dUp, mid: add(s.waist, s.dUp + 180, 6), r: 12 };
      fillShaded(shape, MAT.tee, 0);
      // waistband: the joggers start at the hips
      const band = limbShape(add(s.hip, s.dLow, 7), add(s.hip, s.dLow + 180, 5), [[0, 9, 10], [1, 9.2, 10.6]]);
      fillShaded(band, MAT.pants, 0);
    }

    function head(s) {
      const up = s.dHead + 180, fwd = s.dHead + 90;
      // neck
      limb(add(s.shoulder, s.dUp + 180, 1), add(s.neck, up, 6), [[0, 4.8, 4.8], [1, 4.4, 4.4]], MAT.skin * 0.9);
      const c = s.head;
      // skull + face, slightly egg shaped with jaw and nose
      const face = [
        add(c, up, 12.5),
        add(add(c, up, 9), fwd, 8),
        add(add(c, up, 2), fwd, 10.6),
        add(add(c, up, -1), fwd, 13.2), // nose tip
        add(add(c, up, -3.5), fwd, 10.6),
        add(add(c, up, -8), fwd, 9.4), // mouth
        add(add(c, up, -12), fwd, 7.2), // chin
        add(add(c, up, -12.5), fwd, 1),
        add(add(c, up, -8), fwd, -4.5), // jaw back
        add(add(c, up, -4), fwd, -9.6),
        add(add(c, up, 4), fwd, -11),
        add(add(c, up, 10), fwd, -7),
      ];
      const lc = add(c, 0, 0);
      const grad = g.createRadialGradient(lc[0] + LIGHT[0] * 6, lc[1] + LIGHT[1] * 6, 1, lc[0], lc[1], 14);
      grad.addColorStop(0, gray(MAT.skin));
      grad.addColorStop(0.65, gray(MAT.skin * 0.8));
      grad.addColorStop(1, gray(MAT.skin * 0.35));
      smoothPath(g, face);
      g.fillStyle = grad;
      g.fill();
      // ear
      const ear = add(add(c, up, 0), fwd, -2.5);
      g.fillStyle = gray(MAT.skin * 0.55);
      g.beginPath(); g.ellipse(ear[0], ear[1], 2.2, 3.2, -s.dHead * D2R, 0, Math.PI * 2); g.fill();
      // short hair, swept up at the front
      const hair = [
        add(add(c, up, 6), fwd, -10.6),
        add(add(c, up, 11), fwd, -8),
        add(add(c, up, 14.5), fwd, -2),
        add(add(c, up, 16.2), fwd, 4),
        add(add(c, up, 15), fwd, 9.6), // quiff
        add(add(c, up, 10.5), fwd, 9.8),
        add(add(c, up, 11.5), fwd, 5),
        add(add(c, up, 10), fwd, 0),
        add(add(c, up, 5), fwd, -4),
        add(add(c, up, 0), fwd, -5.5),
        add(add(c, up, 1), fwd, -10),
      ];
      const hg = g.createLinearGradient(...add(c, up, 16), ...add(c, up, 0));
      hg.addColorStop(0, gray(MAT.hair * 1.5));
      hg.addColorStop(1, gray(MAT.hair * 0.7));
      smoothPath(g, hair);
      g.fillStyle = hg;
      g.fill();
    }

    // Far side limbs sit a few units behind and above, dimmer
    function far(fn) {
      g.save();
      g.translate(-5, -2.5);
      fn();
      g.restore();
    }

    return function draw(s) {
      far(() => { group(0, () => arm(s, FAR)); group(0, () => leg(s, FAR)); });
      torso(s);
      head(s);
      group(2.6, () => leg(s, 1));
      group(2.6, () => arm(s, 1));
    };
  }

  function readAccent(el) {
    const cs = getComputedStyle(el);
    return cs.getPropertyValue("--color--accent").trim() || "#daf40a";
  }

  function create(canvas) {
    const track = canvas.closest("[data-backflip-track]") || canvas.parentElement;
    const phaseEl = track.querySelector("[data-backflip-phase]");
    const steps = [...track.querySelectorAll("[data-backflip-step]")];
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });
    const drawBody = makeDrawer(octx);
    const spacing = parseFloat(canvas.getAttribute("data-spacing")) || 4;
    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, raf = 0, last = -1, target = 0, shown = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      cols = Math.max(1, Math.ceil(w / spacing)); rows = Math.max(1, Math.ceil(h / spacing));
      off.width = cols; off.height = rows;
      last = -1;
    }

    function drawFigure(p) {
      const { s, x, y, air } = placement(p);
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.fillStyle = "#000"; octx.fillRect(0, 0, cols, rows);
      // Fit the whole move (standing arms up, flight peak) in the canvas
      const scale = Math.min((rows * 0.9) / 285, (cols * 0.95) / 170);
      const gx = cols * 0.55, gy = rows * 0.93;

      // Floor line and shadow (ground space)
      octx.setTransform(scale, 0, 0, scale, gx, gy);
      octx.fillStyle = gray(0.18);
      octx.fillRect(-80, 2, 160, 1.6 / scale);
      const sh = Math.max(0.2, 1 - air / 110);
      octx.fillStyle = gray(0.42 * sh);
      octx.beginPath(); octx.ellipse(x - 2, 1.5, 30 * sh, 4 * sh, 0, 0, Math.PI * 2); octx.fill();

      // Body
      octx.setTransform(scale, 0, 0, scale, gx + x * scale, gy + y * scale);
      octx.lineJoin = "round"; octx.lineCap = "round";
      drawBody(s);
    }

    function render(p) {
      if (!cols || !rows) return;
      drawFigure(p);
      const data = octx.getImageData(0, 0, cols, rows).data;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = readAccent(canvas);
      const max = spacing * 0.56;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = data[(r * cols + c) * 4] / 255;
          if (v < 0.05) continue;
          const rad = Math.sqrt(v) * max;
          const cx = c * spacing + spacing / 2, cy = r * spacing + spacing / 2;
          ctx.moveTo(cx + rad, cy);
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        }
      }
      ctx.fill();

      track.style.setProperty("--bf-progress", p.toFixed(4));
      if (phaseEl) {
        let label = PHASES[0][1];
        PHASES.forEach(([at, name]) => { if (p >= at) label = name; });
        if (phaseEl.textContent !== label) phaseEl.textContent = label;
      }
      if (steps.length) {
        // One step per phase when counts match, otherwise equal slices
        let idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
        if (steps.length === PHASES.length) PHASES.forEach(([at], i) => { if (p >= at) idx = i; });
        steps.forEach((el, i) => el.classList.toggle("is-active", i === idx));
      }
    }

    function progress() {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    }

    function loop() {
      // Light smoothing so wheel steps don't stutter
      shown += (target - shown) * 0.2;
      if (Math.abs(target - shown) < 0.0005) shown = target;
      if (shown !== last) { render(shown); last = shown; }
      raf = shown !== target ? requestAnimationFrame(loop) : 0;
    }
    function onScroll() {
      target = progress();
      if (!raf) raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => { resize(); render(shown); });
    ro.observe(canvas);
    resize();
    target = shown = progress();
    render(shown);
    window.addEventListener("scroll", onScroll, { passive: true });
    const mo = new MutationObserver(() => render(shown));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    const api = {
      render,
      destroy() {
        cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect();
        window.removeEventListener("scroll", onScroll);
      },
    };
    canvas.__backflip = api;
    return api;
  }

  const instances = [];
  function init(scope) {
    (scope || document).querySelectorAll("canvas[data-backflip]").forEach((c) => {
      if (!c.__backflip) instances.push(create(c));
    });
  }
  function destroyAll() {
    while (instances.length) instances.pop().destroy();
    document.querySelectorAll("canvas[data-backflip]").forEach((c) => delete c.__backflip);
  }
  window.BackflipDots = { init, destroyAll, pose, placement };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => destroyAll());
    barba.hooks.after((data) => init((data && data.next && data.next.container) || document));
  }
})();
