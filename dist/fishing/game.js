import {fishingMove} from './rules.js';
import {newRound,update,action,duration} from './rules.js';
const el=id=>document.getElementById(id),ctx=el('pond').getContext('2d');
const main=el('action'),spots=[...document.querySelectorAll('[data-spot]')];
let round=newRound(),playing=false,pointer=null,keyboard=false,previous=null,mark='';
const bobberX=[152,320,487];
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function oval(x,y,rx,ry,c){
 ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function polygon(p,c){
 ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(...p[0]);for(const point of p.slice(1))ctx.lineTo(...point);ctx.closePath();ctx.fill();
}
function curve(a,b,c,ink,width){
 ctx.strokeStyle=ink;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(...b,...c);ctx.stroke();
}
function draw(now){
 const t=now/1000,s=round;
 rect(0,0,640,390,'#519995');
 rect(0,0,640,69,'#bad9ca');
 polygon([[0,47],[69,31],[144,49],[242,26],[322,53],[410,30],[483,43],[578,27],[640,43],[640,93],[0,93]],'#829f61');
 rect(0,84,640,20,'#91ad6b');
 for(let i=0;i<16;i++){
  const x=(i*71.9+9)%640,y=121+(i*43)%240;
  oval(x+Math.sin(t+i)*13,y,18+(i%4)*6,1.8,i%2?'#70b0a4':'#65a7a0');
 }
 for(let i=0;i<9;i++){
  const x=i<4?24+i*26:513+(i-4)*25,y=115+(i*17)%47;
  oval(x,y,11,4,'#6a8a50');
 }
 const spot=bobberX[s.spot], fight=s.phase==='fight', splash=s.phase==='bite'||(fight&&s.tug);
 const cast=s.phase==='cast'?Math.min(1,s.age/.48):1;
 const selected=fight?1-Math.min(.82,s.reel*.78):cast;
 const boatX=320+(fight&&s.tug?Math.sin(t*10)*9:0);
 const boatY=310+Math.sin(t*2.8)*2.8;
 const x=boatX+(spot-boatX)*selected+(fight&&s.tug?Math.sin(t*13)*9:0);
 const y=boatY-143*selected+Math.sin(t*5)*2+(splash?5*Math.sin(t*19):0)-(s.phase==='cast'?Math.sin(cast*Math.PI)*74:0);
 if(s.phase!=='ready'&&s.phase!=='done'&&s.phase!=='recover'){
  const shadow=splash?21:11;
  oval(x,y+4,shadow,4,'#a0cfc0');
  if(splash){
   for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7, r=7+(t*41+i*1.9)%21;
    oval(x+Math.cos(a)*r,y+Math.sin(a)*r*.42,2.8,1.6,'#f0f5d9');
   }
   if(fight){
    oval(x,y+9,17,6,'#557551');
    polygon([[x-12,y+9],[x-25,y+3],[x-25,y+16]],'#63814e');
   }
  }
 }
 oval(boatX,boatY+15,91,26,'#428786');
 polygon([[boatX-87,boatY-12],[boatX-59,boatY+21],[boatX+62,boatY+21],[boatX+93,boatY-11],[boatX+69,boatY-23],[boatX-63,boatY-23]],'#2b756d');
 polygon([[boatX-86,boatY-13],[boatX+92,boatY-12],[boatX+59,boatY+7],[boatX-56,boatY+7]],'#cba677');
 rect(boatX-63,boatY-14,125,5,'#ebc38d');
 oval(boatX-10,boatY-22,21,20,'#9e4737');
 oval(boatX-11,boatY-49,12,13,'#deab76');
 oval(boatX-11,boatY-57,20,5,'#e1bc75');
 oval(boatX-11,boatY-60,12,6,'#e7c883');
 const bend=fight?Math.min(.92,s.tension):0;
 const rodEnd=[boatX+(spot-boatX)*.24+15,boatY-105+bend*30];
 curve([boatX+8,boatY-34],[boatX+29,boatY-94-bend*7],rodEnd,'#533e2b',4);
 if(s.phase!=='ready'&&s.phase!=='done'&&s.phase!=='recover'){
  curve(rodEnd,[(rodEnd[0]+x)/2,(rodEnd[1]+y)/2+(fight?6:19)],[x,y],'#ffe6ba',1.35);
  oval(x,y,6,6,'#f2ead0');oval(x,y+2,6,3,'#c45c46');
 }
 if(s.phase==='ready'){
  oval(spot,165,20,5,'#81b6a5');
  oval(spot,165,8,3,'#d7e4b6');
 }
 if(s.phase==='recover'&&s.notice.includes('landed')){
  const fy=boatY-52-Math.sin(Math.PI*Math.min(1,s.age/.78))*59;
  oval(boatX+29,fy,17,8,'#96af5e');
  polygon([[boatX+18,fy],[boatX+6,fy-6],[boatX+6,fy+6]],'#96af5e');
  oval(boatX+37,fy-2,2,2,'#293f35');
 }
}
function setSpot(i){
 if(round.phase!=='ready')return;
 round.spot=i;for(const b of spots)b.setAttribute('aria-pressed',Number(b.dataset.spot)===i);
}
for(const b of spots)b.onclick=()=>setSpot(Number(b.dataset.spot));
for(const tool of ['bait','slack','pump'])el('fish-'+tool).onclick=()=>{if(playing)fishingMove(round,tool);};
el('start').onclick=()=>{
 const spot=round.spot;round=newRound();setSpot(spot);
 playing=true;pointer=null;keyboard=false;el('start').disabled=true;
};
main.onpointerdown=e=>{
 if(pointer!==null||e.button!==0||main.disabled)return;
 pointer=e.pointerId;main.setPointerCapture(pointer);
 if(round.phase!=='fight')action(round);
};
main.onpointerup=main.onpointercancel=main.onlostpointercapture=e=>{if(e.pointerId===pointer)pointer=null;};
main.onclick=e=>{if(e.detail===0&&playing&&round.phase!=='fight')action(round);};
addEventListener('keydown',e=>{
 if(e.repeat||e.target.matches('input,select,textarea'))return;
 if(['Digit1','Digit2','Digit3'].includes(e.code)){setSpot(Number(e.code.at(-1))-1);return;}
 if(!(e.code==='Digit4'||(e.code==='Space'&&!e.target.matches('button')))||!playing)return;
 e.preventDefault();keyboard=true;if(round.phase!=='fight')action(round);
});
addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Digit4')keyboard=false;});
addEventListener('blur',()=>{pointer=null;keyboard=false;});
function frame(now){
 const dt=Math.min(.05,(now-(previous??now))/1000);previous=now;
 if(playing)update(round,dt,pointer!==null||keyboard);
 if(round.phase==='done'&&playing){
  playing=false;el('start').disabled=false;el('start').textContent='Fish again';
 }
 const labels={ready:'Cast',cast:'Casting',wait:'Wait…',bite:'Hook!',fight:'Hold Reel',recover:'Wait…',done:'Cast'};
 const hints={ready:playing?(round.notice||'Pick a spot and cast'):'Ready to fish',cast:'Bobber on its way',wait:'Watch the bobber',bite:'Bite! Tap Hook',fight:round.tug?'Fish is pulling · release':'Reel while the line eases',recover:round.notice,done:round.count+' fish landed'};
 for(const tool of ['bait','slack','pump'])el('fish-'+tool).disabled=!playing||(tool==='bait'?round.phase!=='ready':round.phase!=='fight');
 const next=round.phase+':'+hints[round.phase];
 if(mark!==next){el('status').textContent=hints[round.phase];mark=next;}
 main.textContent=labels[round.phase];
 main.disabled=!playing||!['ready','bite','fight'].includes(round.phase);
 main.classList.toggle('urgent',round.phase==='bite');
 main.classList.toggle('tug',round.tug);
 for(const b of spots)b.disabled=round.phase!=='ready';
 el('score').textContent=round.weight+' lb · '+Math.ceil(Math.max(0,duration-round.time))+' s';
 el('tension').value=round.tension;el('reel').value=round.reel;
 draw(now);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
