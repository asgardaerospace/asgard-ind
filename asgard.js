/* ============================================================
   ASGARD INDUSTRIES — interactions & motion
   ============================================================ */
(function(){
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const ACCENT = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3e82ff';
  const GOLD   = () => getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#cda45a';

  /* ---------- nav scroll state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* ---------- hero video: reduced motion + user pause control ---------- */
  document.querySelectorAll('video.hero-media').forEach(v=>{
    v.setAttribute('aria-hidden','true');
    if(reduce){ v.removeAttribute('autoplay'); v.pause(); }
    const hero = v.closest('.hero'); if(!hero) return;
    const btn = document.createElement('button');
    btn.className = 'media-toggle';
    const sync = () => {
      const playing = !v.paused;
      btn.textContent = playing ? '❚❚' : '▶';
      btn.setAttribute('aria-label', playing ? 'Pause background video' : 'Play background video');
      btn.setAttribute('aria-pressed', String(!playing));
    };
    btn.addEventListener('click', ()=>{ v.paused ? v.play() : v.pause(); sync(); });
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    sync();
    hero.appendChild(btn);
  });

  /* ---------- mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  if(navToggle){
    navToggle.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav-links a').forEach(a=>{
      a.addEventListener('click', ()=>{ nav.classList.remove('open'); navToggle.setAttribute('aria-expanded','false'); });
    });
  }

  /* ---------- ticker duplicate for seamless loop (decorative marquee:
     hidden from assistive tech so items aren't announced twice) ---------- */
  const ticker = document.getElementById('ticker');
  if(ticker){
    ticker.innerHTML += ticker.innerHTML;
    const strip = ticker.closest('.ticker') || ticker;
    strip.setAttribute('aria-hidden','true');
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
  },{threshold:.16, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* ---------- count-up ---------- */
  function countUp(el){
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const dur = 1400; const t0 = performance.now();
    const ease = t => 1-Math.pow(1-t,3);
    function step(now){
      const p = Math.min(1,(now-t0)/dur);
      el.textContent = Math.round(ease(p)*target) + suffix;
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const cio = new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ countUp(e.target); cio.unobserve(e.target); }});
  },{threshold:.5});
  document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));

  /* ---------- launchbelt mock animations ---------- */
  const lbBars = document.getElementById('lb-bars');
  if(lbBars){
    for(let i=0;i<14;i++){const b=document.createElement('i');b.style.height='10%';lbBars.appendChild(b);}
  }
  const lbWin = document.querySelector('#launchbelt .window, #console .window');
  if(lbWin){
    const wio = new IntersectionObserver((es)=>{
      es.forEach(e=>{ if(!e.isIntersecting) return;
        if(lbBars) [...lbBars.children].forEach((b,i)=>{ setTimeout(()=>{ b.style.transition='height .6s cubic-bezier(.22,.61,.36,1)'; b.style.height=(25+Math.random()*72)+'%'; }, i*55); });
        const p1=document.getElementById('lb-prog'); if(p1){ setTimeout(()=>{p1.style.transition='width 1.4s cubic-bezier(.22,.61,.36,1)';p1.style.width='87%';},200);}
        document.querySelectorAll('[data-prog]').forEach(p=>{ setTimeout(()=>{p.style.transition='width 1.4s cubic-bezier(.22,.61,.36,1)';p.style.width=p.dataset.prog+'%';},400);});
        wio.disconnect();
      });
    },{threshold:.4});
    wio.observe(lbWin);
    // live shuffle of bars
    if(!reduce) setInterval(()=>{ if(lbBars && isInView(lbWin)) { const b=lbBars.children[Math.floor(Math.random()*lbBars.children.length)]; if(b) b.style.height=(25+Math.random()*72)+'%'; } },900);
  }
  function isInView(el){const r=el.getBoundingClientRect();return r.top<innerHeight && r.bottom>0;}

  /* ============================================================
     HERO NETWORK — nodes representing teams, suppliers,
     facilities, and air/sea/land/space systems
     ============================================================ */
  function heroNetwork(){
    const cv = document.getElementById('hero-net'); if(!cv) return;
    const ctx = cv.getContext('2d');
    let W,H,DPR,nodes=[],t=0;
    const COUNT = window.innerWidth<700?34:64;
    const TYPES = ['team','supplier','facility','system'];

    function size(){
      DPR=Math.min(2,devicePixelRatio||1);
      W=cv.clientWidth;H=cv.clientHeight;
      cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    function build(){
      nodes=[];
      for(let i=0;i<COUNT;i++){
        nodes.push({
          x:Math.random()*W, y:Math.random()*H,
          vx:(Math.random()-.5)*.18, vy:(Math.random()-.5)*.18,
          r:Math.random()<.14?2.6:1.4,
          type:TYPES[i%4],
          pulse:Math.random()*Math.PI*2
        });
      }
    }
    let mouse={x:-9999,y:-9999};
    cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;});
    cv.addEventListener('mouseleave',()=>{mouse.x=-9999;mouse.y=-9999;});

    function frame(){
      t+=0.005;
      ctx.clearRect(0,0,W,H);
      const ac=ACCENT(), gd=GOLD();
      // links
      for(let i=0;i<nodes.length;i++){
        const a=nodes[i];
        for(let j=i+1;j<nodes.length;j++){
          const b=nodes[j];
          const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
          if(d<140){
            const o=(1-d/140)*.5;
            ctx.strokeStyle=`rgba(120,150,210,${o*0.5})`;
            ctx.lineWidth=.6;
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          }
        }
      }
      // nodes
      nodes.forEach(n=>{
        n.x+=n.vx;n.y+=n.vy;n.pulse+=0.03;
        if(n.x<0||n.x>W)n.vx*=-1;
        if(n.y<0||n.y>H)n.vy*=-1;
        // mouse attraction
        const mdx=mouse.x-n.x,mdy=mouse.y-n.y,md=Math.hypot(mdx,mdy);
        if(md<150){const f=(1-md/150)*0.4;n.x+=mdx/md*f;n.y+=mdy/md*f;}
        const isHub=n.r>2;
        const col = n.type==='system'? gd : ac;
        const glow=(Math.sin(n.pulse)*0.3+0.7);
        ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,7);
        ctx.fillStyle=hexA(col, isHub?0.95:0.6*glow);
        ctx.fill();
        if(isHub){
          ctx.beginPath();ctx.arc(n.x,n.y,n.r+4+Math.sin(n.pulse)*2,0,7);
          ctx.strokeStyle=hexA(col,0.25);ctx.lineWidth=1;ctx.stroke();
        }
      });
      requestAnimationFrame(frame);
    }
    function hexA(hex,a){
      hex=hex.replace('#','');
      if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
      const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    }
    size();build();
    addEventListener('resize',()=>{size();build();});
    if(reduce){ /* draw single static frame */ frame=()=>{}; }
    requestAnimationFrame(frame);
  }
  heroNetwork();

  /* ============================================================
     DOMAIN MINI-CANVASES — each domain gets a distinct
     animated motif (orbit / waves / grid / lattice)
     ============================================================ */
  function domainViz(){
    document.querySelectorAll('.domain').forEach(d=>{
      const cv=d.querySelector('canvas'); if(!cv) return;
      const ctx=cv.getContext('2d'); const kind=d.dataset.domain;
      let W,H,DPR,t=Math.random()*100;
      function size(){DPR=Math.min(2,devicePixelRatio||1);W=d.clientWidth;H=d.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
      function frame(){
        t+=0.012;ctx.clearRect(0,0,W,H);
        const ac=ACCENT();
        ctx.strokeStyle=ac;ctx.fillStyle=ac;
        if(kind==='air'){ // arcing flight paths
          for(let i=0;i<5;i++){
            ctx.globalAlpha=.18+i*.04;ctx.lineWidth=1;ctx.beginPath();
            for(let x=0;x<=W;x+=6){const y=H*0.7 - Math.sin((x/W)*Math.PI + t + i)* (30+i*8) - i*14;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
            const px=(t*40+i*60)%W; const py=H*0.7-Math.sin((px/W)*Math.PI+t+i)*(30+i*8)-i*14;
            ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(px,py,1.8,0,7);ctx.fill();
          }
        } else if(kind==='sea'){ // wave layers
          for(let i=0;i<4;i++){ctx.globalAlpha=.14+i*.05;ctx.lineWidth=1.2;ctx.beginPath();
            for(let x=0;x<=W;x+=5){const y=H*0.55+i*16+Math.sin(x*0.04+t*1.5+i)*7;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
        } else if(kind==='land'){ // moving lattice grid
          ctx.globalAlpha=.22;ctx.lineWidth=.7;const g=28,off=(t*10)%g;
          for(let x=-g+off;x<W+g;x+=g){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-30,H);ctx.stroke();}
          for(let y=0;y<H;y+=g){ctx.globalAlpha=.10;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
        } else { // space — orbits
          const cx=W*0.5,cy=H*0.55;
          for(let i=1;i<=3;i++){ctx.globalAlpha=.16;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(cx,cy,i*26,i*15,0,0,7);ctx.stroke();
            const a=t*(1.4/i)+i;const px=cx+Math.cos(a)*i*26,py=cy+Math.sin(a)*i*15;ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(px,py,1.8,0,7);ctx.fill();}
          ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(cx,cy,2.4,0,7);ctx.fill();
        }
        ctx.globalAlpha=1;
        if(!reduce) requestAnimationFrame(frame);
      }
      size();addEventListener('resize',size);
      requestAnimationFrame(frame);
    });
  }
  domainViz();

  /* ============================================================
     AMBIENT NETWORKS for resilience + CTA (lighter version)
     ============================================================ */
  function ambientNet(id,density){
    const cv=document.getElementById(id); if(!cv) return;
    const ctx=cv.getContext('2d');let W,H,DPR,pts=[];
    function size(){DPR=Math.min(2,devicePixelRatio||1);W=cv.parentElement.clientWidth;H=cv.parentElement.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);build();}
    function build(){pts=[];const n=Math.round((W*H)/density);for(let i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.14,vy:(Math.random()-.5)*.14,hub:Math.random()<.12});}
    function frame(){ctx.clearRect(0,0,W,H);const ac=ACCENT();
      for(let i=0;i<pts.length;i++){const a=pts[i];for(let j=i+1;j<pts.length;j++){const b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){ctx.strokeStyle=`rgba(110,140,200,${(1-d/130)*.28})`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.hub?2.2:1.1,0,7);ctx.fillStyle=hexA(ac,p.hub?.85:.4);ctx.fill();});
      if(!reduce)requestAnimationFrame(frame);}
    function hexA(hex,a){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return `rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${a})`;}
    size();addEventListener('resize',size);requestAnimationFrame(frame);
  }
  ambientNet('res-net',16000);
  ambientNet('cta-net',12000);

  /* ---------- hero logo subtle parallax ---------- */
  const heroLogo=document.getElementById('hero-logo');
  if(heroLogo && !reduce){
    addEventListener('scroll',()=>{const y=window.scrollY;if(y<window.innerHeight){heroLogo.style.transform=`translateY(${y*0.12}px) rotate(${y*0.01}deg)`;}},{passive:true});
  }

  /* ---------- failsafe: if the page isn't being painted (backgrounded or
     embedded tab), the reveal observer and count-up rAF never fire, which
     would leave content invisible. Show everything statically instead. ---------- */
  function showAll(){
    document.querySelectorAll('.reveal:not(.in)').forEach(function(e){
      e.style.transition='none'; e.classList.add('in');
      e.style.opacity='1'; e.style.transform='none';
    });
    document.querySelectorAll('[data-count]').forEach(function(e){
      e.textContent=e.dataset.count+(e.dataset.suffix||'');
    });
    if(lbBars) [...lbBars.children].forEach(function(b){ b.style.height=(25+Math.random()*72)+'%'; });
    var p1=document.getElementById('lb-prog');
    if(p1 && !p1.style.width) p1.style.width='87%';
  }
  if(document.visibilityState!=='visible') showAll();
  setTimeout(function(){
    if(document.querySelectorAll('.reveal').length &&
       !document.querySelectorAll('.reveal.in').length) showAll();
  },1600);
})();
