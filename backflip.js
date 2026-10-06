/* =========================================================
   BACKFLIP DOTS
   A side-view person does a standing back tuck, drawn as
   halftone dots in --color--accent. Progress (0-1) comes from
   scroll through the parent [data-backflip-track].

   The body is built from shaded, tapered shapes (tee, shorts,
   bare feet, short swept-up hair) so the dots read as a person,
   not a stick figure. Feet stay planted on the ground. He looks
   at the viewer before and after the flip, profile in the air.

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
  // Shaped after Josh's own beach back flip: arms up, swing down into a
  // squat, jump with an arched open body, legs over, land folded forward.
  const KEYS = [
    { p: 0.0, lean: 0, spine: 0, nod: 0, sh: 12, el: 14, hip: 0, knee: 0, point: 0, rot: 0 },
    { p: 0.09, lean: -3, spine: -4, nod: -8, sh: 172, el: 8, hip: 0, knee: 2, point: 0, rot: 0 },
    { p: 0.18, lean: 10, spine: 4, nod: 0, sh: 70, el: 10, hip: 18, knee: 24, point: 0, rot: 0 },
    { p: 0.28, lean: 40, spine: 12, nod: 6, sh: -50, el: 14, hip: 86, knee: 100, point: 0, rot: 0 },
    { p: 0.37, lean: -4, spine: -14, nod: -20, sh: 170, el: 6, hip: -6, knee: 2, point: 0.9, rot: 4 },
    { p: 0.45, lean: 0, spine: -12, nod: -18, sh: 160, el: 34, hip: 40, knee: 78, point: 1, rot: 72 },
    { p: 0.53, lean: 0, spine: 16, nod: 4, sh: 140, el: 22, hip: 92, knee: 110, point: 0.9, rot: 152 },
    { p: 0.61, lean: 0, spine: 28, nod: 14, sh: 92, el: 30, hip: 112, knee: 118, point: 0.8, rot: 248 },
    { p: 0.68, lean: 0, spine: 16, nod: 6, sh: 60, el: 20, hip: 64, knee: 62, point: 0.5, rot: 320 },
    { p: 0.745, lean: 30, spine: 12, nod: 6, sh: 30, el: 14, hip: 62, knee: 62, point: 0, rot: 360 },
    { p: 0.82, lean: 68, spine: 24, nod: 12, sh: 18, el: 12, hip: 116, knee: 96, point: 0, rot: 360 },
    { p: 0.91, lean: 30, spine: 8, nod: 2, sh: 10, el: 14, hip: 44, knee: 28, point: 0, rot: 360 },
    { p: 1.0, lean: 0, spine: 0, nod: -4, sh: 18, el: 24, hip: 0, knee: 0, point: 0, rot: 360 },
  ];
  const FIELDS = ["lean", "spine", "nod", "sh", "el", "hip", "knee", "point", "rot"];
  const FLIGHT = [0.385, 0.745];
  const PEAK = 72; // how high the hips rise above a straight line during flight
  const TRAVEL = -16; // a back tuck lands a little behind where it took off
  const PHASES = [
    [0.0, "Set"],
    [0.2, "Load"],
    [0.385, "Rotate"],
    [0.745, "Stick"],
  ];

  // Material brightness (dots get bigger with brightness)
  const MAT = { skin: 1, tee: 0.86, pants: 0.5, hair: 0.42 };
  const FAR = 0.55; // far-side limbs are dimmer
  // Light from upper left, a bit toward the viewer
  const LIGHT = (() => { const v = [-0.45, -0.75, 0.5]; const m = Math.hypot(...v); return v.map((n) => n / m); })();

  // Head turn: 1 = looking at the viewer, 0 = profile. He looks out at the
  // viewer, turns his head as the flip starts, and looks back after landing.
  const TURN = [[0.22, 0.34], [0.86, 0.97]];
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const headTurn = (p) => 1 - smooth(TURN[0][0], TURN[0][1], p) + smooth(TURN[1][0], TURN[1][1], p);

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
    q.turn = headTurn(p);
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
    return { turn: q.turn, R, dLow, dUp, dHead, ua, fa, th, shin, foot, hip, waist, shoulder, neck, head, elbow, wrist, knee, ankle, heel, toe };
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

    // Resample a closed polygon to n points spaced evenly along its edge,
    // starting at pts[0], so two outlines can morph point by point.
    function resample(pts, n) {
      const segs = pts.map((a, i) => { const b = pts[(i + 1) % pts.length]; return [a, b, Math.hypot(b[0] - a[0], b[1] - a[1])]; });
      const total = segs.reduce((t, q) => t + q[2], 0);
      const out = [];
      let i = 0, acc = 0;
      for (let k = 0; k < n; k++) {
        const d = (total * k) / n;
        while (acc + segs[i][2] < d) { acc += segs[i][2]; i++; }
        const [a, b, l] = segs[i];
        const t = l ? (d - acc) / l : 0;
        out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
      }
      return out;
    }
    const morph = (a, b, m, n) => { const A = resample(a, n), B = resample(b, n); return A.map((p, i) => [lerp(p[0], B[i][0], m), lerp(p[1], B[i][1], m)]); };

    // Head outlines in head space: [forward, up]. Profile faces forward,
    // front faces the viewer. Both start at the top/back and run the same way.
    const FACE_SIDE = [[0, 12.5], [8, 9], [10.6, 2], [13.2, -1], [10.6, -3.5], [9.4, -8], [7.2, -12], [1, -12.5], [-4.5, -8], [-9.6, -4], [-11, 4], [-7, 10]];
    const FACE_FRONT = [[0, 12.8], [7, 10], [9.4, 4], [9.6, -1], [9.2, -4.5], [8, -8.5], [5, -12], [0, -13.4], [-5, -12], [-8, -8.5], [-9.2, -4.5], [-9.6, -1], [-9.4, 4], [-7, 10]];
    const HAIR_SIDE = [[-9.8, -2.5], [-12.2, 3], [-11.2, 9], [-6.5, 13.6], [0, 15.6], [6, 14.8], [10.2, 11.6], [9.6, 8.6], [4.5, 10], [0.5, 8.5], [0, 3], [-4.5, 2.5], [-6.5, -1.5]];
    // short, swept up, a little lighter on top, temples slightly back
    const HAIR_FRONT = [[-10, 1.5], [-10.6, 7], [-8.6, 12.4], [-4, 15.6], [0.5, 16.4], [5, 15.8], [9, 12.8], [10.6, 7], [10, 1.5], [9.2, 3.5], [8.4, 7.6], [5.6, 9], [2, 9.8], [-1.5, 9.8], [-5, 9], [-8.4, 7.6], [-9.2, 3.5]];

    function head(s, turn) {
      const up = s.dHead + 180, fwd = s.dHead + 90;
      const c = s.head;
      const at = (h, v) => add(add(c, up, v), fwd, h);
      // yaw: 0 = looking at the viewer, 90 = profile (facing forward)
      const yaw = 90 * (1 - turn) * D2R, cy = Math.cos(yaw), sy = Math.sin(yaw);
      // 3D head point (x: his left, y: up, z: toward his face) -> [screen pt, depth toward viewer]
      const P = (x, y, z) => [at(x * cy + z * sy, y), z * cy - x * sy];
      // neck
      limb(add(s.shoulder, s.dUp + 180, 1), add(s.neck, up, 6), [[0, 4.8, 4.8], [1, 4.4, 4.4]], MAT.skin * 0.9);

      function ear(x) {
        const [e, d] = P(x * 9.3, 0, -0.5);
        const w = 1.2 + 1.2 * Math.abs(Math.sin(Math.atan2(x * 9.3, -0.5) - yaw + Math.PI / 2)) ;
        g.fillStyle = gray(MAT.skin * (d > 0 ? 0.62 : 0.45));
        g.beginPath(); g.ellipse(e[0], e[1], Math.min(2.4, w), 3.4, -s.dHead * D2R, 0, Math.PI * 2); g.fill();
      }
      // ears that sit behind the face outline
      if (turn > 0.35) { ear(1); ear(-1); }

      // skull + face
      const face = morph(FACE_SIDE, FACE_FRONT, turn, 48).map(([h, v]) => at(h, v));
      // facing the viewer the face stays bright so the eyes and smile read
      const grad = g.createRadialGradient(c[0] + LIGHT[0] * 6, c[1] + LIGHT[1] * 6, 1, c[0], c[1], lerp(14, 20, turn));
      grad.addColorStop(0, gray(MAT.skin));
      grad.addColorStop(0.65, gray(MAT.skin * 0.8));
      grad.addColorStop(1, gray(MAT.skin * 0.35));
      smoothPath(g, face);
      g.fillStyle = grad;
      g.fill();
      if (turn <= 0.35) ear(-1); // near ear, on top in profile

      const dark = (v) => gray(MAT.skin * v);
      const vis = (d) => Math.min(1, Math.max(0, d / 2));
      // eyes: smiling, a little squinted, with brows above
      [-1, 1].forEach((side) => {
        const [e, d] = P(side * 3.7, 1.8, 8.4);
        const k = vis(d);
        if (k <= 0) return;
        const rx = 2.3 * Math.max(0.35, Math.abs(Math.cos(yaw - side * 0.42)));
        g.fillStyle = dark(lerp(0.8, 0.12, k));
        g.beginPath(); g.ellipse(e[0], e[1], rx, 1.5, -s.dHead * D2R, 0, Math.PI * 2); g.fill();
        const b0 = P(side * 1.6, 4.4, 9.3)[0], b1 = P(side * 3.8, 5, 9)[0], b2 = P(side * 6, 4.3, 7.6)[0];
        g.strokeStyle = dark(lerp(0.8, 0.15, k)); g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(...b0); g.quadraticCurveTo(...b1, ...b2); g.stroke();
      });
      // nose: shadow down the side away from the light
      if (turn > 0.1) {
        const n0 = P(1.1, 3, 10.2)[0], n1 = P(1.9, -1.6, 10.8)[0], n2 = P(0.4, -3.2, 10.6)[0];
        g.strokeStyle = dark(lerp(0.8, 0.45, turn)); g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(...n0); g.quadraticCurveTo(...n1, ...n2); g.stroke();
      }
      // big smile with teeth showing
      const top = [], bot = [], teeth = [];
      for (let i = 0; i <= 8; i++) {
        const x = -5 + (10 * i) / 8, u = x / 5;
        const z = 9.2 - 0.12 * x * x;
        top.push(P(x, -6.2 + 1.4 * u * u, z));
        bot.push(P(x, -6.2 + 1.4 * u * u - 4.6 * (1 - u * u), z - 0.3));
        teeth.push(P(x * 0.66, -6.6 + 0.8 * u * u - 1.1 * (1 - u * u), z));
      }
      const mouthVis = vis(Math.max(...top.map((q) => q[1])) + 2);
      const keep = (arr) => arr.filter((q) => q[1] > -0.5).map((q) => q[0]);
      const mt = keep(top), mb = keep(bot), tt = keep(teeth);
      if (mt.length > 2 && mouthVis > 0) {
        g.fillStyle = dark(lerp(0.8, 0.08, mouthVis));
        g.beginPath(); g.moveTo(...mt[0]); mt.forEach((q) => g.lineTo(...q)); mb.slice().reverse().forEach((q) => g.lineTo(...q)); g.closePath(); g.fill();
        g.fillStyle = gray(lerp(MAT.skin * 0.8, 1, mouthVis));
        g.beginPath(); g.moveTo(...mt[0]); mt.forEach((q) => g.lineTo(...q)); tt.slice().reverse().forEach((q) => g.lineTo(...q)); g.closePath(); g.fill();
      }

      // short crop, swept up
      const hair = morph(HAIR_SIDE, HAIR_FRONT, turn, 56).map(([h, v]) => at(h, v));
      const hg = g.createLinearGradient(...at(0, 16), ...at(0, -2));
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
      head(s, s.turn);
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
      const scale = Math.min((rows * 0.9) / 285, (cols * 0.9) / 190);
      const gx = cols * 0.6, gy = rows * 0.93;

      // Floor line and shadow (ground space)
      octx.setTransform(scale, 0, 0, scale, gx, gy);
      octx.fillStyle = gray(0.18);
      octx.fillRect(-80, 0, 160, 1.6 / scale);
      const sh = Math.max(0.2, 1 - air / 110);
      octx.fillStyle = gray(0.42 * sh);
      octx.beginPath(); octx.ellipse(x - 2, 0.5, 30 * sh, 3.5 * sh, 0, 0, Math.PI * 2); octx.fill();

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
