export const landings={start:-4.3,finish:4.12};
export const rocks=[
 {x:-.82,y:-2.5,r:.37},{x:1.12,y:-.7,r:.43},
 {x:-1.10,y:1.25,r:.40},{x:1.0,y:2.89,r:.38}
];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function newFerry(){
 return {x:0,y:landings.start,vx:0,cargo:5,elapsed:0,stress:0,brake:false,
  flash:0,offset:0,paddle:0,paddleAt:0,brace:0,braceAt:0,note:'Cast off',done:false};
}
function spill(s,message){
 s.cargo--;s.flash=1;s.spilled=true;s.stress=0;s.offset=0;s.note=message;
 if(!s.cargo)s.done=true;
}
export function ferryCurrent(y){
 const surge=Math.abs(y+.14)<.74||Math.abs(y-2.28)<.65;
 return {force:Math.sin(y*1.69+.48)*(surge?1.10:.59),surge};
}
export function ferryAction(s,kind){
 if(!s||s.done||s.finished)return;
 if(kind==='steady'){s.brake=!s.brake;return;}
 if(kind==='brace'){
  if(s.elapsed<s.braceAt)return;
  s.offset*=.18;s.stress*=.30;s.brace=s.elapsed+1.25;s.braceAt=s.elapsed+2.35;
  return;
 }
 if(s.elapsed<s.paddleAt)return;
 s.paddle=kind==='left'?-1:1;s.paddleAt=s.elapsed+.48;
}
export function ferryTick(s,steer,dt){
 s.flash=Math.max(0,s.flash-dt);
 if(s.done)return;
 s.elapsed+=dt;
 const current=ferryCurrent(s.y),braced=s.elapsed<s.brace;
 const stroke=s.paddle*Math.max(0,(s.paddleAt-s.elapsed)/.48);
 const target=clamp(steer,-1,1)*1.93+current.force+stroke*1.32;
 s.vx+=(target-s.vx)*Math.min(1,dt*(s.brake?2.9:4.1));
 s.x=clamp(s.x+s.vx*dt,-2.36,2.36);
 s.y+=dt*(s.brake?.52:1.52);
 const sideForce=s.vx*.58+current.force*.43;
 s.offset=clamp(s.offset+dt*(braced?-s.offset*3.8:sideForce-s.offset*(s.brake?3.1:1.65)),-1,1);
 const nearBank=Math.abs(s.x)>2.18;
 const hardTurn=Math.abs(s.vx)>1.95;
 s.stress=clamp(s.stress+dt*(braced?-.95:nearBank?.95:Math.abs(s.offset)>.64?.74:hardTurn?.38:-.82),0,1.2);
 if(s.stress>=1&&!s.flash)spill(s,'A melon rolled overboard!');
 for(const rock of rocks){
  if(Math.hypot(s.x-rock.x,s.y-rock.y)>=rock.r+.43)continue;
  if(!s.flash){
   if(braced){s.flash=.55;s.spilled=false;s.note='Rock bump! Braced cargo held';}
   else spill(s,'Rock bump! A melon went overboard');
  }
  s.x=clamp(rock.x+(s.x>=rock.x?1:-1)*(rock.r+.46),-2.36,2.36);
  s.vx=0;
 }
 if(s.done)return;
 if(s.y>=landings.finish){
  s.y=landings.finish;
  if(Math.abs(s.x)>.83)spill(s,'Wide landing! A melon fell out');
  s.done=true;
  if(s.cargo)s.note=s.cargo===5?'Docked with every melon!':`Docked with ${s.cargo} of 5 melons`;
 }else if(!s.flash){
  s.note=s.y>3.05?'Line up with the teal dock':braced?'Cargo braced':s.stress>.45?'Brace! Cargo is sliding':current.surge?'Strong current! Paddle to correct':s.brake?'Steadying the ferry':'Steer around the rocks';
 }
}

export const ferryModes={lanes:'Side-by-Side Race',river:'Shared River',practice:'Solo Practice'};
export function newFerryRound(pick='random',random=Math.random){
 const mode=pick==='random'?(random()<.5?'lanes':'river'):Object.hasOwn(ferryModes,pick)?pick:'practice';
 const s=newFerry();
 s.mode=mode;
 s.rivals=mode==='practice'?[]:(mode==='lanes'?[0]:[0,1]).map((_,i)=>({
  ...newFerry(),name:i?'Gold':'Red',x:mode==='river'?(i?1.74:-1.64):0,delay:.34+i*.49
 }));
 s.note=ferryModes[mode];
 return s;
}
function botSteer(s,i){
 const bias=Math.sin(s.elapsed*(1.7+i*.11)+i)*(.16+i*.08);
 const upcoming=rocks.find(r=>r.y>s.y&&r.y-s.y<1.02);
 const line=upcoming?-Math.sign(upcoming.x)*.28:0;
 return clamp((line+bias-s.x)*1.25-ferryCurrent(s.y).force*.31,-1,1);
}
export function ferryRoundTick(s,steer,dt){
 if(s.done)return;
 s.clock=(s.clock??0)+dt;
 if(s.finished)s.flash=Math.max(0,s.flash-dt);
 if(!s.finished){
  ferryTick(s,steer,dt);
  if(s.done){s.finished=true;s.done=false;}
 }
 for(const [i,rival] of s.rivals.entries()){
  if(s.clock>=rival.delay)ferryTick(rival,botSteer(rival,i),dt);
 }
 if(s.mode==='river'&&!s.finished){
  for(const rival of s.rivals){
   if(rival.done||s.clock<rival.delay||Math.hypot(s.x-rival.x,s.y-rival.y)>.57)continue;
   const side=s.x<=rival.x?-1:1;
   s.x=clamp(s.x+side*dt*.9,-2.36,2.36);
   rival.x=clamp(rival.x-side*dt*.9,-2.36,2.36);
  }
 }
 if(!s.finished)return;
 if(s.rivals.some(r=>!r.done))return;
 s.done=true;
 if(s.rivals.length){
  const winner=[s,...s.rivals].filter(r=>r.y>=landings.finish&&r.cargo>0)
   .sort((a,b)=>b.cargo-a.cargo||(a.elapsed+(a.delay??0))-(b.elapsed+(b.delay??0)))[0];
  s.note=(winner===s?'Teal wins!':winner?winner.name+' wins!':'No crew finished.')+' · '+s.cargo+' melons delivered';
 }
}
