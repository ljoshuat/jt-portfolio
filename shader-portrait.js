/* ==========================================================
   SHADER PORTRAIT (WebGL)
   A portrait drawn as a two-tone image in --color--accent over
   --color--bg-primary (follows Dark/Light/Vibe), with a pointer
   effect running in a fragment shader.

   Markup (Webflow):
     <div data-shader-portrait data-src="https://.../josh-cutout.png"
          data-effect="reveal"></div>
   Give the div a size in Designer.

   Effects (data-effect):
     liquid  the photo ripples like water around the pointer
     reveal  halftone dots everywhere; a soft circle around the
             pointer reveals the two-tone photo underneath
     rgb     the colour channels pull apart when the pointer moves fast
   Optional: data-radius (px, default 160), data-spacing (dot gap in
   px for reveal, default 9), data-fit "contain" (default) or "cover".

   Mouse devices animate; touch drags work too. Reduced motion draws
   the still image only. Falls back to nothing if WebGL is missing.
   Load site-wide (footer) after Barba; re-inits on Barba changes.
   ========================================================== */
(() => {
  const EFFECTS = { liquid: 0, reveal: 1, rgb: 2 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const instances = new Set();

  const VERT = `
    attribute vec2 p;
    varying vec2 vUv;
    void main() { vUv = p * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(p, 0.0, 1.0); }`;

  const FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uRes;        // canvas size in css px
    uniform vec4 uFit;        // image rect inside canvas (uv): x, y, w, h
    uniform vec2 uMouse;      // css px
    uniform vec2 uVel;        // smoothed pointer velocity, px/frame
    uniform float uActive;    // 0-1, eased pointer presence
    uniform float uTime;
    uniform float uRadius;
    uniform float uSpacing;
    uniform int uEffect;
    uniform vec3 uAccent;
    uniform vec3 uBg;
    uniform float uLightDots; // 1 = bright pixels take the accent

    vec4 photo(vec2 uv) {
      vec2 t = (uv - uFit.xy) / uFit.zw;
      if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) return vec4(0.0);
      return texture2D(uTex, t);
    }
    float tone(vec4 c) {
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      return mix(1.0 - l, l, uLightDots);
    }
    vec4 duo(vec4 c) {
      return vec4(mix(uBg, uAccent, tone(c)) * c.a, c.a);
    }

    void main() {
      vec2 px = vUv * uRes;
      vec2 d = px - uMouse;
      float dist = length(d);
      float falloff = smoothstep(uRadius, 0.0, dist) * uActive;

      if (uEffect == 0) {
        // Liquid: rings travelling out from the pointer + drag along the motion
        float wave = sin(dist * 0.06 - uTime * 4.0) * falloff;
        vec2 dir = dist > 0.0 ? d / dist : vec2(0.0);
        vec2 offset = dir * wave * 14.0 - uVel * falloff * 2.2;
        gl_FragColor = duo(photo((px + offset) / uRes));
        return;
      }

      if (uEffect == 1) {
        // Halftone dots computed per cell, photo revealed inside a soft circle
        vec2 cell = floor(px / uSpacing) * uSpacing + uSpacing * 0.5;
        vec4 c = photo(cell / uRes);
        float r = sqrt(tone(c) * c.a) * uSpacing * 0.5;
        float dot_ = smoothstep(r + 0.6, r - 0.6, length(px - cell));
        dot_ *= step(0.35, r); // no specks where the photo is empty
        vec4 dots = vec4(uAccent * dot_, dot_);
        float lens = smoothstep(uRadius, uRadius * 0.55, dist) * uActive;
        // slight bulge inside the lens
        vec4 full = duo(photo((uMouse + d * (1.0 - 0.12 * lens)) / uRes));
        gl_FragColor = mix(dots, full, lens);
        return;
      }

      // RGB split: channels offset along the pointer velocity
      float amt = clamp(length(uVel) / 30.0, 0.0, 1.0);
      vec2 shift = (length(uVel) > 0.0 ? normalize(uVel) : vec2(1.0, 0.0)) * amt * (6.0 + 22.0 * falloff);
      vec4 a = duo(photo((px + shift) / uRes));
      vec4 b = duo(photo(px / uRes));
      vec4 e = duo(photo((px - shift) / uRes));
      float alpha = max(max(a.a, b.a), e.a);
      gl_FragColor = vec4(a.r, b.g, e.b, alpha);
    }`;

  /* CSS color -> [r,g,b] 0-1 */
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  function rgb(color) {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "#000";
    probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  }
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function create(el) {
    const src = el.getAttribute("data-src");
    if (!src) return null;
    const opts = {
      effect: el.getAttribute("data-effect") || "reveal",
      radius: parseFloat(el.getAttribute("data-radius")) || 160,
      spacing: parseFloat(el.getAttribute("data-spacing")) || 9,
      fit: el.getAttribute("data-fit") || "contain"
    };

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    el.appendChild(canvas);

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    ["uTex", "uRes", "uFit", "uMouse", "uVel", "uActive", "uTime", "uRadius", "uSpacing",
     "uEffect", "uAccent", "uBg", "uLightDots"].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const img = new Image();
    img.crossOrigin = "anonymous";
    let ready = false, w = 1, h = 1, raf = 0, visible = true;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, vx: 0, vy: 0, active: 0, over: false };
    let accent = [1, 1, 0], bg = [0, 0, 0], lightDots = 1;
    const t0 = performance.now();

    function readTheme() {
      const cs = getComputedStyle(el);
      accent = rgb(cs.getPropertyValue("--color--accent").trim() || "#daf40a");
      bg = rgb(cs.getPropertyValue("--color--bg-primary").trim() || "#0a0f12");
      lightDots = lum(accent) > lum(bg) ? 1 : 0;
    }

    function resize() {
      const r = el.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      wake();
    }

    function fitRect() {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const s = opts.fit === "cover" ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
      const dw = (iw * s) / w, dh = (ih * s) / h;
      return [(1 - dw) / 2, (1 - dh) / 2, dw, dh];
    }

    function frame(now) {
      raf = 0;
      if (!ready || !visible) return;
      const animate = !reducedMotion.matches;
      // ease pointer + velocity
      const px = mouse.x, py = mouse.y;
      mouse.x += (mouse.tx - mouse.x) * 0.2;
      mouse.y += (mouse.ty - mouse.y) * 0.2;
      mouse.vx += ((mouse.x - px) - mouse.vx) * 0.25;
      mouse.vy += ((mouse.y - py) - mouse.vy) * 0.25;
      mouse.active += ((mouse.over && animate ? 1 : 0) - mouse.active) * 0.08;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, w, h);
      gl.uniform4fv(U.uFit, fitRect());
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform2f(U.uVel, animate ? mouse.vx : 0, animate ? mouse.vy : 0);
      gl.uniform1f(U.uActive, mouse.active);
      gl.uniform1f(U.uTime, (now - t0) / 1000);
      gl.uniform1f(U.uRadius, opts.radius);
      gl.uniform1f(U.uSpacing, opts.spacing);
      gl.uniform1i(U.uEffect, EFFECTS[opts.effect] ?? 1);
      gl.uniform3fv(U.uAccent, accent);
      gl.uniform3fv(U.uBg, bg);
      gl.uniform1f(U.uLightDots, lightDots);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const busy = mouse.over || mouse.active > 0.002 ||
        Math.abs(mouse.vx) + Math.abs(mouse.vy) > 0.02;
      if (busy && animate) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && visible) raf = requestAnimationFrame(frame); }

    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (!mouse.over) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.over = true;
      wake();
    }
    function onLeave() { mouse.over = false; wake(); }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);

    const themeObserver = new MutationObserver(() => { readTheme(); wake(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);
    const viewObserver = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); });
    viewObserver.observe(el);

    readTheme();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      ready = true;
      resize();
    };
    img.src = src;

    return {
      el,
      opts,
      redraw: wake,
      destroy() {
        cancelAnimationFrame(raf);
        themeObserver.disconnect();
        resizeObserver.disconnect();
        viewObserver.disconnect();
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerdown", onMove);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("pointercancel", onLeave);
        const lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
        canvas.remove();
      }
    };
  }

  function init(root = document) {
    root.querySelectorAll("[data-shader-portrait]").forEach((el) => {
      if (el._shaderPortrait) return;
      try {
        const inst = create(el);
        if (inst) { el._shaderPortrait = inst; instances.add(inst); }
      } catch (err) {
        console.warn("shader-portrait:", err);
      }
    });
  }
  function destroyAll() {
    instances.forEach((inst) => { inst.destroy(); delete inst.el._shaderPortrait; });
    instances.clear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => destroyAll());
    barba.hooks.after((data) => init((data && data.next && data.next.container) || document));
  }

  window.ShaderPortrait = { init, destroyAll };
})();
