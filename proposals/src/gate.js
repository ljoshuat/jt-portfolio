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
.gate-box{padding:clamp(1.75rem,5vw,2.75rem);border-radius:var(--r-lg,28px);background:rgba(10,15,18,.55);border:1px solid rgba(247,247,247,.09);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);box-shadow:0 30px 80px rgba(0,0,0,.45),inset 0 1px 0 rgba(247,247,247,.06)}
.gate input{background:rgba(20,26,30,.7)}
.gate .mark svg{width:56px;margin-bottom:2rem;overflow:visible;fill:var(--accent)}
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
.welcome-actions{margin-top:2rem;display:grid;gap:1rem}
.welcome-actions .btn{text-align:center;text-decoration:none}
.js .gate-box{animation:rise .9s cubic-bezier(.2,.8,.2,1) .8s both}
.js .gate .mark svg{animation:lean 1.1s cubic-bezier(.2,.8,.2,1) .9s both}
@keyframes rise{from{opacity:0;transform:translateY(28px)}}
@keyframes lean{from{opacity:0;transform:translate(8%,-6%)}}
@media (prefers-reduced-motion:reduce){.gate .mark .sq,.dots i,.gate.bad .pw-wrap,.js .gate-box,.js .gate .mark svg{transition:none;animation:none}}
`;

// demo: used by the local preview only. Any password unlocks and nothing is sent.
// style: 'leaf' (lit leaf field) or 'wave' (dithered wave of angled pixels).
// welcome: { client, title, href } shows the private-link welcome instead of
// the password form: the browser is already unlocked, the button opens it.
export function renderGate({ client = '', error = '', selfHostedFonts = false, demo = false, style = 'leaf', welcome = null } = {}) {
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
    ${welcome ? `
    <h1 class="h2">Hello, ${esc(welcome.client || 'there')}.</h1>
    <p class="muted">${welcome.title ? `Your proposal for ${esc(welcome.title)} is ready.` : 'Your proposal is ready.'}</p>
    <div class="welcome-actions">
      <a class="btn" id="open" href="${esc(welcome.href)}">Open proposal</a>
      ${demo ? '<p class="hint">Preview of the private-link welcome.</p>' : ''}
    </div>` : `
    <h1 class="h2">${client ? `Hello, ${esc(client)}.` : 'Hello.'}</h1>
    <p class="muted">Enter the password from your email to open your proposal.</p>
    <form method="post" autocomplete="off" novalidate>
      <label class="meta" for="pw">Password</label>
      <div class="pw-wrap"><input id="pw" name="password" type="password" required autofocus autocomplete="current-password"><span class="dots" aria-hidden="true"></span></div>
      <p class="err" role="alert" aria-live="assertive">${esc(error)}</p>
      <button class="btn" type="submit">Open proposal</button>
      ${demo ? '<p class="hint">Preview: any password unlocks.</p>' : ''}
    </form>`}
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
  if(dots)dots.style.setProperty('--leaf','url("data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 539 445'><path d='__LEAF__'/></svg>")+'")');

  // Leaf dots that mirror the typed length.
  function sync(){
    var n=Math.min(input.value.length,24);
    while(dots.children.length<n)dots.appendChild(document.createElement('i'));
    while(dots.children.length>n)dots.lastChild.remove();
    gate.classList.toggle('typing',input.value.length>0);
    gate.classList.remove('bad');
  }
  if(input)input.addEventListener('input',sync);

  // Background: the loader's pattern. Large leaves tile the screen on the
  // brand slant (same spacing as the site loader and process video), each in
  // one of three tonal inks. Now and then a single leaf fades up to lime and
  // back. Leaves under the pointer light up too.
  var cv=document.getElementById('field'),cx=cv.getContext('2d'),W=0,H=0,dpr=1,cells=[],TS=0.3;
  var px=-1e4,py=-1e4,tx=0,ty=0,wave=-1,t0=performance.now(),idle=true;
  var TONAL=[['#1F262A',.3],['#181E22',.4],['#13191C',.3]],LIT=0.7;
  function hh(k,r){var x=(Math.imul(k,73856093)^Math.imul(r,19349663))>>>0;x=Math.imul(x^(x>>>13),0x5bd1e995)>>>0;return((x^(x>>>15))&0xffff)/65535;}
  function pick(pal,v){var a=0;for(var i=0;i<pal.length;i++){a+=pal[i][1];if(v<=a)return pal[i][0];}return pal[2][0];}
  function size(){
    dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
    cv.width=W*dpr;cv.height=H*dpr;cells=[];
    TS=(W<600?72:Math.min(120,W/12))/428.4;
    var cs=428.4*TS,rs=445*TS,sl=111.0667*TS,G=0.972;
    for(var r=-1;r*rs<H+rs;r++)for(var k=-2;k*cs-r*sl<W+cs;k++){
      var x=k*cs-r*sl;if(x+539*TS<0)continue;
      var i=cells.length,per=5+hh(i,1)*10;
      cells.push({x:x+269.5*TS*(1-G),y:r*rs+222.5*TS*(1-G),s:TS*G,cx:x+269.5*TS,cy:r*rs+222.5*TS,
        col:pick(TONAL,hh(k+50,r+50)),a:0,per:per,ph:hh(i,2)*per});
    }
    if(still)draw(0);
  }
  function draw(now){
    var t=still?0:(now-t0)/1000;
    if(!idle){tx=px;ty=py;}else{tx=ty=-1e4;}
    cx.setTransform(dpr,0,0,dpr,0,0);cx.fillStyle='#0A0F12';cx.fillRect(0,0,W,H);
    var R=110,wr=wave>=0?(now-wave)*1.6:-1;
    for(var i=0;i<cells.length;i++){
      var p=cells[i];
      var flash=0;if(!still){var cyc=Math.floor((t+p.ph)/p.per),f=((t+p.ph)%p.per)/2.4;
        if(hh(i,cyc+11)<0.35&&f<1)flash=Math.sin(Math.PI*f)*LIT;}
      var dx=p.cx-tx,dy=p.cy-ty,glow=Math.max(0,1-Math.sqrt(dx*dx+dy*dy)/R)*LIT;
      p.a+=(glow-p.a)*0.15;
      var lit=0;if(wr>=0){var dw=Math.hypot(p.cx-W/2,p.cy-H/2);lit=dw<wr?Math.min(1,(wr-dw)/180):0;}
      cx.save();cx.translate(p.x,p.y);cx.scale(p.s,p.s);
      cx.fillStyle=p.col;cx.fill(leaf);
      var g=Math.max(p.a,lit,flash);
      if(g>0.01){cx.fillStyle='rgba(218,244,10,'+g.toFixed(3)+')';cx.fill(leaf);}
      cx.restore();
    }
    if(!still)requestAnimationFrame(draw);
  }

  // Alternative background: a halftone wave in the About page's style
  // (portfolio/halftone/halftone-portrait.js): tone sets each dot's size,
  // dots spring away from the pointer, a tap sends a ripple. Each dot is the
  // angled pixel from the J.
  var ripples=[],level=0,D=null,N=0,SP=6,intro0=0;
  var SPRING=0.085,DAMP=0.82,REACH=96,PUSH=0.4,MIN_DOT=0.06;
  function sizeWave(){
    dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
    cv.width=W*dpr;cv.height=H*dpr;
    SP=W<600?6:7;
    var cols=Math.ceil(W/SP)+1,rows=Math.ceil(H/SP)+1;N=cols*rows;D=new Float32Array(N*6);
    for(var r=0,i=0;r<rows;r++)for(var c=0;c<cols;c++,i+=6){D[i]=D[i+2]=c*SP+SP/2;D[i+1]=D[i+3]=r*SP+SP/2;}
    intro0=performance.now();
    if(still)drawWave(0);
  }
  function drawWave(now){
    var t=(now-t0)/1000,max=SP*0.5,k=0.25,path=new Path2D();
    if(wave>=0)level=Math.min(1.6,(now-wave)/650);
    ripples=ripples.filter(function(r){return now-r.t<2400;});
    var intro=still?1:Math.min(1,(now-intro0)/1400),maxD=Math.hypot(W,H)/2;
    for(var i=0;i<N*6;i+=6){
      var hx=D[i],hy=D[i+1],x=D[i+2],y=D[i+3],yn=hy/H;
      var v=Math.pow(yn,1.6)*1.05-0.22
        +0.16*Math.sin(hx*0.011+t*0.9+yn*3)
        +0.11*Math.sin(hx*0.004-hy*0.009-t*0.6);
      for(var j=0;j<ripples.length;j++){
        var R=ripples[j],age=(now-R.t)/1000,d=Math.hypot(hx-R.x,hy-R.y),front=age*420;
        if(d<front+60&&d>front-160)v+=R.a*(1-age/2.4)*Math.sin((d-front)*0.045)*Math.exp(-d/700);
      }
      v+=level;
      // Spring away from the pointer, like the About portrait.
      var tx=hx,ty=hy;
      if(!idle&&!still){var dx=hx-px,dy=hy-py,dd=Math.sqrt(dx*dx+dy*dy);
        if(dd<REACH&&dd>0.01){var f=(1-dd/REACH)*REACH*PUSH;tx+=dx/dd*f;ty+=dy/dd*f;}}
      if(still){x=tx;y=ty;}else{
        D[i+4]=(D[i+4]+(tx-x)*SPRING)*DAMP;D[i+5]=(D[i+5]+(ty-y)*SPRING)*DAMP;x+=D[i+4];y+=D[i+5];
        D[i+2]=x;D[i+3]=y;}
      var tone=v<0?0:v>1?1:v;if(tone<MIN_DOT)continue;
      var rv=1;if(intro<1){rv=Math.min(1,Math.max(0,intro*1.6-Math.hypot(hx-W/2,hy-H/2)/maxD*0.6));rv=rv*rv*(3-2*rv);}
      var h=Math.sqrt(tone)*max*rv;if(h<0.25)continue;
      var w=h*0.86,o=h*k*2;
      path.moveTo(x-w+o/2,y-h);path.lineTo(x+w+o/2,y-h);path.lineTo(x+w-o/2,y+h);path.lineTo(x-w-o/2,y+h);path.closePath();
    }
    cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
    cx.fillStyle='#DAF40A';cx.fill(path);
    if(!still)requestAnimationFrame(drawWave);
  }
  function drop(x,y,a){if(!still)ripples.push({x:x,y:y,t:performance.now(),a:a||0.6});}
  if(STYLE==='wave'){
    size=sizeWave;draw=drawWave;
    addEventListener('pointerdown',function(e){drop(e.clientX,e.clientY);});
    if(input)input.addEventListener('input',function(){var b=input.getBoundingClientRect();drop(b.left+Math.min(b.width-20,24+input.value.length*22),b.top+b.height/2,0.35);});
  }

  addEventListener('resize',function(){size();});
  addEventListener('pointermove',function(e){idle=false;px=e.clientX;py=e.clientY;});
  addEventListener('pointerdown',function(e){idle=false;px=e.clientX;py=e.clientY;});
  document.addEventListener('mouseout',function(e){if(!e.relatedTarget)idle=true;});
  if(input)input.addEventListener('focus',function(){if(matchMedia('(pointer:coarse)').matches){var b=input.getBoundingClientRect();idle=false;px=b.left+b.width/2;py=b.top+b.height/2;}});
  size();if(!still)requestAnimationFrame(draw);

  function fail(msg){
    err.textContent=msg;gate.classList.remove('bad');void gate.offsetWidth;gate.classList.add('bad');
    btn.disabled=false;btn.textContent='Open proposal';input.focus();
  }
  function unlock(go){
    gate.classList.add('ok');if(err)err.textContent='';btn.textContent='Opening…';
    wave=performance.now();
    if(still){go();return;}
    setTimeout(go,1100);
  }

  // Private-link welcome: already unlocked, the button just plays the unlock.
  var open=document.getElementById('open');
  if(open)open.addEventListener('click',function(e){
    e.preventDefault();gate.classList.add('typing');
    setTimeout(function(){unlock(function(){if(DEMO){btn.textContent='Opened';return;}location.replace(open.href);});},250);
  });

  if(form)form.addEventListener('submit',function(e){
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
