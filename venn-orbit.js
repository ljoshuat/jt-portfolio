/* =========================================================
   VENN ORBIT ("Pull + Orbit") for the home circles section

   The three rings spin as a tilted gyroscope; bringing the cursor
   to the middle pulls them flat into the Venn, and scrolling the
   section does the same, so everyone sees the lock. On phones and
   tablets (no cursor) scrolling does it alone. At the lock the lime center pulses and
   the JT mark draws on (the "Pull" version: the J trims on from
   its tail, then the square slides out and drags the notch in).

   Josh's original is left untouched: the IX3 "Scroll interaction 2",
   the Lottie rings (.circle_lottie-line) and the lime embed
   (.circle-intersect) stay in Webflow. While this runs it only hides
   the rings + lime and takes over the three circles' positions.

   Swap back:
   - for good: remove this script's line from the footer and publish
   - to compare: add ?venn=classic to the URL, or put
     data-venn="classic" on .section_circles in the Designer
========================================================= */
(() => {
  // where Josh's interaction moves the side circles to form the Venn (em)
  const VENN_OFFSETS = [[9, 11.5], [0, 0], [-9, 11.5]];
  const RING = 0.985; // ring radius as a share of half the circle box

  const CSS = `
.venn-orbit-on .circle_lottie-line,.venn-orbit-on .circle-intersect{visibility:hidden!important}
.venn-orbit-on .circle_scroll{transform:translate3d(var(--vo-x,0px),var(--vo-y,0px),0)!important;translate:none!important;rotate:none!important;scale:none!important;opacity:var(--vo-o,1)!important}
.vo-layer{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}
.vo-layer canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.vo-mark{position:absolute;transform:translate(-50%,-50%);will-change:transform}
.vo-mark svg{display:block;width:100%;height:auto;overflow:visible}`;

  /* ---------- JT mark draw-on ("Pull") ---------- */
  const JT_J = 'M73.1747 0L50.293 85.0219H148.829C148.829 85.0219 126.865 92.1591 109.528 98.0872C104.588 119.382 100.41 141.125 94.1041 161.99C89.8674 176.05 78.5046 181.042 64.6428 182.602C60.9138 183.031 22.8036 182.29 22.8036 182.29C22.8036 182.31 0 267 0 267L70.7342 266.668C92.1712 266.571 111.851 256.918 128.798 245.238C158.142 225.464 175.049 197.208 183.444 163.297L223.995 0H73.1747Z';
  // the J with its notch filled in; the notch is pulled in later by a sliding wedge
  const JT_J_SOLID = JT_J.replace('H148.829C148.829 85.0219 126.865 92.1591 109.528 98.0872', 'H112.56L109.528 98.0872');
  const JT_NOTCH = 'M112.56 85.0219H148.829C148.829 85.0219 126.865 92.1591 109.528 98.0872Z';
  const JT_DOT = 'M253.534 0L232.019 85.0219H308.025L327.47 0H253.534Z';
  // centerline the reveal follows: tail (lower left) -> up the stem -> left along the top bar
  const JT_TRIM = 'M-6 226 L58 225 C100 224 126 205 137 168 L160 86 L172 42 L20 42';
  let markN = 0;

  function makeMark() {
    const n = ++markN;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-2 -2 332 271');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<defs><mask id="vo-jm${n}" maskUnits="userSpaceOnUse" x="-80" y="-80" width="500" height="430"><path class="vo-trim" d="${JT_TRIM}" fill="none" stroke="#fff" stroke-width="124" stroke-linejoin="miter" stroke-miterlimit="10"/></mask>
      <clipPath id="vo-dc${n}"><path d="M225.3 -5 L500 -5 L500 90 L201.3 90 Z"/></clipPath>
      <mask id="vo-nm${n}" maskUnits="userSpaceOnUse" x="-80" y="-80" width="500" height="430"><rect x="-80" y="-80" width="500" height="430" fill="#fff"/><path class="vo-wedge" d="${JT_NOTCH}" fill="#000"/></mask></defs>
      <g mask="url(#vo-jm${n})"><path d="${JT_J_SOLID}" fill="currentColor" mask="url(#vo-nm${n})"/></g>
      <g clip-path="url(#vo-dc${n})"><path class="vo-dot" d="${JT_DOT}" fill="currentColor"/></g>`;
    const trim = svg.querySelector('.vo-trim');
    const dot = svg.querySelector('.vo-dot');
    const wedge = svg.querySelector('.vo-wedge');
    let L = 0;
    svg.set = (s) => { // s = seconds into the animation
      if (!L) {
        L = trim.getTotalLength() || 700;
        trim.setAttribute('stroke-dasharray', `${L} ${L}`);
      }
      trim.setAttribute('stroke-dashoffset', L * (1 - easeQuad(clamp(s / 0.8))));
      const w = clamp((s - 0.7) / 0.32); // notch slides in tip first, with the square
      wedge.setAttribute('transform', `translate(${-42 * Math.pow(1 - w, 3)} 0)`);
      dot.setAttribute('transform', `translate(${-108 * (1 - backOut(clamp((s - 0.7) / 0.45)))} 0)`);
    };
    return svg;
  }

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const easeCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const backOut = (t, c = 1.9) => 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function solidBackground(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) return c;
    }
    return '#0d1113';
  }

  const pointer = { x: -1e4, y: -1e4, seen: false };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.seen = false; });

  /* ---------- one instance per circles section ---------- */
  function create(section) {
    const wrapper = section.querySelector('.sticky-wrapper') || section;
    const host = section.querySelector('.p-sticky') || section;
    const order = ['left', 'center', 'right'];
    const parents = [...section.querySelectorAll('.circle_scroll-parent')]
      .sort((a, b) => order.findIndex((c) => a.classList.contains(c)) - order.findIndex((c) => b.classList.contains(c)));
    const circles = parents.map((p) => p.querySelector('.circle_scroll')).filter(Boolean);
    if (circles.length !== 3) return null;
    const limeSrc = section.querySelector('.shape_intersect.w-embed') || section.querySelector('.shape_intersect') || section;
    const labelSrc = section.querySelector('.circle-label') || section;

    const layer = document.createElement('div');
    layer.className = 'vo-layer';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    const markWrap = document.createElement('div');
    markWrap.className = 'vo-mark';
    const mark = makeMark();
    markWrap.appendChild(mark);
    layer.append(canvas, markWrap);

    let on = false, raf = 0, visible = false, w = 0, h = 0, dpr = 1;
    let spin = 0, last = 0, pulse = 0, wasLocked = false, lockAt = 0, pull = 0, tilt = [0, 0];
    let colors = null, colorAge = 0;
    const applied = circles.map(() => [0, 0]);

    function fit() {
      // span the whole section width (padding included) so the side rings never clip on phones
      const sr = section.getBoundingClientRect(), hr0 = host.getBoundingClientRect();
      layer.style.left = (sr.left - hr0.left) + 'px';
      layer.style.width = sr.width + 'px';
      // when the section isn't pinned (phones) the lower rings hang below the sticky box: let the
      // layer run on into the section's bottom padding so they aren't cut off
      const sc = circles[1].getBoundingClientRect().width / (circles[1].offsetWidth || 1) || 1;
      const R = (circles[1].offsetWidth / 2) * RING * sc;
      const extra = getComputedStyle(host).position === 'sticky' ? 0 : clamp(sr.bottom - hr0.bottom, 0, R * 2);
      layer.style.height = (hr0.height + extra) + 'px';
      const r = layer.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      for (const c of [canvas, off]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(() => { if (on) fit(); });
    const io = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible && on && !raf) raf = requestAnimationFrame(frame);
    }, { rootMargin: '200px 0px' });

    function readColors() {
      colors = {
        lime: getComputedStyle(limeSrc).color || '#daf40a',
        ring: getComputedStyle(labelSrc).color || '#ffffff',
        bg: solidBackground(section),
      };
      markWrap.style.color = colors.bg;
    }

    function region(P, R, color, alpha) {
      octx.clearRect(0, 0, w, h);
      octx.save();
      P.forEach((p) => { octx.beginPath(); octx.arc(p[0], p[1], R, 0, 7); octx.clip(); });
      octx.fillStyle = color; octx.fillRect(0, 0, w, h);
      octx.restore();
      ctx.save(); ctx.globalAlpha = alpha; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, 0, 0); ctx.restore();
    }

    function frame(time) {
      raf = 0;
      if (!on || !visible) return;
      raf = requestAnimationFrame(frame);
      if (!colors || ++colorAge > 30) { readColors(); colorAge = 0; }
      const dt = Math.min(0.05, (time - last) / 1000 || 0); last = time;
      const still = reduce.matches;

      // geometry (in layer coordinates), measured from where the circles sit before our offset
      const hr = layer.getBoundingClientRect();
      const em = parseFloat(getComputedStyle(circles[0]).fontSize) || 16;
      // on phones the circle row is scaled down (.circle-layout scale .8): work in screen pixels
      const sc = circles[1].getBoundingClientRect().width / (circles[1].offsetWidth || 1) || 1;
      const nat = circles.map((c, i) => {
        const r = c.getBoundingClientRect();
        return [r.left + r.width / 2 - hr.left - applied[i][0], r.top + r.height / 2 - hr.top - applied[i][1]];
      });
      const R = (circles[1].offsetWidth / 2) * RING * sc;
      const V = nat.map((n, i) => [n[0] + VENN_OFFSETS[i][0] * em * sc, n[1] + VENN_OFFSETS[i][1] * em * sc]);
      const hub = [(V[0][0] + V[1][0] + V[2][0]) / 3, (V[0][1] + V[1][1] + V[2][1]) / 3];

      // scroll progress. Pinned (desktop/tablet): the same range as Josh's interaction, wrapper top at
      // top -> wrapper middle at top. Not pinned (phones): from the Venn entering the bottom of the
      // screen to its middle reaching 60% of the screen height.
      let scroll;
      if (getComputedStyle(host).position === 'sticky') {
        const wr = wrapper.getBoundingClientRect();
        scroll = clamp(-wr.top / (wr.height * 0.5 * 0.88)); // locks a little before the end, then holds
      } else {
        const vh = window.innerHeight, hubY = hr.top + hub[1];
        scroll = clamp((vh + R - hubY) / (vh * 0.4 + R));
      }
      // cursor pull toward the middle
      const px = pointer.x - hr.left, py = pointer.y - hr.top;
      const inside = pointer.seen && px >= 0 && py >= 0 && px <= w && py <= h;
      let target = inside ? 1 - smooth(R * 0.6, R * 2.6, Math.hypot(px - hub[0], py - hub[1])) : 0;
      if (target > 0.9) target = 1; // close enough: snap them together
      pull = still ? 0 : lerp(pull, target, 0.07);
      const p = still ? (scroll > 0.5 ? 1 : scroll) : Math.max(scroll, pull);
      const k = easeCubic(clamp(p));

      spin += still ? 0 : dt * (1 - k) * 1.4;
      const want = inside && !still ? [(px / w - 0.5) * 0.8, (py / h - 0.5) * 0.8] : [0, 0];
      tilt = tilt.map((v, i) => lerp(v, want[i], 0.06));

      const P = V.map((v) => [lerp(hub[0], v[0], k), lerp(hub[1], v[1], k)]);
      if (inside && !still) P.forEach((c) => {
        const dx = px - c[0], dy = py - c[1], d = Math.hypot(dx, dy) || 1, lean = Math.min(16, 2000 / d) * (1 - k);
        c[0] += (dx / d) * lean; c[1] += (dy / d) * lean;
      });

      // Josh's circles (icons + labels) ride along and fade in as the rings line up
      const iconAlpha = smooth(0.6, 0.95, p);
      circles.forEach((c, i) => {
        const x = P[i][0] - nat[i][0], y = P[i][1] - nat[i][1];
        applied[i] = [x, y];
        c.style.setProperty('--vo-x', (x / sc).toFixed(2) + 'px');
        c.style.setProperty('--vo-y', (y / sc).toFixed(2) + 'px');
        c.style.setProperty('--vo-o', iconAlpha.toFixed(3));
      });

      const locked = p > 0.97;
      if (locked && !wasLocked) pulse = 1;
      wasLocked = locked; pulse *= 0.92;
      if (locked && !lockAt) lockAt = time;
      if (p < 0.9) lockAt = 0;

      ctx.clearRect(0, 0, w, h);
      const lit = smooth(0.88, 0.98, p);
      if (lit > 0.01) region(P, R, colors.lime, lit);

      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.ring;
      P.forEach((c, i) => {
        const tau = lerp(1.25 + i * 0.08, 0, k) + tilt[1] * (1 - k);
        const rot = lerp((i * Math.PI) / 3 + spin * (i % 2 ? -1 : 1) + tilt[0], 0, k);
        ctx.globalAlpha = lerp(0.5, 0.32, k);
        ctx.beginPath();
        ctx.ellipse(c[0], c[1], R, Math.max(0.5, R * Math.abs(Math.cos(tau))), rot, 0, 7);
        ctx.stroke();
        if (k < 0.95) { // a lime bead riding each ring sells the 3D motion
          const a = spin * 2.2 + i * 2.1, ex = R * Math.cos(a), ey = R * Math.abs(Math.cos(tau)) * Math.sin(a);
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = colors.lime;
          ctx.beginPath();
          ctx.arc(c[0] + ex * Math.cos(rot) - ey * Math.sin(rot), c[1] + ex * Math.sin(rot) + ey * Math.cos(rot), 2.5, 0, 7);
          ctx.fill();
        }
      });
      ctx.restore();

      if (pulse > 0.02) {
        ctx.save(); ctx.globalAlpha = pulse * 0.6; ctx.strokeStyle = colors.lime;
        ctx.beginPath(); ctx.arc(hub[0], hub[1], R * 0.25 + R * (1 - pulse) * 0.9, 0, 7); ctx.stroke();
        ctx.restore();
      }

      // JT mark knocked out of the lime center, drawn on at each lock. Sized and placed from the
      // lime region itself (top: where the side rings meet, bottom: the top ring's lower edge),
      // matching the proportions Josh approved in the mockup.
      const top = V[1], yB = top[1] + R;
      const yT = Math.max(...[V[0], V[2]].map((c) => c[1] - Math.sqrt(Math.max(0, R * R - (top[0] - c[0]) ** 2))));
      const H = Math.max(1, yB - yT);
      const lw = H * 0.55 * (1 + pulse * 0.12);
      markWrap.style.left = (top[0] - H * 0.055).toFixed(2) + 'px';
      markWrap.style.top = (yT + H * 0.595).toFixed(2) + 'px';
      markWrap.style.width = ((lw * 332) / 328).toFixed(2) + 'px';
      markWrap.style.opacity = smooth(0.94, 1, p).toFixed(3);
      mark.set(lockAt ? (still ? 3 : (time - lockAt) / 1000) : 0);
    }

    function enable() {
      if (on) return;
      on = true;
      section.classList.add('venn-orbit-on');
      host.prepend(layer);
      fit();
      readColors();
      ro.observe(host); ro.observe(section);
      io.observe(section);
    }
    function disable() {
      if (!on) return;
      on = false;
      cancelAnimationFrame(raf); raf = 0;
      ro.disconnect(); io.disconnect();
      layer.remove();
      section.classList.remove('venn-orbit-on');
      circles.forEach((c, i) => { ['--vo-x', '--vo-y', '--vo-o'].forEach((v) => c.style.removeProperty(v)); applied[i] = [0, 0]; });
    }
    enable();
    return { destroy: disable };
  }

  let instances = [];
  function initVennOrbit(scope = document) {
    if (new URLSearchParams(location.search).get('venn') === 'classic') return;
    if (!document.getElementById('venn-orbit-style')) {
      const s = document.createElement('style');
      s.id = 'venn-orbit-style';
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    scope.querySelectorAll('.section_circles').forEach((section) => {
      if (section.dataset.venn === 'classic' || section.__vennOrbit) return;
      const inst = create(section);
      if (inst) { section.__vennOrbit = inst; instances.push({ section, inst }); }
    });
  }
  function destroyVennOrbit() {
    instances.forEach(({ section, inst }) => { inst.destroy(); delete section.__vennOrbit; });
    instances = [];
  }
  window.initVennOrbit = initVennOrbit;
  window.destroyVennOrbit = destroyVennOrbit;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initVennOrbit());
  } else {
    initVennOrbit();
  }
  if (typeof barba !== 'undefined' && barba.hooks) {
    barba.hooks.before(() => destroyVennOrbit());
    barba.hooks.after((data) => initVennOrbit(data && data.next && data.next.container ? data.next.container : document));
  }
})();
