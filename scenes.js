/* ============================================================
   ASGARD IMMERSIVE — THE THREAD / THE ENGINE / THE FUTURE
   ============================================================ */
(function(){
'use strict';
const A=window.Asgard; if(!A) return;
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#4d8dff';}
function hexA(hex,a){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return`rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${a})`;}
const DOMS=[['--air',-1,-1,'AIR'],['--space',1,-1,'SPACE'],['--sea',-1,1,'SEA'],['--land',1,1,'LAND']];

/* ============================ THE THREAD ============================
   A cinematic revelation. Four isolated domains, pathways ignite,
   industrial layers build (engineering, suppliers, manufacturing,
   logistics, operators), the camera pulls back to a full network,
   then Launchbelt is revealed as infrastructure.
   =================================================================== */
(function thread(){
  const scene=document.getElementById('thread'); if(!scene) return;
  const cv=scene.querySelector('canvas');const ctx=cv.getContext('2d');
  const ui={
    open:scene.querySelector('.th-open'), mid:scene.querySelector('.th-mid'),
    reveal:scene.querySelector('.th-reveal'), layer:scene.querySelector('.th-layer'),
    layerN:scene.querySelector('.th-layer-n')
  };
  const DCFG=[{a:-Math.PI/2,c:'--air',name:'AIR'},{a:0,c:'--space',name:'SPACE'},{a:Math.PI/2,c:'--land',name:'LAND'},{a:Math.PI,c:'--sea',name:'SEA'}];
  const LAYERS=['Engineering Teams','Suppliers','Manufacturing','Logistics','Operators'];
  let W,H,DPR,t=0,layers=[];
  function size(){DPR=Math.min(2,devicePixelRatio||1);const st=scene.querySelector('.sticky');W=st.clientWidth;H=st.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);build();}
  function build(){
    layers=LAYERS.map((name,li)=>{
      const count=6+li,nodes=[];
      for(let n=0;n<count;n++)nodes.push({ang:Math.random()*6.2832,rad:0.30+Math.random()*0.62,r:Math.random()*1.5+1,tw:Math.random()*6.2832,dom:Math.floor(Math.random()*4),sp:0.3+Math.random()*0.6,_x:null,_y:null});
      return {name,nodes};
    });
  }
  const clamp=(v)=>Math.max(0,Math.min(1,v));
  function up(p,a,b){return clamp((p-a)/(b-a));}
  function ramp(p,a,b,c,d){if(p<a)return 0;if(p<b)return (p-a)/(b-a);if(p<c)return 1;if(p<d)return 1-(p-c)/(d-c);return 0;}

  A.onFrame(()=>{
    const r=scene.getBoundingClientRect(); if(r.bottom<-40||r.top>innerHeight+40){return;}
    const p=A.prog(scene); t+=0.01;
    ctx.clearRect(0,0,W,H);
    const cx=W*0.5, cy=H*0.52, gold=cssv('--gold');
    const fade=Math.min(1,p*14)*Math.min(1,(1-p)*14);

    const domIn=A.ease(up(p,0.0,0.10));
    const threadIn=A.ease(up(p,0.10,0.26));
    const layersProg=up(p,0.26,0.60)*5;
    const networkFull=A.ease(up(p,0.58,0.78));
    const reveal=A.ease(up(p,0.78,0.92));
    const netDim=1-reveal*0.85;

    const camp=A.ease(up(p,0.05,0.80));
    const zoom=A.lerp(1.18,0.82,camp);
    const R=Math.min(W,H)*0.40*zoom;
    function dpos(i){const d=DCFG[i];return [cx+Math.cos(d.a)*0.82*R, cy+Math.sin(d.a)*0.82*R];}

    // ambient fog
    const fg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*0.7);
    fg.addColorStop(0,hexA('#16223e',0.5*fade));fg.addColorStop(1,'rgba(4,6,12,0)');
    ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);

    // domain-to-domain ring threads
    if(threadIn>0){
      for(let i=0;i<4;i++){const A1=dpos(i),B1=dpos((i+1)%4),col=cssv(DCFG[i].c);
        ctx.strokeStyle=hexA(col,0.32*threadIn*fade*netDim);ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(A1[0],A1[1]);ctx.quadraticCurveTo(cx,cy,B1[0],B1[1]);ctx.stroke();
        for(let k=0;k<3;k++){const pk=((t*0.3+k/3+i*0.12)%1),q=1-pk;
          const bx=q*q*A1[0]+2*q*pk*cx+pk*pk*B1[0], by=q*q*A1[1]+2*q*pk*cy+pk*pk*B1[1];
          ctx.fillStyle=hexA('#fff',0.85*threadIn*fade*netDim);ctx.shadowColor=col;ctx.shadowBlur=10;
          ctx.beginPath();ctx.arc(bx,by,1.8,0,6.29);ctx.fill();ctx.shadowBlur=0;}
      }
    }

    // industrial layers grow outward from the core
    layers.forEach((layer,li)=>{
      const amt=A.ease(clamp(layersProg-li));
      if(amt<=0){layer.nodes.forEach(n=>n._x=null);return;}
      layer.nodes.forEach(nd=>{
        const rad=nd.rad*amt;
        const x=cx+Math.cos(nd.ang+t*0.05*nd.sp)*rad*R, y=cy+Math.sin(nd.ang+t*0.05*nd.sp)*rad*R;
        nd._x=x;nd._y=y;const col=cssv(DCFG[nd.dom].c),dp=dpos(nd.dom);
        ctx.strokeStyle=hexA(col,0.15*amt*fade*netDim);ctx.lineWidth=0.6;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.stroke();
        ctx.strokeStyle=hexA(col,0.11*amt*fade*netDim);
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(dp[0],dp[1]);ctx.stroke();
        if(networkFull>0){const pk=(t*nd.sp*0.4+nd.tw)%1,px=A.lerp(x,cx,pk),py=A.lerp(y,cy,pk);
          ctx.fillStyle=hexA('#fff',0.55*amt*networkFull*fade*netDim);ctx.beginPath();ctx.arc(px,py,1.2,0,6.29);ctx.fill();}
        const tw=0.6+0.4*Math.sin(t*2+nd.tw);
        ctx.fillStyle=hexA(col,amt*tw*fade*netDim);ctx.beginPath();ctx.arc(x,y,nd.r,0,6.29);ctx.fill();
      });
    });

    // density interlinks when the network is full
    if(networkFull>0){
      const all=[];layers.forEach((L,li)=>{if(layersProg>li)L.nodes.forEach(n=>{if(n._x!=null)all.push(n);});});
      for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
        const a1=all[i],b1=all[j],d=Math.hypot(a1._x-b1._x,a1._y-b1._y);
        if(d<W*0.10){ctx.strokeStyle=hexA('#6e8cd0',(1-d/(W*0.10))*0.18*networkFull*fade*netDim);ctx.lineWidth=0.5;
          ctx.beginPath();ctx.moveTo(a1._x,a1._y);ctx.lineTo(b1._x,b1._y);ctx.stroke();}
      }
    }

    // domain anchors
    for(let i=0;i<4;i++){const dp=dpos(i),col=cssv(DCFG[i].c);
      const halo=ctx.createRadialGradient(dp[0],dp[1],0,dp[0],dp[1],46);
      halo.addColorStop(0,hexA(col,0.45*domIn*fade*netDim));halo.addColorStop(1,hexA(col,0));
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(dp[0],dp[1],46,0,6.29);ctx.fill();
      ctx.fillStyle=hexA(col,domIn*fade);ctx.beginPath();ctx.arc(dp[0],dp[1],4.6,0,6.29);ctx.fill();
      ctx.font='600 12px JetBrains Mono,monospace';ctx.fillStyle=hexA('#fff',domIn*0.8*fade*netDim);ctx.textAlign='center';
      ctx.fillText(DCFG[i].name,dp[0],dp[1]+(Math.sin(DCFG[i].a)>0.3?30:-20));ctx.textAlign='left';
    }

    // core (Launchbelt) intensifies toward the reveal
    const coreR=4+reveal*10+networkFull*2;
    const ch=ctx.createRadialGradient(cx,cy,0,cx,cy,90+reveal*140);
    ch.addColorStop(0,hexA(gold,(0.22+reveal*0.4)*fade));ch.addColorStop(1,hexA(gold,0));
    ctx.fillStyle=ch;ctx.beginPath();ctx.arc(cx,cy,90+reveal*140,0,6.29);ctx.fill();
    ctx.fillStyle=hexA(gold,fade);ctx.shadowColor=gold;ctx.shadowBlur=20+reveal*34;
    ctx.beginPath();ctx.arc(cx,cy,coreR,0,6.29);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle=hexA(gold,0.5*fade);ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,coreR+8+Math.sin(t*2)*3,0,6.29);ctx.stroke();

    // text phases
    if(ui.open) ui.open.style.opacity=String(ramp(p,0.0,0.03,0.10,0.16)*fade);
    if(ui.mid) ui.mid.style.opacity=String(ramp(p,0.34,0.40,0.54,0.60)*fade);
    if(ui.reveal){ui.reveal.style.opacity=String(up(p,0.80,0.88)*fade);ui.reveal.style.transform=`translateY(${(1-up(p,0.80,0.90))*26}px)`;}
    if(ui.layer){const labOp=ramp(p,0.26,0.30,0.58,0.62);ui.layer.style.opacity=String(labOp*fade);
      const li=Math.max(0,Math.min(4,Math.floor(layersProg-0.0001)));
      if(labOp>0&&layers[li]) ui.layerN.textContent=layers[li].name;}
  });
  size();addEventListener('resize',size);
})();

/* THE ENGINE — see engine.js (Chapter III: Constraint Orchestration Engine) */

/* ============================ THE FUTURE (finale) ============================ */
(function future(){
  const cv=document.getElementById('finale-canvas'); if(!cv) return;
  const ctx=cv.getContext('2d');let W,H,DPR,nodes=[],t=0;
  function size(){DPR=Math.min(2,devicePixelRatio||1);const host=cv.parentElement;W=host.clientWidth;H=host.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);build();}
  function build(){
    nodes=[];
    DOMS.forEach(([c,sx,sy])=>{const cx=W*0.5+sx*W*0.28,cy=H*0.5+sy*H*0.28;
      for(let i=0;i<14;i++)nodes.push({x:cx+(Math.random()-.5)*W*0.24,y:cy+(Math.random()-.5)*H*0.24,vx:(Math.random()-.5)*.12,vy:(Math.random()-.5)*.12,r:Math.random()*1.8+.6,c});});
  }
  A.onFrame(()=>{
    t+=0.006;ctx.clearRect(0,0,W,H);
    // links across all (the unified ecosystem)
    for(let i=0;i<nodes.length;i++){const a=nodes[i];
      for(let j=i+1;j<nodes.length;j++){const b=nodes[j];const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<W*0.12){const o=(1-d/(W*0.12))*0.32;ctx.strokeStyle=hexA(a.c===b.c?cssv(a.c):cssv('--blue'),o);
          ctx.lineWidth=0.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
    nodes.forEach(nd=>{nd.x+=nd.vx;nd.y+=nd.vy;if(nd.x<0||nd.x>W)nd.vx*=-1;if(nd.y<0||nd.y>H)nd.vy*=-1;
      const tw=0.6+0.4*Math.sin(t*2+nd.x*0.01);ctx.fillStyle=hexA(cssv(nd.c),0.8*tw);ctx.beginPath();ctx.arc(nd.x,nd.y,nd.r,0,6.29);ctx.fill();});
  });
  size();addEventListener('resize',size);
})();

})();
