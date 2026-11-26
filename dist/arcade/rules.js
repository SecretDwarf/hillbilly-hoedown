export const routeTargets=Array.from({length:12},(_,i)=>({
  distance:42+i*30, side:[-1,1,1,-1,1,-1,-1,1,-1,1,1,-1][i]
}));
export function newRoute(random=Math.random){
 const targets=routeTargets.map((stop,i)=>({...stop,side:random()<.5?-1:1,special:i%4===2}));
 return {targets,distance:0,side:-1,next:0,points:0,delivered:0,attempted:0,streak:0,done:false,flight:null,folded:false,slow:0,brakeReady:0,paper:0};
}
export function routeTool(run,kind){
 if(run.done)return;
 if(kind==='fold'){
  run.folded=true;return 'Special edition folded';
 }
 if(run.distance<run.brakeReady)return 'Brake is recovering';
 run.slow=1.5;run.brakeReady=run.distance+23;return 'Slowing for the next mailbox';
}
export function stepRoute(run,dt){
 if(run.done)return;
 run.slow=Math.max(0,run.slow-dt);
 run.distance+=dt*(run.slow?7.5:13);
 while(run.targets[run.next]&&run.distance>run.targets[run.next].distance+4){
  run.next++;run.streak=0;
 }
 if(run.next===run.targets.length)run.done=true;
}
export function deliver(run,now){
 if(run.done||run.flight&&now-run.flight.start<270)return null;
 const stop=run.targets[run.next],gap=stop.distance-run.distance;
 const good=Math.abs(gap)<=5&&run.side===stop.side&&(!stop.special||run.folded);
 run.attempted++;
 run.flight={start:now,side:run.side};
 if(good){
  run.delivered++;run.streak++;run.paper+=stop.special?2:1;
  const points=10+(run.streak>=3?5:0)+(stop.special?5:0);
  if(stop.special)run.folded=false;
  run.points+=points;run.next++;
  if(run.next===run.targets.length)run.done=true;
  return {good,label:'Delivered · +'+points};
 }
 run.streak=0;
 return {good,label:Math.abs(gap)>5?'Wait for the gold marker':run.side!==stop.side?'Switch to the other side':'Fold the special edition first'};
}
export const totalTosses=8;
export function powerAt(ms){return Math.min(1,Math.max(.05,ms/1150));}
export const throws={
 flat:{name:'Flat',wind:.105,roll:0,arc:.76,duration:510},
 lob:{name:'Lob',wind:.20,roll:0,arc:1.48,duration:720},
 skid:{name:'Skid',wind:.05,roll:.20,arc:.39,duration:590}
};
export function windFor(index,seed){
 return Math.sin(seed+index*2.02)*.87;
}
export function scoreToss(aim,power,style='flat',wind=0){
 const spec=throws[style]??throws.flat;
 const x=aim*.95+wind*spec.wind,landing=power*2.4-.77;
 const depth=landing+spec.roll;
 const onLine=Math.abs(x)<=.48;
 const inHole=Math.hypot(x,depth-.84)<=(style==='lob'?.165:.13)||
  (style==='skid'&&Math.abs(x)<.10&&landing>=0&&landing<=.84&&depth>=.84);
 const points=inHole?3:onLine&&depth>=0&&depth<=1?1:0;
 return {x,landing,depth:points===3?.84:depth,points,spec,label:points===3?'In the hole · +3':points?'On the board · +1':'Miss'};
}

export const cornModes={eight:'Eight Tosses',cancel:'Cancellation to 21',practice:'Solo Practice'};
export function cornMatch(pick='random',random=Math.random){
 const mode=pick==='random'?(random()<.5?'eight':'cancel'):Object.hasOwn(cornModes,pick)?pick:'practice';
 return {mode,score:[0,0],end:[0,0],tosses:0,turn:0,round:1,done:false};
}
export function recordCornToss(s,points){
 if(s.done)return;
 const team=s.turn;
 if(s.mode==='cancel')s.end[team]+=points;
 else s.score[team]+=points;
 if(team===0)s.tosses++;
 if(s.mode==='practice'){s.done=s.tosses>=totalTosses;return;}
 s.turn=1-team;
 if(team===0)return;
 if(s.mode==='eight'){s.done=s.tosses>=totalTosses;return;}
 if(s.tosses%4!==0)return;
 const diff=s.end[0]-s.end[1];
 if(diff!==0)s.score[diff>0?0:1]+=Math.abs(diff);
 s.done=s.score.some(n=>n>=21);
 if(!s.done){s.end=[0,0];s.round++;}
}
export function botCornToss(index,wind){
 const aim=Math.sin(index*2.78+1.14)*.28-wind*.06;
 const power=.66+Math.cos(index*2.02+.77)*.17;
 return scoreToss(aim,power,'flat',wind);
}
