export const nest=[0,2.04],exit=[0,-2.51];
export const cowSpots=[[-2.15,.9],[0,1.35],[2.15,.9]];
export const butcherStations=[[-2.13,1.05],[0,1.48],[2.13,1.05]];
export const cuts=['Steak','Roast','Ground beef'];
const prompts=[
 'What farm chore would you trade away?','What’s your funniest animal story?','What would you name a pet goose?',
 'Which vegetable would you put on a pizza?','Which minigame would your family win?','What would you name a tractor?'
];
const dareSpots=[[-2.22,1.4],[2.25,.8],[0,1.96]];
const dares=[
 {name:'Hay Bale Run',route:[0]}, {name:'Fence Dash',route:[1]}, {name:'Barn Visit',route:[2]},
 {name:'Two-Corner Sprint',route:[0,1]}, {name:'Barn Relay',route:[2,0]}, {name:'Around the Yard',route:[1,2,0]}
];
function drawDeck(cards,random){
 const deck=[...cards];
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 return deck;
}
export function darePoint(s){
 if(s.mode!=='dare')return null;
 return dareSpots[s.dareDeck[s.dareIndex-1].route[s.checkpoint]];
}
const foxStarts=[[-2.80,-1.35],[2.72,-.85],[.1,-1.78]];
export const cutCount=6;
const near=(s,[x,y],r)=>Math.hypot(s.x-x,s.y-y)<r;
const base=()=>({x:0,y:-2.51,angle:0,gait:0,phase:0,elapsed:0,done:false});
export const foxStart=()=>({...base(),stage:'defend',fox:[...foxStarts[0]],caught:0,eggs:3,stolen:0,carrying:false,decoy:0,abilityReady:0,dash:0,sneak:false,note:'Catch two foxes before they reach the coop'});
export function cowStart(random=Math.random){
 return {...base(),tipped:cowSpots.map(()=>false),setup:cowSpots.map((_,i)=>i+1<3?
  Array.from({length:2},()=>random()<.5?'left':'right'):Array.from({length:3},()=>random()<.5?'left':'right')),
  progress:[0,0,0],braced:[false,false,false],note:'Walk up to a practice cow and brace'};
}
export function nearCow(s){return cowSpots.findIndex(p=>near(s,p,.78));}
export function cowSetup(s,tool){
 if(!s||s.done)return;
 const i=nearCow(s);
 if(i<0||s.tipped[i]){s.note='Walk up to an upright practice cow';return;}
 if(tool==='brace'){s.braced[i]=true;s.note='Braced. Follow the rock pattern.';return;}
 if(!s.braced[i]){s.note='Brace first';return;}
 const needed=s.setup[i][s.progress[i]];
 if(!needed){s.note='Rocked and ready. Wait for gold.';return;}
 if(tool!==needed){s.note='Try the other direction. Progress saved.';return;}
 s.progress[i]++;
 s.note=s.progress[i]===s.setup[i].length?'Ready. Tip when the marker turns gold.':'Good rock. Next direction.';
}
export function butcherStart(random=Math.random){
 const orders=[0,0,1,1,2,2];
 for(let i=orders.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[orders[i],orders[j]]=[orders[j],orders[i]];}
 return {...base(),orders,wraps:orders.map(()=>random()<.45?2:1),packed:0,wrapped:0,label:false,note:'Read the ticket and prepare the cut'};
}
export function butcherStep(s,tool){
 if(!s||s.done)return;
 const cut=cuts[cutAt(s)];
 if(tool==='ticket'){s.note=`${cut} · Wrap ${s.wraps[s.packed]}× → Label → Pack`;return;}
 if(tool==='wrap'){
  if(s.wrapped>=s.wraps[s.packed]){s.note='Wrapped. Add the label.';return;}
  s.wrapped++;s.note=s.wrapped===s.wraps[s.packed]?'Wrapped. Add the label.':'Add another layer of paper.';
  return;
 }
 if(s.wrapped<s.wraps[s.packed]){s.note='Wrap the cut first';return;}
 s.label=true;s.note='Labeled '+cut+' · Go to its cooler';
}
export function truthStart(random=Math.random){
 return {...base(),turn:0,completed:0,passed:0,mode:'choose',truthIndex:0,dareIndex:0,checkpoint:0,
  truthDeck:drawDeck(prompts,random),dareDeck:drawDeck(dares,random),note:'Choose Truth or Dare'};
}
function endPrompt(s,passed){
 if(passed)s.passed++;else s.completed++;
 s.turn++;s.mode='choose';s.checkpoint=0;
 s.done=s.turn===3;
 s.note=s.done?'Farm Edition complete!':'Choose Truth or Dare';
}
export function passPrompt(s){
 if(!s||s.done||s.mode==='choose')return;
 endPrompt(s,true);
}
export const cutAt=s=>s.orders[s.packed];
export const cowSway=(s,i)=>Math.sin(s.elapsed*3.7+i*1.7);
export function patrol(s){
 return {x:1.58*Math.sin((s.elapsed-(s.raidAt??0))*2.0),y:1.07};
}
const clamp=(v,l,r)=>Math.min(r,Math.max(l,v));
export function foxAbility(s,kind){
 if(!s||s.done)return;
 if(kind==='sneak'&&s.stage==='raid'){s.sneak=!s.sneak;s.note=s.sneak?'Sneaking past the guard':'Back to running';return;}
 if(s.elapsed<s.abilityReady)return;
 if(s.stage==='defend'){
  s.decoy=s.elapsed+(kind==='dash'?1.1:1.8);s.abilityReady=s.elapsed+4;
  s.note=kind==='dash'?'Alarm rattled the fox':'Decoy distracted the fox';
 }else if(kind==='dash'){
  s.dash=s.elapsed+.8;s.abilityReady=s.elapsed+3;s.note='Fox dashed';
 }else{
  s.decoy=s.elapsed+1.35;s.abilityReady=s.elapsed+4;s.note='Guard distracted';
 }
}
export function finaleTick(s,game,x,y,dt){
 if(s.done)return;
 const n=Math.max(1,Math.hypot(x,y)),speed=game==='fox'&&s.stage==='raid'?(s.sneak?1.7:s.dash>s.elapsed?5.1:3.5):3.16;
 s.x=clamp(s.x+x/n*speed*dt,-3.05,3.05);
 s.y=clamp(s.y+y/n*speed*dt,-2.72,2.61);
 s.gait=Math.min(1,Math.hypot(x,y));
 if(s.gait){s.angle=Math.atan2(-x,y);s.phase+=dt*12;}
 s.elapsed+=dt;
 if(game==='truth')return;
 if(game==='fox'){
  if(s.stage==='defend'){
   const dx=nest[0]-s.fox[0],dy=nest[1]-s.fox[1],d=Math.max(.04,Math.hypot(dx,dy));
   const pace=s.decoy>s.elapsed?.28:1.16;
   s.fox[0]+=dx/d*pace*dt;s.fox[1]+=dy/d*pace*dt;
   if(near({x:s.fox[0],y:s.fox[1]},nest,.28)){
    s.eggs--;s.fox=[...foxStarts[(s.caught+3-s.eggs)%3]];
    s.note='Fox got an egg! Intercept the next one.';
    if(!s.eggs){s.done=true;s.note='The foxes emptied the coop!';}
   }
  }else{
   const g=patrol(s);
   if(s.decoy<=s.elapsed&&near(s,[g.x,g.y],s.sneak?.21:.46)){
    Object.assign(s,{x:exit[0],y:exit[1],carrying:false});s.note='The guard spotted you. Try the side path.';
   }
  }
 }
 if(s.elapsed>=40&&!s.done){s.done=true;s.note='Time’s up!';}
}
export function finaleAction(s,game){
 if(s.done)return;
 if(game==='fox'){
  if(s.stage==='defend'){
   if(!near(s,s.fox,.67)){s.note='Get close enough to catch the fox';return;}
   s.caught++;
   if(s.caught===2){
    Object.assign(s,{stage:'raid',raidAt:s.elapsed,abilityReady:0,decoy:0,x:exit[0],y:exit[1]});
    s.note='Coop defended. Play as your trained fox and raid the rival nest.';
   }else{s.fox=[...foxStarts[s.caught]];s.note='Fox caught! Catch one more.';}
  }else if(!s.carrying&&near(s,nest,.66)){
   s.carrying=true;s.note='Egg grabbed! Run back to the gate.';
  }else if(s.carrying&&near(s,exit,.68)){
   s.stolen++;s.carrying=false;s.note='Egg delivered. Steal one more!';
   if(s.stolen===2){s.done=true;s.note='Coop defended and rival raid complete!';}
  }else s.note=s.carrying?'Head back to the gate':'Get closer to the rival nest';
 }else if(game==='cow'){
  const i=nearCow(s);
  if(i<0||s.tipped[i]){s.note='Walk up to an upright practice cow';return;}
  if(!s.braced[i]||s.progress[i]<s.setup[i].length){s.note='Brace and finish the rock pattern first';return;}
  if(cowSway(s,i)<.46){s.note='Wait until the cow leans toward you';return;}
  s.tipped[i]=true;s.note='Tipped!';
  if(s.tipped.every(Boolean)){s.done=true;s.note='All three practice cows tipped!';}
 }else if(game==='butcher'){
  if(!s.label){s.note='Wrap and label the cut before packing';return;}
  if(!near(s,butcherStations[cutAt(s)],.77)){s.note='Find the '+cuts[cutAt(s)].toLowerCase()+' cooler';return;}
  s.packed++;s.wrapped=0;s.label=false;
  s.note=s.packed===cutCount?'All six cuts packed!':'Next cut: '+cuts[cutAt(s)];
  if(s.packed===cutCount)s.done=true;
 }else if(s.mode!=='choose'){
  if(s.mode==='dare'){
   if(!near(s,darePoint(s),.65)){s.note='Reach the gold marker, then tap Check in';return;}
   s.checkpoint++;
   if(s.checkpoint<s.dareDeck[s.dareIndex-1].route.length){s.note='Checkpoint reached. Head to the next marker.';return;}
  }
  endPrompt(s,false);
 }
}
export function choosePrompt(s,kind){
 if(!s||s.done||s.mode!=='choose')return;
 s.mode=kind;
 s.note=kind==='truth'?s.truthDeck[s.truthIndex++]:s.dareDeck[s.dareIndex++].name+' · Reach the gold marker and tap Check in';
}
