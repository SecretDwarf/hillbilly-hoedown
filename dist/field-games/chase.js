import {start,move} from '../movement/simulation.js';
import {maps} from '../movement/maps.js';

const spawns={rabbit:[-.12,-2.72],coyote:[2.44,1.17],farmer:[-.17,2.56]};
const burrowReach=.88;
const holes=[[-2.3,-2.42],[2.09,2.17]];
const titles={rabbit:'Rabbit',coyote:'Coyote',farmer:'Farmer'};
const goal={rabbit:3,coyote:3,farmer:3};
const treatSpots=[[2.42,-2.69],[-2.65,.45],[.53,2.63],[.83,-2.37]];
const near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d;
const targets={coyote:['rabbit'],farmer:['rabbit','coyote']};
const burrows=holes.map(([x,y])=>({x,y}));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const atBurrow=a=>burrows.some(b=>near(a,b,burrowReach));

export function newChase(role){
 const actors=Object.fromEntries(Object.entries(spawns).map(([name,[x,y]])=>[name,{
  ...start(name==='coyote'?'fox':name,'chase'),x,y,role:name,cooldown:0,leap:0,safe:0
 }]));
 return {role,actors,scores:{rabbit:0,coyote:0,farmer:0},elapsed:0,treat:0,dropped:null,carrying:false,winner:null,
  note:'Carrot Heist · First to three points wins'};
}
function tag(s,a,b){
 s.scores[a.role]++;
 if(a.role!==s.role)a.cooldown=4.5;
 s.note=titles[a.role]+' tagged the '+b.role+'!';
 if(b.role==='rabbit'&&s.carrying){
  s.carrying=false;
  if(a.role==='farmer')s.note='Farmer recovered the carrot!';
  else{
   s.dropped={x:b.x,y:b.y};s.note='Coyote tagged the rabbit. Carrot dropped!';
  }
 }
 const [x,y]=spawns[b.role];Object.assign(b,{x,y,gait:0,safe:1.25,leap:0,dash:0});
 if(s.scores[a.role]>=goal[a.role])s.winner=a.role;
}
export function action(s,role){
 if(s.winner)return;
 const a=s.actors[role];
 if(a.cooldown>0)return;
 if(role==='rabbit'){rabbitMove(s,'hop');return;}
 const target=targets[role].map(name=>s.actors[name])
  .filter(b=>!b.safe&&!b.leap&&near(a,b,.61)&&clear(a,b))
  .sort((a1,b1)=>distance(a,a1)-distance(a,b1))[0];
 a.cooldown=.62;
 if(target)tag(s,a,target);
 else if(role===s.role)s.note='Get closer to tag';
}
const roads=[[-.18,-2.30],[-.18,.65],[-.10,1.95],[-2.76,.53],[2.90,-.48],[.18,-.51],[.34,1.02]];
function clear(a,b){
 const distance=Math.hypot(b.x-a.x,b.y-a.y);
 for(let i=1;i<Math.ceil(distance/.12);i++){
  const f=i/Math.ceil(distance/.12),x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
  if(maps.chase.solids.some(([l,r,d,u])=>x>l-.19&&x<r+.19&&y>d-.19&&y<u+.19))return false;
 }
 return true;
}
function steer(a,target){
 const options=[target,...roads.map(([x,y])=>({x,y}))];
 const seen=new Set([a]),queue=[{point:a,first:null}];
 while(queue.length){
  const {point,first}=queue.shift();
  for(const next of options){
   if(seen.has(next)||near(point,next,.12)||!clear(point,next))continue;
   if(next===target)return first??target;
   seen.add(next);queue.push({point:next,first:first??next});
  }
 }
 return target;
}
export function treatPoint(s){
 if(s.carrying)return null;
 if(s.dropped)return s.dropped;
 const [x,y]=treatSpots[s.treat];return {x,y};
}
export function tickChase(s,dx,dy,dt){
 if(s.winner)return;
 s.elapsed=Math.min(45,s.elapsed+dt);
 for(const a of Object.values(s.actors)){
  for(const key of ['cooldown','leap','safe','dash','burrowCooldown','dive'])a[key]=Math.max(0,(a[key]??0)-dt);
  let x=dx,y=dy,rate=1;
  if(a.role!==s.role){
   let dest;
   if(a.role==='rabbit')dest=s.carrying?[...burrows].sort((l,r)=>distance(a,l)-distance(a,r))[0]:treatPoint(s);
   else{
    const rivals=targets[a.role].map(name=>s.actors[name]);
    dest=s.carrying?s.actors.rabbit:rivals.sort((l,r)=>distance(a,l)-distance(a,r))[0];
   }
   if(s.elapsed>=(a.routeAt??0)){
    a.route=steer(a,dest);a.routeAt=s.elapsed+.16;
   }
   const cx=a.route.x-a.x,cy=a.route.y-a.y,n=Math.max(.07,Math.hypot(cx,cy));
   x=cx/n;y=cy/n;rate=a.role==='rabbit'?.67:.82;
  }
  if(a.role==='coyote')rate*=1.28;
  if(a.leap)rate*=1.32;
  if(a.dash)rate*=1.65;
  move(a,x,y,dt*rate);
  if(s.elapsed>=3&&a.role!==s.role&&a.role!=='rabbit'&&targets[a.role].some(name=>{const b=s.actors[name];return !b.safe&&!b.leap&&near(a,b,.48)&&clear(a,b);}))action(s,a.role);
  if(s.winner)return;
 }
 const rabbit=s.actors.rabbit,carrot=treatPoint(s);
 if(s.carrying&&atBurrow(rabbit))bankCarrot(s);
 else if(carrot&&near(rabbit,carrot,.29)){
  s.carrying=true;s.dropped=null;s.note='Carrot grabbed! Carry it to either burrow.';
 }
 if(s.elapsed>=45&&!s.winner){
  const best=Math.max(...Object.values(s.scores));
  const leaders=Object.keys(s.scores).filter(role=>s.scores[role]===best);
  s.winner=leaders.length===1?leaders[0]:'tie';
 }
}
function bankCarrot(s){
 s.carrying=false;s.scores.rabbit++;
 s.treat=(s.treat+1)%treatSpots.length;
 s.note='Rabbit stashed a carrot!';
 if(s.scores.rabbit>=goal.rabbit)s.winner='rabbit';
}
export {titles};

export function rabbitMove(s,kind){
 if(s.winner||s.role!=='rabbit')return;
 const a=s.actors.rabbit;
 if(kind==='burrow'){
  const hole=holes.findIndex(([x,y])=>near(a,{x,y},burrowReach));
  if(hole<0){s.note='Get closer to a burrow';return;}
  if(a.burrowCooldown>0){s.note='Burrow is recovering';return;}
  const delivered=s.carrying;
  if(delivered)bankCarrot(s);
  const [x,y]=holes[1-hole];
  Object.assign(a,{x,y:y-.31,safe:.72,leap:.42,dash:0,dive:.38,burrowCooldown:2.6});
  if(!delivered)s.note='Rabbit dived through the tunnel!';
  return;
 }
 if(a.cooldown>0)return;
 if(kind==='feint'){
  a.safe=.54;a.cooldown=1.45;s.note='Rabbit feinted!';
 }else if(kind==='dash'){
  a.dash=.7;a.cooldown=1.75;s.note='Rabbit dashed!';
 }else{
  a.leap=.56;a.cooldown=.85;s.note='Rabbit hopped!';
 }
}
export function burrowHint(s){
 if(!s||s.role!=='rabbit')return '';
 const a=s.actors.rabbit;
 if(!atBurrow(a))return '';
 return a.burrowCooldown>0?`Burrow ready in ${Math.ceil(a.burrowCooldown)}s`:'Tap Burrow to dive';
}
