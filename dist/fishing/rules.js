export const duration=45;
const fish=[
 {name:'Bluegill',weight:2,pull:.86},
 {name:'Perch',weight:3,pull:.91},
 {name:'Catfish',weight:6,pull:1.11}
];
export function newRound(){
 return {time:0,age:0,phase:'ready',spot:1,casts:0,weight:0,count:0,tension:0,reel:0,fish:null,tug:false,notice:'',bait:0,slackUntil:0,pumpReady:0};
}
function phase(s,next){s.phase=next;s.age=0;}
function endCast(s,notice){
 s.notice=notice;s.tension=0;s.reel=0;s.tug=false;phase(s,'recover');
}
export function action(s){
 if(s.phase==='ready'){
  s.fish=fish[(s.casts+s.spot+s.bait)%fish.length];
  s.casts++;s.notice='';phase(s,'cast');
 }else if(s.phase==='bite'){
  s.reel=0;s.tension=.22;phase(s,'fight');
 }
}
export function fishingMove(s,kind){
 if(kind==='bait'&&s.phase==='ready'){
  s.bait=(s.bait+1)%fish.length;s.notice=['Worm','Corn','Minnow'][s.bait]+' bait';return;
 }
 if(s.phase!=='fight')return;
 if(kind==='slack'){
  s.slackUntil=s.time+.48;s.notice='Slack in the line';
 }else if(kind==='pump'&&s.time>=s.pumpReady&&!s.tug){
  s.reel+=.23;s.tension+=.20;s.pumpReady=s.time+.95;s.notice='Rod lift gained line';
 }
}
export function update(s,dt,holding){
 if(s.phase==='done')return;
 s.time+=dt;s.age+=dt;
 if(s.time>=duration){s.tug=false;phase(s,'done');return;}
 switch(s.phase){
  case 'cast':if(s.age>=.48)phase(s,'wait');break;
  case 'wait':if(s.age>=.95+.23*(s.casts%3))phase(s,'bite');break;
  case 'bite':if(s.age>1.4)endCast(s,'Missed the bite');break;
  case 'fight':
   if(s.time<s.slackUntil)holding=false;
   s.tug=(s.age%1.9)>.96&&(s.age%1.9)<1.65;
   s.tension=Math.max(0,s.tension+dt*(holding?(s.tug?s.fish.pull:.13):-.80));
   s.reel=Math.max(0,s.reel+dt*(holding?(s.tug?.12:.57):-.018));
   if(s.tension>=1){endCast(s,'The line snapped');break;}
   if(s.reel>=1){s.weight+=s.fish.weight;s.count++;endCast(s,s.fish.name+' landed · +'+s.fish.weight+' lb');}
   break;
  case 'recover':if(s.age>=.78)phase(s,'ready');break;
 }
}
