/* JT mark pen build: the J traced point by point with a pen-tool cursor, ending on the badge.
   Mount: any element with [data-jt-mark-pen]. Plays while in view and loops with a hold on the badge.
   Preview source: portfolio/mark-build/jt-mark-pen.html in the project files. */
(() => {
  const CSS = ".jmp{--jmp-bg:var(--color--bg-primary,#0A0F12);--jmp-fg:var(--color--text-primary,#F7F7F7);--jmp-stroke:var(--color--accent,#DAF40A);--jmp-line:color-mix(in srgb,var(--jmp-fg) 9%,transparent);--jmp-line-2:color-mix(in srgb,var(--jmp-fg) 17%,transparent);--jmp-hatch:color-mix(in srgb,var(--jmp-stroke) 42%,transparent);--jmp-muted:color-mix(in srgb,var(--jmp-fg) 45%,transparent);--jmp-badge:#0A0F12;--jmp-ring:color-mix(in srgb,var(--jmp-fg) 30%,transparent);--jmp-mark:#F7F7F7;position:relative;overflow:hidden;aspect-ratio:640/620;width:100%;max-width:100%}.jmp svg.jmp-stage{position:absolute;inset:0;width:100%;height:100%;overflow:visible;display:block}.jmp .g-line{fill:none;stroke:var(--jmp-line);stroke-width:1;vector-effect:non-scaling-stroke}.jmp .g-line.on,.jmp .c-line{fill:none;stroke:var(--jmp-line-2);stroke-width:1;vector-effect:non-scaling-stroke}.jmp .c-live{stroke:var(--jmp-stroke)}.jmp .ctr{fill:var(--jmp-muted)}.jmp .prim{fill:url(#jmp-hatch);stroke:var(--jmp-stroke);stroke-width:1.2;vector-effect:non-scaling-stroke;fill-opacity:0}.jmp .minus,.jmp .drag,.jmp .union{display:none}.jmp .solid-j,.jmp .solid-d{fill:var(--jmp-mark)}.jmp .anc{fill:var(--jmp-bg);stroke:var(--jmp-stroke);stroke-width:1;vector-effect:non-scaling-stroke}.jmp .anc.sel{fill:var(--jmp-stroke)}.jmp .rub{fill:none;stroke:var(--jmp-stroke);stroke-width:.9;opacity:.75;vector-effect:non-scaling-stroke}.jmp .hdl{stroke:var(--jmp-stroke);stroke-width:.8;vector-effect:non-scaling-stroke;opacity:.7}.jmp .hdl-pt{fill:var(--jmp-stroke)}.jmp .badge{fill:var(--jmp-badge);stroke:var(--jmp-ring);stroke-width:1.2;vector-effect:non-scaling-stroke}.jmp .cur-arrow{fill:var(--jmp-fg);stroke:var(--jmp-bg);stroke-width:1.2;stroke-linejoin:round}.jmp .cur-slit{stroke:var(--jmp-bg);stroke-width:1}.jmp .cur-x-bg{fill:none;stroke:var(--jmp-bg);stroke-width:3.4;stroke-linecap:round}.jmp .cur-x{fill:none;stroke:var(--jmp-fg);stroke-width:1.3;stroke-linecap:round}";
  const MARKUP = "<svg class=\"jmp-stage\" data-id=\"stage\" viewBox=\"-147 -176 640 620\" preserveAspectRatio=\"xMidYMid meet\" role=\"img\" aria-label=\"The JT Creative J mark being drawn by hand in a design tool, from guides and circles to the finished badge\"> <defs> <pattern id=\"jmp-hatch\" patternUnits=\"userSpaceOnUse\" width=\"7\" height=\"7\" patternTransform=\"rotate(45)\"><line x1=\"0\" y1=\"0\" x2=\"0\" y2=\"7\" style=\"stroke:var(--hatch);stroke-width:1.1\"/></pattern> <pattern id=\"jmp-hatch-m\" patternUnits=\"userSpaceOnUse\" width=\"7\" height=\"7\" patternTransform=\"rotate(-45)\"><line x1=\"0\" y1=\"0\" x2=\"0\" y2=\"7\" style=\"stroke:var(--minus);stroke-opacity:.45;stroke-width:1\"/></pattern> </defs> <g data-id=\"world\"> <g data-id=\"guides\"></g> <g data-id=\"circles\"></g> <g data-id=\"badgeG\"><circle class=\"badge\" data-id=\"badge\" cx=\"173\" cy=\"133.5\" r=\"0\"/></g> <g data-id=\"markG\"> <g data-id=\"prims\"></g> <path class=\"drag\" data-id=\"drag\" pathLength=\"1\"/> <path class=\"union\" data-id=\"unionJ\"/> <path class=\"union\" data-id=\"unionD\"/> <path class=\"solid-j\" data-id=\"solidJ\"/> <path class=\"solid-d\" data-id=\"solidD\"/> <g data-id=\"handles\"></g> <g data-id=\"anchors\"></g> </g> </g> <g data-id=\"cursor\"> <g data-id=\"cArrow\"><path class=\"cur-arrow\" d=\"M0 0 L0 17 L4.6 12.6 L7.6 19.4 L10.4 18.2 L7.4 11.6 L13.4 11.4 Z\"/></g> <g data-id=\"cCross\"><path class=\"cur-x-bg\" d=\"M-10 0H-3M3 0H10M0 -10V-3M0 3V10\"/><path class=\"cur-x\" d=\"M-10 0H-3M3 0H10M0 -10V-3M0 3V10\"/></g> <g data-id=\"cPen\"><path class=\"cur-arrow\" d=\"M0 0 L2.6 -8.6 L8.2 -14.2 L14.2 -8.2 L8.6 -2.6 Z\"/><path class=\"cur-slit\" d=\"M0.6 -0.6 L6.4 -6.4\"/><circle class=\"cur-arrow\" cx=\"7.1\" cy=\"-7.1\" r=\"1.5\"/></g> <g data-id=\"cMod\" transform=\"translate(11 6)\"> <g data-id=\"mX\"><path class=\"cur-x-bg\" d=\"M0 0l5 5M5 0l-5 5\"/><path class=\"cur-x\" d=\"M0 0l5 5M5 0l-5 5\"/></g> <g data-id=\"mO\"><circle class=\"cur-x-bg\" cx=\"2.5\" cy=\"2.5\" r=\"2.7\"/><circle class=\"cur-x\" cx=\"2.5\" cy=\"2.5\" r=\"2.7\"/></g> <g data-id=\"mC\"><path class=\"cur-x-bg\" d=\"M0 5L2.5 0L5 5\"/><path class=\"cur-x\" d=\"M0 5L2.5 0L5 5\"/></g> <g data-id=\"mP\" transform=\"translate(2 8)\"><path class=\"cur-x-bg\" d=\"M-4 0H4M0 -4V4\"/><path class=\"cur-x\" d=\"M-4 0H4M0 -4V4\"/></g> <g data-id=\"mM\" transform=\"translate(2 8)\"><path class=\"cur-x-bg\" d=\"M-4 0H4\"/><path class=\"cur-x\" d=\"M-4 0H4\"/></g> </g> </g> </svg>";
  const HOLD = 2.4; // seconds the finished badge stays before the loop restarts
  let instances = [];

  function mount(root) {
    root.classList.add("jmp");
    root.innerHTML = MARKUP;
    const NS='http://www.w3.org/2000/svg';
    const $=id=>root.querySelector('[data-id="'+id+'"]');
    const mk=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e};
    const clamp=v=>v<0?0:v>1?1:v;
    const io=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    const out=p=>1-Math.pow(1-p,3);
    const lin=p=>p;
    const S=0.2483; // lean of every slanted edge (dx per dy) = 76.05 degrees

    // ---- mark geometry (from the JT Creative logo sheet) ----
    const J_START=[87.951,0];
    const J_SEGS=[
     ['L',[236.33,0]],['L',[196.392,160.829]],
     ['C',[179.777,222.007],[123.847,267],[57.408,267]],
     ['L',[0,267]],['L',[22.101,178]],['L',[56.748,178]],
     ['C',[82.455,178],[104.149,160.814],[110.495,137.446]],
     ['L',[118.811,103.961]],
     ['C',[128.657,94.685],[141.925,89],[156.521,89]],
     ['L',[65.85,89]],['L',[87.951,0]]
    ];
    const D_START=[270.33,0];
    const D_SEGS=[['L',[346.33,0]],['L',[324.229,89]],['L',[248.229,89]],['L',[270.33,0]]];
    const segStr=(st,segs)=>'M'+st.join(' ')+segs.map(s=>' '+s[0]+s.slice(1).map(p=>p.join(' ')).join(' ')).join('');
    const J_D=segStr(J_START,J_SEGS)+'Z', D_D=segStr(D_START,D_SEGS)+'Z';

    // ---- elements ----
    const world=$('world'), markG=$('markG'), cursor=$('cursor');
    const R=[]; // reset functions run each frame
    const T=[]; // tweens
    const tw=(t0,d,fn,e=io)=>T.push({t0,d,fn,e});
    const hold=(t0,d,fn)=>T.push({t0,d,fn,e:lin,hold:true});
    const cur={x:-60,y:330,tool:'',tip:'',mod:'',press:0};
    let L={x:-60,y:330};
    // hand moves: a bowed path (wrist arc), minimum-jerk speed, a small overshoot and settle
    let seed=11;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
    const mj=p=>p*p*p*(10-15*p+6*p*p);
    const mv=(t0,d,x,y)=>{
      const a={...L},dx=x-a.x,dy=y-a.y,dist=Math.hypot(dx,dy)||1;
      const bow=(.25+rnd()*.75)*(rnd()<.6?1:-1)*Math.min(dist*.16,34);
      const qx=(a.x+x)/2-dy/dist*bow, qy=(a.y+y)/2+dx/dist*bow;
      const ov=Math.min(dist*.035,3.5), ox=x+dx/dist*ov, oy=y+dy/dist*ov;
      d*=1.15;
      tw(t0-.08,d*.8,p=>{const q=1-p;cur.x=q*q*a.x+2*q*p*qx+p*p*ox;cur.y=q*q*a.y+2*q*p*qy+p*p*oy},mj);
      tw(t0-.08+d*.8,d*.2+.05,p=>{cur.x=ox+(x-ox)*p;cur.y=oy+(y-oy)*p},out);
      L={x,y};
    };
    // camera: centre + zoom, eased slowly so it never lurches
    const HOME={x:173,y:133.5,s:1};
    const cam={...HOME};let C={...HOME};
    const camTo=(t0,d,x,y,s)=>{const a={...C};tw(t0,d,p=>{cam.x=a.x+(x-a.x)*p;cam.y=a.y+(y-a.y)*p;cam.s=a.s*Math.pow(s/a.s,p)},io);C={x,y,s}};
    R.push(()=>Object.assign(cam,HOME));
    const tool=(t,n)=>tw(t,0,()=>{cur.tool=n});
    const tip=(t0,d,f)=>hold(t0,d,p=>{cur.tip=typeof f==='function'?f(p):f});
    const fade=(el,t0,d,to,from)=>{tw(t0,d,p=>{el.style.opacity=from+(to-from)*p})};
    const pt=(n)=>n.toFixed(1);

    // ---- 01 GUIDES ----
    const H_Y=[0,89,124,143.5,178,267];
    const SLANT_X=[66.3,87.951,144.6,236.33,270.33,346.33]; // each slanted edge, measured where it crosses y=0
    const guides=$('guides');
    const gl=[];
    H_Y.forEach(y=>gl.push({a:[-900,y],b:[1250,y],h:1}));
    SLANT_X.forEach(x0=>{ // line through (x0, y0) along the lean; x0 measured at y=0 except bottom-anchored ones
      gl.push({a:[x0+S*800,-800],b:[x0-S*1100,1100],h:0});
    });
    gl.forEach(g=>{g.el=mk('path',{class:'g-line',d:`M${g.a} L${g.b}`,pathLength:1},guides);});
    R.push(()=>gl.forEach(g=>{g.el.style.strokeDasharray='1 1';g.el.style.strokeDashoffset=1;g.el.classList.remove('on')}));
    // draw two horizontals and two slants with the cursor, then the rest fan in
    const drawGuide=(g,t0,d,from,to,label)=>{
      const p0=[g.a[0]+(g.b[0]-g.a[0])*from, g.a[1]+(g.b[1]-g.a[1])*from];
      const p1=[g.a[0]+(g.b[0]-g.a[0])*to, g.a[1]+(g.b[1]-g.a[1])*to];
      mv(t0,.32,p0[0],p0[1]);
      const len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);
      tw(t0+.32,d,p=>{
        g.el.style.strokeDasharray=`${(to-from)*p} 2`;g.el.style.strokeDashoffset=-from;g.el.classList.add('on');
        cur.x=p0[0]+(p1[0]-p0[0])*p;cur.y=p0[1]+(p1[1]-p0[1])*p;
      });
      tip(t0+.32,d+.25,p=>`${pt(len*clamp(p*(d+.25)/d))} pt  ${label}`);
      L={x:p1[0],y:p1[1]};
      tw(t0+.32+d,.5,p=>{g.el.style.strokeDasharray=`${(to-from)+(1-(to-from))*p} 2`;g.el.style.strokeDashoffset=-from*(1-p)},out);
    };
    tool(0,'Line Segment');
    camTo(0,3.2,160,110,1.08);
    fade(cursor,0,.3,1,0);
    drawGuide(gl[0],.15,.55,.40,.66,'0.0°');            // y=0
    drawGuide(gl[5],.95,.55,.40,.66,'0.0°');            // y=267
    drawGuide(gl[6+1],1.75,.5,.33,.47,'76.0°');         // left edge of top bar
    drawGuide(gl[6+3],2.45,.5,.33,.47,'76.0°');         // right edge of J
    gl.forEach((g,i)=>{ if([0,5,7,9].includes(i))return;
      const t=2.95+(i%7)*.06; tw(t,.55,p=>{g.el.style.strokeDasharray=`${p} 2`;g.el.style.strokeDashoffset=0;},out);
    });

    // ---- 02 CIRCLES ----
    const circles=$('circles');
    const CIR=[{c:[57.4,124],r:143},{c:[57.4,124],r:54},{c:[156.5,143.5],r:54.5},{c:[57.4,124],r:89},{c:[156.5,143.5],r:89}];
    CIR.forEach(c=>{c.el=mk('circle',{class:'c-line',cx:c.c[0],cy:c.c[1],r:0},circles);c.dot=mk('circle',{class:'ctr',cx:c.c[0],cy:c.c[1],r:0},circles)});
    R.push(()=>CIR.forEach(c=>{c.el.setAttribute('r',0);c.el.classList.remove('c-live');c.dot.setAttribute('r',0)}));
    tool(3.4,'Ellipse');
    camTo(3.3,1.4,95,135,1.12);
    let tc=3.4;
    CIR.slice(0,3).forEach((c,i)=>{
      mv(tc,.38,c.c[0],c.c[1]);
      tw(tc+.3,.2,p=>c.dot.setAttribute('r',1.8*p));
      const a=-Math.PI/4, d=.7;
      tw(tc+.38,d,p=>{c.el.setAttribute('r',c.r*p);c.el.classList.add('c-live');cur.x=c.c[0]+Math.cos(a)*c.r*p;cur.y=c.c[1]+Math.sin(a)*c.r*p});
      tw(tc+.38+d+.1,0,()=>c.el.classList.remove('c-live'));
      tip(tc+.38,d+.3,p=>`⌀ ${pt(2*c.r*clamp(p*(d+.3)/d))} pt`);
      L={x:c.c[0]+Math.cos(a)*c.r,y:c.c[1]+Math.sin(a)*c.r};
      tc+=1.2;
    });
    CIR.slice(3).forEach((c,i)=>tw(tc-.1+i*.12,.6,p=>c.el.setAttribute('r',c.r*p),out));

    // ---- 03 PEN · GEOMETRY: each shape placed click by click, curves pulled out by dragging handles ----
    const prims=$('prims');
    const arcPt=(c,r,a)=>[c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)];
    const a1=Math.atan2(160.829-124,196.392-57.4);
    const o1=arcPt([57.4,124],143,a1), i1=arcPt([57.4,124],54,a1);
    const kArc=4/3*Math.tan((Math.PI/2-a1)/4), ko=kArc*143, ki=kArc*54;
    const N=(x,y,o)=>({p:[x,y],...o});
    const PR=[
     {nodes:[N(87.951,0),N(236.33,0),N(196.392,160.829,{ho:[179.777,222.007]}),N(57.408,267,{hi:[123.847,267]}),
             N(0,267),N(22.101,178),N(56.748,178,{ho:[82.455,178]}),N(110.495,137.446,{hi:[104.149,160.814]}),
             N(118.811,103.961,{ho:[128.657,94.685]}),N(156.521,89,{hi:[141.925,89]}),N(65.85,89)],
      cams:{0:[165,45,1.32],2:[150,185,1.42],4:[45,215,1.4],6:[95,150,1.55],9:[125,75,1.4]}},
     {nodes:[N(270.33,0),N(346.33,0),N(324.229,89),N(248.229,89)],cams:{0:[297,48,1.3]}}
    ];
    const lerp=(a,b,q)=>[a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q];
    const mirror=(p,h)=>[2*p[0]-h[0],2*p[1]-h[1]];
    const hG=mk('g',{},prims);
    const hEls=[0,1].map(()=>({l:mk('line',{class:'hdl'},hG),c:mk('circle',{class:'hdl-pt',r:2.2},hG)}));
    const tmp=mk('path',{},$('stage'));tmp.style.display='none';
    PR.forEach(pr=>{
      pr.el=mk('path',{class:'prim'},prims);
      pr.rub=mk('path',{class:'rub'},prims);
      pr.anc=pr.nodes.map(nd=>mk('rect',{class:'anc',x:nd.p[0]-3,y:nd.p[1]-3,width:6,height:6},prims));
      pr.st={};
    });
    const minus=mk('circle',{class:'minus',cx:156.5,cy:143.5,r:54.5},prims);
    R.push(()=>{
      PR.forEach(pr=>{pr.st={n:0,rub:false,closed:false,active:-1,q:[],cut:[]};pr.el.style.fillOpacity=0;pr.el.style.opacity=1;pr.anc.forEach(a=>a.style.opacity=0)});
      minus.style.opacity=0;minus.setAttribute('r',0);
    });
    // handles as they stand at this frame: geometry uses out/in, the visible pair also shows the mirrored side
    const hOut=(nd,s,i)=>{const q=s.q[i]||0;if(nd.ho)return lerp(nd.p,nd.ho,q);if(nd.hi&&!s.cut[i]&&q)return lerp(nd.p,mirror(nd.p,nd.hi),q);return null};
    const hIn=(nd,s,i)=>nd.hi?lerp(nd.p,nd.hi,s.q[i]||0):null;
    const seg=(a,ao,b,bi)=>ao||bi?` C${(ao||a.p).join(' ')} ${(bi||b.p).join(' ')} ${b.p.join(' ')}`:` L${b.p.join(' ')}`;
    const POST=[];
    let showHandles=null;
    POST.push(()=>{
      showHandles=null;
      PR.forEach(pr=>{
        const s=pr.st,nd=pr.nodes;
        let d=s.n?'M'+nd[0].p.join(' '):'';
        for(let i=1;i<s.n;i++)d+=seg(nd[i-1],hOut(nd[i-1],s,i-1),nd[i],hIn(nd[i],s,i));
        if(s.closed)d+=seg(nd[nd.length-1],hOut(nd[nd.length-1],s,nd.length-1),nd[0],hIn(nd[0],s,0))+'Z';
        pr.el.setAttribute('d',d);
        if(s.rub&&s.n&&!s.closed){const l=nd[s.n-1],lo=hOut(l,s,s.n-1)||l.p;pr.rub.setAttribute('d',`M${l.p.join(' ')} C${lo.join(' ')} ${cur.x} ${cur.y} ${cur.x} ${cur.y}`);pr.rub.style.opacity=1}
        else pr.rub.style.opacity=0;
        pr.anc.forEach((a,i)=>{a.style.opacity=i<s.n?1:0;a.classList.toggle('sel',i===s.active)});
        if(s.active>=0){const n=nd[s.active],o=hOut(n,s,s.active),h=hIn(n,s,s.active)||(n.ho&&o?mirror(n.p,o):null);
          if(o||h)showHandles={p:n.p,a:o,b:h};}
      });
      hEls.forEach((e,k)=>{const h=showHandles&&(k?showHandles.b:showHandles.a);
        if(h){e.l.setAttribute('x1',showHandles.p[0]);e.l.setAttribute('y1',showHandles.p[1]);e.l.setAttribute('x2',h[0]);e.l.setAttribute('y2',h[1]);e.c.setAttribute('cx',h[0]);e.c.setAttribute('cy',h[1]);e.l.style.opacity=.8;e.c.style.opacity=1}
        else{e.l.style.opacity=0;e.c.style.opacity=0}});
    });
    const click=t=>hold(t-.02,.16,p=>{cur.press=Math.sin(p*Math.PI)});
    const reach=(x,y)=>.16+Math.hypot(x-L.x,y-L.y)/1100;
    const drawPen=(pr,t)=>{
      const s=()=>pr.st;
      pr.nodes.forEach((nd,i)=>{
        const d=reach(nd.p[0],nd.p[1]);
        if(pr.cams&&pr.cams[i])camTo(t-.2,.85,...pr.cams[i]);
        if(i===0)hold(t-.1,d+.15,()=>{cur.mod='x'});
        else hold(t,d+.06,()=>{s().rub=true});
        mv(t,d,nd.p[0],nd.p[1]);
        t+=d+.05+rnd()*.06;
        click(t);
        tw(t,0,()=>{s().n=i+1;s().active=i});
        if(nd.ho||nd.hi){
          const tgt=nd.ho||mirror(nd.p,nd.hi);
          tw(t+.08,.45,q=>{s().q[i]=q;cur.x=nd.p[0]+(tgt[0]-nd.p[0])*q;cur.y=nd.p[1]+(tgt[1]-nd.p[1])*q},mj);
          L={x:tgt[0],y:tgt[1]};
          t+=.6;
          if(!nd.ho){ // alt-click the anchor to drop the out handle, as you would at a cusp
            mv(t,.22,nd.p[0],nd.p[1]);
            hold(t,.4,()=>{cur.mod='^'});
            t+=.3;click(t);
            tw(t,0,()=>{s().cut[i]=true});
            t+=.1;
          }
        }else t+=.06;
      });
      const n0=pr.nodes[0].p, d=reach(n0[0],n0[1]);
      hold(t,d+.12,()=>{s().rub=true;cur.mod='o'});
      mv(t,d,n0[0],n0[1]);
      t+=d+.06;click(t);
      tw(t,0,()=>{s().closed=true;s().active=-1});
      tw(t+.08,.35,p=>{pr.el.style.fillOpacity=p});
      return t+.32;
    };
    tool(7.1,'Pen');
    let tp=7.1;
    PR.forEach(pr=>{tp=drawPen(pr,tp)+.15});
    const tGeoEnd=tp+.2;

    const tRefEnd=tGeoEnd;
    // ---- 06 FINAL ----
    const sJ=$('solidJ'), sD=$('solidD'), badge=$('badge');
    sJ.setAttribute('d',J_D); sD.setAttribute('d',D_D);
    const uJ=$('unionJ'),uD=$('unionD'),anchors=$('anchors'),handles=$('handles');
    R.push(()=>{uJ.style.opacity=0;uD.style.opacity=0;prims.style.opacity=1});
    R.push(()=>{sJ.style.opacity=0;sD.style.opacity=0;markG.setAttribute('transform','');badge.setAttribute('r',0);guides.style.opacity=1;circles.style.opacity=1;anchors.style.opacity=1;handles.style.opacity=1});
    const tf=tRefEnd;
    tool(tf,'Selection');
    camTo(tf,1.6,173,133.5,1);
    mv(tf,.5,330,250);
    tw(tf+.75,.6,p=>{sJ.style.opacity=p;sD.style.opacity=p;prims.style.opacity=1-p;uJ.style.opacity=1-p;uD.style.opacity=1-p;anchors.style.opacity=1-p;handles.style.opacity=1-p});
    tw(tf+.7,.8,p=>{guides.style.opacity=1-p;circles.style.opacity=1-p});
    tw(tf+.9,.35,p=>{cursor.style.opacity=1-p});
    tw(tf+.25,1.1,p=>{badge.setAttribute('r',190*p)},out);
    tw(tf+.25,1.3,p=>{const s=1-.42*p;markG.setAttribute('transform',`translate(173 133.5) scale(${s}) translate(-173 -133.5)`)},out);
    const TOTAL=tf+4.6;

    const CH=[[0,'Guides'],[3.3,'Circles'],[7.0,'Pen'],[tf,'Final']];
    CH.push([TOTAL,'']);

    // ---- renderer ----
    let pxPerUnit=1;
    const measure=()=>{const m=$('stage').getScreenCTM();pxPerUnit=m?m.a:1};
    let lastTool='',lastTip='',lastCh=-1;
    function render(t){
      cur.tool='';cur.tip='';cur.mod='';cur.press=0;
      cursor.style.opacity=0;
      R.forEach(f=>f());
      for(const w of T){
        if(t<w.t0)continue;
        if(w.hold&&t>=w.t0+w.d)continue;
        w.fn(w.e(w.d?clamp((t-w.t0)/w.d):1));
      }
      POST.forEach(f=>f());
      world.setAttribute('transform',`translate(${HOME.x} ${HOME.y}) scale(${cam.s}) translate(${-cam.x} ${-cam.y})`);
      // slight hand tremor, in screen space so zoom doesn't magnify it
      const jx=.55*Math.sin(t*2.1)+.3*Math.sin(t*5.3+1.3)+.12*Math.sin(t*12.7+.4);
      const jy=.5*Math.sin(t*1.7+2)+.28*Math.sin(t*6.1+.7)+.12*Math.sin(t*13.9+2.2);
      const sx=HOME.x+(cur.x-cam.x)*cam.s+jx, sy=HOME.y+(cur.y-cam.y)*cam.s+jy;
      cursor.setAttribute('transform',`translate(${sx} ${sy}) scale(${(1-.14*cur.press)/pxPerUnit})`);
      const kind=cur.tool==='Pen'?'pen':(cur.tool==='Line Segment'||cur.tool==='Ellipse')?'cross':'arrow';
      $('cArrow').style.display=kind==='arrow'?'':'none';$('cCross').style.display=kind==='cross'?'':'none';$('cPen').style.display=kind==='pen'?'':'none';
      const mod=kind==='pen'?cur.mod:cur.tool==='Shape Builder'?(cur.mod==='-'?'-':'+'):'';
      $('mX').style.display=mod==='x'?'':'none';$('mO').style.display=mod==='o'?'':'none';$('mC').style.display=mod==='^'?'':'none';
      $('mP').style.display=mod==='+'?'':'none';$('mM').style.display=mod==='-'?'':'none';
    }

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t = reduce ? TOTAL : 0, last = null, visible = false, raf = 0, dead = false;
    function frame(now) {
      raf = 0;
      if (dead || !visible) { last = null; return; }
      if (last != null) t += (now - last) / 1000;
      last = now;
      if (t > TOTAL + HOLD) t = 0;
      render(Math.min(t, TOTAL));
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && !dead) raf = requestAnimationFrame(frame); };
    const onResize = () => { measure(); render(Math.min(t, TOTAL)); };
    measure();
    render(t);
    addEventListener("resize", onResize);
    let obs = null;
    if (!reduce) {
      if ("IntersectionObserver" in window) {
        obs = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { measure(); kick(); } }, { threshold: 0.3 });
        obs.observe(root);
      } else { visible = true; kick(); }
    }
    return { destroy() { dead = true; if (raf) cancelAnimationFrame(raf); if (obs) obs.disconnect(); removeEventListener("resize", onResize); } };
  }

  function init(scope) {
    if (!document.getElementById("jmp-style")) {
      const st = document.createElement("style");
      st.id = "jmp-style";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    (scope || document).querySelectorAll("[data-jt-mark-pen]").forEach(el => {
      if (el.__jmp) return;
      el.__jmp = mount(el);
      instances.push(el.__jmp);
    });
  }
  function destroyAll() { instances.forEach(i => i.destroy()); instances = []; }

  window.initMarkPen = init;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
  if (typeof barba !== "undefined" && barba.hooks) {
    barba.hooks.before(() => destroyAll());
    barba.hooks.after(data => init(data && data.next && data.next.container ? data.next.container : document));
  }
})();
