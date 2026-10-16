// JT Creative brand for the proposal pages, taken from the site's design
// system (portfolio/design-system/DESIGN.md): ink canvas, one lime accent,
// wide uppercase display type, light grotesk body copy.
//
// Fonts: the brand faces (Druk Wide, PP Neue Montreal, PP Editorial New) are
// licensed and self-hosted. Drop their woff2 files in public/fonts (see
// README) and set FONTS = "self" in wrangler.toml; until then the Google
// stand-ins (Unbounded, Inter, Instrument Serif) are used.

export const FONT_FACES = `
@font-face{font-family:"Druk Wide Web";src:url(/fonts/DrukWide-Bold.woff2) format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:"PP Neue Montreal";src:url(/fonts/PPNeueMontreal-Light.woff2) format("woff2");font-weight:300;font-display:swap}
@font-face{font-family:"PP Neue Montreal";src:url(/fonts/PPNeueMontreal-Book.woff2) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"PP Neue Montreal";src:url(/fonts/PPNeueMontreal-Medium.woff2) format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:"PP Editorial New";src:url(/fonts/PPEditorialNew-UltralightItalic.woff2) format("woff2");font-weight:200;font-style:italic;font-display:swap}
`;

// The open J (separated version from logo-mock/jt-mark-golden-lime.svg).
export const MARK_SVG = `<svg viewBox="-12.34 0 350.45 267" aria-hidden="true"><path d="M75.61628,0h148.37872l-39.93821,160.82932c-16.61457,61.17812 -72.54472,106.17068 -138.98345,106.17068h-57.40845l22.10107,-89h35.30738c25.37734,0 46.74075,-17.18563 53.08695,-40.55359l12.03053,-48.44641h-56.67563zM106.47557,103.96121c9.84669,-9.27633 23.11458,-14.96121 37.71024,-14.96121l-33.99498,0z"/><path d="M262.11876,0h76l-22.10107,89h-76z"/></svg>`;

const LEAF = 'M66.59 176.845C79.129 126.353 108.205 81.51 149.186 49.461 190.168 17.412 240.697 0 292.722 0H538.909L472.319 268.155C459.78 318.647 430.704 363.49 389.723 395.539 348.741 427.588 298.212 445 246.187 445H0Z';
export const TRIO_SVG = `<svg viewBox="0 0 1100 916" aria-hidden="true"><path d="${LEAF}" transform="translate(0 471)"/><path d="${LEAF}" transform="translate(455 471)"/><path d="${LEAF}" transform="translate(568 0)"/></svg>`;

const leafUri = (fill) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 539 445'><path fill='${fill}' d='${LEAF}'/></svg>`)}")`;

export const BRAND_CSS = `
:root{
  --bg:#0A0F12;--panel:#141A1E;--text:#F7F7F7;--gray:#A7A7A7;--muted:#7D7D7D;--accent:#DAF40A;--on-accent:#0A0F12;--border:#2A3136;
  --t1:#141B1F;--t2:#1B2328;--t3:#242E33;
  --display:"Druk Wide Web","Druk Wide","Unbounded",Verdana,sans-serif;
  --sans:"PP Neue Montreal","Ppneuemontreal","Inter",Arial,sans-serif;
  --serif:"PP Editorial New","Ppeditorialnew","Instrument Serif",Georgia,serif;
  --pad:clamp(1.25rem,4vw,3rem);--r-md:clamp(16px,1.2vw,20px);--r-lg:clamp(16px,2vw,28px);
  --ease:cubic-bezier(.215,.61,.355,1);
}
[data-theme="light"]{
  --bg:#F7F7F7;--panel:#FFFFFF;--text:#0A0F12;--gray:#3A3F42;--muted:#8A8A8A;--accent:#0A0F12;--on-accent:#F7F7F7;--border:#D9D9D9;
  --t1:#EEEEEE;--t2:#E6E6E6;--t3:#DCDCDC;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-weight:300;line-height:1.4;transition:background .35s,color .35s}
a{color:inherit}
img{max-width:100%;display:block}
.wrap{max-width:1320px;margin:0 auto;padding:0 var(--pad)}
.page{padding:clamp(4rem,9vw,8rem) 0;border-top:1px solid var(--border)}
.hero,.h1,.h2,.h3,.stat{font-family:var(--display);font-weight:700;text-transform:uppercase;line-height:.95;letter-spacing:-.01em}
.hero{font-size:clamp(2.6rem,1.25rem + 7vw,8rem)}
.h1{font-size:clamp(2rem,4.6vw,4.25rem);margin-bottom:clamp(1.5rem,3vw,2.5rem)}
.h2{font-size:clamp(1.5rem,3vw,2.5rem);margin-bottom:1.25rem}
.h3{font-size:clamp(1.05rem,1.6vw,1.5rem);line-height:1.1}
.stat{font-size:clamp(2.5rem,6vw,5rem)}
.serif{font-family:var(--serif);font-style:italic;font-weight:200;font-size:clamp(1.5rem,3vw,2.75rem);line-height:1.05}
.accent{color:var(--accent)}
.lead{font-size:clamp(1.25rem,2.2vw,1.75rem);line-height:1.35}
.muted{color:var(--gray)}
.small{font-size:.9rem}
.item{font-size:clamp(1.05rem,1.5vw,1.3rem);font-weight:400}
.meta,.label{font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:500}
.label{display:flex;align-items:center;gap:.6rem;color:var(--gray);margin-bottom:1.5rem}
.leaf{width:14px;height:12px;background:var(--accent);-webkit-mask:${leafUri('#000')} center/contain no-repeat;mask:${leafUri('#000')} center/contain no-repeat}
.link{text-decoration:none;border-bottom:1px solid currentColor}
p+p{margin-top:1rem}
.stack>*+*{margin-top:1.5rem}

/* top bar */
.topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:1.5rem;padding:.9rem var(--pad);background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.mark svg{width:34px;height:auto;fill:var(--accent);display:block}
.toc{display:flex;gap:1.25rem;overflow-x:auto;flex:1;scrollbar-width:none}
.toc::-webkit-scrollbar{display:none}
.toc a{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--gray);text-decoration:none;white-space:nowrap;transition:color .3s}
.toc a:hover{color:var(--accent)}
.theme{font:inherit;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;background:none;color:var(--gray);border:1px solid var(--border);border-radius:999px;padding:.45rem .9rem;cursor:pointer;white-space:nowrap}
@media (max-width:767px){.toc{display:none}.topbar{justify-content:space-between}}

/* cover */
.cover{border-top:0;min-height:calc(100svh - 60px);display:flex;position:relative;overflow:hidden;padding:clamp(2rem,6vw,5rem) 0}
.cover-inner{display:flex;flex-direction:column;justify-content:space-between;gap:3rem;width:100%;position:relative}
.cover .sub{margin-top:1.25rem}
.cover-pattern{position:absolute;inset:0 0 0 auto;width:min(40%,620px);opacity:.9;
  background:
    ${leafUri('#242E33')} 0 0/180px 149px,
    ${leafUri('#1B2328')} 36px 149px/180px 149px;
  -webkit-mask:linear-gradient(90deg,transparent,#000 35%);mask:linear-gradient(90deg,transparent,#000 35%)}
[data-theme="light"] .cover-pattern{opacity:.6;filter:invert(1)}
@media (max-width:767px){.cover-pattern{width:100%;height:38%;inset:auto 0 0 0;opacity:.45}}
.meta-row{display:flex;flex-wrap:wrap;gap:1.5rem clamp(2rem,5vw,4rem)}
.meta-row dd{margin-top:.4rem;font-weight:400}

/* layouts */
.split{display:grid;gap:clamp(2rem,6vw,7rem);grid-template-columns:1fr}
@media (min-width:900px){.split{grid-template-columns:1fr 1fr}}
.headrow{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1rem;margin-bottom:clamp(1.5rem,3vw,2.5rem)}
.headrow .h1{margin-bottom:0}
.sig{margin-top:2rem}.sig .serif{font-size:2rem}

.steps{list-style:none;border-top:1px solid var(--border)}
.steps li{display:grid;grid-template-columns:3.5rem 1fr;gap:1rem;padding:1.5rem 0;border-bottom:1px solid var(--border)}
.steps .num{font-family:var(--display);font-weight:700;color:var(--accent);font-size:1.35rem}
.steps h3{font-weight:400;font-size:1.25rem;margin-bottom:.35rem}
.steps p{color:var(--gray)}

.cards{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.card{background:var(--panel);border:1px solid var(--border);border-radius:var(--r-lg);padding:clamp(1.5rem,2.5vw,2.25rem)}
.card .h3{margin:.75rem 0}
.card p:last-child{color:var(--gray)}
.num-sm{font-size:.8rem;font-weight:500;color:var(--accent)}

.phases{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.phase{border:1px solid var(--border);border-radius:var(--r-lg);padding:clamp(1.5rem,2.5vw,2.25rem)}
.phase .h3{margin:1rem 0 .5rem}
.phase p:last-child{color:var(--gray);margin-top:1rem}

.gantt{--label:clamp(7rem,16vw,15rem)}
.gantt-row{display:grid;grid-template-columns:var(--label) 1fr;align-items:center;border-top:1px solid var(--border);min-height:4.5rem}
.gantt-head{border-top:0;min-height:2rem}
.track{display:grid;grid-template-columns:repeat(var(--weeks),1fr);position:relative;height:100%;align-items:center}
.gantt-head .track span{font-size:.7rem;color:var(--muted)}
.bar{grid-column:calc(var(--s) + 1) / span var(--l);height:1.6rem;border-radius:999px;background:var(--text);opacity:.85;margin-right:6px}
.bar-accent{background:var(--accent);opacity:1}
@media (max-width:600px){.gantt-head .track span:nth-child(even){visibility:hidden}}
.gantt+.meta-row{margin-top:2.5rem}

.invest{display:grid;gap:2rem;grid-template-columns:1fr}
@media (min-width:900px){.invest{grid-template-columns:1.7fr 1fr;align-items:stretch}}
.prices{list-style:none}
.prices li{display:flex;justify-content:space-between;gap:1.5rem;padding:1.4rem 0;border-bottom:1px solid var(--border)}
.prices .price{white-space:nowrap}
.total{background:var(--accent);color:var(--on-accent);border-radius:var(--r-lg);padding:clamp(1.75rem,3vw,3rem);display:flex;flex-direction:column;justify-content:space-between;gap:2.5rem}
.total .meta{color:var(--on-accent);opacity:.75;margin-bottom:.75rem}
.total .item+.item{margin-top:.5rem}

.work{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))}
.tile{text-decoration:none;display:block}
.media{aspect-ratio:4/3;border-radius:var(--r-md);background:var(--panel);border:1px solid var(--border);overflow:hidden;margin-bottom:1rem;display:grid;place-items:center}
.media img{width:100%;height:100%;object-fit:contain}
.tile .meta{margin-top:.5rem}

.approve{background:var(--panel);border:1px solid var(--border);border-radius:var(--r-lg);padding:clamp(1.75rem,3vw,3.5rem);align-self:start}
.approve>*+*{margin-top:1.25rem}
.btn{display:inline-block;background:var(--accent);color:var(--on-accent);border:2px solid var(--accent);border-radius:var(--r-md);padding:1rem 1.75rem;font-weight:500;text-transform:uppercase;letter-spacing:.06em;text-decoration:none;font-size:.95rem;transition:background .35s,color .35s}
.btn:hover{background:transparent;color:var(--accent)}

.foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;padding-top:2rem;padding-bottom:2.5rem;border-top:1px solid var(--border)}

/* reveal */
.js-reveal [data-reveal] .wrap{opacity:0;transform:translateY(40px);transition:opacity .8s var(--ease),transform .8s var(--ease)}
.js-reveal [data-reveal].in .wrap{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.js-reveal [data-reveal] .wrap{opacity:1;transform:none;transition:none}}

/* password gate */
.gate{min-height:100svh;display:grid;place-items:center;padding:var(--pad)}
.gate-box{width:min(100%,440px)}
.gate-box .mark svg{width:56px;margin-bottom:2.5rem}
.gate-box .h2{margin-bottom:.75rem}
.gate form{margin-top:2rem;display:grid;gap:1rem}
.gate input{font:inherit;font-size:1.1rem;background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:var(--r-md);padding:1rem 1.1rem}
.gate input:focus{outline:2px solid var(--accent);outline-offset:2px}
.gate .btn{cursor:pointer;font-family:inherit}
.gate .err{color:#FF7A6B;font-size:.95rem}
`;
