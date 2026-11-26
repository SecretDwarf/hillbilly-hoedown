export const courses=[
 {name:'Hay Bale Bend',tee:[87,228],cup:[545,122],walls:[[307,205,35]],par:3},
 {name:'Washtub Washout',tee:[81,213],cup:[555,150],walls:[],creek:[265,374,108,180],par:3},
 {name:'Trough Turn',tee:[88,95],cup:[548,261],walls:[[290,167,45],[418,227,37]],par:4},
 {name:'Fridge Door Finale',tee:[88,259],cup:[421,76],walls:[[284,152,32]],door:[297,287,492,151],par:4}
];

export const clubs=[
 {name:'Baseball bat',power:1.04},
 {name:'Muffler',power:1.12},
 {name:'Broom',power:.97}
];
const stashes=[[[120,112],[178,282],[70,294]],[[93,91],[142,256],[196,143]],[[80,185],[183,65],[195,147]],[[90,190],[180,288],[148,213]]];
export function clubStash(s){
 return stashes[s.index].map(([x,y],i)=>({x,y,club:(i+s.index)%clubs.length}));
}
function setupSearch(s){
 const [x,y]=courses[s.index].tee;
 Object.assign(s,{club:null,scout:{x,y,angle:0,gait:0,phase:0},note:'Walk to a makeshift club'});
}
export function scoutGolf(s,dx,dy,dt){
 if(s.club!==null)return;
 const p=s.scout,n=Math.max(1,Math.hypot(dx,dy));
 p.x=Math.max(29,Math.min(235,p.x+dx/n*178*dt));
 p.y=Math.max(30,Math.min(326,p.y-dy/n*178*dt));
 p.gait=Math.min(1,Math.hypot(dx,dy));
 if(p.gait){p.angle=Math.atan2(-dx,dy);p.phase+=dt*13;}
}
export function grabClub(s){
 if(s.club!==null)return;
 const p=s.scout,found=clubStash(s).find(a=>Math.hypot(a.x-p.x,a.y-p.y)<28);
 if(!found){s.note='Get closer to a club';return;}
 s.club=found.club;s.note=clubs[s.club].name+' equipped';
}
export function newGolf(){
 const s={index:0,count:0,strokes:0,ball:[...courses[0].tee],shot:null,sunk:false,done:false};
 setupSearch(s);return s;
}
export function putt(s,degrees,power){
 if(s.done||s.sunk||s.shot||s.club===null)return;
 const a=degrees*Math.PI/180;
 const speed=720*power/100*clubs[s.club].power;
 s.shot={origin:[...s.ball],vx:Math.cos(a)*speed,vy:Math.sin(a)*speed};
 s.count++;s.strokes++;s.note='Ball rolling';
}
export function roll(s,dt){
 if(!s.shot)return;
 const shot=s.shot,c=courses[s.index];
 let [x,y]=s.ball;
 x+=shot.vx*dt;y+=shot.vy*dt;
 if(x<22||x>618){shot.vx*=-.66;x=Math.max(22,Math.min(618,x));}
 if(y<24||y>336){shot.vy*=-.66;y=Math.max(24,Math.min(336,y));}
 for(const [cx,cy,r] of c.walls){
  const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy);
  if(d<r+5&&d>0){
   const nx=dx/d,ny=dy/d,into=shot.vx*nx+shot.vy*ny;
   if(into<0){shot.vx-=1.65*into*nx;shot.vy-=1.65*into*ny;}
   x=cx+nx*(r+5);y=cy+ny*(r+5);
  }
 }
 if(c.door){
  const [ax,ay,bx,by]=c.door,dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(len*len)));
  const px=ax+t*dx,py=ay+t*dy,rx=x-px,ry=y-py,d=Math.hypot(rx,ry);
  if(d<9){
   const nx=d>.01?rx/d:dy/len,ny=d>.01?ry/d:-dx/len;
   const into=shot.vx*nx+shot.vy*ny;
   if(into<0){
    shot.vx-=2.07*into*nx;shot.vy-=2.07*into*ny;
    s.note='Door bank!';shot.bank=true;
   }
   x=px+nx*9;y=py+ny*9;
  }
 }
 s.ball=[x,y];
 if(c.creek){
  const [l,r,b,t]=c.creek;
  if(x>=l&&x<=r&&(y<b||y>t)){
   s.ball=shot.origin;s.shot=null;s.strokes++;s.count++;
   s.note='Splash! One penalty stroke';return;
  }
 }
 if(Math.hypot(x-c.cup[0],y-c.cup[1])<13&&Math.hypot(shot.vx,shot.vy)<540){
  s.ball=[...c.cup];s.shot=null;s.sunk=true;
  s.done=s.index===courses.length-1;s.note=s.done?'Round complete':'In the cup!';return;
 }
 const friction=Math.exp(-1.36*dt);
 shot.vx*=friction;shot.vy*=friction;
 if(Math.hypot(shot.vx,shot.vy)<9){s.shot=null;s.note='Line up your next putt';}
}
export function nextHole(s){
 if(!s.sunk||s.done)return;
 s.index++;s.count=0;s.ball=[...courses[s.index].tee];s.sunk=false;setupSearch(s);
}

const rungOffsets=[0,30,-30,0,90,-90,10,42,-42,0,85,0];
export function newTower(now){
 return {rung:0,misses:0,route:'stairs',braced:-1,start:now,next:now+1400,done:false,note:'Get ready'};
}
const gust=s=>[4,5,8,10].includes(s.rung);
export function towerWindow(s){
 return (s.route==='ladder'?145:240)-(gust(s)&&s.braced!==s.rung?65:0);
}
export function towerAction(s,kind){
 if(!s||s.done)return;
 if(kind==='brace'){
  if(!gust(s)){s.note='Save Brace for a wind gust';return;}
  s.braced=s.rung;s.note='Braced against the gust';return;
 }
 if(s.rung%4){s.note='Switch routes at the next landing';return;}
 s.route=kind;s.note=kind==='ladder'?'Ladder · faster, tighter timing':'Stairs · wider timing';
}
export function climb(s,now){
 tickTower(s,now);
 if(s.done)return;
 if(Math.abs(now-s.next)>towerWindow(s)){s.note='Wait for the gold zone';return;}
 s.rung++;s.lastClimb=now;
 if(s.rung===rungOffsets.length){
  s.done=true;s.time=(now-s.start)/1000;s.note='You rang the bell!';return;
 }
 s.note=gust(s)?'Wind gust! Tap Brace to widen the window':s.rung%4===0?'Landing · choose stairs or ladder':'Clean climb';
 s.next=now+(s.route==='ladder'?530:790)+rungOffsets[s.rung];
}
export function tickTower(s,now){
 if(!s.done&&now>s.next+towerWindow(s)){
  s.misses++;
  s.note='Missed rung. Steady yourself and try again';
  s.next=now+820;
 }
}

const flockStarts=[[-2.40,-.7],[-1.48,.24],[-.44,-1.34],[.75,-.48],[1.65,.24],[2.50,-.94]];
const clamp=(v,l,r)=>Math.min(r,Math.max(l,v));
const rivalStartsAt=6;
export const sheepBarns=[-1.72,1.72];
export const sheepModes={race:'Barn Race',shared:'Shared Pasture',practice:'Solo Practice'};
export function newFlock(pick='practice',random=Math.random){
 const mode=pick==='random'?(random()<.5?'race':'shared'):Object.hasOwn(sheepModes,pick)?pick:'practice';
 const practice=mode==='practice';
 const createPlayer=(x,y)=>({x,y,angle:0,gait:0,phase:0});
 const player=createPlayer(practice?0:-1.72,-2.66);
 const sheep=flockStarts.map(([x,y],i)=>{
  const team=practice?0:mode==='race'?Number(i>=3):i%2;
  return {x,y,team,angle:Math.PI,home:false,gait:0};
 });
 return {mode,player,sheep,rival:practice?null:createPlayer(1.72,-2.66),winner:null,
  elapsed:0,done:false,gate:false,whistleAt:0,dog:null,dogAt:0,note:practice?'Open the gate and guide all six sheep in':'Open the teal gate and beat the red team'};
}
export function flockScore(s){
 return s.sheep.reduce((score,a)=>{if(a.home)score[a.team]++;return score;},[0,0]);
}
export function flockAction(s,action){
 if(!s||s.done)return;
 if(action==='gate'){
  s.gate=!s.gate;s.note=s.gate?'Gate open':'Gate closed';return;
 }
 if(action==='whistle'){
  if(s.elapsed<s.whistleAt)return;
  s.whistleAt=s.elapsed+3.2;
  const p=s.player;
  const nearby=s.sheep.filter(a=>!a.home&&Math.hypot(a.x-p.x,a.y-p.y)<1.65);
  nearby.forEach(a=>{a.followingTrail=true;});
  s.note=nearby.length?`Whistle rallied ${nearby.length} sheep`:'Get closer before whistling';
  return;
 }
 if(s.elapsed<s.dogAt)return;
 const side=action==='left'?-1:1;
 s.dog={side,until:s.elapsed+2.4,y:clamp(s.player.y+.6,-2.5,.80)};
 s.dogAt=s.elapsed+3;
 s.note=side<0?'Dog sweeping left':'Dog sweeping right';
}
function rivalStep(s,dt){
 if(!s.rival||s.elapsed<rivalStartsAt)return;
 const r=s.rival,target=s.sheep.find(a=>a.team===1&&!a.home&&!a.followingTrail);
 if(!target){r.gait=0;return;}
 const dx=target.x-r.x,dy=target.y-.70-r.y,d=Math.hypot(dx,dy);
 if(d<.12){r.gait=0;return;}
 r.x=clamp(r.x+dx/d*1.48*dt,s.mode==='race'?.19:-3.3,3.3);
 r.y=clamp(r.y+dy/d*1.48*dt,-3.02,.96);
 r.angle=Math.atan2(-dx,dy);r.gait=.8;r.phase+=dt*11;
}
export function herd(s,dx,dy,dt){
 if(s.done)return;
 s.elapsed+=dt;
 const p=s.player,n=Math.max(1,Math.hypot(dx,dy));
 p.x=clamp(p.x+dx/n*2.65*dt,-3.30,s.mode==='race'?-.19:3.30);
 p.y=clamp(p.y+dy/n*2.65*dt,-3.02,.96);
 p.gait=Math.min(1,Math.hypot(dx,dy));
 if(p.gait){p.angle=Math.atan2(-dx,dy);p.phase+=p.gait*dt*11;}
 rivalStep(s,dt);
 for(const [i,a] of s.sheep.entries()){
  if(a.home)continue;
  const ux=a.x-p.x,uy=a.y-p.y,d=Math.hypot(ux,uy);
  const barn=s.rival?sheepBarns[a.team]:0;
  const pressure=s.mode==='race'&&a.team===1?0:clamp((1.78-d)*2.3,0,1.6);
  if(s.rival&&s.elapsed>=rivalStartsAt&&a.team===1){
   const r=s.rival;
   if(Math.hypot(a.x-r.x,a.y-r.y)<1.12&&a.y-r.y>.31){
    a.rally=(a.rally??0)+dt;
    if(a.rally>.46)a.followingTrail=true;
   }
  }
  if(pressure>.85&&uy>.32)a.followingTrail=true;
  const dog=s.dog;
  const sweep=(s.mode!=='race'||a.team===0)&&dog&&s.elapsed<dog.until&&dog.side*a.x>0&&Math.abs(a.y-dog.y)<1.55;
  if(sweep)a.followingTrail=true;
  const guide=a.followingTrail?(s.rival&&a.team===1?.51:.72):0;
  let vx=pressure*(d>.03?ux/d:0)-(a.x-barn)*guide-(sweep?dog.side*.46:0);
  let vy=pressure*(d>.03?uy/d:1)+guide*.78;
  for(const b of s.sheep){
   const bx=a.x-b.x,by=a.y-b.y,sep=Math.hypot(bx,by);
   if(!b.home&&(s.mode!=='race'||a.team===b.team)&&sep>.01&&sep<.44){vx+=bx*(.44-sep)*3;vy+=by*(.44-sep)*3;}
  }
  a.x=clamp(a.x+vx*dt,s.mode==='race'&&a.team===1?.19:-3.25,s.mode==='race'&&a.team===0?-.19:3.25);
  a.y=clamp(a.y+vy*dt,-3.08,1.23);
  if((a.team===1||s.gate)&&a.y>=1.20&&Math.abs(a.x-barn)<.48){
   const slot=s.sheep.filter(b=>b.home&&b.team===a.team).length;
   a.home=true;a.x=barn+(slot%3-1)*.42;a.y=1.67+Math.floor(slot/3)*.43;a.angle=Math.PI;a.gait=0;
  }else{
   a.gait=Math.min(1,Math.hypot(vx,vy));
   if(a.gait>.04)a.angle=Math.atan2(vx,-vy);
  }
 }
 if(!s.rival){s.done=s.sheep.every(a=>a.home);return;}
 const [teal,red]=flockScore(s);
 if(teal===3||red===3||s.elapsed>=45){
  s.done=true;s.winner=teal===red?'tie':teal>red?'teal':'red';
 }

}
