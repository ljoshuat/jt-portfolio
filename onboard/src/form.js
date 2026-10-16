// The onboarding form and the thank-you page.
//
// Works as a plain HTML form without JavaScript. With JavaScript it adds a
// progress bar, a check of required answers before sending, and a draft that
// is kept in this browser until the form is sent.

import { BRAND_CSS, FONT_FACES, MARK_SVG, leafUri } from './brand.js';
import { SECTIONS } from './options.js';

export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const pad = (n) => String(n).padStart(2, '0');

const FORM_CSS = `
.cover{min-height:auto;padding:clamp(3rem,8vw,7rem) 0 clamp(2.5rem,6vw,5rem)}
.cover-inner{gap:1.5rem}
.cover .lead{max-width:38ch}
.topbar .progress{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--border)}
.progress i{display:block;height:100%;background:var(--accent);transform:scaleX(0);transform-origin:0 50%;will-change:transform}
.step{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--gray);white-space:nowrap;font-variant-numeric:tabular-nums}
.step b{color:var(--accent);font-weight:500}
.step span{margin-left:.5rem}
.toc a.on{color:var(--accent)}
@media (min-width:768px){.step span{display:none}}
.q-section{display:grid;gap:clamp(1.5rem,4vw,5rem);grid-template-columns:1fr}
@media (min-width:900px){.q-section{grid-template-columns:minmax(0,1fr) minmax(0,1.6fr)}.q-head{position:sticky;top:6rem;align-self:start}}
.q-head .muted{max-width:32ch}
.fields{display:grid;gap:1.75rem;grid-template-columns:1fr}
@media (min-width:600px){.fields{grid-template-columns:1fr 1fr}.f-wide{grid-column:1/-1}}
.f{display:grid;gap:.6rem;align-content:start;border:0;min-width:0}
.f>label,.f>legend{font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--gray);font-weight:500;padding:0}
.f>legend{margin-bottom:.6rem}
.req{color:var(--accent);margin-left:.25rem}
.f input:not([type=radio]):not([type=checkbox]),.f textarea,.f select{width:100%;font:inherit;font-size:1.05rem;font-weight:400;background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:var(--r-md);padding:.95rem 1.1rem;transition:border-color .3s}
.f textarea{min-height:8rem;resize:vertical;line-height:1.4}
.f select{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--gray) 50%),linear-gradient(135deg,var(--gray) 50%,transparent 50%);background-position:calc(100% - 1.4rem) 55%,calc(100% - 1rem) 55%;background-size:.4rem .4rem;background-repeat:no-repeat;padding-right:2.5rem}
.f input:focus-visible,.f textarea:focus-visible,.f select:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-color:transparent}
.f ::placeholder{color:var(--muted)}
.f input[type=date]{color-scheme:dark}
[data-theme="light"] .f input[type=date]{color-scheme:light}
.hint{color:var(--muted);font-size:.85rem}
.chips{display:flex;flex-wrap:wrap;gap:.6rem}
.chip{position:relative}
.chip input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.chip span{display:inline-flex;align-items:center;gap:.55rem;border:1px solid var(--border);border-radius:999px;padding:.7rem 1.1rem;font-size:.98rem;font-weight:400;color:var(--text);transition:background .3s,color .3s,border-color .3s;user-select:none}
.chip span::before{content:"";width:12px;height:10px;flex:none;background:var(--muted);-webkit-mask:${leafUri('#000')} center/contain no-repeat;mask:${leafUri('#000')} center/contain no-repeat;transition:background .3s,transform .3s var(--ease)}
.chip:hover span{border-color:var(--gray)}
.chip input:checked+span{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.chip input:checked+span::before{background:var(--on-accent);transform:rotate(-12deg) scale(1.1)}
.chip input:focus-visible+span{outline:2px solid var(--accent);outline-offset:3px}
.err{color:#FF7A6B;font-size:.9rem}
.f.bad input:not([type=radio]):not([type=checkbox]),.f.bad textarea{border-color:#FF7A6B}
.f.bad .chip span{border-color:#FF7A6B}
.alert{background:var(--panel);border:1px solid #FF7A6B;border-radius:var(--r-md);padding:1rem 1.25rem;margin-top:2rem}
.send{display:grid;gap:1.25rem;justify-items:start}
.send .btn{cursor:pointer;font-family:inherit}
.send .btn[disabled]{opacity:.6;cursor:progress}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.draft{font-size:.85rem;color:var(--muted);min-height:1.2em}
.thanks{min-height:100svh;display:grid;align-items:center}
.thanks .steps{margin-top:2.5rem;max-width:720px}
@media (prefers-reduced-motion:reduce){.chip span,.chip span::before{transition:none}}
`;

function head(title, selfHostedFonts) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Instrument+Serif:ital@1&family=Unbounded:wght@500;700&display=swap" rel="stylesheet">
<style>${selfHostedFonts ? FONT_FACES : ''}${BRAND_CSS}${FORM_CSS}</style>
<script>try{var t=localStorage.getItem('jtp-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
</head>`;
}

const topbar = (progress = false) => `<header class="topbar">
  <a class="mark" href="https://www.jtcreative.design" aria-label="JT Creative">${MARK_SVG}</a>
  <nav class="toc" aria-label="Sections">${SECTIONS.map((s, i) => `<a href="#${s.id}">${pad(i + 1)} ${esc(s.title)}</a>`).join('')}</nav>
  ${progress ? `<p class="step" aria-live="polite"><b>${pad(1)}</b> / ${pad(SECTIONS.length)}<span>${esc(SECTIONS[0].title)}</span></p>` : ''}
  <button class="theme" type="button" aria-label="Switch light or dark">Light / Dark</button>
  ${progress ? '<div class="progress" aria-hidden="true"><i></i></div>' : ''}
</header>`;

function field(f, values, errors) {
  const v = values[f.name];
  const err = errors[f.name];
  const id = `f-${f.name}`;
  const req = f.required ? '<span class="req" aria-hidden="true">*</span>' : '';
  const hint = f.hint ? `<p class="hint">${esc(f.hint)}</p>` : '';
  const errHtml = `<p class="err" id="${id}-err" role="alert">${err ? esc(err) : ''}</p>`;
  const wide = f.type === 'textarea' || f.type === 'radio' || f.type === 'checkbox' ? ' f-wide' : '';
  const cls = `f${wide}${err ? ' bad' : ''}`;
  const aria = `aria-describedby="${id}-err"${err ? ' aria-invalid="true"' : ''}`;

  if (f.type === 'radio' || f.type === 'checkbox') {
    const picked = f.type === 'checkbox' ? v || [] : [v];
    const chips = f.options
      .map((o, i) => `<label class="chip"><input type="${f.type}" name="${f.name}" value="${esc(o)}"${picked.includes(o) ? ' checked' : ''}${f.required && f.type === 'radio' && i === 0 ? ' required' : ''}><span>${esc(o)}</span></label>`)
      .join('');
    return `<fieldset class="${cls}" data-field="${f.name}"${f.required ? ' data-required' : ''} ${aria}><legend>${esc(f.label)}${req}</legend>${hint}<div class="chips">${chips}</div>${errHtml}</fieldset>`;
  }

  const common = `id="${id}" name="${f.name}"${f.required ? ' required' : ''}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ''} ${aria}`;
  let input;
  if (f.type === 'textarea') input = `<textarea ${common}>${esc(v)}</textarea>`;
  else if (f.type === 'select') {
    input = `<select ${common}><option value="">Choose one</option>${f.options.map((o) => `<option${v === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else input = `<input type="${f.type}" ${common} value="${esc(v)}">`;
  return `<div class="${cls}" data-field="${f.name}"${f.required ? ' data-required' : ''}><label for="${id}">${esc(f.label)}${req}</label>${hint}${input}${errHtml}</div>`;
}

// client: optional { name, company, email, slug } from a personal invite link.
export function renderForm({ values = {}, errors = {}, client = null, selfHostedFonts = false, action = '/', demo = false } = {}) {
  const prefill = { name: client?.contact || '', company: client?.company || '', email: client?.email || '', ...values };
  const hasErrors = Object.keys(errors).length > 0;
  const hello = client?.contact ? `Hello, ${esc(client.contact.split(' ')[0])}.` : 'Hello.';

  const sections = SECTIONS.map(
    (s, i) => `<section class="page" id="${s.id}" aria-labelledby="${s.id}-h" data-reveal>
  <div class="wrap q-section">
    <div class="q-head">
      <p class="label"><span class="leaf" aria-hidden="true"></span>${pad(i + 1)} / ${pad(SECTIONS.length)}</p>
      <h2 class="h2" id="${s.id}-h">${esc(s.title)}</h2>
      <p class="muted">${esc(s.intro)}</p>
    </div>
    <div class="fields">${s.fields.map((f) => field(f, prefill, errors)).join('')}</div>
  </div>
</section>`,
  ).join('\n');

  return `${head('Start a project · JT Creative', selfHostedFonts)}
<body>
${topbar(true)}
<main>
<section class="page cover" aria-label="Welcome">
  <div class="cover-pattern" aria-hidden="true"></div>
  <div class="wrap cover-inner">
    <p class="label"><span class="leaf" aria-hidden="true"></span>Client onboarding${client?.company ? ` · ${esc(client.company)}` : ''}</p>
    <h1 class="hero">${hello}<br><span class="accent">Let's begin.</span></h1>
    <p class="lead muted">A few questions so I can plan your project and come back with the right scope. It takes about ten minutes, and your answers are saved in this browser as you go.</p>
    ${hasErrors ? '<p class="alert" role="alert">A few answers need another look. They are marked below.</p>' : ''}
  </div>
</section>
<form method="post" action="${esc(action)}" novalidate${demo ? ' data-demo' : ''}>
${client?.slug ? `<input type="hidden" name="invite" value="${esc(client.slug)}">` : ''}
<div class="hp" aria-hidden="true"><label>Leave this empty<input name="company_url" tabindex="-1" autocomplete="off"></label></div>
${sections}
<section class="page" aria-label="Send">
  <div class="wrap send">
    <p class="serif">That's everything.</p>
    <p class="muted">I'll read it and reply within two business days.</p>
    <button class="btn" type="submit">Send to Josh</button>
    <p class="draft" aria-live="polite"></p>
  </div>
</section>
</form>
</main>
<footer class="wrap foot small muted"><span>JT Creative · Josh Turner</span><a class="link" href="https://www.jtcreative.design">jtcreative.design</a></footer>
<script>${FORM_JS}</script>
</body>
</html>`;
}

export function renderThanks({ name = '', selfHostedFonts = false } = {}) {
  const steps = [
    ['I read your answers', 'I go through everything, including the links and files you shared.'],
    ['We talk', 'A short call to fill in the gaps and agree on priorities.'],
    ['You get a proposal', 'Scope, timeline and investment, on its own private page.'],
  ];
  return `${head('Thank you · JT Creative', selfHostedFonts)}
<body>
${topbar().replace(/<nav[\s\S]*?<\/nav>/, '<span style="flex:1"></span>')}
<main class="page cover thanks">
  <div class="cover-pattern" aria-hidden="true"></div>
  <div class="wrap cover-inner">
    <p class="label"><span class="leaf" aria-hidden="true"></span>Received</p>
    <h1 class="hero">Thank you${name ? `, ${esc(name.split(' ')[0])}` : ''}.</h1>
    <p class="lead muted">Your answers are with me. Here's what happens next.</p>
    <ol class="steps">${steps.map(([h, p], i) => `<li><span class="num">${pad(i + 1)}</span><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></li>`).join('')}</ol>
  </div>
</main>
<script>try{localStorage.removeItem('jto-draft');}catch(e){}${THEME_JS}</script>
</body>
</html>`;
}

const THEME_JS = `
(function(){var root=document.documentElement,b=document.querySelector('.theme');if(!b)return;
b.addEventListener('click',function(){var next=root.getAttribute('data-theme')==='light'?'dark':'light';root.setAttribute('data-theme',next);try{localStorage.setItem('jtp-theme',next);}catch(e){}});})();
`;

const FORM_JS = `${THEME_JS}
(function(){
  var form=document.querySelector('form'),bar=document.querySelector('.progress i'),note=document.querySelector('.draft'),btn=form.querySelector('[type=submit]');
  var KEY='jto-draft',still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Section reveals, same as the proposal pages.
  document.documentElement.classList.add('js-reveal');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -10% 0px'});
  document.querySelectorAll('[data-reveal]').forEach(function(s){io.observe(s);});

  function filled(box){
    var els=box.querySelectorAll('input,textarea,select');
    for(var i=0;i<els.length;i++){var el=els[i];if(el.type==='radio'||el.type==='checkbox'){if(el.checked)return true;}else if(el.value.trim())return true;}
    return false;
  }
  var boxes=[].slice.call(form.querySelectorAll('[data-field]'));
  // Progress follows your place in the form: the bar fills as you scroll
  // from the first question to Send, and the counter names the section.
  var secs=[].slice.call(form.querySelectorAll('section[id]')),links=[].slice.call(document.querySelectorAll('.toc a')),
      step=document.querySelector('.step'),stepN=step.querySelector('b'),stepT=step.querySelector('span'),cur=-1,ticking=false;
  function progress(){
    ticking=false;
    var top=secs[0].getBoundingClientRect().top+scrollY,end=form.getBoundingClientRect().bottom+scrollY-innerHeight;
    var p=end>top?(scrollY-top+innerHeight*0.35)/(end-top+innerHeight*0.35):1;
    bar.style.transform='scaleX('+Math.max(0,Math.min(1,p)).toFixed(4)+')';
    var line=innerHeight*0.4,i=0;
    secs.forEach(function(s,k){if(s.getBoundingClientRect().top<line)i=k;});
    if(i!==cur){cur=i;stepN.textContent=(i<9?'0':'')+(i+1);stepT.textContent=secs[i].querySelector('h2').textContent;
      links.forEach(function(a,k){a.classList.toggle('on',k===i);});}
  }
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(progress);}}
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);

  // Draft: kept in this browser only, cleared once the form is sent.
  function save(){
    var d={};new FormData(form).forEach(function(v,k){if(k==='company_url'||k==='invite')return;(d[k]=d[k]||[]).push(v);});
    try{localStorage.setItem(KEY,JSON.stringify(d));note.textContent='Draft saved in this browser.';}catch(e){}
  }
  function restore(){
    var d;try{d=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
    if(!d)return;
    Object.keys(d).forEach(function(k){
      var els=form.querySelectorAll('[name="'+k+'"]');
      els.forEach(function(el){
        if(el.type==='radio'||el.type==='checkbox')el.checked=d[k].indexOf(el.value)>-1;
        else if(!el.value)el.value=d[k][0];
      });
    });
    note.textContent='Picked up where you left off.';
  }
  if(!form.querySelector('.bad'))restore();
  var t;form.addEventListener('input',function(e){
    var box=e.target.closest('[data-field]');if(box&&filled(box)){box.classList.remove('bad');var er=box.querySelector('.err');if(er)er.textContent='';}
    clearTimeout(t);t=setTimeout(save,400);
  });
  progress();

  form.addEventListener('submit',function(e){
    var first=null;
    boxes.forEach(function(box){
      var er=box.querySelector('.err'),msg='';
      if(box.hasAttribute('data-required')&&!filled(box))msg=box.tagName==='FIELDSET'?'Pick one.':'Required.';
      var em=box.querySelector('input[type=email]');
      if(!msg&&em&&em.value&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(em.value))msg='Check this email address.';
      box.classList.toggle('bad',!!msg);if(er)er.textContent=msg;
      if(msg&&!first)first=box;
    });
    if(first){
      e.preventDefault();
      first.scrollIntoView({behavior:still?'auto':'smooth',block:'center'});
      var f=first.querySelector('input,textarea,select');if(f)f.focus({preventScroll:true});
      return;
    }
    if(form.hasAttribute('data-demo')){e.preventDefault();btn.textContent='Preview: not sent';return;}
    btn.disabled=true;btn.textContent='Sending…';
  });
})();
`;
