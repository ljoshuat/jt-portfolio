// The password screen a client sees before their proposal.
//
// Works as a plain form without JavaScript. With JavaScript it becomes
// interactive: a field of brand leaves that lights up around the pointer,
// leaf "dots" that fill in as you type, a shake on a wrong password, and a
// lime wave that sweeps the screen before the proposal opens.
import { BRAND_CSS, FONT_FACES, LEAF } from './brand.js';
import { esc } from './template.js';

// The open J, split into its two pieces so the square can move on its own.
const MARK = `<svg viewBox="-12.34 -60 350.45 327" aria-hidden="true"><path d="M75.61628,0h148.37872l-39.93821,160.82932c-16.61457,61.17812 -72.54472,106.17068 -138.98345,106.17068h-57.40845l22.10107,-89h35.30738c25.37734,0 46.74075,-17.18563 53.08695,-40.55359l12.03053,-48.44641h-56.67563zM106.47557,103.96121c9.84669,-9.27633 23.11458,-14.96121 37.71024,-14.96121l-33.99498,0z"/><path class="sq" d="M262.11876,0h76l-22.10107,89h-76z"/></svg>`;

const GATE_CSS = `
.gate{position:relative;min-height:100svh;display:grid;place-items:center;padding:var(--pad);overflow:hidden;isolation:isolate}
#field{position:fixed;inset:0;width:100%;height:100%;z-index:-1;display:block}
.gate-box{width:min(100%,440px);position:relative}
.gate-box::before{content:"";position:absolute;inset:-3rem -2.5rem;background:radial-gradient(closest-side,var(--bg) 72%,transparent);z-index:-1;opacity:.95}
.gate .mark svg{width:60px;margin-bottom:2.25rem;overflow:visible;fill:var(--accent)}
.gate .mark .sq{transition:transform .5s cubic-bezier(.3,1.4,.5,1)}
.gate.typing .mark .sq{transform:translate(10px,-38px)}
.gate.ok .mark .sq{transform:none;transition-duration:.35s}
.gate-box .h2{margin-bottom:.75rem}
.gate form{margin-top:2rem;display:grid;gap:1rem}
.pw-wrap{position:relative}
.gate input{width:100%;font:inherit;font-size:1.1rem;background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:var(--r-md);padding:1rem 1.1rem;transition:border-color .2s}
.gate input:focus{outline:2px solid var(--accent);outline-offset:2px}
.js .gate input{color:transparent;caret-color:var(--accent);letter-spacing:.2em}
.js .gate input::selection{background:transparent;color:transparent}
.dots{position:absolute;left:1.1rem;right:1.1rem;top:50%;transform:translateY(-50%);display:flex;gap:6px;pointer-events:none;overflow:hidden}
.dots i{flex:none;width:16px;height:13px;background:var(--accent);-webkit-mask:var(--leaf) center/contain no-repeat;mask:var(--leaf) center/contain no-repeat;animation:pop .28s cubic-bezier(.3,1.6,.5,1)}
@keyframes pop{from{transform:scale(0) rotate(-30deg)}}
.gate .btn{cursor:pointer;font-family:inherit;border:0;transition:transform .15s,opacity .2s}
.gate .btn:active{transform:scale(.98)}
.gate .btn[disabled]{opacity:.6;cursor:progress}
.gate .err{color:#FF7A6B;font-size:.95rem;min-height:1.4em}
.gate.bad .pw-wrap{animation:shake .45s}
.gate.bad input{border-color:#FF7A6B}
@keyframes shake{20%{transform:translateX(-10px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}
.gate.ok .gate-box{transition:opacity .45s .35s,transform .45s .35s;opacity:0;transform:translateY(-12px)}
.hint{color:var(--muted);font-size:.85rem}
@media (prefers-reduced-motion:reduce){.gate .mark .sq,.dots i,.gate.bad .pw-wrap{transition:none;animation:none}}
`;

// demo: used by the local preview only. Any password unlocks and nothing is sent.
// style: 'leaf' (lit leaf field) or 'wave' (dithered wave of angled pixels).
export function renderGate({ client = '', error = '', selfHostedFonts = false, demo = false, style = 'leaf' } = {}) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Proposal · JT Creative</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Instrument+Serif:ital@1&family=Unbounded:wght@500;700&display=swap" rel="stylesheet">
<style>${selfHostedFonts ? FONT_FACES : ''}${BRAND_CSS}${GATE_CSS}</style>
</head>
<body>
<main class="gate${error ? ' bad' : ''}">
  <canvas id="field" aria-hidden="true"></canvas>
  <div class="gate-box">
    <span class="mark">${MARK}</span>
    <p class="label"><span class="leaf" aria-hidden="true"></span>Private proposal</p>
    <h1 class="h2">${client ? `Hello, ${esc(client)}.` : 'Hello.'}</h1>
    <p class="muted">Enter the password from your email to open your proposal.</p>
    <form method="post" autocomplete="off" novalidate>
      <label class="meta" for="pw">Password</label>
      <div class="pw-wrap"><input id="pw" name="password" type="password" required autofocus autocomplete="current-password"><span class="dots" aria-hidden="true"></span></div>
      <p class="err" role="alert" aria-live="assertive">${esc(error)}</p>
      <button class="btn" type="submit">Open proposal</button>
      ${demo ? '<p class="hint">Preview: any password unlocks.</p>' : ''}
    </form>
  </div>
</main>
<script>${GATE_JS.replaceAll('__LEAF__', LEAF).replace('__DEMO__', demo ? 'true' : 'false').replace('__STYLE__', style === 'wave' ? 'wave' : 'leaf')}</script>
</body>
</html>`;
}

const GATE_JS = `
(function(){
  var DEMO=__DEMO__,STYLE='__STYLE__';
  document.documentElement.classList.add('js');
  var gate=document.querySelector('.gate'),form=gate.querySelector('form'),input=gate.querySelector('#pw'),
      dots=gate.querySelector('.dots'),err=gate.querySelector('.err'),btn=gate.querySelector('.btn');
  var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var leaf=new Path2D('__LEAF__');
  dots.style.setProperty('--leaf','url("data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 539 445'><path d='__LEAF__'/></svg>")+'")');

  // Leaf dots that mirror the typed length.
  function sync(){
    var n=Math.min(input.value.length,24);
    while(dots.children.length<n)dots.appendChild(document.createElement('i'));
    while(dots.children.length>n)dots.lastChild.remove();
    gate.classList.toggle('typing',input.value.length>0);
    gate.classList.remove('bad');
  }
  input.addEventListener('input',sync);

  // Background: a slanted grid of leaves that brightens near the pointer.
  var cv=document.getElementById('field'),cx=cv.getContext('2d'),W=0,H=0,dpr=1,cells=[];
  var px=-1e4,py=-1e4,tx=0,ty=0,wave=-1,waveColor='218,244,10',t0=performance.now(),idle=true;
  function size(){
    dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
    cv.width=W*dpr;cv.height=H*dpr;cells=[];
    var w=W<600?64:84,h=w*0.83;
    for(var r=-1;r*h<H+h;r++)for(var c=-1;c*w<W+w;c++)cells.push({x:c*w+(r%2?w*0.42:0),y:r*h,s:w/539*0.8,a:0});
    if(still)draw(0);
  }
  function draw(now){
    var t=(now-t0)/1000;
    if(idle&&!still){tx=W*(0.5+0.32*Math.sin(t*0.35));ty=H*(0.5+0.28*Math.sin(t*0.53+1));}
    else if(!idle){tx=px;ty=py;}
    cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
    var R=Math.max(W,H)*0.33,wr=wave>=0?(now-wave)*1.6:-1;
    for(var i=0;i<cells.length;i++){
      var p=cells[i],dx=p.x+20-tx,dy=p.y+16-ty,d=Math.sqrt(dx*dx+dy*dy);
      var glow=still?0:Math.max(0,1-d/R);glow*=glow;
      var lit=0;
      if(wr>=0){var dw=Math.hypot(p.x-W/2,p.y-H/2);lit=dw<wr?Math.min(1,(wr-dw)/180):0;}
      p.a+=(glow-p.a)*0.12;
      cx.save();cx.translate(p.x,p.y);cx.scale(p.s,p.s);
      cx.fillStyle='rgba(36,46,51,'+(0.55+p.a*0.45)+')';cx.fill(leaf);
      var g=Math.max(p.a*0.5,lit);
      if(g>0.01){cx.fillStyle='rgba('+waveColor+','+g.toFixed(3)+')';cx.fill(leaf);}
      cx.restore();
    }
    if(!still)requestAnimationFrame(draw);
  }

  // Alternative background: a dithered wave drawn with the angled pixel from
  // the J (the square), quantised to ink and lime with a 4x4 ordered dither.
  var BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],ripples=[],level=0,grid=[];
  function sizeWave(){
    dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
    cv.width=W*dpr;cv.height=H*dpr;grid=[];
    var s=W<600?10:12,pw=s*0.86,k=s*0.25,gx=s*1.02,gy=s*1.18;
    grid.s={pw:pw,h:s,k:k};
    for(var r=0;r*gy<H+gy;r++)for(var c=-1;c*gx<W+gx;c++)grid.push({x:c*gx,y:r*gy,b:(BAYER[(r&3)*4+((c+8)&3)]+0.5)/16});
    if(still)drawWave(0);
  }
  function drawWave(now){
    var t=(now-t0)/1000,g=grid.s,lime=new Path2D(),dim=new Path2D();
    if(wave>=0)level=Math.min(1.4,(now-wave)/700);
    ripples=ripples.filter(function(r){return now-r.t<2600;});
    for(var i=0;i<grid.length;i++){
      var p=grid[i],yn=p.y/H;
      var v=Math.pow(yn,1.7)*0.95-0.2
        +0.17*Math.sin(p.x*0.011+t*0.9+yn*3)
        +0.12*Math.sin(p.x*0.004-p.y*0.009-t*0.6);
      if(!idle){var dx=p.x-px,dy=p.y-py;v+=0.42*Math.exp(-(dx*dx+dy*dy)/12800);}
      for(var j=0;j<ripples.length;j++){
        var R=ripples[j],age=(now-R.t)/1000,d=Math.hypot(p.x-R.x,p.y-R.y),front=age*420;
        if(d<front+60&&d>front-160)v+=R.a*(1-age/2.6)*Math.sin((d-front)*0.045)*Math.exp(-d/700);
      }
      v+=level;
      var path=v>p.b?lime:(v>p.b-0.35?dim:null);
      if(path){path.moveTo(p.x+g.k,p.y);path.lineTo(p.x+g.k+g.pw,p.y);path.lineTo(p.x+g.pw,p.y+g.h);path.lineTo(p.x,p.y+g.h);path.closePath();}
    }
    cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
    cx.fillStyle='#1B2328';cx.fill(dim);
    cx.fillStyle='#DAF40A';cx.fill(lime);
    if(!still)requestAnimationFrame(drawWave);
  }
  function drop(x,y,a){if(!still)ripples.push({x:x,y:y,t:performance.now(),a:a||0.6});}
  if(STYLE==='wave'){
    size=sizeWave;draw=drawWave;
    addEventListener('pointerdown',function(e){drop(e.clientX,e.clientY);});
    input.addEventListener('input',function(){var b=input.getBoundingClientRect();drop(b.left+Math.min(b.width-20,24+input.value.length*22),b.top+b.height/2,0.35);});
  }

  addEventListener('resize',function(){size();});
  addEventListener('pointermove',function(e){idle=false;px=e.clientX;py=e.clientY;});
  addEventListener('pointerdown',function(e){idle=false;px=e.clientX;py=e.clientY;});
  document.addEventListener('mouseout',function(e){if(!e.relatedTarget)idle=true;});
  input.addEventListener('focus',function(){if(matchMedia('(pointer:coarse)').matches){var b=input.getBoundingClientRect();idle=false;px=b.left+b.width/2;py=b.top+b.height/2;}});
  size();if(!still)requestAnimationFrame(draw);

  function fail(msg){
    err.textContent=msg;gate.classList.remove('bad');void gate.offsetWidth;gate.classList.add('bad');
    btn.disabled=false;btn.textContent='Open proposal';input.focus();
  }
  function unlock(go){
    gate.classList.add('ok');err.textContent='';btn.textContent='Opening…';
    wave=performance.now();
    if(still){go();return;}
    setTimeout(go,1100);
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!input.value){fail('Enter your password to continue.');return;}
    btn.disabled=true;btn.textContent='Checking…';
    if(DEMO){setTimeout(function(){unlock(function(){btn.textContent='Unlocked';});},500);return;}
    fetch(location.pathname,{method:'POST',body:new URLSearchParams({password:input.value}),credentials:'same-origin',redirect:'follow'})
      .then(function(res){
        if(res.redirected&&res.ok){unlock(function(){location.replace(res.url);});return;}
        if(res.status===429)fail('Too many tries. Wait 15 minutes and try again.');
        else fail("That password didn't match. Check your email and try again.");
      })
      .catch(function(){form.submit();});
  });
})();
`;
