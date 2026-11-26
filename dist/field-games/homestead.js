export const plots=[[-2.30,-1.05],[-.75,-1.05],[.75,-1.05],[2.30,-1.05],[-2.30,.82],[-.75,.82],[.75,.82],[2.30,.82]];
export const goatGate=[0,2.6];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const base=()=>({x:0,y:-2.36,angle:0,gait:0,phase:0,elapsed:0,done:false});
export const plantTools=['Weed','Till','Sow','Water'];
export const plantLimit=32;
export function plantStart(random=Math.random){
 return {...base(),plots:plots.map(()=>Math.floor(random()*3)),note:'Check the next job on each plot'};
}
export function goatStart(){
 return {...base(),goats:[[-2.5,-.6],[-.6,.75],[1.15,-.9],[2.42,.52]].map(([x,y])=>({x,y,angle:0,home:false})),
  lure:0,cooldown:0,gate:false,shooAt:0,whistleAt:0,note:'Open the gate and guide the goats into the pen'};
}
function step(s,dx,dy,dt,top){
 const n=Math.max(1,Math.hypot(dx,dy));
 s.x=clamp(s.x+dx/n*3.2*dt,-3.03,3.03);s.y=clamp(s.y+dy/n*3.2*dt,-2.71,top);
 s.gait=Math.min(1,Math.hypot(dx,dy));
 if(s.gait){s.angle=Math.atan2(-dx,dy);s.phase+=dt*13;}
 s.elapsed+=dt;
}
export function plantTick(s,dx,dy,dt){
 if(s.done)return;
 step(s,dx,dy,dt,2.66);
 if(s.elapsed>=plantLimit){s.done=true;s.note='Time’s up!';}
}
export function plantAction(s,tool){
 if(s.done)return;
 const i=nearPlot(s);
 if(i<0){s.note='Move closer to a plot';return;}
 const need=s.plots[i];
 if(need===4){s.note='This plot is growing';return;}
 if(tool!==need){s.note='Needs '+plantTools[need]+' first';return;}
 s.plots[i]++;
 s.note=s.plots[i]===4?'Plant watered!':'Next: '+plantTools[s.plots[i]];
 if(s.plots.every(n=>n===4)){s.done=true;s.note='All eight plots growing!';}
}
export function nearPlot(s){
 return plots.findIndex(([x,y])=>Math.hypot(x-s.x,y-s.y)<.59);
}
export function lureGoats(s){
 if(s.done||s.cooldown>0)return;
 s.lure=3.4;s.cooldown=6;
 s.note='Feed shake! Nearby goats will follow you.';
}
export function goatCommand(s,kind){
 if(!s||s.done)return;
 if(kind==='gate'){s.gate=!s.gate;s.note=s.gate?'Gate open':'Gate closed';return;}
 const radius=kind==='shoo'?1.95:1.52;
 const nearby=s.goats.filter(g=>!g.home&&Math.hypot(g.x-s.x,g.y-s.y)<radius);
 const cooldown=kind==='shoo'?'shooAt':'whistleAt';
 if(s.elapsed<s[cooldown])return;
 if(!nearby.length){s.note='Get closer to a goat';return;}
 s[cooldown]=s.elapsed+2.65;
 for(const g of nearby){
  if(kind==='shoo')g.alert=true;
  else g.pauseUntil=s.elapsed+1.15;
 }
 s.note=kind==='shoo'?'Goats nudged toward the pen':'Whistle! Nearby goats pause';
}
export function goatTick(s,dx,dy,dt){
 if(s.done)return;
 step(s,dx,dy,dt,2.72);
 s.lure=Math.max(0,s.lure-dt);s.cooldown=Math.max(0,s.cooldown-dt);
 for(const [i,g] of s.goats.entries()){
  if(g.home||g.pauseUntil>s.elapsed)continue;
  const x=g.x-s.x,y=g.y-s.y,d=Math.max(.06,Math.hypot(x,y));
  const push=clamp((1.31-d)*1.65,0,1.33);
  if(push>.54&&y>.24)g.alert=true;
  const rate=s.lure&&d<2.2?-1.55:push;
  const trail=g.alert?.77:0;
  const vx=x/d*rate-g.x*trail*.62,vy=y/d*rate+trail;
  g.x=clamp(g.x+vx*dt,-2.98,2.98);g.y=clamp(g.y+vy*dt,-2.63,2.42);
  if(Math.hypot(vx,vy)>.05)g.angle=Math.atan2(-vx,vy);
  if(s.gate&&g.y>=2.38&&Math.abs(g.x)<.50){g.home=true;g.x=(i-1.5)*.43;g.y=2.78;s.note='Goat back in the pen!';}
 }
 if(s.goats.every(g=>g.home)){s.done=true;s.note='All four goats rounded up!';}
 else if(s.elapsed>=30){s.done=true;s.note='Time’s up!';}
}
