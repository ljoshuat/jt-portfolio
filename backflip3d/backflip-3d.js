/* Backflip 3D loader: tiny, site-wide. Only pulls in the 3D bundle
   (three.js + the model) on pages that have canvas[data-backflip].
   Replaces backflip.js in the site footer. */
(() => {
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.replace(/[^/]*$/, "") : "";
  window.__BF3D = Object.assign({
    glb: base + "josh-backflip.glb",
    fallback: "https://cdn.jsdelivr.net/gh/ljoshuat/jt-portfolio@017f42357df06cfa23104ea394f963274a421594/backflip.js",
  }, window.__BF3D || {});
  let loading = false;
  function need(scope) {
    if (loading || window.Backflip3D) return;
    if (!(scope || document).querySelector("canvas[data-backflip]")) return;
    loading = true;
    const s = document.createElement("script");
    s.src = base + "backflip-3d.bundle.js";
    s.async = true;
    s.onerror = () => {
      const f = document.createElement("script"); f.src = window.__BF3D.fallback; document.body.appendChild(f);
    };
    document.body.appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => need());
  else need();
  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.after((data) => {
      const scope = (data && data.next && data.next.container) || document;
      if (window.Backflip3D) window.Backflip3D.init(scope); else need(scope);
    });
  }
})();
