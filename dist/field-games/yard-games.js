import {craftMode} from './craft.js';

export const boards=Array.from({length:18},(_,i)=>[-2.5+i%6,Math.floor(i/6)]);
export const holes=[[-2.35,-1.55],[0,-1.45],[2.27,-1.61],[-1.72,1.38],[.02,1.45],[2.13,1.33]];
export const paintLimit=35,catchLimit=30,catchGoal=8;

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(v,hi));
const base=()=>({x:0,y:-2.5,angle:0,phase:0,gait:0,elapsed:0,done:false});
export const barnColors=['Red','Teal','Gold'];
export const barnBucket=[-2.55,-1.87];
export function barnPanel(s){return s.row*6+clamp(Math.round(s.x+2.5),0,5);}
export function barnAtBucket(s){return Math.hypot(s.x-barnBucket[0],s.y-barnBucket[1])<.72;}
export function barnStart(pick='timed',random=Math.random){
 const mode=craftMode(pick,random);
 const offset=Math.floor(random()*3),pattern=Math.floor(random()*3);
 const stencil=boards.map(([,row],i)=>(offset+(pattern===0?row:pattern===1?Math.floor(i%6/2):row+Math.floor(i%6/2)))%3);
 return {...base(),mode,stencil,color:0,flaws:boards.map(()=>false),note:'Walk up to the barn and paint',painted:boards.map(()=>false),coat:6,row:0};
}
export function gopherStart(random=Math.random){
 return {...base(),random,next:Math.floor(random()*holes.length),scoutUntil:0,scoutReady:0,baitReady:0,coverReady:0,
  note:'Watch for a gopher',caught:0,popup:-1,appears:.65,until:0};
}
function nextHole(s,old){
 return (old+1+Math.floor(s.random()*(holes.length-1)))%holes.length;
}
export function gopherMove(s,kind){
 if(!s||s.done)return;
 if(kind==='peek'){
  if(s.elapsed<s.scoutReady)return;
  s.scoutUntil=s.elapsed+2.6;s.scoutReady=s.elapsed+3.1;s.note='Watch the shaking mound';return;
 }
 const i=holes.findIndex(([x,y])=>Math.hypot(s.x-x,s.y-y)<.80);
 if(i<0){s.note='Get closer to a hole';return;}
 if(kind==='bait'){
  if(s.elapsed<s.baitReady)return;
  s.baitReady=s.elapsed+4.0;s.next=i;s.scoutUntil=s.elapsed+2;
  s.note='Bait set for the next gopher';return;
 }
 if(s.elapsed<s.coverReady)return;
 s.coverReady=s.elapsed+3;
 if(s.popup===i){
  const other=holes.map(([x,y],j)=>({j,d:Math.hypot(x-holes[i][0],y-holes[i][1])}))
   .filter(a=>a.j!==i).sort((a,b)=>a.d-b.d)[0].j;
  s.popup=-1;s.next=other;s.appears=s.elapsed+.55;s.scoutUntil=s.elapsed+2.75;
  s.note='The gopher will pop up at the next mound';
 }else if(s.next===i){
  s.next=nextHole(s,i);s.note='Hole covered. Watch for another mound.';
 }else s.note='This hole is quiet';
}

function move(s,x,y,dt,top){
 const n=Math.max(1,Math.hypot(x,y));
 s.x=clamp(s.x+x/n*dt*3.35,-3.05,3.05);
 s.y=clamp(s.y+y/n*dt*3.35,-2.78,top);
 s.gait=Math.min(1,Math.hypot(x,y));
 if(s.gait){s.phase+=dt*14;s.angle=Math.atan2(-x,y);}
}
export function barnTick(s,x,y,dt){
 if(s.done)return;
 move(s,x,y,dt,1.11);
 s.elapsed+=dt;
 if(s.mode==='timed'&&s.elapsed>=paintLimit){s.done=true;s.note='Time’s up!';}
}
export function paintBoards(s){
 if(s.done)return;
 if(s.y<.67){s.note='Move closer to the barn';return;}
 if(!s.coat){s.note='Refill at the paint bucket';return;}
 const i=barnPanel(s);
 if(s.painted[i]){s.note='That panel already has paint';return;}
 if(s.color!==s.stencil[i]){s.flaws[i]=true;s.note='This panel needs '+barnColors[s.stencil[i]];return;}
 s.painted[i]=true;s.coat--;
 if(s.painted.every(Boolean)){s.done=true;s.note='Barn painted!';}
 else s.note=s.coat?'Fresh coat!':'Roller’s dry. Head to the bucket';
}
export function changeRow(s,delta){
 if(s.done)return;
 s.row=(s.row+delta+3)%3;
}
export function refill(s){
 if(s.done)return;
 if(!barnAtBucket(s)){s.color=(s.color+1)%barnColors.length;s.note=barnColors[s.color]+' selected';return;}
 s.coat=6;s.note='Roller refilled';
}
export function gopherTick(s,x,y,dt){
 if(s.done)return;
 move(s,x,y,dt,2.68);
 s.elapsed=Math.min(catchLimit,s.elapsed+dt);
 if(s.elapsed>=catchLimit){s.done=true;s.note='Time’s up!';return;}
 if(s.popup>=0&&s.elapsed>=s.until){s.popup=-1;s.appears=s.elapsed+.32;s.note='It ducked back down';}
 if(s.popup<0&&s.elapsed>=s.appears){
  s.popup=s.next;s.next=nextHole(s,s.popup);
  s.until=s.elapsed+Math.max(1.48,2.04-s.caught*.075);
  s.note='Gopher up!';
 }
}
export function catchGopher(s){
 if(s.done)return;
 if(s.popup<0){s.note='Wait for a gopher to pop up';return;}
 const [x,y]=holes[s.popup];
 if(Math.hypot(s.x-x,s.y-y)>.75){s.note='Get closer to the gopher';return;}
 s.caught++;s.popup=-1;s.appears=s.elapsed+.35;
 if(s.caught===catchGoal){s.done=true;s.note='All eight gophers caught!';}
 else s.note='Caught one! Watch the next hole';
}
