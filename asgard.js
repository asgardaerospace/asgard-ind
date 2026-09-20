/* ============================================================
   ASGARD INDUSTRIES — interactions & motion v2
   Vanilla JS. Scroll-driven, restrained, reduced-motion aware.
   ============================================================ */
(function(){
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
  const isOnScreen = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < (window.innerHeight||0); };

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
  /* Videos ship with preload="none" and no autoplay attribute, so nothing downloads during
     parse and the poster stays the LCP element. Motion starts only when it is wanted:
     not with reduced motion, Save-Data, or a 2G/3G connection. */
  const conn = navigator.connection;
  const constrained = !!(conn && (conn.saveData || /(^|-)2g$|^3g$/.test(conn.effectiveType || '')));
  const motionOK = !reduce && !constrained;
  const canStart = v => v.dataset.wanted==='1' && !v.dataset.done && (!v.hasAttribute('data-autoplay') || v.dataset.armed==='1');
  /* Observe an unclipped ancestor: a video inside .mreveal starts at clip-path inset(0 100% 0 0),
     and Chromium does not re-run intersection when that clip animates open without a scroll. */
  const vTarget = new Map();
  const vio = 'IntersectionObserver' in window ? new IntersectionObserver((es)=>{
    es.forEach(e=>{
      const v = vTarget.get(e.target);
      if(e.isIntersecting){ if(canStart(v)) v.play().catch(()=>{}); }
      else if(!v.paused){ v.dataset.wanted='1'; v.pause(); }
    });
  },{threshold:.15}) : null;
  const heroVideos = [];
  document.querySelectorAll('video[data-ambient]').forEach(v=>{
    v.setAttribute('aria-hidden','true');
    /* WebKit removes the poster when play() is called on a source that fails to load,
       leaving a black box. Paint the same poster as the element background so a
       failed video always degrades to the still. */
    if(v.poster){
      v.style.backgroundImage = 'url("' + v.poster + '")';
      v.style.backgroundSize = 'cover';
      v.style.backgroundRepeat = 'no-repeat';
      v.style.backgroundPosition = getComputedStyle(v).objectPosition || '50% 50%';
    }
    v.dataset.wanted = motionOK ? '1' : '0';
    if(!motionOK) v.pause();
    /* play-once clips hold their final frame instead of looping */
    if(v.hasAttribute('data-once')) v.addEventListener('ended', ()=>{ v.dataset.done='1'; });
    /* hero clips wait for window load so they never compete with LCP */
    if(v.hasAttribute('data-autoplay')) heroVideos.push(v);
    if(vio){
      const clip = v.closest('.mreveal');
      const target = clip && clip.parentElement ? clip.parentElement : v;
      vTarget.set(target, v); vio.observe(target);
    }
    v.addEventListener('pause', ()=>{ if(document.visibilityState==='visible' && isOnScreen(v)) v.dataset.wanted='0'; });
    v.addEventListener('play', ()=>{ v.dataset.wanted='1'; });
    const host = v.closest('.hero, .bleed, .cta, .cap-media, .fam-media, .mod-media'); if(!host) return;
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
  const armHeroes = () => heroVideos.forEach(v=>{
    v.dataset.armed = '1';
    if(motionOK){ v.preload = 'auto'; if(isOnScreen(v)) v.play().catch(()=>{}); }
  });
  if(document.readyState === 'complete') armHeroes(); else window.addEventListener('load', armHeroes, {once:true});

  /* ---------- accessible tabs ([data-tabs]: role=tablist + tabpanels) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(box=>{
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const planes = [...box.querySelectorAll('.bf-stack i')];
    planes.forEach((p,k)=>p.style.setProperty('--k', planes.length-1-k));
    function select(i, focus){
      tabs.forEach((t,k)=>{
        const on = k===i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if(panel) panel.hidden = !on;
      });
      planes.forEach((p,k)=>p.classList.toggle('on', k===i));
      if(focus) tabs[i].focus();
    }
    tabs.forEach((t,i)=>{
      t.addEventListener('click', ()=>select(i));
      t.addEventListener('keydown', e=>{
        const n = tabs.length; let j = null;
        if(e.key==='ArrowDown' || e.key==='ArrowRight') j = (i+1)%n;
        else if(e.key==='ArrowUp' || e.key==='ArrowLeft') j = (i-1+n)%n;
        else if(e.key==='Home') j = 0;
        else if(e.key==='End') j = n-1;
        if(j!==null){ e.preventDefault(); select(j, true); }
      });
    });
    select(Math.max(0, tabs.findIndex(t=>t.getAttribute('aria-selected')==='true')));
  });

  /* ---------- ticker duplicate for seamless loop ---------- */
  const ticker = document.getElementById('ticker');
  if(ticker){
    ticker.innerHTML += ticker.innerHTML;
    const strip = ticker.closest('.ticker') || ticker;
    strip.setAttribute('aria-hidden','true');
  }

  /* ---------- reveal on scroll (text, lines, image masks) ---------- */
  /* A .mreveal starts at clip-path inset(0 100% 0 0), and Chromium reports
     intersectionRatio 0 for an element its own clip-path has collapsed, so it never
     reaches the threshold and the mask never opens. Observe the unclipped parent
     instead and reveal the children it carries (same reason as vio above). */
  const revealFor = new Map();
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      (revealFor.get(e.target)||[]).forEach(el=>el.classList.add('in'));
      io.unobserve(e.target); revealFor.delete(e.target);
    });
  },{threshold:.14, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal, .mreveal, .linegrow').forEach(el=>{
    const target = el.classList.contains('mreveal') && el.parentElement ? el.parentElement : el;
    const queued = revealFor.get(target);
    if(queued){ queued.push(el); return; }
    revealFor.set(target, [el]); io.observe(target);
  });

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
