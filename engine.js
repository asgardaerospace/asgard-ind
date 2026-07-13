/* ============================================================
   ASGARD IMMERSIVE — CHAPTER III · THE ENGINE
   The Constraint Orchestration Engine.
   A digital assembly is ingested, decomposed into components,
   routed through an expanding supplier network, converged at a
   Forge, then reassembled for delivery. Scroll driven.
   ============================================================ */
(function(){
'use strict';
const A=window.Asgard; if(!A) return;
const scene=document.getElementById('engine'); if(!scene) return;
const cv=scene.querySelector('canvas'); const ctx=cv.getContext('2d');
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#4d8dff';}
function hexA(hex,a){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return`rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${a})`;}
const clamp=v=>Math.max(0,Math.min(1,v));
const up=(p,a,b)=>clamp((p-a)/(b-a));
const sm=(p,a,b)=>A.ease(up(p,a,b));
function ramp(p,a,b,c,d){if(p<a)return 0;if(p<b)return (p-a)/(b-a);if(p<c)return 1;if(p<d)return 1-(p-c)/(d-c);return 0;}

const M=156, NODES=72;
const CONSTRAINTS=['MATERIAL','TOLERANCE','METHOD','CERTIFICATION','COMPLIANCE','CAPACITY','LEAD TIME','QUALITY'];
const FACILITIES=['Machining','Composites','Electronics','Additive','Thermoplastics','Assembly','Inspection','Test'];

const caps={}; scene.querySelectorAll('.eng-cap').forEach(el=>caps[el.dataset.s]=el);
const finalEl=scene.querySelector('.eng-final');

let W,H,DPR,comps=[],nodes=[],dust=[],t=0,cx,cy,baseScale;

function rnd(a,b){return a+Math.random()*(b-a);}
function build(){
  cx=W*0.5; cy=H*0.5; baseScale=Math.min(W,H)*0.34;
  // supplier nodes (normalized -1..1)
  nodes=[];
  for(let i=0;i<NODES;i++){
    const ang=Math.random()*6.2832, rad=0.18+Math.random()*0.92;
    nodes.push({x:Math.cos(ang)*rad, y:Math.sin(ang)*rad*0.82, r:rnd(1.2,2.6), tw:Math.random()*6.28,
      fac:i<FACILITIES.length?FACILITIES[i]:null});
  }
  // components forming a stylized 3D assembly (craft-like)
  comps=[];
  for(let i=0;i<M;i++){
    let mx,my,mz; const z=Math.random();
    if(z<0.42){ // fuselage / spine
      mz=rnd(-0.95,0.95); mx=rnd(-0.05,0.05); my=rnd(-0.06,0.04)+Math.sin(mz*1.4)*0.05;
    }else if(z<0.72){ // wings
      const side=Math.random()<0.5?-1:1; mx=side*rnd(0.12,0.92); mz=rnd(-0.12,0.22); my=rnd(-0.03,0.03);
    }else if(z<0.85){ // tail
      mz=rnd(-0.98,-0.7); mx=rnd(-0.28,0.28); my=rnd(0,0.32);
    }else{ // detail scatter
      mx=rnd(-0.5,0.5); my=rnd(-0.2,0.2); mz=rnd(-0.7,0.7);
    }
    comps.push({mx,my,mz, node:Math.floor(Math.random()*NODES), r:rnd(1.0,2.4), tw:Math.random()*6.28,
      gold:Math.random()<0.12, fx:rnd(-1,1), fy:rnd(-1,1), spd:rnd(0.6,1.4),
      con:i<CONSTRAINTS.length?CONSTRAINTS[i]:null});
  }
  dust=[];const m=Math.round(W*H/12000);
  for(let i=0;i<m;i++)dust.push({x:Math.random()*W,y:Math.random()*H,vx:rnd(-.1,.1),vy:rnd(-.1,.1),r:rnd(.4,1.6),a:rnd(.1,.4)});
}
function size(){DPR=Math.min(2,devicePixelRatio||1);const st=scene.querySelector('.sticky');W=st.clientWidth;H=st.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);build();}

function proj(mx,my,mz,theta,zoom){
  const c=Math.cos(theta),s=Math.sin(theta);
  const rx=mx*c+mz*s, rz=-mx*s+mz*c;
  const persp=1/(1-rz*0.30);
  return [cx+rx*baseScale*zoom*persp, cy+my*baseScale*zoom*persp, persp];
}

A.onFrame(()=>{
  const r=scene.getBoundingClientRect(); if(r.bottom<-40||r.top>innerHeight+40){return;}
  const p=A.prog(scene); t+=0.01;
  ctx.clearRect(0,0,W,H);
  const blue=cssv('--blue'),blueHi=cssv('--blue-hi'),gold=cssv('--gold');
  const fade=Math.min(1,p*16)*Math.min(1,(1-p)*16);

  // phase scalars
  const e=sm(p,0.16,0.32);            // explode
  const toNode=sm(p,0.34,0.52);
  const toForge=sm(p,0.66,0.80);
  const toDeliver=sm(p,0.82,0.95);
  const nodesAppear=sm(p,0.34,0.44)*(1-sm(p,0.88,0.96));
  const networkFull=sm(p,0.54,0.66);
  const decompTag=ramp(p,0.20,0.25,0.32,0.37);
  const theta=t*0.18+p*3.0;

  // camera zoom chain
  let zoom=1.12;
  zoom=A.lerp(zoom,0.96,up(p,0.10,0.20));
  zoom=A.lerp(zoom,0.78,up(p,0.34,0.60));
  zoom=A.lerp(zoom,0.94,up(p,0.66,0.74));
  zoom=A.lerp(zoom,0.70,up(p,0.84,0.97));

  // node spread expansion chain
  let expansion=0.55;
  expansion=A.lerp(expansion,1.0,up(p,0.36,0.54));
  expansion=A.lerp(expansion,1.6,up(p,0.54,0.66));
  expansion=A.lerp(expansion,1.25,up(p,0.66,0.82));
  const spreadX=W*0.46, spreadY=H*0.44;
  function npos(i){const n=nodes[i];return [cx+n.x*spreadX*expansion*zoom*0.7, cy+n.y*spreadY*expansion*zoom*0.7];}
  const forge=[cx, cy];

  // ambient dust
  for(const d of dust){d.x+=d.vx;d.y+=d.vy;if(d.x<0)d.x+=W;if(d.x>W)d.x-=W;if(d.y<0)d.y+=H;if(d.y>H)d.y-=H;
    ctx.globalAlpha=d.a*fade*0.7;ctx.fillStyle=blue;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,6.29);ctx.fill();}
  ctx.globalAlpha=1;

  // central glow (ingestion energy / forge convergence)
  const glowR=Math.max(W,H)*(0.3+toForge*0.15);
  const cgrad=ctx.createRadialGradient(cx,cy,0,cx,cy,glowR);
  const gc = toForge>0.3? gold : blue;
  cgrad.addColorStop(0,hexA(gc,(0.16+toForge*0.2)*fade));cgrad.addColorStop(1,hexA(gc,0));
  ctx.fillStyle=cgrad;ctx.beginPath();ctx.arc(cx,cy,glowR,0,6.29);ctx.fill();

  // supplier nodes + interlinks
  if(nodesAppear>0.01){
    // interlinks when network full
    if(networkFull>0){
      for(let i=0;i<NODES;i++){const a1=npos(i);
        for(let j=i+1;j<NODES;j++){const b1=npos(j);const dx=a1[0]-b1[0],dy=a1[1]-b1[1];const dd=Math.hypot(dx,dy);
          if(dd<W*0.12){ctx.strokeStyle=hexA('#5f86c8',(1-dd/(W*0.12))*0.16*networkFull*nodesAppear*fade);ctx.lineWidth=0.5;
            ctx.beginPath();ctx.moveTo(a1[0],a1[1]);ctx.lineTo(b1[0],b1[1]);ctx.stroke();}}}
    }
    for(let i=0;i<NODES;i++){const np=npos(i);const tw=0.5+0.5*Math.sin(t*2+nodes[i].tw);
      const halo=ctx.createRadialGradient(np[0],np[1],0,np[0],np[1],20);
      halo.addColorStop(0,hexA(blueHi,0.4*nodesAppear*tw*fade));halo.addColorStop(1,hexA(blueHi,0));
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(np[0],np[1],20,0,6.29);ctx.fill();
      ctx.fillStyle=hexA(blueHi,nodesAppear*fade);ctx.beginPath();ctx.arc(np[0],np[1],nodes[i].r,0,6.29);ctx.fill();
    }
    // facility labels during network scene
    const facOp=ramp(p,0.55,0.59,0.66,0.71);
    if(facOp>0){ctx.font='500 11px JetBrains Mono,monospace';
      for(let i=0;i<NODES;i++){if(!nodes[i].fac)continue;const np=npos(i);
        ctx.fillStyle=hexA('#cfe0ff',facOp*0.85*fade);ctx.textAlign='center';
        ctx.fillText(nodes[i].fac.toUpperCase(),np[0],np[1]-12);}
      ctx.textAlign='left';}
  }

  // forge node
  if(toForge>0.02){const fr=6+toForge*16;
    const fh=ctx.createRadialGradient(forge[0],forge[1],0,forge[0],forge[1],120);
    fh.addColorStop(0,hexA(gold,0.4*toForge*fade));fh.addColorStop(1,hexA(gold,0));
    ctx.fillStyle=fh;ctx.beginPath();ctx.arc(forge[0],forge[1],120,0,6.29);ctx.fill();
    ctx.fillStyle=hexA(gold,toForge*fade);ctx.shadowColor=gold;ctx.shadowBlur=24;
    ctx.beginPath();ctx.arc(forge[0],forge[1],fr,0,6.29);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle=hexA(gold,0.5*toForge*fade);ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(forge[0],forge[1],fr+10+Math.sin(t*2)*4,0,6.29);ctx.stroke();
  }

  // components
  const sc=1+e*1.5;
  for(let i=0;i<M;i++){const c=comps[i];
    const asm=proj(c.mx,c.my,c.mz,theta,zoom);
    const exp=proj(c.mx*sc,c.my*sc,c.mz*sc,theta,zoom);
    let P=[exp[0],exp[1]];
    const np=npos(c.node);
    P[0]=A.lerp(P[0],np[0],toNode);P[1]=A.lerp(P[1],np[1],toNode);
    const fpt=[forge[0]+c.fx*Math.min(W,H)*0.05, forge[1]+c.fy*Math.min(W,H)*0.05];
    P[0]=A.lerp(P[0],fpt[0],toForge);P[1]=A.lerp(P[1],fpt[1],toForge);
    P[0]=A.lerp(P[0],asm[0],toDeliver);P[1]=A.lerp(P[1],asm[1],toDeliver);

    // route line to node (orchestration) / to forge
    if(toNode>0.02 && toDeliver<0.5){
      const tgt = toForge>0.02? fpt : np;
      ctx.strokeStyle=hexA(c.gold?gold:blue,0.10*toNode*(1-toDeliver)*fade);ctx.lineWidth=0.5;
      ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(tgt[0],tgt[1]);ctx.stroke();
    }
    const tw=0.55+0.45*Math.sin(t*2.4+c.tw);
    const col=c.gold?gold:(toDeliver>0.4?blueHi:blue);
    const sz=(c.r*(asm[2]||1))*(0.8+0.5*toDeliver);
    ctx.fillStyle=hexA(col,(0.55+0.45*tw)*fade);
    ctx.beginPath();ctx.arc(P[0],P[1],Math.max(0.6,sz*0.7),0,6.29);ctx.fill();
  }

  // assembled wire hint during ingestion + delivery (connect nearby fuselage comps)
  const wire=Math.max(sm(p,0.0,0.12)*(1-e), toDeliver*0.9);
  if(wire>0.05){ctx.strokeStyle=hexA(blueHi,0.18*wire*fade);ctx.lineWidth=0.6;
    for(let i=0;i<M;i+=1){const c=comps[i];if(Math.abs(c.mx)>0.1)continue;
      const a1=proj(c.mx,c.my,c.mz,theta,zoom);const b1=proj(0,0,c.mz+0.06,theta,zoom);
      ctx.beginPath();ctx.moveTo(a1[0],a1[1]);ctx.lineTo(b1[0],b1[1]);ctx.stroke();}}

  // constraint tags (decomposition)
  if(decompTag>0.02){ctx.font='500 11px JetBrains Mono,monospace';
    for(let i=0;i<CONSTRAINTS.length;i++){const c=comps[i];if(!c.con)continue;
      const exp=proj(c.mx*sc,c.my*sc,c.mz*sc,theta,zoom);
      ctx.fillStyle=hexA(gold,decompTag*0.8*fade);ctx.fillRect(exp[0]-1,exp[1]-1,2,2);
      ctx.fillStyle=hexA('#dfe8f6',decompTag*0.85*fade);ctx.textAlign='left';
      ctx.fillText(c.con,exp[0]+8,exp[1]+3);}
  }

  // ---- captions ----
  setOp(caps.intro, ramp(p,0.0,0.02,0.085,0.13));
  setOp(caps['0'], ramp(p,0.105,0.14,0.18,0.215));
  setOp(caps['1'], ramp(p,0.225,0.26,0.31,0.355));
  setOp(caps['2'], ramp(p,0.385,0.42,0.49,0.53));
  setOp(caps['3'], ramp(p,0.55,0.59,0.635,0.675));
  setOp(caps['4'], ramp(p,0.69,0.725,0.775,0.815));
  setOp(caps['5'], ramp(p,0.83,0.865,0.905,0.94));
  if(finalEl){const fo=up(p,0.92,0.965);finalEl.style.opacity=String(fo);finalEl.style.transform=`translateY(${(1-up(p,0.92,0.99))*22}px)`;}
  function setOp(el,v){if(el)el.style.opacity=String(v*fade);}
});
size();addEventListener('resize',size);
})();
