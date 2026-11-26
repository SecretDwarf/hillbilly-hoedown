import {cartWorldFaces} from './game-models.js';
export const gates = [
  { y: 495, x: 238, width: 128 },
  { y: 399, x: 402, width: 120 },
  { y: 305, x: 193, width: 116 },
  { y: 213, x: 363, width: 112 },
  { y: 119, x: 493, width: 108 }
];
const finish = 40;
const startingLine = 573;
const roadLeft = 44, roadRight = 556;

export function makeRace() {
  return { x: 300, y: startingLine, speed: 0, heading: 0, cameraX: 300, elapsed: 0, next: 0, misses: 0, pushUntil:0, pushReady:0, lean:0, leanUntil:0, finished: false };
}

export function cartMove(race,kind){
 if(race.finished)return;
 if(kind==='push'){
  if(race.elapsed<race.pushReady)return;
  race.pushUntil=race.elapsed+.75;race.pushReady=race.elapsed+2.15;
 }else{
  race.lean=kind==='left'?-1:1;race.leanUntil=race.elapsed+.36;
 }
}
export function stepRace(race, dt, steer, brake) {
  if (race.finished) return;
  const lean=race.elapsed<race.leanUntil?race.lean:0;
  const targetSpeed=brake?36:race.elapsed<race.pushUntil?118:84;
  steer=Math.max(-1,Math.min(1,steer+lean*.42));
  race.heading += (steer * -.46 - race.heading) * Math.min(1, dt * 10);
  race.speed += (targetSpeed - race.speed) * Math.min(1, dt * 5);
  race.x = Math.max(roadLeft+15, Math.min(roadRight-15, race.x + steer * (brake ? 225 : lean ? 211 : 175) * dt));
  race.cameraX += (race.x-race.cameraX) * Math.min(1,dt*5);
  race.y = Math.max(finish, race.y - race.speed * dt);
  race.elapsed += dt;
  while (race.next < gates.length && race.y <= gates[race.next].y) {
    const gate = gates[race.next++];
    if (Math.abs(race.x - gate.x) > gate.width / 2) race.misses++;
  }
  race.finished = race.y === finish;
}

const focal=385;
const roadZ=y=>.15*Math.max(0,y-finish);
const worldX=x=>(x-300)*.49;
const courseY=y=>-y;

function camera(race){
 const eye=[worldX(race.cameraX),courseY(race.y)-76,roadZ(race.y)+61];
 const angle=.28, c=Math.cos(angle),s=Math.sin(angle);
 return ([x,y,z])=>{
  const dy=y-eye[1],dz=z-eye[2];
  return [x-eye[0],dy*s+dz*c,dy*c-dz*s];
 };
}
function project(view,verts){
 const cameraPoints=verts.map(view);
 const clipped=[];
 const near=10;
 for(let i=0;i<cameraPoints.length;i++){
  const a=cameraPoints[i],b=cameraPoints[(i+1)%cameraPoints.length];
  if(a[2]>=near)clipped.push(a);
  if((a[2]>=near)!==(b[2]>=near)){
   const t=(near-a[2])/(b[2]-a[2]);
   clipped.push(a.map((v,k)=>v+(b[k]-v)*t));
  }
 }
 return clipped.map(([x,y,z])=>[300+x*focal/z,114-y*focal/z,z]);
}
function fill(ctx,p,color){
 if(p.length<3)return;
 ctx.fillStyle=color;
 ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
 for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);
 ctx.closePath();ctx.fill();
}
function quad(ctx,view,x1,x2,y1,y2,color,z=.0){
 fill(ctx,project(view,[[x1,courseY(y1),roadZ(y1)+z],[x2,courseY(y1),roadZ(y1)+z],
  [x2,courseY(y2),roadZ(y2)+z],[x1,courseY(y2),roadZ(y2)+z]]),color);
}
function upright(ctx,view,x,y,width,height,color,base=0){
 const z=roadZ(y)+base, cy=courseY(y);
 fill(ctx,project(view,[[x-width/2,cy,z],[x+width/2,cy,z],[x+width/2,cy,z+height],[x-width/2,cy,z+height]]),color);
}
function block(ctx,view,x,y,w,d,h,colors){
 const z=roadZ(y), cy=courseY(y), a=x-w/2,b=x+w/2,f=cy+d/2,n=cy-d/2;
 const sides=[
  {p:[[a,n,z],[b,n,z],[b,n,z+h],[a,n,z+h]],c:colors[0]},
  {p:[[a,f,z],[a,n,z],[a,n,z+h],[a,f,z+h]],c:colors[1]},
  {p:[[b,n,z],[b,f,z],[b,f,z+h],[b,n,z+h]],c:colors[1]},
  {p:[[a,n,z+h],[b,n,z+h],[b,f,z+h],[a,f,z+h]],c:colors[2]}
 ].sort((l,r)=>view(r.p.reduce((s,v)=>s.map((x,i)=>x+v[i]/4),[0,0,0]))[2]-view(l.p.reduce((s,v)=>s.map((x,i)=>x+v[i]/4),[0,0,0]))[2]);
 for(const side of sides)fill(ctx,project(view,side.p),side.c);
}

export function drawRace(ctx,race,oval){
 const view=camera(race);
 ctx.fillStyle='#b3d6d2';ctx.fillRect(0,0,600,390);
 ctx.fillStyle='#9aaa67';ctx.fillRect(0,70,600,320);
 quad(ctx,view,worldX(roadLeft),worldX(roadRight),-24,startingLine+100,'#c9915e');
 for(const side of [roadLeft,roadRight-8]){
  quad(ctx,view,worldX(side),worldX(side+8),-24,startingLine+100,'#a86d46',.08);
 }
 for(let y=0;y<startingLine+75;y+=28){
  quad(ctx,view,-2,2,y,y+10,'#dba976',.18);
 }
 for(let i=0;i<20;i++){
  const x=worldX(roadLeft+4+i*25.2);
  quad(ctx,view,x,x+12.35,finish-3,finish+3,i%2?'#5b4936':'#fff1c8',.3);
 }
 const props=[];
 for(let y=3;y<startingLine+60;y+=46)for(const x of [worldX(roadLeft-21),worldX(roadRight+21)]){
  props.push({y,draw:()=>block(ctx,view,x,y,13,15,9,['#c79542','#b17e35','#efc16a'])});
 }
 for(const [i,gate] of gates.entries()){
  if(gate.y>race.y+15)continue;
  const left=worldX(gate.x-gate.width/2),right=worldX(gate.x+gate.width/2);
  const color=i===race.next?'#ffeb8b':i%2?'#ca5d43':'#54a892';
  props.push({y:gate.y,draw:()=>{
   quad(ctx,view,left,right,gate.y-2,gate.y+2,color,.28);
   for(const [x,dir] of [[left,1],[right,-1]]){
    upright(ctx,view,x,gate.y,2.5,24,'#80583e');
    upright(ctx,view,x+dir*3.8,gate.y,8.8,6.8,color,16);
   }
  }});
 }
 const x=worldX(race.x),y=courseY(race.y),z=roadZ(race.y);
 props.push({y:race.y,draw:()=>{
  const center=project(view,[[x,y,z],[x+.01,y,z],[x,y,z+.01]])[0];
  if(center)oval(center[0],center[1]+2,27,9,'#966640');
  const faces=cartWorldFaces(x,y,z,race.heading,20).map(({points,color})=>{
   const p=project(view,points);
   const depth=p.reduce((sum,v)=>sum+v[2],0)/Math.max(1,p.length);
   const [a,b,c]=points,ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
   const normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
   const shade=.66+.34*Math.abs((normal[0]*-.28+normal[1]*.42+normal[2]*.86)/Math.max(.001,Math.hypot(...normal)));
   return {p,depth,color:'rgb('+color.map(n=>Math.round(n*shade)).join(',')+')'};
  }).sort((a,b)=>b.depth-a.depth);
  for(const f of faces)fill(ctx,f.p,f.color);
 }});
 props.sort((a,b)=>a.y-b.y).forEach(p=>p.draw());
}
