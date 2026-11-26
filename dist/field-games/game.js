import {workScore} from './craft.js';
import {courses,newGolf,clubs,clubStash,scoutGolf,grabClub,putt,roll,nextHole,newTower,climb,towerAction,towerWindow,tickTower,newFlock,herd,flockAction,flockScore,sheepBarns,sheepModes} from './rules.js';
import {createScene} from '../movement/scene.js';
import {maps,mapMesh,golfCourseMesh,fieldGameMeshes,rabbitMesh,ferryMeshes,gardenMeshes,spectatorMeshes,yardGameMeshes,deliveryMeshes,tractorGameMeshes,workshopMeshes,garageMeshes,homesteadMeshes,golfClubMeshes,canHenMeshes,finaleMeshes,pieRelayMeshes,herdingMeshes,teamPastureMeshes} from '../movement/maps.js';

import {newChase,tickChase,treatPoint,action as chaseAction,titles,rabbitMove,burrowHint} from './chase.js';

import {newFerryRound,ferryRoundTick,ferryModes,ferryAction,ferryCurrent,rocks} from './ferry.js';

import {setupScreen} from './screen.js';

import {heads,forks,nearFork,waterOn,wateredTargets,forkStatus,baskets,gardenDuration,crewDuration,plotPoint,callPlanter,lanes,gardenStart,jet,gardenTick,valve,gatherBasket,turnSprinkler,gardenDash,sackStart,sackJump,sackTick,sackBrace,sackRecover,sackModes,sackHazards} from './garden.js';

import {boards,barnColors,barnPanel,barnAtBucket,holes,paintLimit,catchLimit,catchGoal,barnStart,barnTick,paintBoards,changeRow,refill,gopherStart,gopherTick,gopherMove,catchGopher} from './yard-games.js';

import {loads,bays,feedNames,feedColors,feedTicket,braceFeed,returnFeed,swath,ruts,feedStart,hayStart,deliveryTick,deliveryAction,wagonBalance,signalDriver,braceWagon} from './delivery.js';

import {mudBounds,muddy,pullStart,traction,throttle,clutch,shift,pullTick,bogStart,boost,bogGear,bogBrake,bogWinch,bogTick} from './tractor.js';

import {windmills,mailboxes,tools,paintColors,mailTasks,shiftTime,windStart,mailStart,workTick,station,inspectMill,fixMill,inspectMail,decorate} from './workshop.js';

import {parts,racks,bench,garageTools,garageTool,garageStart,garageTick,garageAction,derbyStart,derbyTick,derbyBoost,derbyManeuver,derbyPit} from './garage.js';

import {plots,plantStart,goatStart,plantTick,plantAction,plantTools,plantLimit,nearPlot,goatTick,goatCommand,lureGoats} from './homestead.js';

import {canSpot,canRack,kitchen,jobs,kickTime,henTime,canStart,henStart,guard,canMove,canTick,kickCan,replaceCan,henTick,cook} from './can-hen.js';

import {nest,exit,cowSpots,butcherStations,cuts,darePoint,foxStart,cowStart,cowSetup,nearCow,butcherStart,butcherStep,cutCount,truthStart,cutAt,cowSway,patrol,foxAbility,finaleTick,finaleAction,choosePrompt,passPrompt} from './farm-finale.js';

import {pantry,ingredients as pieIngredients,presets,pieStart,nextIngredient,pieAction,swapIngredient,beginAim,releaseAim,tossPower,pieTick} from './pie-relay.js';

const get=id=>document.getElementById(id);
const names={golf:'Hillbilly Golf',tower:'Water Tower Dash',sheep:'Sheep Herdin’',chase:'Rabbit Run · Carrot Heist',ferry:'Watermelon Ferry',sprinkler:'Sprinkler Scramble',sack:'Sack Race',barn:'Barn Painting',gopher:'Gopher Catching',feed:'Feed Store Run',hay:'Buck the Hay',pull:'Tractor Pull',bog:'Mud Bog',wind:'Windmill Repair',mail:'Mailbox Makeover',derby:'Demolition Derby',junk:'Junkyard Jamboree',plant:'Plantin’',goat:'Goat Getaway',can:'Kick the Can',hen:'Little Red Hen',fox:'Fox’n da Hen House',cow:'Cow Tippin’',butcher:'Butcher the Cow',truth:'Truth or Dare Farm Edition',pie:'Pie Cookin’'};
const step=1/120,keys=new Set();
let game,state,last,accumulator=0,scene,models,golf,axis=[0,0],pointer=null;
const stick=get('stick');
let padAxis=[0,0],heldButtons=[],clubModels;
const world=([x,y],z=0)=>[(x-320)/80,(180-y)/80,z];

function drawGolf(){
 const c=courses[state?.index??0];
 scene.begin([.01,-3.25,7.2],[0,0,0],2.35);
 scene.paint(golf[state?.index??0]);
 if(state?.sunk)return;
 const ball=state?.ball??c.tee;
 const bridge=c.creek&&ball[0]>=c.creek[0]&&ball[0]<=c.creek[1];
 if(state?.club===null){
  for(const {x,y,club} of clubStash(state)){
   scene.paint(clubModels[club],world([x,y],.02),club*.44);
   scene.paint(models.marker,world([x,y],.33));
  }
  const p=state.scout;
  scene.paint(models.farmer,world([p.x,p.y]),p.angle,[2,p.gait,p.phase]);
 }else if(state&&!state.shot){
  scene.paint(clubModels[state.club],world([ball[0]-15,ball[1]+20],bridge?.095:.02),.74);
  const angle=-Number(get('aim').value)*Math.PI/180-Math.PI/2;
  const count=1+Math.floor(Number(get('power').value)/23);
  for(let i=1;i<=count;i++){
   const [x,y,z]=world(ball,bridge?.095:.028);
   scene.paint(models.aim,[x-i*.16*Math.sin(angle),y+i*.16*Math.cos(angle),z],angle);
  }
 }
 scene.paint(models.ball,world(ball,bridge?.095:.012));
}
function drawTower(now){
 scene.begin([2.8,-5.8,5.0],[0,.72,.73],2.15);
 scene.paint(models.tower);
 const r=state?.rung??0;
 const landing=r?Math.min(1,Math.max(0,(now-state.lastClimb)/180)):1;
 const y=-1.46+(r-1+landing)*.25;
 const z=maps.tower.height(0,y);
 const ladder=state?.route==='ladder'&&!state.done;
 const rise=Math.max(0,(r-1+landing)/12);
 scene.paint(models.farmer,ladder?[1.07,1.72,rise*1.48]:[0,y,z],0,[2,1-landing,landing*Math.PI*2]);
 const swing=state?.done?Math.sin((now-state.lastClimb)/90)*.09:0;
 scene.paint(models.bell,[.37+swing,1.55,1.62]);
 get('timing').low=-(state?towerWindow(state):205);
 get('timing').high=state?towerWindow(state):205;
 get('timing').value=state&&!state.done?Math.max(-850,Math.min(850,state.next-now)):850;
}
function drawSheep(){
 scene.begin([.01,-5.2,8.2],[0,.12,0],2.3);
 const f=state??preview;
 scene.paint(models[f.rival?'team-pasture':'pasture']);
 if(f.mode==='race')scene.paint(models['pasture-divider']);
 if(!f.gate)scene.paint(models['sheep-gate'],[f.rival?sheepBarns[0]:0,1.23,0]);
 if(f.rival){
  const r=f.rival;
  scene.paint(models['crew-1'],[r.x,r.y,Math.abs(Math.sin(r.phase))*r.gait*.07],r.angle+Math.PI);
 }
 if(f.dog&&f.elapsed<f.dog.until){
  const t=1-(f.dog.until-f.elapsed)/2.4;
  scene.paint(models['herding-dog'],[f.dog.side*(3.08-.62*Math.sin(t*Math.PI)),f.dog.y-.9+t*1.6,Math.abs(Math.sin(f.elapsed*13))*.043],-f.dog.side*.45);
 }
 const p=f.player;
 scene.paint(models.farmer,[p.x,p.y,0],p.angle,[2,p.gait,p.phase]);
 for(const [i,a] of f.sheep.entries()){
  const bounce=Math.abs(Math.sin(f.elapsed*12+i))*a.gait*.059;
  scene.paint(models[f.mode==='shared'?'marked-sheep-'+a.team:'sheep'],[a.x,a.y,bounce],a.angle);
 }
}
const preview=newFlock();
const previewChase=newChase('rabbit');
function drawChase(now){
 scene.begin([.01,-5.5,9.1],[0,0,0],2.23);
 scene.paint(models.chase);
 const s=state??previewChase;
 const carrot=treatPoint(s);
 if(carrot)scene.paint(models.carrot,[carrot.x,carrot.y,.05+.04*Math.sin(now/210)],now/500);
 for(const a of Object.values(s.actors)){
  const leap=a.dive>0?.10:a.leap?.54*Math.sin(Math.PI*a.leap/.56):0;
  scene.paint(models[a.role],[a.x,a.y,leap],a.angle,[{rabbit:3,coyote:1,farmer:2}[a.role],a.gait,a.phase],[a.lean,a.dive>0?Math.sin(Math.PI*a.dive/.38):0]);
  if(a.role==='rabbit'&&s.carrying)scene.paint(models.carrot,[a.x,a.y,leap+.57],now/500);
  if(a.role===(state?.role??get('chase-role').value))scene.paint(models.marker,[a.x,a.y,leap+(a.role==='farmer'?1.21:.90)]);
 }
}
const ferryPreview=newFerryRound('practice');
function drawFerry(now){
 const s=state??ferryPreview;
 const y=s.y,tilt=-s.vx*.17;
 const race=s.mode==='lanes';
 scene.begin([race?3.14:.01,y-4.5,race?10.7:7.6],[race?3.15:0,y+1.12,0],race?1.94:2.38);
 scene.paint(models.channel);
 if(race)scene.paint(models.channel,[6.30,0,0]);
 const bob=.036*Math.sin(now/143);
 if(state&&!s.done)for(let i=0;i<3;i++){
  const offset=(now/900+i*.38)%1.1;
  scene.paint(models.wake,[s.x-s.vx*offset*.12,y-.43-offset,.028],tilt);
 }
 const current=ferryCurrent(y);
 if(state&&!s.done&&current.surge){
  for(let i=0;i<3;i++)scene.paint(models.wake,[((now/390+i*1.31)%4)-2,y+.63+i*.32,.027],current.force<0?.31:-.31);
 }
 scene.paint(models.raft,[s.x,y,bob],tilt);
 const slots=[[-.33,.28],[.32,.27],[0,-.03],[-.32,-.29],[.32,-.29]];
 for(let i=0;i<s.cargo;i++){
  const [x,oy]=slots[i],ox=x+s.offset*.23;
  scene.paint(models.melon,[s.x+ox*Math.cos(tilt)-oy*Math.sin(tilt),y+ox*Math.sin(tilt)+oy*Math.cos(tilt),.26+bob],tilt);
 }
 for(const [i,r] of s.rivals.entries()){
  const rx=r.x+(race?6.30:0),turn=-r.vx*.17;
  scene.paint(models.raft,[rx,r.y,bob],turn);
  for(let k=0;k<r.cargo;k++){
   const [x,dy]=slots[k];
   scene.paint(models.melon,[rx+x+r.offset*.21,r.y+dy,.26+bob],turn);
  }
  scene.paint(models['crew-'+(1+i)],[rx,r.y+.31,.24+bob],Math.PI);
 }
 if(s.spilled&&s.flash>0){
  const t=1-s.flash;
  scene.paint(models.melon,[s.x+(s.vx<0?-1:1)*(.55+t*.85),y-t*.46,.05+Math.sin(Math.PI*t)*.42],t*6);
 }
}
const gardenPreview=gardenStart(),sackPreview=sackStart();
function drawGarden(){
 const s=state??gardenPreview;
 scene.begin([.01,-4.65,8.1],[0,.1,0],2.35);
 scene.paint(models.garden);
 for(const [i,[x,y]] of baskets.entries()){
  if(!s.planter&&!s.gathered[i])scene.paint(models.basket,[x,y,.02],Math.sin(i)*.24);
 }
 for(const [fork,pair] of s.hoses.entries())for(const [branch,head] of pair.entries()){
  const id=`${fork}-${branch}-${head}`;
  scene.paint(models['hose-'+id]);
  if(waterOn(s,head))scene.paint(models['flow-'+id]);
 }
 for(const [i,[x,y]] of heads.entries()){
  if(s.targets.includes(i)){
   scene.paint(models['water-target'],[x,y,.03]);
   scene.paint(models.marker,[x,y,waterOn(s,i)?.56:.73]);
  }
  if(!waterOn(s,i))continue;
  const a=jet(s.elapsed,i);
  for(let j=0;j<9;j++){
   const d=.18+((j/9+s.elapsed*1.1)%1)*1.5;
   scene.paint(models.droplet,[x+Math.cos(a)*d,y+Math.sin(a)*d,.30+Math.sin(d/1.73*Math.PI)*.41],a);
  }
 }
 if(s.planter){
  for(const c of s.crops){
   const spot=plotPoint(c.head);
   scene.paint(models[c.prep<1?'crop-bed':'sprouts'],[...spot,.055]);
   if(c.water>=2)scene.paint(models['water-target'],[...spot,.14]);
  }
  const p=s.planter;
  scene.paint(models['crew-2'],[p.x,p.y,Math.abs(Math.sin(p.phase))*p.gait*.065],p.angle+Math.PI);
 }
 const fork=nearFork(s);
 if(fork>=0)scene.paint(models.marker,[...forks[fork],.49]);
 if(s.wet)scene.paint(models.wake,[s.x,s.y,.045],s.elapsed*3);
 scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
}
function drawSack(){
 const s=state??sackPreview;
 const flight=Math.min(1,Math.max(0,(s.elapsed-s.hopAt)/s.hopTime));
 const y=s.from+(s.y-s.from)*flight;
 scene.begin([.01,y-4.55,8.1],[0,y+1.1,0],2.2);
 scene.paint(models['sack-track']);
 if(s.mode==='obstacles'){
  for(const {kind,y} of sackHazards)for(const x of lanes){
   scene.paint(models[kind==='hay'?'sack-hurdle':'sack-puddle'],[x,y,.026]);
  }
 }

 function racer(lane,y,z){
  scene.paint(models['crew-'+lane],[lanes[lane],y,z+.07],Math.PI);
  scene.paint(models.sack,[lanes[lane],y,z]);
 }
 racer(0,y,Math.sin(flight*Math.PI)*s.height);
 for(let i=0;i<s.bots.length;i++)racer(i+1,s.bots[i],state?Math.abs(Math.sin(s.elapsed*(5+i*.38)))*.18:0);
 const meter=get('timing');
 meter.low=-245;meter.high=245;
 meter.value=state&&!state.done?Math.max(-850,Math.min(850,(s.next-s.elapsed)*1000)):850;
}
const barnPreview=barnStart(),gopherPreview=gopherStart();
function drawYard(){
 const barn=game==='barn',s=state??(barn?barnPreview:gopherPreview);
 scene.begin([.01,-7.3,barn?5.6:8.1],[0,barn?.04:0,barn?.87:0],2.40);
 scene.paint(models[barn?'paint-yard':'gopher-yard']);
 if(barn){
  const selected=Math.max(0,Math.min(5,Math.round(s.x+2.5)));
  for(const [i,[x,row]] of boards.entries()){
   const z=.48+row*.74;
   scene.paint(models[s.painted[i]?'painted-board-'+s.stencil[i]:'bare-board'],[x,1.25,z]);
   if(!s.painted[i])scene.paint(models['stencil-chip-'+s.stencil[i]],[x,1.186,z]);
   if(s.y>=.67&&row===s.row&&i%6===selected)scene.paint(models['board-marker'],[x,1.197,z+.316]);
  }
 }else if(s.popup>=0){
  const [x,y]=holes[s.popup];
  const lift=Math.min(1,(s.until-s.elapsed)*9,Math.max(0,(s.elapsed-s.appears)*9));
  scene.paint(models.gopher,[x,y,.10-(1-lift)*.28]);
  scene.paint(models.marker,[x,y,.76]);
 }
 if(!barn&&s.elapsed<s.scoutUntil&&!s.done){
  const [x,y]=holes[s.next];
  scene.paint(models.wake,[x,y,.10],s.elapsed*5);
  scene.paint(models.marker,[x,y,.30+Math.sin(s.elapsed*14)*.04]);
 }
 scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
}
const feedPreview=feedStart(),hayPreview=hayStart();
function drawDelivery(){
 const s=state??(game==='hay'?hayPreview:feedPreview);
 if(game==='feed'){
  scene.begin([.01,-5.7,7.8],[0,0,0],2.32);
  scene.paint(models['feed-yard']);
  for(const [i,[x,y]] of loads.entries()){
   if(!s.delivered.includes(i)&&s.carrying!==i)scene.paint(models['feed-'+s.dest[i]],[x,y,.02]);
   if(!s.done&&s.carrying===null&&i===s.order[s.delivered.length])scene.paint(models.marker,[x,y,.63]);
  }
  scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
  if(s.carrying!==null){
   scene.paint(models['feed-'+s.dest[s.carrying]],[s.x-.38*Math.sin(s.angle),s.y+.38*Math.cos(s.angle),.48]);
   scene.paint(models.marker,[...bays[s.dest[s.carrying]],.45]);
  }
 }else{
  scene.begin([.01,s.y-4.15,6.1],[0,s.y+1,0],2.28);
  scene.paint(models.hayfield);
  scene.paint(models.tractor,[0,s.y+1.34,0]);
  scene.paint(models['crew-1'],[0,s.y+1.19,.40],Math.PI);
  scene.paint(models.wagon,[0,s.y,0]);
  for(const [i,[x,y]] of swath.entries()){
   if(!s.loaded.includes(i)&&s.carrying!==i)scene.paint(models['hay-bale'],[x,y,0]);
  }
  const stacks={[-1]:0,1:0};
  for(const side of s.stackSides){
   const i=stacks[side]++;
   scene.paint(models['hay-bale'],[side*.24,s.y-.36+(i%2)*.46,.38+Math.floor(i/2)*.47]);
  }
  for(const [i,y] of ruts.entries()){
   if(i>=s.rut)scene.paint(models.wake,[0,y,.026]);
   if(i===s.rut&&y-s.y<1.50)scene.paint(models.marker,[0,y,.34]);
  }
  scene.paint(models['crew-0'],[s.lane*.27,s.y+.46,.40],s.lane*Math.PI/2);
  if(s.carrying!==null)scene.paint(models['hay-bale'],[s.lane*.60,s.y+.37,.74]);
 }
}
const pullPreview=pullStart(),bogPreview=bogStart();
function drawTractor(now){
 const pull=game==='pull',s=state??(pull?pullPreview:bogPreview);
 scene.begin([.01,s.y-4.55,7.2],[0,s.y+1.18,0],2.30);
 scene.paint(models[pull?'pull-track':'bog-track']);
 if(pull)scene.paint(models['pull-sled'],[0,s.y-1.40,0]);
 const active=s.spin>.1||(!pull&&muddy(s.x,s.y)&&s.boost>0);
 if(active)for(let i=0;i<6;i++){
  const t=(now/480+i/6)%1;
  scene.paint(models['mud-spray'],[(s.x??0)+(i%2?1:-1)*(.34+t*.60),s.y-.20-t*.68,.12+Math.sin(t*Math.PI)*.36]);
 }
 scene.paint(models.tractor,[s.x??0,s.y,active?.025*Math.sin(now/40):0],s.angle??0);
 if(pull){
  const {low,high}=traction(s),meter=get('timing');
  meter.min=0;meter.max=100;meter.low=low;meter.high=high;meter.optimum=(low+high)/2;meter.value=s.throttle;
 }
}
const windPreview=windStart(),mailPreview=mailStart();
function drawWorkshop(){
 const wind=game==='wind',s=state??(wind?windPreview:mailPreview);
 scene.begin([.01,-6.9,6.4],[0,.05,.55],2.31);
 scene.paint(models[wind?'mill-yard':'mail-yard']);
 if(wind){
  for(const [i,[x,y]] of windmills.entries()){
   const running=s.progress[i]===s.plans[i].length,frame=running?Math.floor(performance.now()/44+i*4)%16:0;
   scene.paint(models['sails-'+frame],[x,y-.30,1.30]);
   if(!running)scene.paint(models.marker,[x,y,2.13]);
  }
 }else{
  for(const [i,[x,y]] of mailboxes.entries()){
   const steps=s.plans[i].slice(0,s.progress[i]),color=steps.includes('paint')?s.colors[i]:3;
   scene.paint(models['mailbox-'+color],[x,y,.60]);
   if(steps.includes('flag'))scene.paint(models['mail-flag-'+s.colors[i]],[x+.29,y,.60]);
   if(steps.includes('plate'))scene.paint(models['house-number'],[x,y-.29,.77]);
  }
 }
 scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
}
const derbyPreview=derbyStart(),garagePreview=garageStart();
function drawGarage(now){
 const derby=game==='derby',s=state??(derby?derbyPreview:garagePreview);
 scene.begin([.01,-5.9,8.4],[0,.03,0],2.27);
 scene.paint(models[derby?'derby-ring':'garage-yard']);
 if(derby){
  scene.paint(models.wake,[...derbyPit,.03]);
  if(!s.repaired)scene.paint(models.marker,[...derbyPit,.48]);
  for(const [i,a] of s.cars.entries()){
   scene.paint(models['derby-car-'+(a.hp>0?i:4)],[a.x,a.y,0],a.angle);
   if(!i&&a.hp>0)scene.paint(models.marker,[a.x,a.y,.72]);
   if(a.shield>.67)scene.paint(models['mud-spray'],[a.x,a.y,.58]);
  }
 }else{
  for(const [i,[x,y]] of racks.entries()){
   scene.paint(models['part-'+i],[x,y,.47],now/1600);
   if(i===s.order[s.step]&&s.part!==i)scene.paint(models.marker,[x,y,1.02]);
  }
  scene.paint(models['derby-car-'+(s.step===3?0:4)],[0,.27,0]);
  if(s.part!==null){
   scene.paint(models.marker,[bench[0],bench[1],.12]);
   scene.paint(models['part-'+s.part],[s.x-.34*Math.sin(s.angle),s.y+.34*Math.cos(s.angle),.51],s.angle);
  }
  scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
 }
}
const plantPreview=plantStart(),goatPreview=goatStart();
function drawHomestead(){
 const plant=game==='plant',s=state??(plant?plantPreview:goatPreview);
 scene.begin([.01,-5.8,8.15],[0,0,.1],2.31);
 scene.paint(models[plant?'plant-yard':'goat-yard']);
 if(plant){
  for(const [i,[x,y]] of plots.entries()){
   const stage=s.plots[i];
   if(stage===0||stage>=3)scene.paint(models[stage===0?'weeds':'sprouts'],[x,y,.055]);
   if(stage===2)scene.paint(models.aim,[x,y,.065],Math.PI/2);
   if(stage===4)scene.paint(models.wake,[x,y-.24,.061]);
   if(i===nearPlot(s)&&stage<4)scene.paint(models.marker,[x,y,.39]);
  }
 }else{
  if(!s.gate)scene.paint(models['sheep-gate'],[0,2.52,0]);
  for(const [i,g] of s.goats.entries())
   scene.paint(models.goat,[g.x,g.y,g.home?0:Math.abs(Math.sin(s.elapsed*10+i))*.035],g.angle);
 }
 scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
}
const canPreview=canStart(),henPreview=henStart();
function drawCanHen(now){
 const can=game==='can',s=state??(can?canPreview:henPreview);
 scene.begin([.01,-5.9,8.2],[0,.02,.13],2.28);
 scene.paint(models[can?'can-yard':'hen-yard']);
 if(can){
  const g=guard(s);
  scene.paint(models['crew-1'],[g.x,g.y,0],g.angle+Math.PI);
  const point=s.can?canSpot:canRack,z=s.can?.027:.46;
  if(!s.done){
   scene.paint(models['tin-can'],[...point,z]);
   scene.paint(models.marker,[...point,z+.35+Math.sin(now/170)*.037]);
  }
  if(s.flight>0){
   const t=1-s.flight/.56;
   scene.paint(models['tin-can'],[canSpot[0]-.86*t,canSpot[1]+2.10*t,.06+Math.sin(t*Math.PI)*.93],t*7);
  }
  for(let i=s.kicks;i<2;i++)scene.paint(models['crew-'+(2+i)],[-2.52+i*.59,2.02,.17]);
 }else{
  const props=['milk-jug','butter-churn','bread-loaf'];
  for(const [i,[x,y]] of kitchen.entries()){
   const active=s.job===i,z=.71+(active&&s.work?Math.abs(Math.sin(now/130))*.075:0);
   scene.paint(models[props[i]],[x,y+.36,z]);
   if(active&&(s.ovenAt===null||(s.elapsed-s.ovenAt>=1.05&&s.elapsed-s.ovenAt<=2.25)))
    scene.paint(models.marker,[x,y+.36,1.35]);
  }
 }
 scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
}
const finaleGames=new Set(['fox','cow','butcher','truth']);
const finalePreviews={fox:foxStart(),cow:cowStart(),butcher:butcherStart(),truth:truthStart()};
function drawFinale(s){
 scene.begin([.01,-5.8,8.1],[0,.02,.13],2.29);
 scene.paint(models[game+'-yard']);
 if(game==='fox'){
  if(s.stage==='defend')scene.paint(models.fox,[...s.fox,0],Math.atan2(s.fox[0],nest[1]-s.fox[1]),[1,state?.done?0:.68,s.elapsed*10]);
  else{
   const g=patrol(s);
   scene.paint(models['crew-1'],[g.x,g.y,0],g.x<0?Math.PI/2:-Math.PI/2);
   if(s.carrying)scene.paint(models.egg,[s.x,s.y,.46]);
   scene.paint(models.marker,[...(s.carrying?exit:nest),.39]);
  }
  const eggs=s.stage==='defend'?s.eggs:2-s.stolen-Number(s.carrying);
  for(let i=0;i<eggs;i++)scene.paint(models.egg,[nest[0]+(i-1)*.174,nest[1],.10]);
 }else if(game==='cow'){
  for(const [i,[x,y]] of cowSpots.entries()){
   const sway=cowSway(s,i);
   scene.paint(models['practice-cow-'+(s.tipped[i]?10:Math.round(4+4*sway))],[x,y,0]);
   if(!s.tipped[i]&&s.braced[i]&&s.progress[i]===s.setup[i].length&&sway>=.46)scene.paint(models.marker,[x,y,.97]);
  }
 }else if(game==='butcher'){
  const i=cutAt(s);
  if(i!==undefined){
   if(s.label)scene.paint(models.marker,[...butcherStations[i],.88]);
   scene.paint(models['wrapped-cut-'+i],[s.x-.32*Math.sin(s.angle),s.y+.32*Math.cos(s.angle),.49]);
  }
 }else if(s.mode==='dare')scene.paint(models.marker,[...darePoint(s),.37]);
 const animal=game==='fox'&&s.stage==='raid';
 scene.paint(models[animal?'fox':'farmer'],[s.x,s.y,0],s.angle,[animal?1:2,s.gait,s.phase]);
}
const piePreview=pieStart('rush',()=>0);
function drawPieRelay(s){
 scene.begin([.01,-6.15,7.75],[0,.12,.43],2.28);
 scene.paint(models['pie-relay-yard']);
 scene.paint(models['crew-2'],[0,2.24,0],s.flight?-.19:0);
 for(const [i,[x,y]] of pantry.entries()){
  scene.paint(models['pie-ingredient-'+i],[x,y,.37]);
  if(!s.done&&i===nextIngredient(s)&&s.holding!==i)scene.paint(models.marker,[x,y,.67]);
 }
 scene.paint(models.farmer,[s.x,s.y,0],s.angle,[2,s.gait,s.phase]);
 if(s.holding!==null)scene.paint(models['pie-ingredient-'+s.holding],[s.x-.31*Math.sin(s.angle),s.y+.31*Math.cos(s.angle),.57]);
 if(s.aim){
  const {charge,target}=tossPower(s),d=.70+charge*5.2;
  const angle=Math.atan2(-s.aim.x,s.aim.y);
  for(let i=1;i<=5;i++)scene.paint(models.aim,[s.x+s.aim.x*d*i/5,s.y+s.aim.y*d*i/5,.08],angle);
  if(Math.abs(charge-target)<=.12)scene.paint(models.marker,[s.x+s.aim.x*d,s.y+s.aim.y*d,.62]);
 }
 if(s.flight){
  const f=s.flight,t=Math.min(1,(s.elapsed-f.start)/.44);
  scene.paint(models['pie-ingredient-'+f.kind],[f.x+((f.tx??0)-f.x)*t,f.y+((f.ty??2.03)-f.y)*t,.58+Math.sin(Math.PI*t)*.71],t*5);
 }
 if(s.dropped)scene.paint(models['pie-ingredient-'+s.dropped.kind],[s.dropped.x,s.dropped.y,.018]);
 if(s.oven!==null&&!s.done){
  scene.paint(models['pie-prop'],[0,2.02,.70]);
  if(s.elapsed-s.oven>=1.35&&s.elapsed-s.oven<=2.35)scene.paint(models.marker,[0,1.94,.95]);
 }
 if(s.splat>0)scene.paint(models['pie-splat'],[0,1.43,.045]);
}
const movementGames=new Set(['sheep','chase','ferry','sprinkler','barn','gopher','feed','hay','bog','wind','mail','derby','junk','plant','goat','can','hen','golf','pie',...finaleGames]);
const createRound={
 golf:newGolf,tower:()=>newTower(performance.now()),chase:()=>newChase(get('chase-role').value),
 ferry:()=>newFerryRound(get('ferry-preset').value),sheep:()=>newFlock(get('sheep-preset').value),sprinkler:()=>gardenStart(Math.random,get('garden-preset').value),sack:()=>sackStart(get('sack-preset').value),barn:()=>barnStart(get('barn-preset').value),gopher:gopherStart,feed:feedStart,hay:hayStart,pull:pullStart,bog:bogStart,wind:windStart,mail:()=>mailStart(get('mail-preset').value),derby:derbyStart,junk:garageStart,plant:plantStart,goat:goatStart,can:canStart,hen:henStart,fox:foxStart,cow:cowStart,butcher:butcherStart,truth:truthStart,pie:()=>pieStart(get('pie-preset').value)
};
function loadMode(){
 clearStick();keys.clear();aimInput=null;
 const hash=location.hash.slice(1);
 game=Object.hasOwn(names,hash)?hash:'golf';state=null;
 get('title').textContent=names[game];
 for(const id of Object.keys(names)){
  if(id===game)get(id).setAttribute('aria-current','page');else get(id).removeAttribute('aria-current');
 }
 get('golf-controls').hidden=true;
 get('tower-timing').hidden=game!=='tower'&&game!=='sack'&&game!=='pull';
 get('timing-label').textContent=game==='pull'?'Throttle':game==='sack'?'Hop timing':'Climb timing';
 get('timing').min=-850;get('timing').max=850;
 stick.hidden=!movementGames.has(game);
 get('action').removeAttribute('aria-pressed');
 get('chase-roles').hidden=game!=='chase';
 get('paint-controls').hidden=game!=='barn';
 get('tractor-controls').hidden=game!=='pull';
 get('bog-controls').hidden=game!=='bog';
 get('workshop-controls').hidden=game!=='mail';
 get('wind-tools').hidden=game!=='wind';
 get('rabbit-tools').hidden=game!=='chase';
 get('truth-controls').hidden=game!=='truth';
 get('pie-controls').hidden=game!=='pie';
 get('hay-controls').hidden=game!=='hay';
 get('ferry-controls').hidden=game!=='ferry';
 get('sack-controls').hidden=game!=='sack';
 get('plant-controls').hidden=game!=='plant';
 get('spray-controls').hidden=game!=='sprinkler';
 get('feed-controls').hidden=game!=='feed';
 get('garage-controls').hidden=game!=='junk';
 get('gopher-controls').hidden=game!=='gopher';
 get('goat-controls').hidden=game!=='goat';
 get('hen-controls').hidden=game!=='hen';
 get('butcher-controls').hidden=game!=='butcher';
 get('cow-controls').hidden=game!=='cow';
 get('tower-tools').hidden=game!=='tower';
 get('derby-tools').hidden=game!=='derby';
 get('fox-tools').hidden=game!=='fox';
 get('can-tools').hidden=game!=='can';
 get('action').hidden=false;
 get('sheep-controls').hidden=game!=='sheep';
 clearStick();
 const instructions={
  golf:'Find a baseball bat, muffler, or broom on each hole. Walk up and pick one up, then aim and putt. Each club hits with different power. Bank off the old car door on the fourth hole.',
  tower:'Choose Stairs for a wider cue or Ladder for speed. Switch at landings. Brace in gusts, then tap Climb in the gold zone.',
  sheep:'Use the thumbstick, arrow keys, or WASD. Open the gate, then use the stick, whistle, and dog to guide sheep. In Shared Pasture, look for sheep with teal markings.',
  chase:'Rabbit carries carrots to either burrow to score. Coyote tags rabbit and knocks the carrot loose. Farmer tags either intruder and returns any carrot the rabbit is carrying. First to three wins.',
  ferry:'Steer left and right with the thumbstick or arrow keys. Use Paddle left or right to correct drift, Brace to secure sliding melons, and Steady to slow down. Most melons delivered wins. Docking time breaks ties.',
  sprinkler:'Trace the crossed hoses to the gold heads. In Scramble, gather six baskets. In Water Crew, route water to all three plots as the bot plants.',
  sack:'Small Hop works anywhere in the gold zone. Big Hop needs the center. Brace before a big landing, or use Recover if you stumble. In Obstacle Course, jump over hay bales and avoid landing in puddles.',
  barn:'Match the color chip on each panel. Use Row up or down to target it. Top changes color or refills the roller when you stand beside the bucket. Craftsmanship rewards first-try panels.',
  gopher:'Peek to see the next hole. Bait a hole to lure the next gopher or Cover a hole to send it elsewhere. Catch eight in 30 seconds.',
  feed:'Follow the truck ticket and deliver four sacks in order. Brace before lifting the heavy sack. Return a sack if you need to set it back.',
  hay:'The bot drives. Move left or right to the side with the next bale. Grab when it is beside you, then tap Load. Stack on either side. Balance the load or brace for a rut. Signal the driver to slow down.',
  pull:'Use Throttle + and − to stay in the traction zone. Tap Clutch, then Shift to change gears. High gear pulls faster but narrows the zone. Reach the line before the tires dig in.',
  bog:'Drive to the checkered line. Use low gear for grip, boost for speed, brake for control, or winch once toward the bank. Finish in 18 seconds.',
  wind:'Walk up and tap Inspect to reveal a repair card. Tap the Wrench, Oil, and Belt buttons in the shown order. Repair all three in 30 seconds.',
  mail:'Inspect each mailbox for its job card. Use Sand, Paint, and Fit in the order shown. Paint uses the color from the card. Craftsmanship rewards first-try work orders.',
  derby:'Boost for harder hits, use Handbrake to turn, or Brace for impact. The marked pit bay offers one repair.',
  junk:'Follow the marker to the next part, bring it to the workbench, and use the tools in the order shown on the fitting card.',
  plant:'Each plot starts at a different stage. Follow its prompt to weed, till, sow, or water. Get all eight growing in 32 seconds.',
  goat:'Open the gate and round up four goats. Shake feed to lure them, shoo them toward the pen, or whistle to pause nearby goats.',
  can:'Hide, distract, or dash to slip past the guard. Kick the can, get a spare, and kick again to free both teammates.',
  hen:'Milk and churn at the first two stations. Knead at the oven, tap Bake, then tap again when the cue turns gold.',
  fox:'Catch two foxes using a decoy or the alarm. During the raid, sneak, dash, and distract the guard to bring two eggs back.',
  cow:'Brace by each practice cow, follow its left/right rocking pattern, then tip it when the gold marker appears.',
  butcher:'Read the ticket. Wrap and label each cut, then pack it in the matching cooler. Some orders need two layers of paper.',
  truth:'Pick a shuffled Truth or Dare. Answer aloud or check in at each gold marker. You can pass any prompt.',
  pie:'Pick up the ingredient shown on the recipe card. Tap Toss near the window. From farther away, hold Aim toss, steer the aim, then release in gold. Serve when the cue turns gold.'
 };
 get('instructions').textContent=instructions[game];
}
function aimAtCup(){
 const [x,y]=state.ball,[hx,hy]=courses[state.index].cup;
 get('aim').value=Math.round(Math.atan2(hy-y,hx-x)*180/Math.PI);
 get('power').value=70;
}
get('start').onclick=()=>{
 if(!models)return;
 aimInput=null;state=createRound[game]();
 accumulator=0;
 if(game==='golf')aimAtCup();
};
get('restart').onclick=get('start').onclick;
get('action').onclick=()=>{
 if(!state||state.done||state.winner)return;
 if(game==='sheep'){flockAction(state,'gate');return;}
 if(game==='pie'){pieAction(state);return;}
 if(finaleGames.has(game)){finaleAction(state,game);return;}
 if(game==='can'){(state.can?kickCan:replaceCan)(state);return;}
 if(game==='hen'){cook(state,'bake');return;}
 if(game==='plant'){plantAction(state,3);return;}
 if(game==='goat'){lureGoats(state);return;}
 if(game==='derby'){derbyBoost(state);return;}
 if(game==='junk'){garageAction(state);return;}
 if(game==='wind'){inspectMill(state);return;}
 if(game==='mail'){inspectMail(state);return;}
 if(game==='pull'){shift(state);return;}
 if(game==='bog'){boost(state);return;}
 if(game==='feed'||game==='hay'){deliveryAction(state);return;}
 if(game==='barn'){paintBoards(state);return;}
 if(game==='gopher'){catchGopher(state);return;}
 if(game==='sprinkler'){(state.planter?callPlanter:gatherBasket)(state);return;}
 if(game==='sack'){sackJump(state);return;}
 if(game==='ferry'){ferryAction(state,'steady');return;}
 if(game==='chase'){if(state.role==='rabbit')rabbitMove(state,'hop');else chaseAction(state,state.role);return;}
 if(game==='tower')climb(state,performance.now());
 else if(game==='golf'&&state.sunk){nextHole(state);aimAtCup();}
 else if(game==='golf'&&state.club===null){grabClub(state);if(state.club!==null)clearStick();return;}
 else if(game==='golf'&&!state.shot){
  putt(state,Number(get('aim').value),Number(get('power').value));accumulator=0;
 }
};
for(const [id,action] of [['sheep-dog-left','left'],['sheep-dog-right','right'],['sheep-whistle','whistle']])
 get(id).onclick=()=>{if(game==='sheep')flockAction(state,action);};
for(const tool of ['milk','churn','knead'])get('hen-'+tool).onclick=()=>{if(game==='hen')cook(state,tool);};
for(const tool of ['wrap','label','ticket'])get('butcher-'+tool).onclick=()=>{if(game==='butcher')butcherStep(state,tool);};
for(const move of ['peek','bait','cover'])
 get('gopher-'+move).onclick=()=>{if(game==='gopher')gopherMove(state,move);};
for(const move of ['gate','shoo','whistle'])
 get('goat-'+move).onclick=()=>{if(game==='goat')goatCommand(state,move);};
for(const [id,fn] of [['feed-ticket',feedTicket],['feed-brace',braceFeed],['feed-return',returnFeed]])
 get(id).onclick=()=>{if(game==='feed'&&state)fn(state);};
for(const [i,id] of ['garage-wrench','garage-clamp','garage-test'].entries())
 get(id).onclick=()=>{if(game==='junk'&&state)garageTool(state,i);};
for(const [i,id] of ['plant-weed','plant-till','plant-sow'].entries())
 get(id).onclick=()=>{if(game==='plant'&&state)plantAction(state,i);};
for(const [id,fn] of [['spray-off',valve],['spray-turn',turnSprinkler],['spray-dash',gardenDash]])
 get(id).onclick=()=>{if(game==='sprinkler'&&state)fn(state);};
get('sack-big').onclick=()=>{if(game==='sack'&&state)sackJump(state,true);};
get('sack-brace').onclick=()=>{if(game==='sack'&&state)sackBrace(state);};
get('sack-recover').onclick=()=>{if(game==='sack'&&state)sackRecover(state);};
for(const [id,action] of [['ferry-left','left'],['ferry-right','right'],['ferry-brace','brace']])
 get(id).onclick=()=>{if(game==='ferry')ferryAction(state,action);};
function rutAhead(s){return ruts[s.rut]-s.y<1.5;}
get('hay-helper').onclick=()=>{
 if(game==='hay'&&state)(rutAhead(state)?braceWagon:signalDriver)(state);
};
get('pie-swap').onclick=()=>{if(game==='pie'&&state)swapIngredient(state);};
get('pie-card').onclick=()=>{
 if(game==='pie'&&state&&!state.done)state.note=state.recipe.pattern.slice(state.step).map(i=>pieIngredients[i]).join(' → ')||'Pie in the oven';
};
let aimInput=null;
function startPieAim(source){
 if(game!=='pie'||aimInput!==null||!beginAim(state))return false;
 aimInput=source;return true;
}
function endPieAim(source,cancel=false){
 if(aimInput!==source)return;
 aimInput=null;
 if(game!=='pie'||!state?.aim)return;
 if(cancel){state.aim=null;state.note='Toss canceled';}
 else releaseAim(state);
}
function bindPieAim(button,shared=false){
 button.onpointerdown=e=>{
  if(e.button!==0||!startPieAim(e.pointerId))return;
  button.setPointerCapture(e.pointerId);
 };
 button.onpointerup=e=>endPieAim(e.pointerId);
 button.onpointercancel=button.onlostpointercapture=e=>endPieAim(e.pointerId,true);
 if(!shared)button.onclick=e=>{if(!e.detail)togglePieAim();};
}
function togglePieAim(){
 if(aimInput==='toggle')endPieAim('toggle');else startPieAim('toggle');
}
bindPieAim(get('pie-aim'));
bindPieAim(get('pad-east'),true);
for(const move of ['brace','left','right'])get('cow-'+move).onclick=()=>{if(game==='cow')cowSetup(state,move);};
for(const tool of ['decoy','dash','sneak'])get('fox-'+tool).onclick=()=>{if(game==='fox')foxAbility(state,tool);};
for(const tool of ['hide','dash','distract'])get('can-'+tool).onclick=()=>{if(game==='can')canMove(state,tool);};
for(const tool of ['stairs','ladder','brace'])get('tower-'+tool).onclick=()=>{if(game==='tower')towerAction(state,tool);};
for(const tool of ['brake','brace','repair'])get('derby-'+tool).onclick=()=>{if(game==='derby')derbyManeuver(state,tool);};
get('pass-prompt').onclick=()=>{if(game==='truth')passPrompt(state);};
get('choose-truth').onclick=()=>{if(game==='truth')choosePrompt(state,'truth');};
get('choose-dare').onclick=()=>{if(game==='truth')choosePrompt(state,'dare');};
const held=(a,b)=>Number(keys.has(a)||keys.has(b));
const horizontal=()=>held('ArrowRight','KeyD')-held('ArrowLeft','KeyA')||axis[0]||padAxis[0];
for(const [i,id] of ['wrench','oil','belt'].entries()){
 get('tool-'+id).onclick=()=>{if(game==='wind'&&state)fixMill(state,i);};
}
for(const move of ['burrow','feint','dash']){
 get('rabbit-'+move).onclick=()=>{if(game==='chase'&&state)rabbitMove(state,move);};
}
for(const tool of ['sand','paint','fit'])get('mail-'+tool).onclick=()=>{if(game==='mail'&&state)decorate(state,tool);};
get('clutch').onclick=()=>{if(game==='pull'&&state)clutch(state);};
get('bog-gear').onclick=()=>{if(game==='bog'&&state)bogGear(state);};
get('bog-brake').onclick=()=>{if(game==='bog'&&state)bogBrake(state);};
get('bog-winch').onclick=()=>{if(game==='bog'&&state)bogWinch(state);};
get('throttle-up').onclick=()=>{if(game==='pull'&&state)throttle(state,5);};
get('throttle-down').onclick=()=>{if(game==='pull'&&state)throttle(state,-5);};
get('row-up').onclick=()=>{if(game==='barn'&&state)changeRow(state,1);};
get('row-down').onclick=()=>{if(game==='barn'&&state)changeRow(state,-1);};
get('refill').onclick=()=>{if(game==='barn'&&state)refill(state);};
function point(e){
 const b=stick.getBoundingClientRect(),x=e.clientX-b.left-b.width/2,y=e.clientY-b.top-b.height/2;
 const d=Math.hypot(x,y),strength=Math.max(0,Math.min(1,(d-5)/24));
 axis=d?[x/d*strength,-y/d*strength]:[0,0];
 stick.style.setProperty('--x',axis[0]*29+'px');stick.style.setProperty('--y',-axis[1]*29+'px');
}
function clearStick(){
 axis=[0,0];pointer=null;
 stick.style.setProperty('--x','0px');stick.style.setProperty('--y','0px');
}
stick.onpointerdown=e=>{if(pointer===null&&e.button===0){pointer=e.pointerId;stick.setPointerCapture(pointer);point(e);}};
stick.onpointermove=e=>{if(pointer===e.pointerId)point(e);};
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=e=>{if(pointer===e.pointerId)clearStick();};
addEventListener('blur',()=>{keys.clear();clearStick();endPieAim(aimInput,true);});
const faceKeys={Digit1:'west',Digit2:'north',Digit3:'east',Digit4:'south',Space:'south'};
function pressFace(face){
 if(document.body.classList.contains('drawer'))return;
 const button=get('pad-'+face);
 if(!button.disabled)button.onclick?.();
}
addEventListener('keydown',e=>{
 if(e.target?.matches?.('input,select,textarea,[contenteditable]')||document.body.classList.contains('drawer'))return;
 const face=faceKeys[e.code];
 if(game==='pie'&&e.code==='Digit3'){e.preventDefault();if(!e.repeat)startPieAim('keyboard');return;}
 if(face&&!e.repeat&&(e.code!=='Space'||!e.target?.matches?.('button,a'))){
  e.preventDefault();pressFace(face);
 }
 if(movementGames.has(game)&&(game!=='golf'||state?.club===null)&&/^(Arrow(Up|Down|Left|Right)|Key[WASD])$/.test(e.code)){
  keys.add(e.code);e.preventDefault();
 }
});
addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Digit3')endPieAim('keyboard');});
addEventListener('hashchange',loadMode);
function setText(id,value){
 const element=get(id);
 if(element.textContent!==value)element.textContent=value;
}
function frame(now){
 const elapsed=Math.min(.10,Math.max(0,(now-(last??now))/1000));
 last=now;
 readPad();
 const x=horizontal();
 const y=held('ArrowUp','KeyW')-held('ArrowDown','KeyS')||axis[1]||padAxis[1];
 if(game==='golf'){
  stick.hidden=state?.club!==null;
  get('golf-controls').hidden=state?.club==null;
  if(state?.club===null)scoutGolf(state,x,y,elapsed);
  if(state){
   const wasRolling=!!state.shot;
   accumulator+=elapsed;
   while(accumulator>=step){roll(state,step);accumulator-=step;}
   if(wasRolling&&!state.shot&&!state.sunk)aimAtCup();
  }
  drawGolf();
  const idx=state?.index??0;
  setText('score',state?.done?`${state.strokes} strokes · Par ${courses.reduce((sum,c)=>sum+c.par,0)}`:`Hole ${idx+1}/${courses.length} · ${state?.count??0} strokes${state?.club!=null?' · '+clubs[state.club].name:''}`);
  setText('status',state?.note??courses[idx].name);
  setText('action',state?.sunk&&!state.done?'Next hole':state?.club===null?'Pick up':'Putt');
 }else if(game==='tower'){
  if(state)tickTower(state,now);
  drawTower(now);
  setText('score',state?.done?`${state.time.toFixed(2)} s · ${state.misses} missed`:`${state?.rung??0}/12 · ${state?.route==='ladder'?'Ladder':'Stairs'} · ${state?.misses??0} missed`);
  setText('status',state?.note??'Ready at the stairs');
  setText('action','Climb');
 }else if(game==='pull'){
  if(state)pullTick(state,elapsed);
  drawTractor(now);
  const distance=Math.max(0,(state?.y??-5.6)+5.6);
  const {low,high}=traction(state??pullPreview);
  setText('score',`${distance.toFixed(1)}/13.2 m · ${state?.throttle??0}% · Gear ${state?.gear??1} · Target ${Math.ceil(low)}–${Math.floor(high)}%`);
  setText('status',state?.note??'Ready for the pull');
  setText('action',state?.gear===2?'Shift low':'Shift high');
 }else if(game==='sack'){
  if(state)sackTick(state,elapsed);
  drawSack();
  get('sack-preset').disabled=!!state&&!state.done;
  setText('score',state?`${sackModes[state.mode]} · ${state.elapsed.toFixed(1)} s`:'Choose a mode or leave it on Random');
  const bigReady=state&&!state.done&&!state.landing&&state.elapsed>=state.recoverAt&&Math.abs(state.elapsed-state.next)<=.115;
  const hazard=state?.mode==='obstacles'&&!state.done&&!state.landing?sackHazards.find(a=>a.y>state.y&&a.y-state.y<1.6):null;
  const hint=hazard?' · '+(hazard.kind==='hay'?'Hay bale ahead':'Puddle ahead'):'';
  setText('status',(bigReady?'Big hop now':state?.note??'Ready at the starting line')+hint);
  setText('action','Small hop');
 }else{
  if(game==='pie'){
   const s=state??piePreview;
   if(state)pieTick(s,x,y,elapsed);
   drawPieRelay(s);
   get('pie-preset').disabled=!!state&&!s.done;
   const bake=s.oven===null?null:s.elapsed-s.oven;
   const charge=s.aim?tossPower(s):null;
   const ready=charge&&Math.abs(charge.charge-charge.target)<=.12;
   get('pie-aim').disabled=!state||s.done||s.holding===null||!!s.flight;
   const clue=s.done?'':bake!==null?(bake<1.35?' · Baking':bake<=2.35?' · Serve now!':' · Past gold'):` · ${s.recipe.name} · Next: ${pieIngredients[nextIngredient(s)]??'Oven'}`;
   setText('score',state?`${presets[s.preset].name} · ${s.served} pies · ${s.quality} pts · ${Math.max(0,Math.ceil(presets[s.preset].time-s.elapsed))} s`:'Choose a preset or leave it on Random');
   const power=charge?` · Power ${Math.round(charge.charge*100)}% / ${Math.round(charge.target*100)}% target${ready?' · Release!':''}`:'';
   setText('status',state?s.note+clue+power:'Ready at the bake shed');
   setText('action',bake!==null?'Serve':s.holding===null?'Pick up':'Toss');
  }else if(finaleGames.has(game)){
   const s=state??finalePreviews[game];
   if(state)finaleTick(state,game,x,y,elapsed);
   drawFinale(s);
   const count=game==='fox'?(s.stage==='defend'?`${s.caught}/2 foxes caught · ${s.eggs} eggs safe`:`${s.stolen}/2 eggs raided`):
    game==='cow'?`${s.tipped.filter(Boolean).length}/3 tipped`:game==='butcher'?`${s.packed}/${cutCount} packed${s.packed<cutCount?' · '+cuts[cutAt(s)]:''}` :`${s.turn}/3 prompts · ${s.completed} done · ${s.passed} passed`;
   setText('score',game==='truth'?count:`${count} · ${Math.max(0,Math.ceil(40-s.elapsed))} s`);
   if(game==='fox'){
    setText('fox-dash',s.stage==='raid'?'Dash':'Alarm');
    get('fox-sneak').hidden=s.stage!=='raid';
   }
   const prep=game==='butcher'&&!s.done?` · Wrap ${s.wrapped}/${s.wraps[s.packed]} · ${s.label?'Labeled':'Needs label'}`:'';
   const i=game==='cow'?nearCow(s):-1;
   const pattern=i>=0&&!s.tipped[i]&&s.braced[i]?' · '+(s.setup[i].slice(s.progress[i]).map(a=>a==='left'?'Left':'Right').join(' → ')||'Wait for gold'):'';
   setText('status',s.note+prep+pattern);
   setText('action',game==='fox'?(s.stage==='defend'?'Catch':s.carrying?'Deliver':'Grab egg'):game==='cow'?'Tip':game==='butcher'?'Pack':s.mode==='dare'?'Check in':'Done');
   get('choose-truth').disabled=get('choose-dare').disabled=!state||s.done||s.mode!=='choose';
   get('pass-prompt').disabled=!state||s.done||s.mode==='choose';
  }else if(game==='can'||game==='hen'){
   const can=game==='can',s=state??(can?canPreview:henPreview);
   if(state)(can?canTick:henTick)(state,x,y,elapsed);
   drawCanHen(now);
   const oven=!can&&s.ovenAt!==null?s.elapsed-s.ovenAt:null;
   const stepHint=can||s.done?'':s.job<2?` · ${jobs[s.job]} ${s.work}/${s.rolls[s.job]}`:s.work<s.rolls[2]?` · Knead ${s.work}/${s.rolls[2]}`:' · Oven';
   const count=can?`${s.kicks}/2 teammates free`:`${s.job}/3 stations${stepHint}`;
   setText('score',`${count} · ${Math.max(0,Math.ceil((can?kickTime:henTime)-s.elapsed))} s`);
   const ready=oven!==null&&!s.done&&oven>=1.05&&oven<=2.25;
   setText('status',ready?'Gold window · Take bread out now':s.note);
   setText('action',can?(s.can?'Kick':'Spare can'):oven===null?'Bake':'Take out');
  }else if(game==='plant'||game==='goat'){
   const plant=game==='plant',s=state??(plant?plantPreview:goatPreview);
   if(state)(plant?plantTick:goatTick)(state,x,y,elapsed);
   drawHomestead();
   const count=plant?`${s.plots.filter(n=>n===4).length}/8 growing`:`${s.goats.filter(g=>g.home).length}/4 penned`;
   setText('score',`${count} · ${Math.max(0,Math.ceil((plant?plantLimit:30)-s.elapsed))} s`);
   const job=plant&&!s.done?plantTools[s.plots[nearPlot(s)]]:null;
   setText('status',job?s.note+' · Plot needs '+job:s.note);
   if(!plant)setText('goat-gate',s.gate?'Close gate':'Open gate');
   setText('action',plant?'Water':s.cooldown>0?`Feed ${Math.ceil(s.cooldown)}s`:'Shake feed');
  }else if(game==='derby'||game==='junk'){
   const derby=game==='derby',s=state??(derby?derbyPreview:garagePreview);
   if(state)(derby?derbyTick:garageTick)(state,x,y,elapsed);
   drawGarage(now);
   const score=derby?`${s.cars[0].hp}/5 condition · ${s.cars.slice(1).filter(a=>a.hp>0).length} rivals · ${s.charges} boosts`:`${s.step}/3 parts · ${s.part===null?'Empty hands':parts[s.part]}`;
   setText('score',`${score} · ${Math.max(0,Math.ceil((derby?35:25)-s.elapsed))} s`);
   const card=!derby&&!s.done&&s.part!==null?s.plan[s.part].slice(s.input).map(n=>garageTools[n]).join(' → '):'';
   setText('status',card?`${s.note} · ${card}`:s.note);
   setText('action',derby?'Boost':s.part===null?'Pick up':'Check fit');
  }else if(game==='wind'||game==='mail'){
   const wind=game==='wind',preview=wind?windPreview:mailPreview;
   if(state)workTick(state,x,y,elapsed);
   const s=state??preview,i=station(s,wind?windmills:mailboxes);
   drawWorkshop();
   if(wind){
    const complete=s.progress.filter((n,j)=>n===s.plans[j].length).length;
    const card=i>=0&&s.checked[i]?s.plans[i].slice(s.progress[i]).map(n=>tools[n]).join(' → '):'';
    setText('score',`${complete}/3 running · ${Math.max(0,Math.ceil(shiftTime-s.elapsed))} s`);
    setText('status',card&&!s.done?`${s.note} · ${card}`:s.note);
    setText('action','Inspect');
   }else{
    const completed=s.progress.map((n,j)=>n===s.plans[j].length);
    const count=completed.filter(Boolean).length;
    const steps=i>=0&&s.checked[i]?s.plans[i].slice(s.progress[i]):[];
    const card=steps.map(task=>task==='paint'?'Paint '+paintColors[s.colors[i]]:mailTasks[task]).join(' → ');
    get('mail-preset').disabled=!!state&&!s.done;
    const result=s.mode==='craft'?`Craftsmanship · ${workScore(completed,s.flaws)}/100`:`Timed · ${Math.max(0,Math.ceil(shiftTime-s.elapsed))} s`;
    setText('score',state?`${count}/4 done · ${result}`:'Choose a mode or leave it on Random');
    setText('status',card&&!s.done?`${s.note} · ${card}`:s.note);
    setText('action','Inspect');
   }
  }else if(game==='bog'){
   if(state)bogTick(state,x,y,elapsed);
   drawTractor(now);
   setText('score',`${state?.charges??3} boosts · ${state?.low?'Low':'High'} gear · ${Math.max(0,Math.ceil(18-(state?.elapsed??0)))} s`);
   setText('status',state?.note??'Ready at the bog');
   setText('action','Boost');
  }else if(game==='feed'||game==='hay'){
   if(state)deliveryTick(state,x,y,elapsed);
   drawDelivery();
   const hay=game==='hay';
   const lean=hay&&state?wagonBalance(state):0;
   setText('hay-helper',hay&&state&&rutAhead(state)?'Brace':'Slow driver');
   setText('score',hay?`${state?.loaded.length??0}/6 loaded · ${lean===0?'Balanced':lean<0?'Left '+Math.abs(lean):'Right '+lean} · ${state?.signals??3} signals`:`${state?.delivered.length??0}/4 sacks · ${Math.max(0,Math.ceil(35-(state?.elapsed??0)))} s`);
   setText('status',(state?.note??(hay?'Ready on the wagon':'Ready at the feed store'))+(hay&&state&&!state.done&&rutAhead(state)?' · Rut ahead!':''));
   if(!hay&&state&&!state.done){
    const i=state.order[state.delivered.length];
    setText('status',`${state.note} · Ticket: ${feedNames[i]} → ${feedColors[state.dest[i]]}${i===state.heavy?' · Heavy':''}`);
   }
   const carrying=state?.carrying!=null;
   setText('action',hay?(carrying?'Load':'Grab'):(carrying?'Drop off':'Pick up'));
  }else if(game==='barn'||game==='gopher'){
   const barn=game==='barn';
   if(state)(barn?barnTick:gopherTick)(state,x,y,elapsed);
   drawYard();
   const time=Math.ceil((barn?paintLimit:catchLimit)-(state?.elapsed??0));
   const count=barn?`${state?.painted.filter(Boolean).length??0}/18 panels · ${barnColors[state?.color??0]} · Roller ${state?.coat??6}`:`${state?.caught??0}/${catchGoal} caught`;
   if(barn){
    get('barn-preset').disabled=!!state&&!state.done;
    const result=state?.mode==='craft'?`Craftsmanship · ${workScore(state.painted,state.flaws)}/100`:`Timed · ${Math.max(0,time)} s`;
    setText('score',state?`${count} · ${result}`:'Choose a mode or leave it on Random');
   }else setText('score',`${count} · ${time} s`);
   const stencil=barn&&state&&!state.done&&state.y>=.67&&!state.painted[barnPanel(state)]?' · Panel: '+barnColors[state.stencil[barnPanel(state)]]:'';
   setText('status',(state?.note??(barn?'Ready at the barn':'Ready by the gopher holes'))+stencil);
   if(barn)setText('refill',state&&barnAtBucket(state)?'Refill':'Next color');
   setText('action',barn?'Paint':'Catch');
  }else if(game==='sprinkler'){
   if(state)gardenTick(state,x,y,elapsed);
   drawGarden();
   get('garden-preset').disabled=!!state&&!state.done;
   const crew=!!state?.planter;
   const time=Math.max(0,Math.ceil((crew?crewDuration:gardenDuration)-(state?.elapsed??0)));
   const score=crew?`Water Crew · ${state.crops.filter(c=>c.water>=2).length}/3 growing · ${time} s`:
    `${state?.gathered.filter(Boolean).length??0}/6 baskets · ${state?wateredTargets(state):0}/3 gold watered · ${time} s`;
   setText('score',score);
   const fork=state?nearFork(state):-1;
   const routing=fork>=0?` · Y${fork+1}: ${forkStatus(state,fork)}`:'';
   setText('status',(state?.note??'Ready in the garden')+routing);
   setText('action',crew?'Call planter':'Gather');
  }else if(game==='ferry'){
   if(state){
    accumulator+=elapsed;
    while(accumulator>=step){ferryRoundTick(state,x,step);accumulator-=step;}
   }
   drawFerry(now);
   get('ferry-preset').disabled=!!state&&!state.done;
   const cargo=state?.rivals.length?`Teal ${state.cargo} · ${state.rivals.map(r=>r.name+' '+r.cargo).join(' · ')}`:`${state?.cargo??5}/5 melons`;
   setText('score',state?`${ferryModes[state.mode]} · ${cargo} · ${state.elapsed.toFixed(1)} s${Math.abs(state.offset)>.48?' · Cargo sliding':''}`:'Choose a mode or leave it on Random');
   setText('status',state?.finished&&!state.done?'Waiting for other crews to finish':state?.note??'Ready at the dock');
   setText('action',state?.brake?'Resume speed':'Steady');
   get('action').setAttribute('aria-pressed',String(!!state?.brake));
  }else if(game==='chase'){
   if(state){
    accumulator+=elapsed;
    while(accumulator>=step){tickChase(state,x,y,step);accumulator-=step;}
   }
   drawChase(now);
   const score=state?.scores??previewChase.scores;
   const role=state?.role??get('chase-role').value;
   setText('score',`Rabbit ${score.rabbit} · Coyote ${score.coyote} · Farmer ${score.farmer} · ${Math.ceil(45-(state?.elapsed??0))}s`);
   setText('status',state?.winner==='tie'?'Time’s up · Draw':state?.winner?`${titles[state.winner]} wins!`:state?.note??'Pick a role and start the round');
   const hint=burrowHint(state);
   if(hint&&!state.winner)setText('status',`${state.note} · ${hint}`);
   get('rabbit-tools').hidden=role!=='rabbit';
   setText('action',role==='rabbit'?'Hop':'Tag');
  }else{
   if(state)herd(state,x,y,elapsed);
   drawSheep();
   get('sheep-preset').disabled=!!state&&!state.done;
   const s=state??preview,[teal,red]=flockScore(s);
   const score=s.rival?`${sheepModes[s.mode]} · Teal ${teal}/3 · Red ${red}/3 · ${Math.max(0,Math.ceil(45-s.elapsed))} s`:
    state?`${teal}/6 penned · ${s.elapsed.toFixed(1)} s`:'Choose a mode or leave it on Random';
   const result=s.winner==='tie'?'Tie game!':s.winner==='teal'?'Teal wins!':'Red wins!';
   setText('score',score);
   setText('status',s.done?(s.rival?result:'Flock safely penned!'):s.note);
   setText('action',state?.gate?'Close gate':'Open gate');
  }
 }
 get('chase-role').disabled=game==='chase'&&!!state&&!state.winner;
 get('action').disabled=!state||(game==='ferry'&&state.finished)||(game==='pie'&&!!(state.flight||state.aim))||(game==='truth'&&state.mode==='choose')||(game==='goat'&&state.cooldown>0)||!!(state.done||state.shot||state.winner);
 get('start').disabled=!!state&&!state.done&&!state.winner;
 setText('start',(state?.done||state?.winner)?'Play again':'Start round');
 get('restart').hidden=!state||!!(state.done||state.winner);
 updatePad();
 if(document.body.classList.contains('immersive')){
  setText('overlay-status',get('status').textContent);setText('overlay-score',get('score').textContent);
 }
 requestAnimationFrame(frame);
}
function updatePad(){
 const aim=game==='golf'&&state&&state.club!==null&&!state.sunk&&!state.shot;
 const running=!!state&&!state.done&&!state.winner;
 const adjust=(id,amount)=>{
  const input=get(id),next=Number(input.value)+amount;
  input.value=String(Math.max(Number(input.min),Math.min(Number(input.max),next)));
 };
 const barn=game==='barn'&&running,hay=game==='hay'&&running,pull=game==='pull'&&running;
 const choosing=game==='truth'&&running&&state.mode==='choose';
 const wind=game==='wind'&&running,rabbit=game==='chase'&&running&&state.role==='rabbit';
 const bog=game==='bog'&&running;
 const sack=game==='sack'&&running;
 const ferry=game==='ferry'&&running&&!state.finished,pie=game==='pie'&&running,sheep=game==='sheep'&&running;
 const mail=game==='mail'&&running;
 const plant=game==='plant'&&running,spray=game==='sprinkler'&&running;
 const feed=game==='feed'&&running,junk=game==='junk'&&running;
 const goat=game==='goat'&&running,gopher=game==='gopher'&&running;
 const hen=game==='hen'&&running,butcher=game==='butcher'&&running;
 const cow=game==='cow'&&running,canPass=game==='truth'&&running&&!choosing;
 const tower=game==='tower'&&running,derby=game==='derby'&&running;
 const fox=game==='fox'&&running,can=game==='can'&&running;
 const controls={
  north:fox?[state.stage==='raid'?'Sneak':'Alarm',get(state.stage==='raid'?'fox-sneak':'fox-dash').onclick]:can?['Distract',get('can-distract').onclick]:tower?['Brace',get('tower-brace').onclick]:derby?['Brace',get('derby-brace').onclick]:cow?['Brace',get('cow-brace').onclick]:canPass?['Pass',get('pass-prompt').onclick]:hen?['Knead',get('hen-knead').onclick]:butcher?['Label',get('butcher-label').onclick]:goat?[state.gate?'Close gate':'Open gate',get('goat-gate').onclick]:gopher?['Peek',get('gopher-peek').onclick]:feed?['Ticket',get('feed-ticket').onclick]:junk?['Clamp',get('garage-clamp').onclick]:plant?['Till',get('plant-till').onclick]:spray?['Shut off',get('spray-off').onclick]:sack?['Brace',get('sack-brace').onclick]:ferry?['Brace',get('ferry-brace').onclick]:sheep?['Whistle',get('sheep-whistle').onclick]:hay?[rutAhead(state)?'Brace':'Slow driver',get('hay-helper').onclick]:pie?['Recipe',get('pie-card').onclick]:pull?['Clutch',get('clutch').onclick]:bog?['Winch',get('bog-winch').onclick]:wind?['Oil',get('tool-oil').onclick]:rabbit?['Burrow',get('rabbit-burrow').onclick]:mail?['Paint',get('mail-paint').onclick]:barn?[barnAtBucket(state)?'Refill':'Color',get('refill').onclick]:aim?['Power',()=>{const p=get('power');if(Number(p.value)>=Number(p.max))p.value=String(p.min);else adjust('power',15);}]:['Y'],
  west:fox?['Decoy',get('fox-decoy').onclick]:can?['Hide',get('can-hide').onclick]:tower?['Stairs',get('tower-stairs').onclick]:derby?['Handbrake',get('derby-brake').onclick]:cow?['Rock left',get('cow-left').onclick]:hen?['Milk',get('hen-milk').onclick]:butcher?['Wrap',get('butcher-wrap').onclick]:goat?['Shoo',get('goat-shoo').onclick]:gopher?['Bait',get('gopher-bait').onclick]:feed?['Brace',get('feed-brace').onclick]:junk?['Wrench',get('garage-wrench').onclick]:plant?['Weed',get('plant-weed').onclick]:spray?['Switch fork',get('spray-turn').onclick]:mail?['Sand',get('mail-sand').onclick]:sack?['Recover',get('sack-recover').onclick]:ferry?['Paddle left',get('ferry-left').onclick]:sheep?['Dog left',get('sheep-dog-left').onclick]:pie?['Swap',get('pie-swap').onclick]:bog?['Gear',get('bog-gear').onclick]:wind?['Wrench',get('tool-wrench').onclick]:rabbit?['Feint',get('rabbit-feint').onclick]:choosing?['Truth',get('choose-truth').onclick]:pull?['Throttle −',get('throttle-down').onclick]:hay?['Left',()=>{state.lane=-1;}]:barn?['Row down',get('row-down').onclick]:aim?['Aim left',()=>adjust('aim',-5)]:['X'],
  east:fox&&state.stage==='raid'?['Dash',get('fox-dash').onclick]:can?['Dash',get('can-dash').onclick]:tower?['Ladder',get('tower-ladder').onclick]:derby?['Repair',get('derby-repair').onclick]:cow?['Rock right',get('cow-right').onclick]:hen?['Churn',get('hen-churn').onclick]:butcher?['Ticket',get('butcher-ticket').onclick]:goat?['Whistle',get('goat-whistle').onclick]:gopher?['Cover',get('gopher-cover').onclick]:feed?['Return',get('feed-return').onclick]:junk?['Test',get('garage-test').onclick]:plant?['Sow',get('plant-sow').onclick]:spray?['Dash',get('spray-dash').onclick]:mail?['Fit',get('mail-fit').onclick]:sack?['Big hop',get('sack-big').onclick]:ferry?['Paddle right',get('ferry-right').onclick]:sheep?['Dog right',get('sheep-dog-right').onclick]:pie?['Aim toss',event=>{if(!event?.detail)togglePieAim();}]:bog?['Brake',get('bog-brake').onclick]:wind?['Belt',get('tool-belt').onclick]:rabbit?['Dash',get('rabbit-dash').onclick]:choosing?['Dare',get('choose-dare').onclick]:pull?['Throttle +',get('throttle-up').onclick]:hay?['Right',()=>{state.lane=1;}]:barn?['Row up',get('row-up').onclick]:aim?['Aim right',()=>adjust('aim',5)]:['B'],
  south:!running?[state?'Replay':'Start',get('start').onclick]:get('action').hidden?['A']:[get('action').textContent,get('action').onclick]
 };
 for(const [key,[label,fn]] of Object.entries(controls)){
  const button=get('pad-'+key);
  if(button.textContent!==label){button.textContent=label;button.setAttribute('aria-label',label);}
  button.disabled=!fn||(key==='south'&&running&&get('action').disabled)||(key==='east'&&pie&&get('pie-aim').disabled);
  button.onclick=fn??null;
 }
}
function readPad(){
 let pads=[];
 try{pads=globalThis.navigator?.getGamepads?.()??[];}catch{/* A browser can restrict controller access. */}
 const pad=Array.from(pads).find(p=>p?.mapping==='standard');
 const dead=v=>Math.abs(v??0)>.16?v:0;
 const dpad=(a,b)=>Number(!!pad?.buttons[a]?.pressed)-Number(!!pad?.buttons[b]?.pressed);
 padAxis=pad&&!document.body.classList.contains('drawer')?
  [dead(pad.axes[0])||dpad(15,14),-dead(pad.axes[1])||dpad(12,13)]:[0,0];
 const current=['south','east','west','north'].map((key,i)=>{
  const pressed=!!pad?.buttons[i]?.pressed;
  if(game==='pie'&&key==='east'){
   if(pressed&&!heldButtons[i]&&!document.body.classList.contains('drawer'))startPieAim('controller');
   if(!pressed&&heldButtons[i])endPieAim('controller',!pad);
  }else if(pressed&&!heldButtons[i])pressFace(key);
  return pressed;
 });
 heldButtons=current;
}
async function boot(){
 loadMode();get('start').disabled=true;
 setupScreen(()=>{clearStick();keys.clear();endPieAim(aimInput,true);});
 scene=createScene(get('field'));
 async function model(name){
  const response=await fetch('../movement/'+name+'.bin');
  if(!response.ok)throw Error('Could not load the '+name+' model.');
  const data=new Float32Array(await response.arrayBuffer());
  if(!data.length||data.length%18)throw Error('Incomplete '+name+' model.');
  return data;
 }
 const [farmer,fox]=await Promise.all([model('farmer'),model('fox')]);
 const coyote=fox.slice();
 for(let i=3;i<coyote.length;i+=6){
  const r=coyote[i],g=coyote[i+1],b=coyote[i+2];
  if(r>g*1.14&&r>b*1.20){
   const tone=(r+g+b)/3;coyote[i]=tone*.96;coyote[i+1]=tone*.93;coyote[i+2]=tone*.87;
  }
 }
 const crews=Object.fromEntries(Object.entries(spectatorMeshes()).filter(([key])=>key.startsWith('crew-')||key==='pie-prop'));
 models=Object.fromEntries(Object.entries({...fieldGameMeshes(),...ferryMeshes(rocks),...gardenMeshes(heads,lanes,forks),...yardGameMeshes(holes),...deliveryMeshes(bays),...tractorGameMeshes(mudBounds),...workshopMeshes(windmills,mailboxes),...garageMeshes(racks,bench),...homesteadMeshes(plots),...canHenMeshes(canRack,kitchen),...finaleMeshes(cowSpots,butcherStations),...pieRelayMeshes(pantry),...herdingMeshes(),...teamPastureMeshes(sheepBarns),...crews,farmer,fox,coyote,rabbit:rabbitMesh(),tower:mapMesh('tower'),chase:mapMesh('chase')})
  .map(([key,data])=>[key,scene.mesh(data)]));
 clubModels=golfClubMeshes().map(mesh=>scene.mesh(mesh));
 golf=courses.map(c=>scene.mesh(golfCourseMesh(c)));
 requestAnimationFrame(frame);
}
boot().catch(error=>setText('status',error.message));
