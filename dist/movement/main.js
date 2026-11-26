import {createScene} from './scene.js?idle=5';
import {districts,slots,trailY,nearbyStage} from './walkthrough.js';
import {maps,mapMesh,stageMesh,rabbitMesh,spectatorMeshes} from './maps.js';
import {start,move,tick} from './simulation.js';
import {activityAt} from './spectator.js';
const el=id=>document.getElementById(id);
const canvas=el('view'),stick=el('stick');
const keys=new Set(), models={};
let player=start('fox'),follow=[player.x,player.y,0], speed=1, paused=false, accumulator=0, last=null;
let pointer=null,axis=[0,0],wayfinding='',sceneTime=0,motionTime=0;
const wave=el('wave');
let waveStart=null;
const activity=el('activity');
activity.checked=location.hash==='#spectate';
if(activity.checked)el('title').textContent='Farm & Fairground Spectator';
if(['#idle','#motion','#farmer','#face','#torso','#arms','#boots'].includes(location.hash))el('map').value='yard';
if(['#idle','#farmer'].includes(location.hash))el('camera').value='front';
if(location.hash==='#face')el('camera').value='portrait';
if(location.hash==='#boots')el('camera').value='boots';
if(location.hash==='#arms')el('camera').value='arms';
if(location.hash==='#torso')el('camera').value='torso';
const selectedKind=()=>el('kind').value==='farmer-copper'?'farmer':el('kind').value;
activity.onchange=()=>{el('title').textContent=activity.checked?'Farm & Fairground Spectator':'Movement Lab';};
function advance(){
 motionTime+=tick;
 if(waveStart!==null&&motionTime-waveStart>=2.25)waveStart=null;
 if(activity.checked)sceneTime+=tick;
 const held=(a,b)=>Number(keys.has(a)||keys.has(b));
 move(player,held('ArrowRight','KeyD')-held('ArrowLeft','KeyA')||axis[0],held('ArrowUp','KeyW')-held('ArrowDown','KeyS')||axis[1]);
 if(player.gait>.16)waveStart=null;
 const delay=Number(el('delay').value), f=delay?1-Math.exp(-tick/delay):1;
 follow=follow.map((v,i)=>v+([player.x,player.y,player.z][i]-v)*f);
 updateWayfinding();
}
const playable={pie:'pie',yard:'fox',derby:'derby',junk:'junk',bog:'bog',feed:'feed',ferry:'ferry',chase:'chase',golf:'golf',tower:'tower',sheep:'sheep'};
function updatePlayLink(key){
 const game=playable[key];
 el('stage-play').hidden=!game;
 if(game)el('stage-link').href='../field-games/#'+game;
}
function updateWayfinding(){
 if(player.mapKey!=='walk')return;
 const slot=nearbyStage(player.x,player.y);
 el('matchup').hidden=slot?.key!=='teams';
 const next=slot?slot.district+' · '+maps[slot.key].title:player.y<trailY+1?'South trail · Farm west, Fairground east':player.x<0?'Farm path · Follow the teal entrances':'Fairground path · Follow the red entrances';
 if(next!==wayfinding){el('status').textContent=next;wayfinding=next;updatePlayLink(slot?.key);}
}
function arrive(x,y){
 player=start(selectedKind(),'walk');
 player.x=x;player.y=y;player.z=maps.walk.height(x,y);
 follow=[x,y,player.z];accumulator=0;wayfinding='';
 updateWayfinding();
}
for(const d of districts){
 const group=document.createElement('optgroup');group.label=d.name;
 for(const key of d.keys){
  const option=document.createElement('option');option.value=key;option.textContent=maps[key].title;group.append(option);
 }
 el('stage-directory').append(group);
}
el('farm-entry').onclick=()=>arrive(districts[0].x,trailY);
el('fair-entry').onclick=()=>arrive(districts[1].x,trailY);
el('stage-directory').onchange=()=>{
 const slot=slots.find(s=>s.key===el('stage-directory').value);
 if(!slot)return;
 arrive(slot.x,slot.y-4.45);
 el('stage-directory').value='';
};
function reset(){
 waveStart=null;
 wave.disabled=selectedKind()!=='farmer';
 const camera=el('camera');
 for(const option of camera.querySelectorAll('[data-farmer]'))option.disabled=selectedKind()!=='farmer';
 if(camera.selectedOptions[0].disabled)camera.value='follow';
 player=start(selectedKind(),el('map').value);follow=[player.x,player.y,player.z];accumulator=0;
 el('walk-controls').hidden=player.mapKey!=='walk';
 el('matchup').hidden=player.mapKey!=='teams';
 if(player.mapKey==='walk'){wayfinding='';updateWayfinding();return;}
 updatePlayLink(player.mapKey);
 const hint={pen:'Circle the bales and try tight turns near the fence.',lane:'Walk past the mailboxes and compare the view of each porch.'};
 const yardHint={fox:'Crawl through the fence gap and round the hay bale.',farmer:'Start inside the fence. Try the corner and coop ramp.',rabbit:'Hop through the low rail and circle the hay bale.'};
 el('status').textContent=maps[player.mapKey].hint??hint[player.mapKey]??yardHint[player.kind];
}
function stickMove(e){
 const b=stick.getBoundingClientRect(),x=e.clientX-b.left-b.width/2,y=e.clientY-b.top-b.height/2,r=Math.hypot(x,y);
 const travel=Math.min(r,27),t=Math.max(0,(travel-4)/23),nx=r?x/r:0,ny=r?y/r:0;
 axis=[nx*t,-ny*t];stick.style.setProperty('--x',nx*travel+'px');stick.style.setProperty('--y',ny*travel+'px');
}
function clearStick(){
 pointer=null;axis=[0,0];stick.style.setProperty('--x','0px');stick.style.setProperty('--y','0px');
}
stick.onpointerdown=e=>{if(pointer===null&&e.button===0){pointer=e.pointerId;stick.setPointerCapture(pointer);stickMove(e);}};
stick.onpointermove=e=>{if(pointer===e.pointerId)stickMove(e);};
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=e=>{if(pointer===e.pointerId)clearStick();};
addEventListener('blur',()=>{clearStick();keys.clear();});
addEventListener('keydown',e=>{
 if(/^(Arrow(Up|Down|Left|Right)|Key[WASD])$/.test(e.code)&&!e.target.matches('input,select')){e.preventDefault();keys.add(e.code);}
});
addEventListener('keyup',e=>keys.delete(e.code));
el('map').onchange=el('kind').onchange=el('reset').onclick=reset;
el('pause').onclick=()=>{paused=!paused;accumulator=0;el('pause').textContent=paused?'Resume':'Pause';el('step').disabled=!paused;};
wave.onclick=()=>{waveStart=motionTime;};
el('step').onclick=()=>{if(paused)advance();};
for(const b of document.querySelectorAll('[data-rate]'))b.onclick=()=>{
 speed=Number(b.dataset.rate);
 for(const t of document.querySelectorAll('[data-rate]'))t.setAttribute('aria-pressed',t===b);
};
function draw(scene){
 const {paint}=scene;
 const waveTime=waveStart===null?0:motionTime-waveStart;
 const pose=[player.lean,0,waveTime,Number(el('kind').value==='farmer-copper')];
 const top=el('camera').value==='top', [x,y,z]=follow, map=maps[player.mapKey], walking=player.mapKey==='walk';
 const camera=el('camera');
 if(camera.selectedOptions[0].hasAttribute('data-farmer')){
  const {x,y,z,angle}=player;
  if(camera.value==='boots'){
   const eye=[x-1.40*Math.sin(angle)+.42*Math.cos(angle),y+1.40*Math.cos(angle)+.42*Math.sin(angle),z+.55];
   scene.begin(eye,[x,y,z+.31],2.7,motionTime);
   paint(models[el('kind').value],[x,y,z],angle,[2,player.gait,player.phase],pose);
   return;
  }
  if(camera.value==='arms'||camera.value==='torso'){
   const arms=camera.value==='arms';
   const distance=arms?1.30:.95;
   const eye=[x-distance*Math.sin(angle)+.16*Math.cos(angle),y+distance*Math.cos(angle)+.16*Math.sin(angle),z+(arms?.92:.90)];
   scene.begin(eye,[x,y,z+(arms?.82:.745)],arms?2.1:2.2,motionTime);
   paint(models[el('kind').value],[x,y,z],angle,[2,player.gait,player.phase],pose);
   return;
  }
  const profileClose=camera.value==='profile-close';
  const threeQuarter=camera.value==='three-quarter';
  const close=camera.value==='portrait'||profileClose||threeQuarter, rear=camera.value==='rear';
  const profile=camera.value==='profile';
  const distance=profileClose?0:threeQuarter?.63:close?.77:rear?-2.15:profile?0:2.15;
  const side=profileClose?.77:threeQuarter?.48:close?.085:profile?2.15:0;
  const eye=[x-distance*Math.sin(angle)+side*Math.cos(angle),y+distance*Math.cos(angle)+side*Math.sin(angle),z+(close?1.075:.78)];
  scene.begin(eye,[x,y,z+(close?1.075:.66)],close?2.35:2.7,motionTime);
  paint(models[el('kind').value],[x,y,z],angle,[2,player.gait,player.phase],pose);
  return;
 }
 const overviewX=x<0?districts[0].x:districts[1].x;
 const eye=top?(walking?[overviewX+2,x<0?-13:-10,x<0?42:52]:map.overview):[x+Number(el('offset').value),y-Number(el('distance').value),z+Number(el('height').value)+(player.kind==='farmer'?.27:0)];
 const target=top?(walking?[overviewX,x<0?2:7,0]:map.center):[x,y+.74,z+.40];
 scene.begin(eye,target,top?2.36:1.87,motionTime);
 paint(models[player.mapKey],[0,0,0],0);
 if(walking){
  for(const slot of slots){
   if(!top&&Math.hypot(slot.x-x,slot.y-y)>=20)continue;
   paint(models['stage-'+slot.key],[slot.x,slot.y,0],0);
   if(activity.checked)paintActivity(slot.key,slot.x,slot.y);
  }
 }
 function paintActivity(key,x,y){
  for(const actor of activityAt(key,sceneTime)){
   const [ax,ay,z]=actor.position;
   paint(models[actor.model],[x+ax,y+ay,z+(maps[key].height?.(ax,ay)??0)],actor.angle,actor.motion);
  }
 }
 if(activity.checked&&!walking)paintActivity(player.mapKey,0,0);
 paint(models[el('kind').value],[player.x,player.y,player.z],player.angle,[{fox:1,farmer:2,rabbit:3}[player.kind],player.gait,player.phase],pose);
 if(top&&!activity.checked&&player.mapKey==='yard')paint(models[player.kind==='fox'?'farmer':'fox'],[1.48,.21,0],-.4);
}
async function boot(){
 const scene=createScene(canvas);
 function store(name,data,waveSections){models[name]=scene.mesh(data,waveSections);}
 for(const key of Object.keys(maps))if(key!=='yard')store(key,key==='walk'?stageMesh(key):mapMesh(key));
 for(const slot of slots)if(slot.key!=='yard')store('stage-'+slot.key,stageMesh(slot.key));
 store('rabbit',rabbitMesh());
 for(const [name,mesh] of Object.entries(spectatorMeshes()))store(name,mesh);
 await Promise.all(['yard','fox','farmer','farmer-copper'].map(async name=>{
  const r=await fetch(name+'.bin'+(name.startsWith('farmer')?'?boots=4':''));
  if(!r.ok)throw Error('Could not load the '+name+' model.');
  const a=new Float32Array(await r.arrayBuffer());
  if(!a.length||a.length%18)throw Error('Incomplete '+name+' model.');
  let sections=[];
  if(name.startsWith('farmer')){
   const ranges=await fetch(name+'.wave.json?idle=5');
   if(!ranges.ok)throw Error('Could not load the farmer gesture.');
   sections=await ranges.json();
   if(!sections.every(([start,end],i)=>start>=0&&end>start&&end<=a.length/6&&start%3===0&&end%3===0&&(!i||start>=sections[i-1][1])))
    throw Error('Invalid farmer gesture geometry.');
  }
  store(name,a,sections);
  if(name==='yard'){
   const bounded=[];
   for(let i=0;i<a.length;i+=18){
    if([0,6,12].every(j=>Math.abs(a[i+j])<4&&Math.abs(a[i+j+1])<4))
     for(let j=0;j<18;j++)bounded.push(a[i+j]);
   }
   store('stage-yard',new Float32Array(bounded));
  }
 }));
 reset();
 function frame(time){
  if(!paused){
   accumulator+=Math.min(.10,(time-(last??time))/1000)*speed;
   while(accumulator>=tick){advance();accumulator-=tick;}
  }
  last=time;draw(scene);requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
boot().catch(e=>{el('status').textContent=e.message;});
