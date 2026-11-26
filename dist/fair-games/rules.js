const interval=680,warmup=1450,beats=18;
export function newTug(now,random=Math.random){
 return {begin:now+warmup,next:0,pull:0,hits:0,plan:Array.from({length:beats},(_,i)=>i<2?'pull':random()<.3?'brace':'pull'),done:false,result:'',flash:''};
}
export function tugCue(s){return s.begin+interval*s.next;}
function finishTug(s){
 if(Math.abs(s.pull)>=6||s.next===beats){
  s.done=true;s.result=s.pull>0?'You win!':s.pull<0?'The bot crew wins':'Draw';
 }
}
export function tickTug(s,now){
 while(!s.done&&now>tugCue(s)+220){
  s.next++;s.pull-=.82;s.flash='The bots gained ground';finishTug(s);
 }
}
export function tugMove(s,now,move){
 tickTug(s,now);
 if(s.done)return;
 const error=Math.abs(tugCue(s)-now);
 if(error>220){s.flash='Wait for the gold line';return;}
 if(move!==s.plan[s.next]){s.flash=s.plan[s.next]==='brace'?'Brace on this beat!':'Pull on this beat!';return;}
 s.next++;
 const perfect=error<=95;
 s.hits++;s.pull+=move==='brace'?.56:perfect?.84:.42;s.flash=move==='brace'?'Held your ground':perfect?'Strong pull!':'Good pull';finishTug(s);
}
export function pull(s,now){tugMove(s,now,'pull');}
export const ingredients=['Crust','Filling','Topping'];
export function newPie(now){
 return {phase:'mix',since:now,step:0,you:3,bot:3,quality:0,shot:null,notice:'',done:false};
}
export function mix(s,i,now){
 if(s.phase!=='mix')return;
 if(i!==s.step){s.notice='Add '+ingredients[s.step].toLowerCase()+' next';return;}
 s.step++;s.notice='';
 if(s.step===ingredients.length){s.phase='bake';s.since=now;}
}
export function bake(s,now){
 if(s.phase!=='bake')return;
 const t=now-s.since;
 s.quality=t>=950&&t<=1550?1:0;
 s.notice=s.quality?'Golden crust · bigger splat':'Pie ready · aim carefully';
 s.phase='aim';s.since=now;
}
export function targetX(elapsed){return 320+Math.sin(elapsed/335)*171;}
export function throwPie(s,x,now){
 if(s.phase!=='aim')return;
 const botX=targetX(now-s.since);
 s.shot={x:Math.max(125,Math.min(515,x)),botX,start:now};
 s.phase='flight';
}
export function tickPie(s,now){
 if(s.phase==='bake'&&now-s.since>2300)bake(s,now);
 if(s.phase==='flight'&&now-s.shot.start>=480){
  const hit=Math.abs(s.shot.botX-s.shot.x)<=(s.quality?65:43);
  if(hit){s.bot--;s.notice='Splat!';}
  else{s.you--;s.notice='Miss! The bot threw back.';}
  s.phase='result';s.since=now;
  if(s.you===0||s.bot===0){s.done=true;s.notice=s.bot===0?'You win!':'The bot baker wins';}
 }
 if(s.phase==='result'&&!s.done&&now-s.since>=850){
  s.phase='mix';s.step=0;s.shot=null;s.notice='';
 }
}
