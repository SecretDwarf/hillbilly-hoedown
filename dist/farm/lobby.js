import {createScene} from '../movement/scene.js?farm-motion=1';
import {
 farmLobbyMeshes,farmLobbyPropMeshes,practiceAnimalMeshes,spectatorMeshes,rabbitMesh,
 deliveryMeshes,workshopMeshes,canHenMeshes,homesteadMeshes,fieldGameMeshes,
 cornholeMeshes,garageMeshes
} from '../movement/maps.js?gates=1';

const el=id=>document.getElementById(id);
const cameras=[
 ['Whole farm',[13,-18,17],[0,.3,.2],1.85],
 ['Front Gate',[3.4,-16.6,3.3],[.15,-10.7,.65],2.95],
 ['Coop',[5,-8,4.7],[-5,-2.6,.3],2.6],
 ['Pasture',[11,-5,4.3],[5,1,.24],2.6],
 ['Workshop',[16,-8,5.6],[7,-4,.29],2.1],
 ['Garden',[-4,-5,4.4],[-7.9,2.0,.5],2.45],
 ['Pond',[9.6,1.6,4.6],[5.25,8.18,.12],2.25],
 ['Windmill',[-5,-1,3.5],[-8.8,5.9,.88],2.8]
];

async function binary(name){
 const r=await fetch('../movement/'+name+'.bin'+(name.startsWith('farmer')?'?boots=4':''));
 if(!r.ok)throw Error('Could not load '+name);
 return new Float32Array(await r.arrayBuffer());
}

async function boot(){
 const scene=createScene(el('farm'));
 const data = {
  ground:farmLobbyMeshes(),...farmLobbyPropMeshes(),...spectatorMeshes(),
  ...deliveryMeshes([]),...workshopMeshes([],[]),...canHenMeshes([0,0],[]),
  ...homesteadMeshes([]),...fieldGameMeshes(),...cornholeMeshes(),...garageMeshes([],[0,0]),
  rabbit:rabbitMesh()
 };
 // Prefer the redesigned animals where a background prop shares a name.
 Object.assign(data,practiceAnimalMeshes());
 for(const [name,mesh] of await Promise.all(['yard','fox','farmer','farmer-copper'].map(async name=>[name,await binary(name)])))data[name]=mesh;
 const items=[
  ['ground',0,0],['yard',-5,-4],['fox',-3.4,-5.8,.12,-.6],['rabbit',-3.9,-6.9,.04,.4],
  ['goose',-.8,-2.4,0,-.3],['goat',5.4,1.4,0,.4],['goat',6.4,2.2,0,1.9],
  ['sheep',7.7,.7,0,-.5],['sheep',8.6,1.4,0,-1.1],['sheep',7.1,2.1,0,.5],['pig',4.1,-2.5,0,.75],
  ['farmer',.8,-1.2,0,1.7],['farmer-copper',-.7,-.1,0,-.5],['tractor',8,-4,0,-1],
  ['wagon',10,-3.2,0,-1],['hay-bale',10.1,-5.2],['hay-bale',9.4,-5.2],['hay-bale',10.1,-5.85],
  ['derby-car-1',9.3,-7.9,0,.4],['windmill-sails',-8.8,5.75,1.47],['mailbox-0',2.1,-5.2,.58],
  ['sprouts',-7.1,1.4,.074],['sprouts',-7.1,2.1,.074],['sprouts',-7.1,2.8,.074],['weeds',-8.1,2.3,.074],
  ['milk-jug',-4.6,.9],['butter-churn',-4.1,.9],['bread-loaf',-3.6,.9],['pie-prop',2.3,-1.6],
  ['corn-board',2.5,4.3],['corn-ear',2.1,3.85],['tin-can',3.6,-5.2],['bell-post',-3.4,-4.4],['coop-bell',-3.4,-4.58,.99]
 ];
 const converted=new Map();
 for(const [name] of items)if(!converted.has(name)){
  if(!data[name])throw Error('Missing farm model '+name);
  converted.set(name,scene.mesh(data[name]));
 }
 let camera=0;
 const motionButton=el('motion');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let playing=!reducedMotion.matches;
 let frame=0, previous=null, elapsed=0, lastPaint=-Infinity;
 function draw(){
  const [,eye,target,zoom]=cameras[camera];
  scene.begin(eye,target,zoom,elapsed);
  const breeze=Math.sin(elapsed*1.45)*.55+Math.sin(elapsed*.73)*.45;
  for(const [name,x,y,z=0,angle=0] of items){
   let tilt=0;
   if(name==='windmill-sails')tilt=elapsed*.61+.18*breeze;
   if(name==='coop-bell'){
    const phase=elapsed%9;
    tilt=Math.sin(phase*7)*Math.exp(-phase*1.35)*.42;
   }
   if(name==='sprouts'||name==='weeds')tilt=.15*breeze*Math.cos(y*.9);
   scene.paint(converted.get(name),[x,y,z],angle,undefined,undefined,tilt);
  }
 }
 function animate(now){
  if(previous!==null)elapsed+=Math.min(now-previous,100)/1000;
  previous=now;
  if(now-lastPaint>=1000/30){draw();lastPaint=now;}
  frame=requestAnimationFrame(animate);
 }
 function syncMotion(){
  cancelAnimationFrame(frame);
  previous=null;
  motionButton.textContent=playing?'Pause motion':'Play motion';
  if(playing&&!document.hidden)frame=requestAnimationFrame(animate);
  draw();
 }
 motionButton.onclick=()=>{playing=!playing;syncMotion();};
 reducedMotion.addEventListener('change',event=>{playing=!event.matches;syncMotion();});
 document.addEventListener('visibilitychange',syncMotion);
 const choices=cameras.map(([name],i)=>{
  const button=document.createElement('button');button.textContent=name;
  button.onclick=()=>{camera=i;for(const b of choices)b.setAttribute('aria-pressed',b===button);draw();};
  button.setAttribute('aria-pressed',i===0);el('views').append(button);return button;
 });
 new ResizeObserver(draw).observe(el('farm'));
 document.addEventListener('fullscreenchange',draw);
 el('status').textContent='Pick a farm view or start a minigame.';
 motionButton.disabled=false;
 syncMotion();
}
boot().catch(error=>el('status').textContent=error.message);
