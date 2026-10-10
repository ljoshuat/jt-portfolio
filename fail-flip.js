/* =========================================================
   FAIL FLIP (404)
   Same halftone-dot figure as BACKFLIP DOTS, but the back tuck
   under-rotates and he lands flat on his stomach, legs flop,
   then he lifts his head to look at you. Plays once on load,
   replays on [data-failflip-replay] click or a click on the
   canvas. prefers-reduced-motion shows the final pose only.

   Markup (inside [data-failflip-wrap]):
     canvas[data-failflip]        (data-spacing, default 4)
     [data-failflip-step] x 4     (optional, gets .is-active; wrap gets .is-splat)
     [data-failflip-phase]        (optional label)
     [data-failflip-replay]       (optional button)

   Load on the 404 page only. No dependencies. Barba-safe.
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
  // Shaped after Josh's own beach back flip: arms up, swing down into a
  // squat, jump with an arched open body, legs over, land folded forward.
  // Same takeoff as the real flip, then it under-rotates (~270deg) and
  // lands face down, arms out front, legs flopping.
  const KEYS = [
    { p: 0.0, lean: 0, spine: 0, nod: 0, sh: 12, el: 14, hip: 0, knee: 0, point: 0, rot: 0 },
    { p: 0.09, lean: -3, spine: -4, nod: -8, sh: 172, el: 8, hip: 0, knee: 2, point: 0, rot: 0 },
    { p: 0.18, lean: 10, spine: 4, nod: 0, sh: 70, el: 10, hip: 18, knee: 24, point: 0, rot: 0 },
    { p: 0.28, lean: 40, spine: 12, nod: 6, sh: -50, el: 14, hip: 86, knee: 100, point: 0, rot: 0 },
    { p: 0.37, lean: -4, spine: -14, nod: -20, sh: 170, el: 6, hip: -6, knee: 2, point: 0.9, rot: 4 },
    { p: 0.45, lean: 0, spine: -12, nod: -18, sh: 160, el: 34, hip: 40, knee: 78, point: 1, rot: 66 },
    { p: 0.53, lean: 0, spine: 8, nod: 0, sh: 150, el: 26, hip: 70, knee: 96, point: 0.9, rot: 132 },
    { p: 0.6, lean: 0, spine: -8, nod: -16, sh: 178, el: 18, hip: 26, knee: 40, point: 0.9, rot: 196 },
    { p: 0.67, lean: 0, spine: -8, nod: -12, sh: 176, el: 10, hip: 2, knee: 12, point: 0.8, rot: 248 },
    { p: 0.72, lean: 0, spine: -4, nod: -6, sh: 172, el: 8, hip: -2, knee: 6, point: 0.7, rot: 270 },
    { p: 0.76, lean: 0, spine: 2, nod: 2, sh: 176, el: 4, hip: -6, knee: 74, point: 0.9, rot: 270 },
    { p: 0.82, lean: 0, spine: 0, nod: 0, sh: 176, el: 6, hip: -2, knee: 14, point: 0.8, rot: 270 },
    { p: 0.87, lean: 0, spine: 0, nod: 0, sh: 175, el: 8, hip: -3, knee: 36, point: 0.8, rot: 270 },
    { p: 0.92, lean: 0, spine: -2, nod: -4, sh: 172, el: 12, hip: -2, knee: 8, point: 0.8, rot: 270 },
    { p: 1.0, lean: 0, spine: -10, nod: -42, sh: 158, el: 34, hip: -2, knee: 14, point: 0.8, rot: 270 },
  ];
  const FIELDS = ["lean", "spine", "nod", "sh", "el", "hip", "knee", "point", "rot"];
  const FLIGHT = [0.385, 0.72];
  const PEAK = 58;
  const LAND_X = -20; // hips land a little behind the takeoff spot
  const DURATION = 3200; // ms for the whole move
  const PHASES = [
    [0.0, "Set"],
    [0.2, "Load"],
    [0.385, "Rotate"],
    [0.72, "Splat"],
  ];

  // Material brightness (dots get bigger with brightness)
  const MAT = { skin: 1, tee: 0.86, pants: 0.5, hair: 0.42 };
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
    // [point, radius of the body there] so the sole touches the floor exactly
    const pts = [
      [add(add(s.heel, s.foot, 2), s.foot - 90, 3.4), 0], [add(add(s.toe, s.foot, -2), s.foot - 90, 2.2), 0],
      [s.knee, 5.6], [add(s.wrist, s.fa, 9), 2.6], [s.head, 13.5], [add(s.head, s.dHead + 180, 3), 14],
      [s.waist, 9.5], [s.shoulder, 9], [s.hip, 10.5],
    ];
    return Math.max(...pts.map(([p, r]) => p[1] + r));
  }

  // Before takeoff the feet are planted; after the splat the hips stay put.
  function placement(p) {
    const s = skeleton(pose(p));
    const before = (pp) => { const k = skeleton(pose(pp)); return { x: -k.ankle[0], y: -lowest(k) }; };
    const after = (pp) => { const k = skeleton(pose(pp)); return { x: LAND_X, y: -lowest(k) }; };
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
    return { s, x, y, air: Math.max(0, Math.min(stand - y - 4, 110)) };
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
      // bare legs and feet, shorts over the top of the thigh
      limb(s.knee, s.ankle, [[0, 5.2, 5.4], [0.3, 4.8, 6.8], [0.8, 3.5, 3.8], [1, 3.3, 3.3]], MAT.skin * k);
      limb(s.hip, s.knee, [[0, 9.2, 10], [0.35, 8.2, 8.4], [1, 5.6, 5.4]], MAT.skin * k);
      limb(s.hip, add(s.hip, s.th, LEN.thigh * 0.62), [[0, 10.4, 11.2], [1, 9.4, 9.6]], MAT.pants * k);
      limb(add(s.heel, s.foot, 2), add(s.toe, s.foot, -2), [[0, 3.6, 3.4], [0.6, 3.2, 3], [1, 2.4, 2.2]], MAT.skin * 0.9 * k);
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
      // short, full crop that hugs the head
      const hair = [
        add(add(c, up, -2.5), fwd, -9.8), // nape
        add(add(c, up, 3), fwd, -12.2),
        add(add(c, up, 9), fwd, -11.2),
        add(add(c, up, 13.6), fwd, -6.5),
        add(add(c, up, 15.6), fwd, 0),
        add(add(c, up, 14.8), fwd, 6),
        add(add(c, up, 11.6), fwd, 10.2), // front of the crop
        add(add(c, up, 8.6), fwd, 9.6), // hairline at the forehead
        add(add(c, up, 10), fwd, 4.5),
        add(add(c, up, 8.5), fwd, 0.5),
        add(add(c, up, 3), fwd, 0), // sideburn
        add(add(c, up, 2.5), fwd, -4.5), // above the ear
        add(add(c, up, -1.5), fwd, -6.5),
      ];
      const hg = g.createLinearGradient(...add(c, up, 16), ...add(c, up, -2));
      hg.addColorStop(0, gray(MAT.hair * 1.35));
      hg.addColorStop(1, gray(MAT.hair * 0.8));
      smoothPath(g, hair);
      g.fillStyle = hg;
      g.fill();
    }

    // Far side limbs sit a few units behind and above, dimmer
    function far(fn) {
      g.save();
      g.translate(-5, -1);
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
    const wrap = canvas.closest("[data-failflip-wrap]") || canvas.parentElement;
    const phaseEl = wrap.querySelector("[data-failflip-phase]");
    const replay = wrap.querySelector("[data-failflip-replay]");
    const steps = [...wrap.querySelectorAll("[data-failflip-step]")];
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });
    const drawBody = makeDrawer(octx);
    const spacing = parseFloat(canvas.getAttribute("data-spacing")) || 4;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, raf = 0, t0 = 0, shown = still ? 1 : 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      cols = Math.max(1, Math.ceil(w / spacing)); rows = Math.max(1, Math.ceil(h / spacing));
      off.width = cols; off.height = rows;
    }

    function drawFigure(p) {
      const { s, x, y, air } = placement(p);
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.fillStyle = "#000"; octx.fillRect(0, 0, cols, rows);
      // Fit standing-arms-up height and the full prone length
      const scale = Math.min((rows * 0.9) / 270, (cols * 0.92) / 290);
      const gx = cols * 0.5, gy = rows * 0.9;

      octx.setTransform(scale, 0, 0, scale, gx, gy);
      octx.fillStyle = gray(0.18);
      octx.fillRect(-140, 0, 280, 1.6 / scale);
      const sh = Math.max(0.2, 1 - air / 110);
      const shadowX = p >= FLIGHT[1] ? x + 30 : x - 2;
      const shadowW = p >= FLIGHT[1] ? 95 : 30 * sh;
      octx.fillStyle = gray(0.42 * sh);
      octx.beginPath(); octx.ellipse(shadowX, 0.5, shadowW, 3.5 * sh, 0, 0, Math.PI * 2); octx.fill();

      // Dust puffs right after impact
      const d = (p - FLIGHT[1]) / 0.16;
      if (d > 0 && d < 1) {
        const puffs = [[-70, 0.9], [-40, 1.2], [60, 1], [95, 1.3], [120, 0.8]];
        puffs.forEach(([px, k], i) => {
          const spread = (px < 20 ? -1 : 1) * d * 18 * k;
          const rise = Math.sin(d * Math.PI) * (8 + i * 2.5);
          octx.fillStyle = gray(0.55 * (1 - d));
          octx.beginPath(); octx.arc(LAND_X + px + spread, -rise, 4 + d * 6 * k, 0, Math.PI * 2); octx.fill();
        });
      }

      // Small impact shake
      const shake = d > 0 && d < 0.35 ? Math.sin(d * 60) * (0.35 - d) * 6 : 0;
      octx.setTransform(scale, 0, 0, scale, gx + x * scale, gy + (y + shake) * scale);
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
      if (phaseEl) {
        let label = PHASES[0][1];
        PHASES.forEach(([at, name]) => { if (p >= at) label = name; });
        if (phaseEl.textContent !== label) phaseEl.textContent = label;
        phaseEl.classList.toggle("is-splat", p >= FLIGHT[1]);
      }
      if (steps.length) {
        let idx = 0;
        PHASES.forEach(([at], i) => { if (p >= at) idx = i; });
        steps.forEach((el, i) => el.classList.toggle("is-active", i === Math.min(idx, steps.length - 1)));
        wrap.classList.toggle("is-splat", p >= FLIGHT[1]);
      }
    }

    function tick(now) {
      if (!t0) t0 = now;
      shown = Math.min(1, (now - t0) / DURATION);
      render(shown);
      raf = shown < 1 ? requestAnimationFrame(tick) : 0;
    }
    function play() {
      if (still) { shown = 1; render(1); return; }
      cancelAnimationFrame(raf); t0 = 0; raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => { resize(); render(shown); });
    ro.observe(canvas);
    resize();
    render(shown);
    const startDelay = setTimeout(play, 500);
    canvas.addEventListener("click", play);
    if (replay) replay.addEventListener("click", play);
    const mo = new MutationObserver(() => render(shown));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    const api = {
      play,
      show(p) { cancelAnimationFrame(raf); clearTimeout(startDelay); shown = p; render(p); },
      destroy() {
        clearTimeout(startDelay); cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect();
        canvas.removeEventListener("click", play);
        if (replay) replay.removeEventListener("click", play);
      },
    };
    canvas.__failflip = api;
    return api;
  }

  const instances = [];
  function init(scope) {
    (scope || document).querySelectorAll("canvas[data-failflip]").forEach((c) => {
      if (!c.__failflip) instances.push(create(c));
    });
  }
  function destroyAll() {
    while (instances.length) instances.pop().destroy();
    document.querySelectorAll("canvas[data-failflip]").forEach((c) => delete c.__failflip);
  }
  window.FailFlip = { init, destroyAll, pose, placement };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => destroyAll());
    barba.hooks.after((data) => init((data && data.next && data.next.container) || document));
  }
})();
