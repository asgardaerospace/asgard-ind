/* ============================================================
   ASGARD IMMERSIVE — core: scroll manager, nav, audio, hero
   ============================================================ */
(function(){
'use strict';
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------------- frame loop + scroll API ---------------- */
const frame=[];
const Asgard={
  onFrame(cb){frame.push(cb);},
  prog(el){ // 0..1 through a tall sticky scene
    const total=el.offsetHeight-innerHeight;
    const scrolled=-el.getBoundingClientRect().top;
    return total<=0?0:Math.max(0,Math.min(1,scrolled/total));
  },
  vis(el){ // 0..1 how centered a normal section is in viewport
    const r=el.getBoundingClientRect();
    const c=r.top+r.height/2, mid=innerHeight/2;
    return Math.max(0,Math.min(1,1-Math.abs(c-mid)/(innerHeight*0.75)));
  },
  lerp:(a,b,t)=>a+(b-a)*t,
  ease:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  reduce
};
window.Asgard=Asgard;
let scrollY=window.scrollY;
addEventListener('scroll',()=>{scrollY=window.scrollY;},{passive:true});
addEventListener('load',()=>{ dispatchEvent(new Event('resize')); });
function loop(t){ for(const cb of frame) cb(t,scrollY); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

/* ---------------- nav progress bar ---------------- */
const bar=document.querySelector('.nav .progress');
Asgard.onFrame(()=>{ const max=document.documentElement.scrollHeight-innerHeight;
  if(bar) bar.style.width=(max>0?(scrollY/max*100):0)+'%'; });

/* ---------------- reveals ---------------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.2});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));

/* ---------------- enter sequence ---------------- */
const enter=document.getElementById('enter');
const heroEls=document.querySelectorAll('#hero .hero-center > *');
document.body.classList.add('no-scroll');
function doEnter(){
  enter.classList.add('gone');
  document.body.classList.remove('no-scroll');
  // canvases may have sized while the overlay/lock was active — recompute
  requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
  setTimeout(()=>dispatchEvent(new Event('resize')),120);
  heroEls.forEach((el,i)=>{ el.animate(
    [{opacity:0,transform:'translateY(26px)'},{opacity:1,transform:'none'}],
    {duration:1400,delay:300+i*220,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
  });
}
document.getElementById('enter-btn')?.addEventListener('click',doEnter);
setTimeout(()=>{ if(!enter.classList.contains('gone')) {/* auto fallback */} },20000);

/* ---------------- ambient audio (synth drone) ---------------- */
let actx,master,running=false;
const audioBtn=document.getElementById('audio');
function buildAudio(){
  actx=new (window.AudioContext||window.webkitAudioContext)();
  master=actx.createGain(); master.gain.value=0; master.connect(actx.destination);
  const filt=actx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=420; filt.connect(master);
  [55,82.4,110,164.8].forEach((f,i)=>{
    const o=actx.createOscillator(); o.type=i<2?'sine':'triangle'; o.frequency.value=f;
    const g=actx.createGain(); g.gain.value=i<2?0.5:0.16; o.connect(g); g.connect(filt); o.start();
    const lfo=actx.createOscillator(); lfo.frequency.value=0.05+i*0.03; const la=actx.createGain(); la.gain.value=f*0.004;
    lfo.connect(la); la.connect(o.frequency); lfo.start();
  });
  // slow filter sweep
  const fl=actx.createOscillator(); fl.frequency.value=0.03; const fg=actx.createGain(); fg.gain.value=180;
  fl.connect(fg); fg.connect(filt.frequency); fl.start();
}
function toggleAudio(){
  if(!actx) buildAudio();
  if(actx.state==='suspended') actx.resume();
  running=!running;
  master.gain.cancelScheduledValues(actx.currentTime);
  master.gain.linearRampToValueAtTime(running?0.16:0, actx.currentTime+ (running?1.2:0.6));
  audioBtn.classList.toggle('on',running);
}
audioBtn?.addEventListener('click',toggleAudio);

/* ============================================================
   HERO COSMOS — stars, metallic particles, fog, Yggdrasil net
   ============================================================ */
(function hero(){
  const scene=document.getElementById('hero'); if(!scene) return;
  const cv=scene.querySelector('canvas'); const ctx=cv.getContext('2d');
  const center=scene.querySelector('.hero-center');
  const cue=scene.querySelector('.hero-cue');
  let W,H,DPR,stars=[],dust=[],net=null;
  function size(){
    DPR=Math.min(2,devicePixelRatio||1);
    const st=scene.querySelector('.sticky');
    W=st.clientWidth;H=st.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }
  function build(){
    stars=[];const n=Math.round(W*H/1400);
    for(let i=0;i<n;i++)stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random(),r:Math.random()*1.3+0.2,tw:Math.random()*6.28});
    dust=[];const m=Math.round(W*H/14000);
    for(let i=0;i<m;i++)dust.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.12,vy:(Math.random()-.5)*.12,r:Math.random()*2+.6,a:Math.random()*.5+.2});
    buildNet();
  }
  function buildNet(){
    const cx=W*0.5, cy=H*0.52;
    const anchors=[
      {x:cx,y:cy-H*0.34,c:'--air',name:'AIR'},
      {x:cx+W*0.30,y:cy-H*0.02,c:'--space',name:'SPACE'},
      {x:cx,y:cy+H*0.34,c:'--land',name:'LAND'},
      {x:cx-W*0.30,y:cy-H*0.02,c:'--sea',name:'SEA'},
    ];
    const nodes=[{x:cx,y:cy,core:true,r:5}];
    const links=[];
    anchors.forEach(a=>{
      const steps=4;
      let prev=0;
      for(let s=1;s<=steps;s++){
        const t=s/steps;
        const jx=(Math.random()-.5)*W*0.05, jy=(Math.random()-.5)*H*0.05;
        const idx=nodes.length;
        nodes.push({x:Asgard.lerp(cx,a.x,t)+jx*(1-t),y:Asgard.lerp(cy,a.y,t)+jy*(1-t),r:s===steps?4:2.2,c:a.c,anchor:s===steps,name:s===steps?a.name:null});
        links.push({a:prev,b:idx,c:a.c,pulse:Math.random()});
        prev=idx;
        // small offshoots
        if(s>1&&Math.random()<.7){const ox=nodes[idx].x+(Math.random()-.5)*W*0.12,oy=nodes[idx].y+(Math.random()-.5)*H*0.12;
          const oi=nodes.length;nodes.push({x:ox,y:oy,r:1.6,c:a.c});links.push({a:idx,b:oi,c:a.c,pulse:Math.random(),faint:true});}
      }
    });
    net={cx,cy,nodes,links};
  }
  function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#4d8dff';}
  function hexA(hex,a){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return`rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${a})`;}

  let t=0;
  Asgard.onFrame((now)=>{
    if(!net) return;
    t+=0.006;
    const p=Asgard.prog(scene);            // 0..1 scroll
    const cam=Asgard.ease(Math.min(1,p*1.2));
    // recede hero text as we scroll so the network is revealed
    if(center){const tf=Math.max(0,Math.min(1,(p-0.10)/0.28));
      center.style.opacity=String(1-tf);
      center.style.transform=`scale(${1-tf*0.14}) translateY(${-tf*50}px)`;
      center.style.filter=`blur(${tf*6}px)`;}
    if(cue){cue.style.opacity=String(Math.max(0,1-p*6));}
    ctx.clearRect(0,0,W,H);
    // fog
    const g=ctx.createRadialGradient(W*0.5,H*(0.5-cam*0.1),0,W*0.5,H*0.5,Math.max(W,H)*0.75);
    g.addColorStop(0,`rgba(20,32,60,${0.5-cam*0.2})`);g.addColorStop(.5,'rgba(8,12,24,0.25)');g.addColorStop(1,'rgba(4,6,12,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // stars (parallax by z, drift up with cam)
    for(const s of stars){
      const off=cam*H*0.4*(0.3+s.z);
      const y=((s.y - off)%H+H)%H;
      const tw=0.5+0.5*Math.sin(t*2+s.tw);
      ctx.globalAlpha=(0.25+s.z*0.6)*tw;
      ctx.fillStyle= s.z>0.85?hexA(cssv('--blue-hi'),1):'#cdd8ee';
      ctx.beginPath();ctx.arc(s.x,y,s.r*(0.6+s.z),0,6.29);ctx.fill();
    }
    ctx.globalAlpha=1;
    // metallic dust
    for(const d of dust){
      d.x+=d.vx;d.y+=d.vy-cam*0.3;
      if(d.x<0)d.x+=W;if(d.x>W)d.x-=W;if(d.y<0)d.y+=H;if(d.y>H)d.y-=H;
      const grd=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r*3);
      grd.addColorStop(0,hexA('#cfe0ff',d.a*0.7));grd.addColorStop(1,'rgba(207,224,255,0)');
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(d.x,d.y,d.r*3,0,6.29);ctx.fill();
    }
    // network — camera drift up + slight zoom
    ctx.save();
    ctx.translate(0,-cam*H*0.16);
    const zoom=1+cam*0.12;ctx.translate(net.cx,net.cy);ctx.scale(zoom,zoom);ctx.translate(-net.cx,-net.cy);
    const appear=Math.min(1,p*2.2+0.15);
    // links
    for(const l of net.links){
      const a=net.nodes[l.a],b=net.nodes[l.b];const col=cssv(l.c||'--blue');
      ctx.strokeStyle=hexA(col,(l.faint?0.10:0.28)*appear);ctx.lineWidth=l.faint?0.6:1.1;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      // pulse
      l.pulse=(l.pulse+0.004)%1;const pt=l.pulse;
      const px=Asgard.lerp(a.x,b.x,pt),py=Asgard.lerp(a.y,b.y,pt);
      ctx.globalAlpha=appear*(1-Math.abs(pt-0.5)*1.4);
      ctx.fillStyle=hexA(col,0.9);ctx.beginPath();ctx.arc(px,py,1.6,0,6.29);ctx.fill();ctx.globalAlpha=1;
    }
    // nodes
    for(const nd of net.nodes){
      const col=nd.core?cssv('--gold'):cssv(nd.c||'--blue');
      const pr=nd.r*(0.4+appear*0.6);
      if(nd.core||nd.anchor){
        const halo=ctx.createRadialGradient(nd.x,nd.y,0,nd.x,nd.y,pr*6);
        halo.addColorStop(0,hexA(col,0.5*appear));halo.addColorStop(1,hexA(col,0));
        ctx.fillStyle=halo;ctx.beginPath();ctx.arc(nd.x,nd.y,pr*6,0,6.29);ctx.fill();
      }
      ctx.fillStyle=hexA(col,appear);ctx.beginPath();ctx.arc(nd.x,nd.y,pr,0,6.29);ctx.fill();
      if(nd.core){ctx.strokeStyle=hexA(col,0.5*appear);ctx.lineWidth=1;ctx.beginPath();ctx.arc(nd.x,nd.y,pr+5+Math.sin(t*2)*2,0,6.29);ctx.stroke();}
      if(nd.name&&appear>0.6){
        ctx.font='500 11px JetBrains Mono, monospace';ctx.fillStyle=hexA('#ffffff',(appear-0.6)/0.4*0.7);
        ctx.textAlign='center';ctx.fillText(nd.name,nd.x,nd.y-pr-12);ctx.textAlign='left';
      }
    }
    ctx.restore();
    // fade hero scene out toward end
    if(p>0.7){ctx.fillStyle=`rgba(4,6,12,${(p-0.7)/0.3})`;ctx.fillRect(0,0,W,H);}
  });
  size();addEventListener('resize',size);
})();

})();
