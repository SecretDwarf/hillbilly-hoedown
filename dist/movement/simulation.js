import {maps} from './maps.js';
import {translatedBounds} from './walkthrough.js';
export const tick=1/60;
const bounds=[
 [-2.22,-2.04,-2.04,2.21],[2.04,2.22,-2.04,2.21],
 [-2.21,-.96,-2.04,-1.84],[.29,2.20,-2.04,-1.84],
 [-.91,-.19,-1.37,-.88],[-1.95,-.93,-1.02,-.28],
 [-1.56,-1,.13,.71],[.39,1.60,-.84,-.40],[-1.06,1.06,.57,2.14]
];
const farmerBounds=[...bounds,[-.98,.30,-2.04,-1.84]];
const walkthroughBounds=translatedBounds(maps,maps.walk.solids,bounds);
const walkthroughFarmerBounds=translatedBounds(maps,maps.walk.solids,farmerBounds);
export function start(kind,mapKey='yard'){
 const entry=maps[mapKey].entry;
 const x=entry?.[0]??(kind==='farmer'?-.10:-.61),y=entry?.[1]??(kind==='farmer'?-1.58:-2.68);
 return {kind,mapKey,x,y,z:maps[mapKey].height?.(x,y)??0,angle:0,phase:0,gait:0,lean:0};
}
export function move(p,x,y,dt=tick){
 const map=maps[p.mapKey], [l,r,d,u]=map.extent;
 const len=Math.max(1,Math.hypot(x,y)), speed={fox:1.23,farmer:1.45,rabbit:1.83}[p.kind]*(map.surface?.(p.x,p.y)??1)*(p.mapKey==='walk'?1.65:1), radius=p.kind==='farmer'?.17:.13;
 const human=p.kind==='farmer';
 const solids=p.mapKey==='walk'?(human?walkthroughFarmerBounds:walkthroughBounds):p.mapKey==='yard'?(human?farmerBounds:bounds):map.solids;
 const oldX=p.x,oldY=p.y;
 function blocked(a,b){
  return solids.some(([l,r,d,u])=>Math.hypot(a-Math.max(l,Math.min(r,a)),b-Math.max(d,Math.min(u,b)))<radius);
 }
 const nx=Math.max(l,Math.min(r,p.x+x*speed*dt/len));
 if(!blocked(nx,p.y))p.x=nx;
 const ny=Math.max(d,Math.min(u,p.y+y*speed*dt/len));
 if(!blocked(p.x,ny))p.y=ny;
 let turning=0;
 if(Math.hypot(x,y)>.01){
  const a=Math.atan2(-x,y)-p.angle;
  turning=Math.atan2(Math.sin(a),Math.cos(a));
  p.angle+=turning*(1-Math.exp(-14*dt));
 }
 const bank=Math.max(-1,Math.min(1,turning*1.6));
 p.lean+=(bank-p.lean)*(1-Math.exp(-8*dt));
 const travelled=Math.hypot(p.x-oldX,p.y-oldY);
 p.gait+=(Math.min(1,travelled/(speed*dt))-p.gait)*(1-Math.exp(-14*dt));
 p.phase=(p.phase+travelled*{fox:10,farmer:10,rabbit:11}[p.kind])%(Math.PI*2);
 const coopRamp=p.mapKey==='yard'&&p.x>.02&&p.x<.58&&p.y>-.58;
 p.z=map.height?.(p.x,p.y)??(coopRamp?Math.min(.58,(p.y+.58)*.54):0);
}
