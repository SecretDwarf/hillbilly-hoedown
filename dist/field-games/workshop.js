import {craftMode} from './craft.js';

export const windmills=[[-2.32,.92],[0,1.19],[2.32,.92]];
export const mailboxes=[[-2.30,.89],[-.78,1.62],[.78,1.62],[2.30,.89]];
export const tools=['Wrench','Oil','New belt'];

export const paintColors=['Red','Teal','Gold'];
export const mailTasks={sand:'Sand',paint:'Paint',flag:'Fit flag',plate:'Add plate'};
export const shiftTime=30;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const base=()=>({x:0,y:-2.3,angle:0,gait:0,phase:0,elapsed:0,done:false});
export function windStart(random=Math.random){
 const plans=windmills.map((_,i)=>{
  const first=Math.floor(random()*3),second=(first+1+Math.floor(random()*2))%3;
  return i===2?[first,second,(second+1+Math.floor(random()*2))%3]:[first,second];
 });
 return {...base(),plans,checked:[false,false,false],progress:[0,0,0],note:'Approach a windmill and inspect it'};
}
export function mailStart(pick='timed',random=Math.random){
 const mode=craftMode(pick,random);
 const cards=[['sand','paint','flag','plate'],['paint','plate'],['sand','paint','plate'],['paint','flag','plate']];
 const offset=Math.floor(random()*cards.length);
 const plans=mailboxes.map((_,i)=>cards[(i+offset)%cards.length]);
 const colors=mailboxes.map(()=>Math.floor(random()*paintColors.length));
 return {...base(),mode,plans,colors,checked:[false,false,false,false],progress:[0,0,0,0],flaws:[false,false,false,false],note:'Inspect a mailbox to read its work order'};
}
export function workTick(s,dx,dy,dt){
 if(s.done)return;
 s.elapsed+=dt;
 const n=Math.max(1,Math.hypot(dx,dy));
 s.x=clamp(s.x+dx/n*3.25*dt,-3.04,3.04);
 s.y=clamp(s.y+dy/n*3.25*dt,-2.68,2.62);
 s.gait=Math.min(1,Math.hypot(dx,dy));
 if(s.gait){s.angle=Math.atan2(-dx,dy);s.phase+=dt*14;}
 if(s.mode!=='craft'&&s.elapsed>=shiftTime){s.done=true;s.note='Time’s up!';}
}
export function station(s,points){
 return points.findIndex(([x,y])=>Math.hypot(x-s.x,y-s.y)<.73);
}
export function inspectMill(s){
 if(s.done)return;
 const i=station(s,windmills);
 if(i<0){s.note='Get closer to a windmill';return;}
 s.checked[i]=true;
 s.note=s.progress[i]===s.plans[i].length?'This mill is running':'Follow the repair card';
}
export function fixMill(s,tool){
 if(s.done)return;
 const i=station(s,windmills);
 if(i<0){s.note='Get closer to a windmill';return;}
 if(!s.checked[i]){s.note='Inspect this windmill first';return;}
 const task=s.plans[i][s.progress[i]];
 if(task===undefined){s.note='This mill is running';return;}
 if(tool!==task){s.note='Wrong tool. Your progress is saved.';return;}
 s.progress[i]++;
 s.note=s.progress[i]===s.plans[i].length?'Windmill running!':'Good fit. Next tool.';
 if(s.progress.every((n,j)=>n===s.plans[j].length)){s.done=true;s.note='All three windmills are running!';}
}
export function inspectMail(s){
 if(s.done)return;
 const i=station(s,mailboxes);
 if(i<0){s.note='Get closer to a mailbox';return;}
 s.checked[i]=true;s.note=s.progress[i]===s.plans[i].length?'Mailbox finished':'Follow the work order';
}
export function decorate(s,tool){
 if(s.done)return;
 const i=station(s,mailboxes);
 if(i<0){s.note='Get closer to a mailbox';return;}
 if(!s.checked[i]){s.note='Inspect the mailbox first';return;}
 const task=s.plans[i][s.progress[i]];
 if(!task){s.note='Mailbox finished';return;}
 if(task!==tool&&!(tool==='fit'&&(task==='flag'||task==='plate'))){
  s.flaws[i]=true;s.note='Wrong step. Your work is saved.';return;
 }
 s.progress[i]++;
 s.note=s.progress[i]===s.plans[i].length?'Mailbox finished!':'Good work. Next step.';
 if(s.progress.every((n,j)=>n===s.plans[j].length)){s.done=true;s.note='All four mailboxes are ready!';}
}
