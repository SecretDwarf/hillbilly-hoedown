export const forks=[[-1.62,-1.45],[1.47,-.88],[-.18,.91]];
export const heads=forks.flatMap(([x,y])=>[[x-.70,y+.82],[x+.70,y+.82]]);
export const forkReach=.77;
export function nearFork(s){return forks.findIndex(([x,y])=>distance(s.x,s.y,x,y)<forkReach);}
export function waterOn(s,head){
 return s.hoses.some((pair,i)=>s.off[i]<=s.elapsed&&pair[s.route[i]]===head);
}
export function forkStatus(s,i){
 return s.off[i]>s.elapsed?'Off '+Math.ceil(s.off[i]-s.elapsed)+'s':s.route[i]?'Hose B':'Hose A';
}
export const baskets=[[-2.75,-1.92],[2.71,-1.69],[-2.66,.99],[2.65,1.59],[-1.35,2.51],[1.31,2.48]];
export const gardenDuration=45;
export const lanes=[-1.95,-.65,.65,1.95];
export const finish=5.1;

const clamp=(v,l,r)=>Math.max(l,Math.min(r,v));
const distance=(x,y,a,b)=>Math.hypot(x-a,y-b);
export const crewDuration=55;
export function gardenStart(random=Math.random,mode='scramble'){
 const ends=heads.map((_,i)=>i);
 for(let i=ends.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [ends[i],ends[j]]=[ends[j],ends[i]];
 }
 const hoses=forks.map((_,i)=>ends.slice(i*2,i*2+2));
 if(hoses.every((pair,i)=>pair.every(head=>Math.floor(head/2)===i))){
  [hoses[0][1],hoses[1][1],hoses[2][1]]=[hoses[1][1],hoses[2][1],hoses[0][1]];
 }
 const goal=forks.map(()=>random()<.5?0:1);
 const targets=hoses.map((pair,i)=>pair[goal[i]]);
 const route=goal.map((side,i)=>i===2&&random()<.5?side:1-side);
 return {mode,planter:mode==='crew'?{x:.45,y:-2.48,angle:0,gait:0,phase:0,next:0}:null,
  crops:targets.map(head=>({head,prep:0,water:0})),x:0,y:-2.51,angle:0,gait:0,phase:0,elapsed:0,wet:0,off:[0,0,0],hoses,targets,route,dashUntil:0,dashReady:0,
  gathered:baskets.map(()=>false),note:mode==='crew'?'Route water to the plots while the planter works':'Trace the hoses to the gold-marked sprinklers',done:false};
}
export function wateredTargets(s){
 return s.targets.filter(head=>waterOn(s,head)).length;
}
function finishGarden(s){
 if(s.mode==='crew'){
  if(s.crops.every(c=>c.water>=2)){s.done=true;s.note='Water Crew wins! All three plots growing.';}
  return;
 }
 if(s.gathered.every(Boolean)&&wateredTargets(s)===s.targets.length){
  s.done=true;s.note='Hoses sorted and all six baskets collected!';
 }
}
export function plotPoint(head){
 const [x,y]=heads[head];
 return [x,y+.43];
}
export function callPlanter(s){
 if(!s?.planter||s.done)return;
 const i=s.crops.findIndex(c=>c.prep<1&&distance(s.x,s.y,...plotPoint(c.head))<.90);
 if(i<0){s.note='Go near an unplanted gold plot to call the planter';return;}
 s.planter.next=i;s.note='Planter called to this plot';
}
function plantCrew(s,dt){
 const p=s.planter;
 const crop=s.crops[p.next];
 if(crop?.prep>=1)p.next=s.crops.findIndex(c=>c.prep<1);
 const next=s.crops[p.next];
 p.gait=0;
 if(next){
  const [x,y]=plotPoint(next.head),dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);
  if(d>.15){
   const step=Math.min(d,dt*1.9);
   p.x+=dx/d*step;p.y+=dy/d*step;p.angle=Math.atan2(-dx,dy);p.phase+=dt*10;p.gait=.86;
  }else{
   next.prep=Math.min(1,next.prep+dt*.70);
   if(next.prep>=1)s.note='Plot planted. Keep its sprinkler on to grow it.';
  }
 }
 for(const c of s.crops)if(c.prep>=1&&waterOn(s,c.head))c.water=Math.min(2,c.water+dt);
}
export function jet(time,i){return time*(i%2?-2.1:1.9)+i*1.3;}
export function gardenTick(s,dx,dy,dt){
 if(s.done)return;
 s.elapsed+=dt;
 s.wet=Math.max(0,s.wet-dt);
 for(const [i,[x,y]] of heads.entries()){
  if(!waterOn(s,i))continue;
  const a=jet(s.elapsed,i),vx=Math.cos(a),vy=Math.sin(a);
  const px=s.x-x,py=s.y-y,along=px*vx+py*vy;
  if(s.elapsed>=s.dashUntil&&along>=0&&along<1.68&&Math.abs(px*vy-py*vx)<.23)s.wet=.68;
 }
 const n=Math.max(1,Math.hypot(dx,dy)),speed=s.elapsed<s.dashUntil?4.62:s.wet?1.26:2.80;
 s.x=clamp(s.x+dx*dt*speed/n,-3.10,3.10);
 s.y=clamp(s.y+dy*dt*speed/n,-2.89,2.83);
 s.gait=Math.min(1,Math.hypot(dx,dy));
 if(s.gait){s.angle=Math.atan2(-dx,dy);s.phase+=dt*speed*5;}
 if(s.planter)plantCrew(s,dt);
 finishGarden(s);
 if(s.done)return;
 const limit=s.planter?crewDuration:gardenDuration;
 if(s.elapsed>=limit){s.elapsed=limit;s.done=true;s.note='Time’s up!';}
 else if(s.wet)s.note='Soaked! Keep moving';
 else if(s.note==='Soaked! Keep moving')s.note=s.planter?'Route water to the marked crops':'Collect the six baskets';
}
export function valve(s){
 if(s.done)return;
 const i=nearFork(s);
 if(i<0){s.note='Get closer to a sprinkler valve';return;}
 s.off[i]=s.elapsed+5;s.note=`Y${i+1} paused for five seconds`;
}
export function gatherBasket(s){
 if(!s||s.done)return;
 const i=baskets.findIndex(([x,y],j)=>!s.gathered[j]&&distance(s.x,s.y,x,y)<.58);
 if(i<0){s.note='Get closer to a basket';return;}
 s.gathered[i]=true;s.note='Basket collected!';
 if(s.gathered.every(Boolean))s.note='Baskets collected. Route all three gold sprinklers.';
 finishGarden(s);
}
export function turnSprinkler(s){
 if(!s||s.done)return;
 const i=nearFork(s);
 if(i<0){s.note='Get closer to a valve to redirect it';return;}
 s.route[i]=1-s.route[i];s.note=`Y${i+1} switched hose`;finishGarden(s);
}
export function gardenDash(s){
 if(!s||s.done||s.elapsed<s.dashReady)return;
 s.dashUntil=s.elapsed+.52;s.dashReady=s.elapsed+2.75;s.wet=0;s.note='Dash through the spray';
}
export const sackModes={sprint:'Rhythm Sprint',obstacles:'Obstacle Course'};
export const sackHazards=[{kind:'puddle',y:-2.56},{kind:'hay',y:.42},{kind:'puddle',y:2.68}];
export function sackStart(pick='sprint',random=Math.random){
 const mode=pick==='random'?(random()<.5?'sprint':'obstacles'):pick==='obstacles'?'obstacles':'sprint';
 return {mode,elapsed:0,next:1.0,y:-4.8,from:-4.8,hopAt:-1,hopTime:.44,height:.27,done:false,won:false,
  recoverAt:0,braceUntil:0,landing:false,large:false,obstacle:null,bots:[-4.8,-4.8,-4.8],note:'Wait for the gold zone'};
}
export function sackJump(s,big=false){
 if(s.done||s.elapsed-s.hopAt<s.hopTime)return;
 if(s.elapsed<s.recoverAt){s.note='Stumbling! Tap Recover';return;}
 const error=Math.abs(s.elapsed-s.next),window=big?.115:.245;
 if(error>window){
  if(big&&error<=.245){s.recoverAt=s.elapsed+.64;s.note='Big hop mistimed. Tap Recover!';}
  else s.note='Wait for the gold zone';
  return;
 }
 s.from=s.y;s.y+=big?1.60:error<.105?1.13:.96;
 s.hopAt=s.elapsed;s.hopTime=big?.52:.39;s.height=big?.54:.27;
 s.large=big;s.landing=true;
 s.obstacle=s.mode==='obstacles'?sackHazards.find(({kind,y})=>
  kind==='puddle'?Math.abs(s.y-y)<.32:!big&&s.from<y&&s.y>=y):null;s.next=s.elapsed+(big?.86:.65);
 s.note=big?'Big hop! Brace before landing.':'Small hop';
}
export function sackBrace(s){
 if(s.done||!s.landing||!s.large)return;
 s.braceUntil=s.elapsed+.58;s.note='Braced for landing';
}
export function sackRecover(s){
 if(s.done||s.elapsed>=s.recoverAt)return;
 s.recoverAt=s.elapsed;s.next=s.elapsed+.44;s.note='Recovered. Find the next beat.';
}
export function sackTick(s,dt){
 if(s.done)return;
 s.elapsed+=dt;
 if(s.landing&&s.elapsed-s.hopAt>=s.hopTime){
  s.landing=false;
  if(s.obstacle){
   s.recoverAt=s.elapsed+.72;
   s.note=s.obstacle.kind==='puddle'?'Splash! Tap Recover.':'Clipped a hay bale. Tap Recover.';
   s.obstacle=null;
  }else if(s.large&&s.elapsed>s.braceUntil&&s.y<finish){
   s.recoverAt=s.elapsed+.67;s.note='Rough landing. Tap Recover!';
  }
 }
 if(s.elapsed>s.next+.245){
  s.next=s.elapsed+.52;
  if(s.elapsed>=s.recoverAt)s.note='Missed beat. Try the next one.';
 }
 s.bots=s.bots.map((y,i)=>{
  const hazard=s.mode==='obstacles'&&sackHazards.some(a=>Math.abs(a.y-y)<.23);
  return y+dt*(1.04+i*.105)*(hazard?.60:1);
 });
 if(s.y>=finish&&!s.landing){s.done=true;s.won=true;s.note='You won the sack race!';}
 else if(s.bots.some(y=>y>=finish)){s.done=true;s.note='A bot won the race';}
}
