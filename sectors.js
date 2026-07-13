/* ============================================================
   ASGARD — SECTORS  (interactive capability selector)
   Air / Sea / Land / Space. Click a tab to swap a cinematic
   image + capability copy. Auto-advances with a progress bar;
   pauses on hover or interaction. DOM/CSS driven — no canvas.
   ============================================================ */
(function(){
'use strict';
const BASE='assets/realms/';
const DWELL=7000; // ms per sector on auto-advance

const SECTORS=[
  {id:'air', idx:'01', name:'Air', title:'Aerospace & Air Dominance',
   copy:'Low-observable airframes, uncrewed platforms, and the networks that fly them — engineered for reach, speed, and survivability.',
   caps:['Stealth airframes','Autonomous air networks','Orbital-edge aerospace'],
   heritage:'Lineage: the first navigators of the northern sky.',
   img:'air-2.png'},
  {id:'sea', idx:'02', name:'Sea', title:'Maritime & Naval Systems',
   copy:'Precision hulls, integrated combat systems, and autonomous vessels built for the modern maritime fight.',
   caps:['Advanced naval craft','Autonomous fleets','Distributed maritime sensing'],
   heritage:'Lineage: the shipwrights who mastered the harshest waters.',
   img:'sea-3.png'},
  {id:'land', idx:'03', name:'Land', title:'Manufacturing & Robotics',
   copy:'Robotic production lines and precision automation machining aerospace-grade components at scale.',
   caps:['Robotic manufacturing','Precision robotics','Integrated ground systems'],
   heritage:'Lineage: the forge, rebuilt as the factory.',
   img:'land-3.png'},
  {id:'space', idx:'04', name:'Space', title:'Space & Orbital Systems',
   copy:'Satellite networks and persistent orbital infrastructure that manufacture and operate beyond Earth.',
   caps:['Satellite constellations','Orbital systems','Orbital infrastructure'],
   heritage:'Lineage: navigation heritage, carried into orbit.',
   img:'space-3.png'},
];

const section=document.getElementById('realms');
if(!section) return;
const tabsEl=section.querySelector('.sector-tabs');
const mediaEl=section.querySelector('.sector-media');
const infoEl=section.querySelector('.sector-info');
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// build media layers + tabs
const imgs=[], tabs=[];
SECTORS.forEach((s,i)=>{
  const im=document.createElement('img');
  im.src=BASE+s.img; im.alt=s.title; im.className='sector-img'; im.decoding='async';
  mediaEl.appendChild(im); imgs.push(im);

  const tint=cssv('--'+s.id);
  const tab=document.createElement('button');
  tab.className='sector-tab'; tab.type='button'; tab.style.setProperty('--tab',tint);
  tab.innerHTML='<span class="st-i">'+s.idx+'</span><span class="st-l">'+s.name+'</span><span class="st-prog"></span>';
  tab.addEventListener('click',()=>{ go(i); user(); });
  tabsEl.appendChild(tab); tabs.push(tab);
});

let active=-1, timer=null, paused=false;

function renderInfo(s){
  const tint=cssv('--'+s.id);
  infoEl.innerHTML=
    '<div class="si-idx" style="color:'+tint+'">Domain '+s.idx+' · '+s.name+'</div>'+
    '<h3>'+s.title+'</h3>'+
    '<p class="si-copy">'+s.copy+'</p>'+
    '<div class="si-caps">'+s.caps.map(c=>'<span style="border-color:'+tint+'55">'+c+'</span>').join('')+'</div>'+
    '<div class="si-her">'+s.heritage+'</div>';
  // retrigger entrance transition
  infoEl.classList.remove('in'); void infoEl.offsetWidth; infoEl.classList.add('in');
}

function go(i){
  if(i===active) return;
  active=i; const s=SECTORS[i];
  imgs.forEach((im,k)=>im.classList.toggle('active',k===i));
  tabs.forEach((t,k)=>t.classList.toggle('active',k===i));
  renderInfo(s);
  restartProgress();
}

/* progress bar on the active tab */
function restartProgress(){
  tabs.forEach(t=>{const p=t.querySelector('.st-prog');p.style.transition='none';p.style.transform='scaleX(0)';});
  if(paused) return;
  const p=tabs[active].querySelector('.st-prog');
  void p.offsetWidth;
  p.style.transition='transform '+DWELL+'ms linear';
  p.style.transform='scaleX(1)';
}

function schedule(){ clearTimeout(timer); if(paused) return;
  timer=setTimeout(()=>{ go((active+1)%SECTORS.length); schedule(); }, DWELL);
}
function user(){ // a manual pick resets the clock but keeps auto-advance
  if(!paused) schedule();
}

// pause auto-advance while the viewer is engaging with the stage
const stage=section.querySelector('.sector-stage');
function setPaused(v){ paused=v;
  if(v){ clearTimeout(timer);
    const p=tabs[active]?.querySelector('.st-prog');
    if(p){const w=getComputedStyle(p).transform;p.style.transition='none';p.style.transform=w==='none'?'scaleX(0)':w;}
  } else { restartProgress(); schedule(); }
}
[stage,tabsEl].forEach(el=>{
  el.addEventListener('mouseenter',()=>setPaused(true));
  el.addEventListener('mouseleave',()=>setPaused(false));
});

// only run the auto-advance clock while the section is in view
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){ if(!paused){restartProgress();schedule();} }
  else { clearTimeout(timer); }
}),{threshold:0.25});
io.observe(section);

go(0);
})();
