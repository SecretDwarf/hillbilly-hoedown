import {createScene} from '../movement/scene.js?goose=1';
import {homesteadMeshes,practiceAnimalMeshes} from '../movement/maps.js?animals=5';

const el=id=>document.getElementById(id);
const setup={
 goat:{button:'Ram', speed:2.0, time:.46, motion:4, hint:'Line up with a barrel and ram it. Knock all three out of place.'},
 goose:{button:'Honk', speed:1.67,time:.48,motion:5,hint:'Walk up to the three sheep and honk to scatter them.'},
 pig:{button:'Slide', speed:1.57,time:.68,motion:6,hint:'Slide across the three mud patches to splash through them.'},
 sheep:{button:'Hop', speed:1.73,time:.63,motion:7,hint:'Hop over each of the three low rails.'}
};
const spots=[[-1.65,1.02],[0,1.22],[1.65,1.02]];
const stick=el('stick'),keys=new Set();
let state, targets, axis=[0,0], pointer, camera=0;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function reset(){
 const kind=el('animal').value;
 state={kind,x:0,y:-1.65,z:0, angle:0, phase:0, gait:0, left:0, actionAngle:0};
 targets=spots.map(([x,y])=>({x,y,baseX:x,baseY:y,hit:false}));
 el('action').textContent=setup[kind].button;
 el('hint').textContent=setup[kind].hint;
 status();
}
function status(){
 const scored=targets.filter(t=>t.hit).length;
 el('status').textContent=scored===3?'Practice complete!':'Targets cleared · '+scored+' / 3';
 if(scored===3)el('action').textContent='Try again';
}
function action(){
 if(!state||state.left>0)return;
 if(targets.every(t=>t.hit)){reset();return;}
 state.left=setup[state.kind].time;
 state.actionAngle=state.angle;
}
function direction(e){
 const b=stick.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/32,y=(b.top+b.height/2-e.clientY)/32;
 const norm=Math.max(1,Math.hypot(x,y));
 axis=[x/norm,y/norm];
 stick.style.setProperty('--x',axis[0]*29+'px');stick.style.setProperty('--y',-axis[1]*29+'px');
}
function clear(){
 pointer=undefined;axis=[0,0];stick.style.removeProperty('--x');stick.style.removeProperty('--y');
}
stick.onpointerdown=e=>{if(pointer!==undefined)return;pointer=e.pointerId;stick.setPointerCapture(pointer);direction(e);};
stick.onpointermove=e=>{if(e.pointerId===pointer)direction(e);};
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=e=>{if(e.pointerId===pointer)clear();};
el('animal').onchange=reset;
el('action').onclick=action;
el('camera').onclick=()=>camera=(camera+1)%3;
addEventListener('keydown',e=>{
 if(e.target.matches('input,select,button'))return;
 if(e.code==='Space'){e.preventDefault();if(!e.repeat)action();return;}
 if(/^(Key[WASD]|Arrow(Up|Down|Left|Right))$/.test(e.code)){e.preventDefault();keys.add(e.code);}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();clear();});

function update(dt){
 const s=state,entry=setup[s.kind];
 const key=(a,b)=>Number(keys.has(a)||keys.has(b));
 let dx=key('KeyD','ArrowRight')-key('KeyA','ArrowLeft')||axis[0];
 let dy=key('KeyW','ArrowUp')-key('KeyS','ArrowDown')||axis[1];
 const active=s.left>0, impulse=active?Math.sin(Math.PI*s.left/entry.time):0;
 if(active && ['goat','pig'].includes(s.kind)){
  dx=-Math.sin(s.actionAngle);dy=Math.cos(s.actionAngle);
 }
 if(Math.hypot(dx,dy)>.04){
  const goal=Math.atan2(-dx,dy), delta=goal-s.angle;
  s.angle+=Math.atan2(Math.sin(delta),Math.cos(delta))*Math.min(1,dt*15);
 }
 const length=Math.max(1,Math.hypot(dx,dy));
 const speed=entry.speed+(active?(s.kind==='goat'?2.5:s.kind==='pig'?2.0:0):0);
 const nx=clamp(s.x+dx/length*speed*dt,-2.97,2.97),ny=clamp(s.y+dy/length*speed*dt,-2.62,2.35);
 s.z=s.kind==='sheep'?impulse*.37:0;
 const blocked=s.kind==='sheep'&&!active&&targets.some(t=>Math.abs(nx-t.x)<.48&&Math.abs(ny-t.y)<.14);
 if(!blocked){s.x=nx;s.y=ny;}
 s.gait+=(Math.min(1,Math.hypot(dx,dy))-s.gait)*Math.min(1,dt*12);
 s.phase+=dt*s.gait*(s.kind==='goose'?12:14);
 for(const t of targets){
  if(t.splash>0)t.splash=Math.max(0,t.splash-dt);
  if(t.hit&&s.kind==='goose'){
   t.x=clamp(t.x+t.vx*dt,-2.90,2.90);t.y=clamp(t.y+t.vy*dt,-2.60,2.31);
   t.vx*=Math.max(0,1-2*dt);t.vy*=Math.max(0,1-2*dt);
  }
  if(t.hit||!active)continue;
  const hit=s.kind==='sheep'?s.z>.13&&Math.abs(t.x-s.x)<.53&&Math.abs(t.y-s.y)<.20:distance(s,t)<(s.kind==='goose'?.88:.49);
  if(!hit)continue;
  t.hit=true;status();
  if(s.kind==='pig')t.splash=.42;
  if(s.kind==='goat'){t.x=clamp(t.x-Math.sin(s.angle)*.73,-2.97,2.97);t.y=clamp(t.y+Math.cos(s.angle)*.73,-2.62,2.35);}
  if(s.kind==='goose'){const d=Math.max(.01,distance(s,t));t.vx=(t.x-s.x)/d*2.2;t.vy=(t.y-s.y)/d*2.2;}
 }
 s.left=Math.max(0,s.left-dt);
 return impulse;
}

function box(w,d,h,color){
 const a=w/2,b=d/2;
 const points=[[-a,-b,0],[a,-b,0],[a,b,0],[-a,b,0],[-a,-b,h],[a,-b,h],[a,b,h],[-a,b,h]];
 const out=[];
 for(const [side,light] of [[[0,1,5,4],.75],[[1,2,6,5],.90],[[2,3,7,6],.66],[[3,0,4,7],.70],[[4,5,6,7],1]]){
  for(const i of [0,1,2,0,2,3])out.push(...points[side[i]],...color.map(c=>c*light));
 }
 return new Float32Array(out);
}
try{
 const scene=createScene(el('field'));
 const props=homesteadMeshes([]), animals=practiceAnimalMeshes();
 const meshes={
  goat:scene.mesh(animals.goat),goose:scene.mesh(animals.goose),pig:scene.mesh(animals.pig),
  sheep:scene.mesh(animals.sheep),yard:scene.mesh(props['goat-yard']),
  barrel:scene.mesh(box(.36,.36,.37,[.72,.40,.24])),
  rail:scene.mesh(box(.83,.13,.15,[.73,.54,.29])),
  mud:scene.mesh(box(.67,.57,.015,[.49,.32,.22])),
  drop:scene.mesh(box(.037,.037,.042,[.67,.47,.28])),
  lit:scene.mesh(box(.19,.19,.025,[.94,.73,.24]))
 };
 reset();
 let last;
 function frame(time){
  const dt=Math.min(.04,(time-(last??time))/1000);last=time;
  const pulse=update(dt);
  const s=state;
  const close=camera===2;
  const eye=close?[s.x+1.29,s.y+1.62,1.18]:camera===1?[.05,-4.35,8.4]:[s.x*.65+1.0,s.y*.56-4.7,3.48];
  const aim=close?[s.x,s.y,s.kind==='goose'?.49:.33]:[s.x*.29,s.y*.18,.16];
  scene.begin(eye,aim,close?2.40:camera===1?1.82:1.92,time/1000);
  scene.paint(meshes.yard);
  const object={goat:'barrel',goose:'sheep',pig:'mud',sheep:'rail'}[s.kind];
  for(const t of targets){
   scene.paint(meshes[object],[t.x,t.y,0],s.kind==='goose'?Math.atan2(-t.vx||0,t.vy||1):0,
     s.kind==='goose'?[7,Math.min(1,Math.hypot(t.vx||0,t.vy||0)),time*.016]:undefined);
   if(t.hit)scene.paint(meshes.lit,[t.baseX,t.baseY,.025]);
   if(t.splash>0){
    const travel=1-t.splash/.42;
    for(let i=0;i<8;i++){
     const a=i*Math.PI/4;
     scene.paint(meshes.drop,[t.x+Math.cos(a)*travel*.40,t.y+Math.sin(a)*travel*.37,Math.sin(travel*Math.PI)*(.18+.015*i)],a);
    }
   }
  }
  scene.paint(meshes[s.kind],[s.x,s.y,s.z],s.angle,[setup[s.kind].motion,s.gait,s.phase],[0,pulse]);
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}catch(error){el('status').textContent=error.message;}
