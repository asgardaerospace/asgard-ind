/* ============================================================
   ASGARD INDUSTRIES — interactions & motion v2
   Vanilla JS. Scroll-driven, restrained, reduced-motion aware.
   ============================================================ */
(function(){
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));

  /* ---------- nav scroll state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 40);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* ---------- fullscreen menu ---------- */
  const menuBtn = document.querySelector('.nav-toggle');
  const menuScreen = document.getElementById('menu-screen');
  function setMenu(open){
    document.body.classList.toggle('menu-open', open);
    if(menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
    if(menuScreen) menuScreen.setAttribute('aria-hidden', String(!open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  if(menuBtn && menuScreen){
    menuBtn.addEventListener('click', ()=> setMenu(!document.body.classList.contains('menu-open')));
    menuScreen.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>setMenu(false)));
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && document.body.classList.contains('menu-open')){ setMenu(false); menuBtn.focus(); }});
  }

  /* ---------- hero/background video: reduced motion + pause control ---------- */
  document.querySelectorAll('video[data-ambient]').forEach(v=>{
    v.setAttribute('aria-hidden','true');
    if(reduce){ v.removeAttribute('autoplay'); v.pause(); }
    const host = v.closest('.hero, .bleed, .cta'); if(!host) return;
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
    host.appendChild(btn);
  });

  /* ---------- ticker duplicate for seamless loop ---------- */
  const ticker = document.getElementById('ticker');
  if(ticker){
    ticker.innerHTML += ticker.innerHTML;
    const strip = ticker.closest('.ticker') || ticker;
    strip.setAttribute('aria-hidden','true');
  }

  /* ---------- reveal on scroll (text, lines, image masks) ---------- */
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
  },{threshold:.14, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal, .mreveal, .linegrow').forEach(el=>io.observe(el));

  /* ---------- count-up ---------- */
  function countUp(el){
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if(reduce){ el.textContent = target + suffix; return; }
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

  /* ============================================================
     SECTOR SEQUENCE — pinned viewport, scroll advances sectors
     ============================================================ */
  function sectorSeq(){
    const seq = document.querySelector('[data-seq]'); if(!seq) return;
    const imgs = [...seq.querySelectorAll('.seq-media img')];
    const panels = [...seq.querySelectorAll('.seq-panel')];
    const rail = [...seq.querySelectorAll('.seq-rail i')];
    const cur = seq.querySelector('.seq-count .cur');
    const n = panels.length;
    let idx = -1;
    function setIdx(i){
      if(i===idx) return; idx = i;
      imgs.forEach((im,k)=>im.classList.toggle('is-active', k===i));
      panels.forEach((p,k)=>p.classList.toggle('is-active', k===i));
      rail.forEach((r,k)=>r.classList.toggle('done', k<=i));
      if(cur) cur.textContent = String(i+1).padStart(2,'0');
    }
    const mobileMq = window.matchMedia('(max-width:760px)');
    function update(){
      if(mobileMq.matches) return;
      const r = seq.getBoundingClientRect();
      const total = r.height - (window.innerHeight || 1);
      const p = clamp(-r.top/Math.max(1,total), 0, 0.999);
      setIdx(Math.floor(p*n));
    }
    setIdx(0);
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    update();
  }
  sectorSeq();

  /* ============================================================
     LINE TRACING — fill a rail as the visitor moves through it.
     [data-lineprog] gets --p set from scroll progress through
     its parent container.
     ============================================================ */
  const rails = [...document.querySelectorAll('[data-lineprog]')];
  function updateRails(){
    rails.forEach(rail=>{
      const host = rail.closest('.thread, .exec') || rail.parentElement;
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh*0.72 - r.top) / Math.max(1, r.height), 0, 1);
      rail.style.setProperty('--p', reduce ? 1 : p.toFixed(4));
      if(rail.closest('.thread')){
        const nodes = host.querySelectorAll('.thread-node');
        nodes.forEach(node=>{
          const nr = node.getBoundingClientRect();
          const nodeP = (nr.top + nr.height/2 - r.top) / Math.max(1, r.height);
          node.classList.toggle('lit', reduce || nodeP <= p);
        });
      }
    });
  }
  if(rails.length){
    window.addEventListener('scroll', updateRails, {passive:true});
    window.addEventListener('resize', updateRails);
    updateRails();
  }

  /* ============================================================
     PARALLAX — subtle drift on [data-plx] media (factor ~0.06-0.16)
     ============================================================ */
  const plx = [...document.querySelectorAll('[data-plx]')];
  if(plx.length && !reduce){
    let ticking = false;
    function apply(){
      ticking = false;
      const vh = window.innerHeight;
      plx.forEach(el=>{
        const host = el.closest('section,div') || el;
        const r = host.getBoundingClientRect();
        if(r.bottom < 0 || r.top > vh) return;
        const f = parseFloat(el.dataset.plx) || 0.1;
        const centerOff = (r.top + r.height/2) - vh/2;
        el.style.transform = 'translateY(' + (-centerOff*f).toFixed(1) + 'px) scale(' + (1 + f*1.6).toFixed(3) + ')';
      });
    }
    window.addEventListener('scroll', ()=>{ if(!ticking){ ticking=true; requestAnimationFrame(apply); } }, {passive:true});
    apply();
  }

  /* ============================================================
     HORIZONTAL LIFECYCLE STRIP — prev/next controls
     ============================================================ */
  document.querySelectorAll('.hscroll-wrap').forEach(w=>{
    const strip = w.querySelector('.hscroll');
    const prev = w.querySelector('[data-hprev]');
    const next = w.querySelector('[data-hnext]');
    if(!strip) return;
    const step = () => Math.max(260, strip.clientWidth * 0.6);
    prev && prev.addEventListener('click', ()=>strip.scrollBy({left:-step(), behavior: reduce?'auto':'smooth'}));
    next && next.addEventListener('click', ()=>strip.scrollBy({left: step(), behavior: reduce?'auto':'smooth'}));
  });

  /* ---------- launchbelt mock console (launchbelt + partner pages) ---------- */
  const lbBars = document.getElementById('lb-bars');
  if(lbBars){
    for(let i=0;i<14;i++){const b=document.createElement('i');b.style.height='10%';lbBars.appendChild(b);}
  }
  const lbWin = document.querySelector('#launchbelt .window, #console .window');
  function isInView(el){const r=el.getBoundingClientRect();return r.top<innerHeight && r.bottom>0;}
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
    if(!reduce) setInterval(()=>{ if(lbBars && isInView(lbWin)) { const b=lbBars.children[Math.floor(Math.random()*lbBars.children.length)]; if(b) b.style.height=(25+Math.random()*72)+'%'; } },900);
  }

  /* ---------- failsafe: if the page isn't painted (backgrounded tab),
     observers never fire — show everything statically ---------- */
  function showAll(){
    document.querySelectorAll('.reveal:not(.in), .mreveal:not(.in), .linegrow:not(.in)').forEach(function(e){
      e.style.transition='none'; e.classList.add('in');
      e.style.opacity='1'; e.style.transform='none'; e.style.clipPath='none';
    });
    document.querySelectorAll('[data-count]').forEach(function(e){
      e.textContent=e.dataset.count+(e.dataset.suffix||'');
    });
    if(lbBars) [...lbBars.children].forEach(function(b){ b.style.height=(25+Math.random()*72)+'%'; });
    var p1=document.getElementById('lb-prog');
    if(p1 && !p1.style.width) p1.style.width='87%';
    rails.forEach(function(r){ r.style.setProperty('--p',1); });
    document.querySelectorAll('.thread-node').forEach(function(n){ n.classList.add('lit'); });
  }
  if(document.visibilityState!=='visible') showAll();
  setTimeout(function(){
    if(document.querySelectorAll('.reveal').length &&
       !document.querySelectorAll('.reveal.in').length) showAll();
  },1600);
})();
