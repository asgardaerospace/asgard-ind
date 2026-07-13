/* ============================================================
   ASGARD — THE REALMS  (cinematic image edition)
   Each domain tells a tight three-beat lineage:
   Heritage -> Today -> Next, rendered with real imagery that
   cross-fades with a slow Ken Burns push. Museum placards + rail.
   ============================================================ */
(function(){
'use strict';
const A=window.Asgard; if(!A) return;

/* ---------- content + imagery per domain ---------- */
const BASE='assets/realms/';
const DATA={
  air:{
    head:'Aerospace & Air Dominance',
    stages:[
      {k:'Heritage',name:'The Raven',   cap:'The first navigators of the northern sky — the origin of the instinct to fly farther.', img:'air-1.png'},
      {k:'Today',   name:'Stealth Airframes', cap:'Low-observable aircraft engineered for reach, speed, and survivability.', img:'air-2.png'},
      {k:'Next',    name:'Autonomous Air Networks', cap:'Uncrewed platforms and satellites operating as one coordinated system above Earth.', img:'air-3.png'},
    ]
  },
  sea:{
    head:'Maritime & Naval Systems',
    stages:[
      {k:'Heritage',name:'The Longship', cap:'Norse shipwrights mastering the harshest waters ever crossed.', img:'sea-1.png'},
      {k:'Today',   name:'Advanced Naval Craft', cap:'Precision hulls and integrated systems built for the modern maritime fight.', img:'sea-2.png'},
      {k:'Next',    name:'Autonomous Fleets', cap:'Uncrewed vessels patrolling and coordinating across the open ocean.', img:'sea-3.png'},
    ]
  },
  land:{
    head:'Manufacturing & Robotics',
    stages:[
      {k:'Heritage',name:'The Forge', cap:'Raw iron shaped by hand — the origin of everything we build.', img:'land-1.png'},
      {k:'Today',   name:'Robotic Manufacturing', cap:'The forge becomes the factory: automated lines producing at scale.', img:'land-2.png'},
      {k:'Next',    name:'Precision Robotics', cap:'Intelligent automation machining aerospace-grade components to the micron.', img:'land-3.png'},
    ]
  },
  space:{
    head:'Space & Orbital Systems',
    stages:[
      {k:'Heritage',name:'The Sun Compass', cap:'Steering by the sky — the first instruments to find a way through the unknown.', img:'space-1.png'},
      {k:'Today',   name:'Orbital Systems', cap:'Navigation heritage rebuilt as satellite networks and orbital infrastructure.', img:'space-2.png'},
      {k:'Next',    name:'Orbital Infrastructure', cap:'Persistent platforms that manufacture and operate beyond Earth.', img:'space-3.png'},
    ]
  },
};

/* ---------- image cache ---------- */
const CACHE={};
function load(src){ if(CACHE[src]) return CACHE[src];
  const im=new Image(); im.decoding='async'; im.src=BASE+src; CACHE[src]={img:im,ok:false};
  im.onload=()=>{CACHE[src].ok=true;}; return CACHE[src];
}

/* dwell timeline: S holds + (S-1) transitions. Holds let a stage breathe. */
const HOLD=1.5, TRANS=1.0;
function timeline(p,S){
  const totalW=S*HOLD+(S-1)*TRANS;
  const x=Math.max(0,Math.min(totalW,p*totalW));
  let acc=0;
  for(let i=0;i<S;i++){
    if(x<=acc+HOLD || (i===S-1 && x<=acc+HOLD+0.001)){
      const local=(x-acc)/HOLD;
      return {i,f:0,hold:true,holdT:Math.max(0,Math.min(1,local))};
    }
    acc+=HOLD;
    if(i<S-1){
      if(x<=acc+TRANS){const local=(x-acc)/TRANS;return {i,f:A.ease(Math.max(0,Math.min(1,local))),hold:false,raw:local};}
      acc+=TRANS;
    }
  }
  return {i:S-1,f:0,hold:true,holdT:1};
}

function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#4d8dff';}
function hexA(hex,a){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return`rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${a})`;}

document.querySelectorAll('.realm').forEach(scene=>{
  const domain=scene.dataset.realm;
  const conf=DATA[domain]; if(!conf) return;
  const data=conf.stages, S=data.length;
  data.forEach(d=>{d._im=load(d.img);});

  const cv=scene.querySelector('canvas');const ctx=cv.getContext('2d');
  const word=scene.querySelector('.word'),wordGlow=scene.querySelector('.word-glow');
  const placard=scene.querySelector('.placard');
  const pNum=placard.querySelector('.p-num'),pName=placard.querySelector('.p-name'),pCap=placard.querySelector('.p-cap');
  const railEl=scene.querySelector('.rail');
  const cue=scene.querySelector('.scene-cue');
  const subHead=scene.querySelector('.realm-id .sub-head');
  if(subHead) subHead.textContent=conf.head;
  const tint=cssv('--'+domain), tint2=cssv('--'+domain+'-2');
  placard.style.color=tint;

  // build rail
  railEl.innerHTML='';
  const railItems=data.map(d=>{
    const st=document.createElement('div');st.className='st';
    st.innerHTML='<span class="lab">'+d.name+'</span><span class="dot"></span>';
    st.style.color=tint;railEl.appendChild(st);return st;
  });

  let W,H,DPR,dust=[],t=Math.random()*99,curStage=-1;
  const drift={air:[0,-1],sea:[1,0],land:[0,0],space:[0,0]}[domain]||[0,0];
  function size(){DPR=Math.min(2,devicePixelRatio||1);const st=scene.querySelector('.sticky');W=st.clientWidth;H=st.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
    dust=[];const m=Math.round(W*H/12000);
    for(let i=0;i<m;i++)dust.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.10+drift[0]*.06,vy:(Math.random()-.5)*.10+drift[1]*.06,r:Math.random()*1.6+.3,a:Math.random()*.4+.08,z:Math.random()});
  }
  function setStage(k){
    if(k===curStage) return; curStage=k;
    pNum.textContent=data[k].k.toUpperCase()+'  ·  '+String(k+1).padStart(2,'0')+' / '+String(S).padStart(2,'0');
    pName.textContent=data[k].name;
    pCap.textContent=data[k].cap;
    railItems.forEach((r,idx)=>r.classList.toggle('active',idx===k));
  }

  // cover-fit draw with Ken Burns push
  function drawCover(entry,alpha,zoom,panx,pany){
    if(!entry||!entry.ok) return;
    const im=entry.img;
    const scale=Math.max(W/im.width,H/im.height)*zoom;
    const dw=im.width*scale, dh=im.height*scale;
    const dx=(W-dw)/2+panx, dy=(H-dh)/2+pany;
    ctx.globalAlpha=alpha; ctx.drawImage(im,dx,dy,dw,dh); ctx.globalAlpha=1;
  }

  A.onFrame(()=>{
    const r=scene.getBoundingClientRect();
    if(r.bottom<-40||r.top>innerHeight+40){return;} // offscreen skip
    const p=A.prog(scene);
    t+=0.006;
    ctx.clearRect(0,0,W,H);
    // entry/exit cinematic fade
    const fade=Math.min(1,p*8)*Math.min(1,(1-p)*8);

    const tl=timeline(p,S);
    const iA=tl.i, iB=Math.min(S-1,tl.i+1), f=tl.f;
    const displayStage = tl.hold ? tl.i : (f<0.5?tl.i:tl.i+1);
    setStage(displayStage);

    // per-stage Ken Burns phase (0..1 across the time the stage owns)
    const phase = tl.hold ? tl.holdT : (tl.raw||0);
    const panAmt = Math.min(W,H)*0.018;
    const pan = (ph,dir)=>[Math.sin(ph*1.2+dir)*panAmt + drift[0]*ph*panAmt*1.4,
                           Math.cos(ph*1.0+dir)*panAmt*0.6 + drift[1]*ph*panAmt*1.4];

    // base black
    ctx.fillStyle='#04060c'; ctx.fillRect(0,0,W,H);

    if(tl.hold){
      const zA=1.045+phase*0.075;
      const [px,py]=pan(phase,0);
      drawCover(data[iA]._im, fade, zA, px, py);
    } else {
      const zA=1.045+0.075+f*0.03;         // outgoing keeps pushing
      const zB=1.06-(1-f)*0.02;            // incoming settles in
      const [ax,ay]=pan(1+f*0.3,0);
      const [bx,by]=pan(f*0.4,2.1);
      drawCover(data[iA]._im, fade*(1-f), zA, ax, ay);
      drawCover(data[iB]._im, fade*f,     zB, bx, by);
    }

    // domain tint wash for cohesion (very subtle, screen-like)
    const wash=ctx.createLinearGradient(0,0,0,H);
    wash.addColorStop(0,hexA(tint2,0.10*fade));
    wash.addColorStop(0.55,'rgba(4,6,12,0)');
    wash.addColorStop(1,hexA('#04060c',0.15*fade));
    ctx.fillStyle=wash; ctx.fillRect(0,0,W,H);

    // cinematic vignette
    const vg=ctx.createRadialGradient(W*0.5,H*0.48,Math.min(W,H)*0.2,W*0.5,H*0.5,Math.max(W,H)*0.75);
    vg.addColorStop(0,'rgba(4,6,12,0)');
    vg.addColorStop(1,hexA('#04060c',0.72));
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    // left + bottom scrim for text legibility
    const ls=ctx.createLinearGradient(0,0,W*0.55,0);
    ls.addColorStop(0,hexA('#04060c',0.66));ls.addColorStop(1,'rgba(4,6,12,0)');
    ctx.fillStyle=ls;ctx.fillRect(0,0,W*0.55,H);
    const bs=ctx.createLinearGradient(0,H,0,H*0.5);
    bs.addColorStop(0,hexA('#04060c',0.78));bs.addColorStop(1,'rgba(4,6,12,0)');
    ctx.fillStyle=bs;ctx.fillRect(0,H*0.5,W,H*0.5);

    // drifting dust / embers for life
    for(const d of dust){d.x+=d.vx*(0.4+d.z);d.y+=d.vy*(0.4+d.z);
      if(d.x<0)d.x+=W;if(d.x>W)d.x-=W;if(d.y<0)d.y+=H;if(d.y>H)d.y-=H;
      ctx.globalAlpha=d.a*(0.4+0.6*Math.sin(t*1.4+d.x*0.02))*fade;
      ctx.fillStyle=d.z>0.6?'#dfeaff':tint;
      ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,6.29);ctx.fill();}
    ctx.globalAlpha=1;

    // faint domain word, rises toward culmination
    if(word){const wy=(p-0.5)*-H*0.22;
      word.style.transform=`translate(-50%,calc(-50% + ${wy}px))`;word.style.opacity=fade*0.10;
      wordGlow.style.transform=`translate(-50%,calc(-50% + ${wy*1.1}px)) scale(${1+p*0.06})`;wordGlow.style.opacity=fade*0.30;}

    // placard cinematic reveal (visible during holds, dims through transitions)
    let pop;
    if(tl.hold){const inN=Math.min(1,tl.holdT/0.14),outN=Math.min(1,(1-tl.holdT)/0.14);pop=inN*outN;}
    else pop=0.12;
    placard.style.opacity=String(pop*fade);
    placard.style.transform=`translateY(${(1-pop)*20}px)`;

    if(cue) cue.style.opacity=String(Math.max(0,1-p*9)*fade);

    // edge wipes
    if(p>0.96){ctx.fillStyle=`rgba(4,6,12,${(p-0.96)/0.04})`;ctx.fillRect(0,0,W,H);}
    if(p<0.03){ctx.fillStyle=`rgba(4,6,12,${1-(p/0.03)})`;ctx.fillRect(0,0,W,H);}
  });
  size();addEventListener('resize',size);
});
})();
