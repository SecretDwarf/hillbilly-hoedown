export const parts=['Wheel','Battery','Belt'];
export const racks=[[-2.3,.8],[0,1.65],[2.3,.8]];
export const bench=[0,-.7];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const close=(s,[x,y],d)=>Math.hypot(s.x-x,s.y-y)<d;
export const garageTools=['Wrench','Clamp','Test'];
export function garageStart(random=Math.random){
 const order=[0,1,2];
 for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const plan=parts.map((_,i)=>i===1?[1,2]:i===0?[0,1]:[1,0,2]);
 return {x:0,y:-2.5,angle:0,gait:0,phase:0,part:null,step:0,input:0,order,plan,elapsed:0,done:false,note:'Bring a '+parts[order[0]].toLowerCase()+' to the workbench'};
}
export function garageTool(s,tool){
 if(!s||s.done)return;
 const part=s.order[s.step];
 if(!close(s,bench,.85)||s.part!==part){s.note='Bring the '+parts[part].toLowerCase()+' to the workbench';return;}
 if(s.plan[part][s.input]!==tool){s.note='Check the next tool. Your work is saved.';return;}
 s.input++;
 if(s.input<s.plan[part].length){s.note='Good fit. Next tool.';return;}
 s.part=null;s.input=0;s.step++;
 if(s.step===parts.length){s.done=true;s.note='Engine running!';}
 else s.note='Next part: '+parts[s.order[s.step]];
}
export function garageTick(s,x,y,dt){
 if(s.done)return;
 s.elapsed+=dt;
 const n=Math.max(1,Math.hypot(x,y)),speed=s.part===null?3.25:2.65;
 s.x=clamp(s.x+x/n*speed*dt,-3.1,3.1);
 s.y=clamp(s.y+y/n*speed*dt,-2.8,2.7);
 s.gait=Math.min(1,Math.hypot(x,y));
 if(s.gait){s.phase+=dt*14;s.angle=Math.atan2(-x,y);}
 if(s.elapsed>=25){s.done=true;s.note='Time’s up!';}
}
export function garageAction(s){
 if(s.done)return;
 if(close(s,bench,.85)&&s.part!==null){
  if(s.part!==s.order[s.step]){s.note='Next part: '+parts[s.order[s.step]];return;}
  s.note='Follow the fitting card';return;
 }
 const rack=racks.findIndex(r=>close(s,r,.69));
 if(rack<0){s.note=s.part===null?'Move closer to a parts rack':'Bring the part to the workbench';return;}
 if(rack!==s.order[s.step]){s.note='Next part: '+parts[s.order[s.step]];return;}
 s.part=rack;s.note='Picked up: '+parts[rack];
}
export const derbyPit=[-2.64,-2.38];
const spawns=[[0,-2.4],[-2,.9],[2,1.2],[0,2.65]];
export function derbyStart(){
 return {elapsed:0,boost:0,charges:3,brake:0,guard:0,guardReady:0,repair:0,repaired:false,cars:spawns.map(([x,y],i)=>({x,y,vx:0,vy:0,angle:i?Math.PI:0,hp:i?3:5,shield:0})),done:false,note:'Ram the other cars to knock them out'};
}
export function derbyBoost(s){if(!s.done&&s.charges&&s.boost<=0){s.charges--;s.boost=.65;}}
export function derbyManeuver(s,kind){
 if(!s||s.done)return;
 if(kind==='brake'){s.brake=.46;s.note='Handbrake turn';return;}
 if(kind==='brace'){
  if(s.elapsed<s.guardReady)return;
  s.guard=.72;s.guardReady=s.elapsed+3.1;s.note='Bumper braced';return;
 }
 if(!close(s.cars[0],derbyPit,.80)){s.note='Drive to the teal pit bay';return;}
 if(s.repaired||s.repair){s.note='Repair already used';return;}
 if(s.cars[0].hp>=5){s.note='Your car is already at full condition';return;}
 s.repair=1.10;s.note='Repairing. Hold position.';
}
export function derbyTick(s,x,y,dt){
 if(s.done)return;
 s.elapsed+=dt;s.boost=Math.max(0,s.boost-dt);
 const player=s.cars[0];
 s.brake=Math.max(0,s.brake-dt);s.guard=Math.max(0,s.guard-dt);
 if(s.repair){
  s.repair=Math.max(0,s.repair-dt);x=0;y=0;
  if(!s.repair){player.hp=Math.min(5,player.hp+2);s.repaired=true;s.note='Two condition restored';}
 }
 for(const [i,a] of s.cars.entries()){
  if(a.hp<=0)continue;
  a.shield=Math.max(0,a.shield-dt);
  let dx=x,dy=y;
  if(i){
   const target=i===1?player:s.cars.find((b,j)=>j!==i&&j!==0&&b.hp>0)??player;
   dx=target.x-a.x;dy=target.y-a.y;
   const wiggle=Math.sin(s.elapsed*2.7+i)*.31;
   [dx,dy]=[dx-dy*wiggle,dy+dx*wiggle];
  }
  const n=Math.max(1,Math.hypot(dx,dy));
  const speed=i?2.25+i*.1:s.repair?0:s.brake?1.7:s.boost?5.65:3.55;
  a.vx+=(dx/n*speed-a.vx)*Math.min(1,dt*(i===0&&s.brake?15:7));
  a.vy+=(dy/n*speed-a.vy)*Math.min(1,dt*(i===0&&s.brake?15:7));
  if(Math.hypot(a.vx,a.vy)>.14)a.angle=Math.atan2(-a.vx,a.vy);
  a.x=clamp(a.x+a.vx*dt,-3.05,3.05);a.y=clamp(a.y+a.vy*dt,-2.9,2.9);
 }
 for(let i=0;i<s.cars.length;i++)for(let j=i+1;j<s.cars.length;j++){
  const a=s.cars[i],b=s.cars[j];
  if(a.hp<=0||b.hp<=0)continue;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d>=.83)continue;
  const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0;
  const attack=a.vx*nx+a.vy*ny,defend=-b.vx*nx-b.vy*ny;
  if(attack>1.15&&attack>=defend*.82&&!b.shield){b.hp=Math.max(0,b.hp-(i===0&&s.boost&&attack>2.8?2:1));b.shield=.85;}
  if(defend>1.15&&defend>=attack*.88&&!a.shield){if(i===0&&s.guard)s.note='Brace absorbed a hit';
   else{a.hp--;a.shield=1.1;if(i===0&&s.repair){s.repair=0;s.note='Impact interrupted the repair';}}}
  const push=(.86-d)/2;
  a.x=clamp(a.x-nx*push,-3.05,3.05);a.y=clamp(a.y-ny*push,-2.9,2.9);
  b.x=clamp(b.x+nx*push,-3.05,3.05);b.y=clamp(b.y+ny*push,-2.9,2.9);
  a.vx-=nx*.64;a.vy-=ny*.64;b.vx+=nx*.64;b.vy+=ny*.64;
 }
 if(player.hp<=0){s.done=true;s.note='Your car is out!';}
 else if(s.cars.slice(1).every(a=>a.hp<=0)){s.done=true;s.note='Last car rolling!';}
 else if(s.elapsed>=35){s.done=true;s.note='Time’s up!';}
}
