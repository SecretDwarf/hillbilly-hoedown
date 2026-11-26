export const canSpot=[0,.21],canRack=[2.48,1.68];
export const kitchen=[[-2.0,.87],[0,1.45],[2.0,.87]];
export const jobs=['Milk','Churn','Bake'];
export const kickTime=30,henTime=30;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const near=(s,[x,y],r)=>Math.hypot(s.x-x,s.y-y)<r;
const base=()=>({x:0,y:-2.52,angle:0,gait:0,phase:0,elapsed:0,done:false});
export function canStart(){
 return {...base(),kicks:0,can:true,grace:0,flight:0,hide:0,dash:0,decoy:0,moveReady:0,note:'Sneak past the guard and kick the can'};
}
export function henStart(random=Math.random){
 const rolls=[2,3,2].map(n=>n+Number(random()>.5));
 return {...base(),job:0,work:0,rolls,ovenAt:null,note:'Go to the milk station'};
}
export function guard(s){
 const a=s.elapsed*1.72;
 return {x:1.47*Math.sin(a),y:.92+.85*Math.cos(a),angle:Math.atan2(-1.47*Math.cos(a),-.85*Math.sin(a))};
}
export function canMove(s,kind){
 if(!s||s.done||s.elapsed<s.moveReady)return;
 if(kind==='hide'){s.hide=s.elapsed+1.05;s.note='Hiding. Move to break cover.';}
 if(kind==='dash'){s.dash=s.elapsed+.65;s.note='Dashed!';}
 if(kind==='distract'){s.decoy=s.elapsed+1.6;s.note='Guard distracted';}
 s.moveReady=s.elapsed+2.3;
}
export function canTick(s,x,y,dt){
 s.flight=Math.max(0,s.flight-dt);
 if(s.done)return;
 if(Math.hypot(x,y)>.18)s.hide=0;
 const boost=s.dash>s.elapsed?1.65:1;
 advance(s,x,y,dt,boost);
 s.grace=Math.max(0,s.grace-dt);
 const g=guard(s);
 if(!s.grace&&s.hide<=s.elapsed&&s.decoy<=s.elapsed&&near(s,[g.x,g.y],.76)){
  s.x=0;s.y=-2.52;s.grace=1.7;s.note='Tagged! Back to the starting line';
 }
 if(s.elapsed>=kickTime){s.done=true;s.note='Time’s up!';}
}
export function kickCan(s){
 if(s.done)return;
 if(!s.can){s.note='There’s a spare can at the rack';return;}
 if(!near(s,canSpot,.61)){s.note='Get closer to the can';return;}
 s.kicks++;s.can=false;s.flight=.56;
 if(s.kicks===2){s.done=true;s.note='Both teammates freed!';}
 else s.note='One teammate free. Get a spare from the rack.';
}
export function replaceCan(s){
 if(s.done||s.can)return;
 if(!near(s,canRack,.73)){s.note='Go to the spare-can rack';return;}
 s.can=true;s.note='Spare can set. Go free your second teammate.';
}
export function henTick(s,x,y,dt){
 if(s.done)return;
 advance(s,x,y,dt);
 if(s.elapsed>=henTime){s.done=true;s.note='Time’s up!';}
}
export function cook(s,tool){
 if(!s||s.done)return;
 if(!near(s,kitchen[s.job],.76)){s.note='Head to the '+jobs[s.job].toLowerCase()+' station';return;}
 const expect=s.job===0?'milk':s.job===1?'churn':s.work<s.rolls[2]?'knead':'bake';
 if(tool!==expect){s.note='Next: '+expect;return;}
 if(expect==='bake'){
  if(s.ovenAt===null){s.ovenAt=s.elapsed;s.note='Bread in oven. Wait for gold.';return;}
  const time=s.elapsed-s.ovenAt;
  if(time<1.05){s.note='Still baking. Wait for gold.';return;}
  s.job=3;s.done=true;s.note=time<=2.25?'Golden bread and butter are ready!':'Bread and butter are ready!';
  return;
 }
 s.work++;
 if(s.work<s.rolls[s.job]){s.note=expect+' '+s.work+'/'+s.rolls[s.job];return;}
 if(s.job===2){s.note='Dough kneaded. Tap Bake to start the oven.';return;}
 s.job++;s.work=0;s.note='Next stop: '+jobs[s.job];
}
function advance(s,x,y,dt,speed=1){
 s.elapsed+=dt;
 const norm=Math.max(1,Math.hypot(x,y));
 s.x=clamp(s.x+x/norm*3.24*dt*speed,-3.03,3.03);
 s.y=clamp(s.y+y/norm*3.24*dt*speed,-2.73,2.64);
 s.gait=Math.min(1,Math.hypot(x,y));
 if(s.gait){s.angle=Math.atan2(-x,y);s.phase+=dt*13;}
}
