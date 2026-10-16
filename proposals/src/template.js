// Renders one client proposal as a full HTML page.
// Everything that comes from proposal data goes through esc(), so a proposal
// file can never inject markup into the page.

import { BRAND_CSS, FONT_FACES, MARK_SVG, TRIO_SVG, leafUri } from './brand.js';

export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const pad = (n) => String(n).padStart(2, '0');
const paras = (list, cls = '') =>
  (Array.isArray(list) ? list : [list]).filter(Boolean).map((p) => `<p${cls ? ` class="${cls}"` : ''}>${esc(p)}</p>`).join('');

const label = (n, text) => `<p class="label"><span class="leaf" aria-hidden="true"></span>${pad(n)} · ${esc(text)}</p>`;

function section(id, n, name, inner, extraClass = '') {
  return `<section class="page ${extraClass}" id="${id}" aria-label="${esc(name)}" data-reveal>
  <div class="wrap">${inner}</div>
</section>`;
}

// Arriving from the unlock screen: the lime leaf field it ends on lifts away
// on the brand slant to reveal the cover.
const CURTAIN_CSS = `
.curtain{display:none}
.from-unlock .curtain{display:block;position:fixed;inset:-10% 0;z-index:100;pointer-events:none;
  background:#0A0F12 ${leafUri('#DAF40A')} 0 0/88px 73px;
  transform-origin:0 0;animation:curtain .9s cubic-bezier(.7,0,.2,1) .15s forwards}
@keyframes curtain{to{transform:translateY(-110%) skewY(-6deg)}}
@media (prefers-reduced-motion:reduce){.from-unlock .curtain{animation:none;display:none}}
`;

export function renderProposal(d, { previewBanner = '', selfHostedFonts = false } = {}) {
  const theme = d.theme === 'light' ? 'light' : 'dark';
  const sections = [];
  let n = 0;

  // 01 Introduction
  if (d.intro) {
    n++;
    sections.push(section('introduction', n, 'Introduction', `
      ${label(n, 'Introduction')}
      <div class="split">
        <div>
          <h2 class="h1">${esc(d.intro.heading || `Hello, ${d.client}.`)}</h2>
          ${d.intro.accent ? `<p class="serif accent">${esc(d.intro.accent)}</p>` : ''}
        </div>
        <div class="stack">
          ${d.intro.lead ? `<p class="lead">${esc(d.intro.lead)}</p>` : ''}
          ${paras(d.intro.body, 'muted')}
          ${d.intro.signoff ? `<div class="sig"><p class="serif">${esc(d.intro.signoff.name)}</p><p class="meta">${esc(d.intro.signoff.title)}</p></div>` : ''}
        </div>
      </div>`));
  }

  // 02 Challenge & goals
  if (d.challenge) {
    n++;
    sections.push(section('challenge', n, 'The challenge', `
      ${label(n, 'The challenge')}
      <div class="split">
        <div class="stack">
          <h2 class="h2">${esc(d.challenge.currentHeading || 'Where you are')}</h2>
          ${paras(d.challenge.current, 'lead muted')}
        </div>
        <div>
          <h2 class="h2">${esc(d.challenge.goalsHeading || "Where we're going")}</h2>
          <ol class="steps">${(d.challenge.goals || []).map((g, i) => `
            <li><span class="num">${pad(i + 1)}</span><div><h3>${esc(g.title)}</h3><p>${esc(g.body)}</p></div></li>`).join('')}
          </ol>
        </div>
      </div>`));
  }

  // 03 Scope
  if (d.scope?.length) {
    n++;
    sections.push(section('scope', n, 'Scope', `
      ${label(n, 'Scope')}
      <h2 class="h1">${esc(d.scopeHeading || "What I'll make")}</h2>
      <div class="cards">${d.scope.map((c, i) => `
        <article class="card"><p class="num-sm">${pad(i + 1)}</p><h3 class="h3">${esc(c.title)}</h3><p>${esc(c.body)}</p></article>`).join('')}
      </div>`));
  }

  // 04 Process
  if (d.process?.length) {
    n++;
    sections.push(section('process', n, 'Process', `
      ${label(n, "How we'll work")}
      <div class="headrow"><h2 class="h1">${esc(d.processHeading || `${['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][d.process.length] || d.process.length} phases`)}</h2>
      ${d.processAccent ? `<p class="serif accent">${esc(d.processAccent)}</p>` : ''}</div>
      <div class="phases">${d.process.map((p, i) => `
        <article class="phase"><p class="stat accent">${pad(i + 1)}</p><h3 class="h3">${esc(p.title)}</h3><p class="meta">${esc(p.weeks)}</p><p>${esc(p.body)}</p></article>`).join('')}
      </div>`));
  }

  // 05 Timeline
  if (d.timeline?.phases?.length) {
    n++;
    const W = Math.max(1, Number(d.timeline.weeks) || 10);
    const last = d.timeline.phases.length - 1;
    sections.push(section('timeline', n, 'Timeline', `
      ${label(n, 'Timeline')}
      <div class="headrow"><h2 class="h1">${esc(`${W} weeks`)}</h2>
      ${d.timeline.accent ? `<p class="serif accent">${esc(d.timeline.accent)}</p>` : ''}</div>
      <div class="gantt" style="--weeks:${W}">
        <div class="gantt-row gantt-head"><span></span><div class="track">${Array.from({ length: W }, (_, i) => `<span>W${i + 1}</span>`).join('')}</div></div>
        ${d.timeline.phases.map((p, i) => {
          const start = Math.max(0, Number(p.start) || 0);
          const len = Math.max(1, Number(p.length) || 1);
          return `<div class="gantt-row"><span class="h3">${esc(p.name)}</span><div class="track"><i class="bar${i === last ? ' bar-accent' : ''}" style="--s:${start};--l:${len}"></i></div></div>`;
        }).join('')}
      </div>
      ${d.timeline.milestones?.length ? `<dl class="meta-row">${d.timeline.milestones.map((m) => `<div><dt class="meta">${esc(m.label)}</dt><dd>${esc(m.when)}</dd></div>`).join('')}</dl>` : ''}`));
  }

  // 06 Investment
  if (d.investment) {
    n++;
    const inv = d.investment;
    sections.push(section('investment', n, 'Investment', `
      ${label(n, 'Investment')}
      <div class="invest">
        <div>
          <h2 class="h1">${esc(inv.heading || 'The investment')}</h2>
          <ul class="prices">${(inv.items || []).map((it) => `
            <li><div><p class="item">${esc(it.item)}</p><p class="muted small">${esc(it.detail)}</p></div><p class="item price">${esc(it.price)}</p></li>`).join('')}
          </ul>
        </div>
        <aside class="total">
          <div><p class="meta">Project total</p><p class="stat">${esc(inv.total)}</p></div>
          ${inv.schedule?.length ? `<div><p class="meta">Payment schedule</p>${inv.schedule.map((s) => `<p class="item">${esc(s)}</p>`).join('')}</div>` : ''}
        </aside>
      </div>`));
  }

  // 07 Selected work
  if (d.work?.length) {
    n++;
    sections.push(section('work', n, 'Selected work', `
      ${label(n, 'Selected work')}
      <div class="headrow"><h2 class="h1">${esc(d.workHeading || 'Recent work')}</h2><a class="serif accent link" href="https://www.jtcreative.design" target="_blank" rel="noopener">More at jtcreative.design</a></div>
      <div class="work">${d.work.map((w) => `
        <a class="tile" ${w.url ? `href="${esc(w.url)}" target="_blank" rel="noopener"` : ''}>
          <div class="media">${w.image ? `<img src="${esc(w.image)}" alt="${esc(w.title)}" loading="lazy">` : ''}</div>
          <h3 class="h3">${esc(w.title)}</h3><p class="meta">${esc(w.meta)}</p>
        </a>`).join('')}
      </div>`));
  }

  // 08 Terms
  if (d.terms?.length) {
    n++;
    sections.push(section('terms', n, 'Terms', `
      ${label(n, 'The fine print')}
      <h2 class="h1">Terms</h2>
      <div class="cards">${d.terms.map((c, i) => `
        <article class="card"><p class="num-sm">${pad(i + 1)}</p><h3 class="h3">${esc(c.title)}</h3><p>${esc(c.body)}</p></article>`).join('')}
      </div>`));
  }

  // 09 Next steps
  if (d.nextSteps?.length || d.contact) {
    n++;
    const email = d.contact?.email || '';
    const subject = encodeURIComponent(`Approved: ${d.title || 'Proposal'} (${d.reference || d.client})`);
    // A DocuSign (or any e-sign) link, e.g. a PowerForm. Only https links are used.
    const signUrl = /^https:\/\//i.test(d.contact?.signUrl || '') ? d.contact.signUrl : '';
    const primary = signUrl
      ? `<a class="btn" href="${esc(signUrl)}" target="_blank" rel="noopener noreferrer">${esc(d.contact?.signLabel || 'Review & sign')}</a>`
      : email ? `<a class="btn" href="mailto:${esc(email)}?subject=${subject}">${esc(d.contact?.approveLabel || 'Approve proposal')}</a>` : '';
    sections.push(section('next', n, 'Next steps', `
      ${label(n, 'Next steps')}
      <div class="split">
        <div>
          <h2 class="h1">${esc(d.closingHeading || "Let's make something good.")}</h2>
          <ol class="steps">${(d.nextSteps || []).map((s, i) => `
            <li><span class="num">${pad(i + 1)}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></div></li>`).join('')}
          </ol>
        </div>
        <div class="approve">
          <h2 class="h2">Ready to go?</h2>
          <p class="muted">${signUrl
            ? "Signing opens the agreement in DocuSign. Once it's signed I hold your start date and send the deposit invoice the same day."
            : "Approving tells me to hold your start date. I'll send the deposit invoice the same day."}</p>
          ${primary}
          ${email ? `<p class="muted small">Questions? <a class="link" href="mailto:${esc(email)}">${esc(email)}</a></p>` : ''}
        </div>
      </div>`));
  }

  const tocItems = sections.length ? [...sections.join('').matchAll(/<section class="page[^"]*" id="([^"]+)" aria-label="([^"]+)"/g)] : [];

  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(String(d.title || 'Proposal').replace(/\s*\n\s*/g, ' '))} · ${esc(d.client)} · JT Creative</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Instrument+Serif:ital@1&family=Unbounded:wght@500;700&display=swap" rel="stylesheet">
<style>${selfHostedFonts ? FONT_FACES : ''}${BRAND_CSS}${CURTAIN_CSS}</style>
<script>try{if(sessionStorage.getItem('jtp-unlock')){sessionStorage.removeItem('jtp-unlock');document.documentElement.classList.add('from-unlock');}}catch(e){}</script>
</head>
<body>
<div class="curtain" aria-hidden="true"></div>
${previewBanner}
<header class="topbar">
  <a class="mark" href="#cover" aria-label="Back to top">${MARK_SVG}</a>
  <nav class="toc" aria-label="Sections">${tocItems.map((m) => `<a href="#${m[1]}">${m[2]}</a>`).join('')}</nav>
  <button class="theme" type="button" aria-label="Switch light or dark">Light / Dark</button>
</header>

<section class="page cover" id="cover" aria-label="Cover">
  <div class="cover-pattern" aria-hidden="true"></div>
  <div class="wrap cover-inner">
    <p class="label"><span class="leaf" aria-hidden="true"></span>Project proposal</p>
    <div>
      <h1 class="hero">${String(d.title || 'Proposal').split('\n').map(esc).join('<br>')}</h1>
      <p class="serif accent sub">Prepared for ${esc(d.client)}</p>
    </div>
    <dl class="meta-row">
      ${[['Prepared by', d.preparedBy || 'Josh Turner, JT Creative'], ['Date', d.date], ['Valid until', d.validUntil], ['Reference', d.reference]]
        .filter(([, v]) => v).map(([k, v]) => `<div><dt class="meta">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
  </div>
</section>

${sections.join('\n')}

<footer class="foot wrap">
  <p class="meta">Confidential · prepared for ${esc(d.client)}</p>
  <p class="meta">JT Creative · jtcreative.design</p>
</footer>

<script>${CLIENT_JS}</script>
</body>
</html>`;
}

// Theme toggle (remembered per browser) and gentle reveal on scroll.
const CLIENT_JS = `
(function(){
  var root=document.documentElement;
  try{var t=localStorage.getItem('jtp-theme');if(t)root.setAttribute('data-theme',t);}catch(e){}
  document.querySelector('.theme').addEventListener('click',function(){
    var next=root.getAttribute('data-theme')==='light'?'dark':'light';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem('jtp-theme',next);}catch(e){}
  });
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  root.classList.add('js-reveal');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -10% 0px'});
  document.querySelectorAll('[data-reveal]').forEach(function(s){io.observe(s);});
})();`;

export { TRIO_SVG };
