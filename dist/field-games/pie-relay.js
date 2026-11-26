export const pantry=[[-2.45,-1.65],[-.82,-1.65],[.82,-1.65],[2.45,-1.65]];
export const ingredients=['Crust','Peaches','Berries','Topping'];
export const windowSpot=[0,1.35];
export const presets={
 rush:{name:'Order Rush',goal:'Serve as many pies as you can in 60 seconds.',time:60},
 race:{name:'Three-Pie Race',goal:'Serve three good pies as fast as you can.',time:90},
 ribbon:{name:'Blue Ribbon',goal:'Bake three pies and aim for 300 ribbon points.',time:90}
};
const recipes=[
 {name:'Peach pie',pattern:[0,1,3]},
 {name:'Berry pie',pattern:[0,2,2,3]},
 {name:'Mixed fruit pie',pattern:[0,1,2,3]}
];
const near=(s,[x,y],r)=>Math.hypot(s.x-x,s.y-y)<r;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function pieStart(pick='random',random=Math.random){
 const keys=Object.keys(presets);
 const preset=Object.hasOwn(presets,pick)?pick:keys[Math.floor(random()*keys.length)];
 return {preset,random,recipe:recipes[Math.floor(random()*recipes.length)],step:0,
  x:0,y:-2.42,gait:0,angle:0,phase:0,elapsed:0,holding:null,flight:null,aim:null,dropped:null,oven:null,
  served:0,quality:0,splat:0,done:false,note:presets[preset].goal};
}
export function nextIngredient(s){return s.recipe.pattern[s.step];}
function nextOrder(s){
 s.oven=null;s.step=0;s.recipe=recipes[Math.floor(s.random()*recipes.length)];
}
export function pieAction(s){
 if(s.done||s.flight||s.aim)return;
 if(s.oven!==null){
  if(!near(s,windowSpot,.92)){s.note='Return to the window to serve';return;}
  const bake=s.elapsed-s.oven;
  if(bake<.65){s.splat=1;s.note='Major mistake: raw pie splat!';nextOrder(s);return;}
  if(bake<1.35){s.note='Still baking. Wait for gold.';return;}
  const score=bake<=2.35?100:bake<=3.3?75:45;
  s.served++;s.quality+=score;
  s.note=score===100?'Golden pie served!':'Pie served';
  if(s.preset!=='rush'&&s.served===3){
   s.done=true;s.note=s.preset==='ribbon'?`Judges awarded ${s.quality}/300 points!`:'Three pies served!';
  }else nextOrder(s);
  return;
 }
 if(s.holding===null){
  if(s.dropped&&near(s,[s.dropped.x,s.dropped.y],.7)){
   s.holding=s.dropped.kind;s.dropped=null;s.note='Picked up the dropped ingredient';return;
  }
  const i=pantry.findIndex(p=>near(s,p,.64));
  if(i<0){s.note='Walk up to an ingredient basket';return;}
  s.holding=i;s.note='Carrying '+ingredients[i];return;
 }
 if(s.y<-.20||Math.abs(s.x)>.93){s.note='Line up with the middle of the bake window';return;}
 if(s.holding!==nextIngredient(s)){s.note='Recipe needs '+ingredients[nextIngredient(s)]+'. Tap Swap at a basket.';return;}
 s.flight={kind:s.holding,x:s.x,y:s.y,start:s.elapsed};
 s.holding=null;s.note='Ingredient tossed!';
}
export function beginAim(s){
 if(!s||s.done||s.aim||s.flight||s.holding===null||s.oven!==null)return false;
 if(s.holding!==nextIngredient(s)){s.note='Check the recipe before throwing';return false;}
 const dx=-s.x,dy=2.03-s.y,d=Math.hypot(dx,dy);
 s.aim={x:dx/d,y:dy/d,start:s.elapsed};
 s.note='Aim with the stick. Release in the gold power range.';
 return true;
}
export function tossPower(s){
 const distance=Math.hypot(s.x,2.03-s.y);
 return {charge:Math.min(1,(s.elapsed-s.aim.start)/.93),target:clamp((distance-.70)/5.2,0,1)};
}
export function releaseAim(s){
 if(!s?.aim)return;
 const {charge}=tossPower(s),{x,y}=s.aim;
 const d=.70+charge*5.2;
 const tx=s.x+x*d,ty=s.y+y*d;
 const caught=Math.hypot(tx,ty-2.03)<.74;
 s.flight={kind:s.holding,x:s.x,y:s.y,start:s.elapsed,
  tx:caught?0:clamp(tx,-3,3),ty:caught?2.03:clamp(ty,-2.62,1.36),caught};
 s.holding=null;s.aim=null;
 s.note=caught?'Long toss!':'Off target. You can pick it up and try again.';
}
export function swapIngredient(s){
 if(s.done||s.flight||s.aim||s.oven!==null)return;
 const i=pantry.findIndex(p=>near(s,p,.64));
 if(i<0){s.note='Go to a basket to swap ingredients';return;}
 s.holding=i;s.note='Carrying '+ingredients[i];
}
export function pieTick(s,x,y,dt){
 s.splat=Math.max(0,s.splat-dt);
 if(s.done)return;
 s.elapsed+=dt;
 const n=Math.hypot(x,y);
 if(s.aim&&n>.22){s.aim.x=x/n;s.aim.y=y/n;}
 if(s.aim){x=0;y=0;s.gait=0;}
 const speed=3.35/Math.max(1,n);
 s.x=clamp(s.x+x*speed*dt,-3.06,3.06);
 s.y=clamp(s.y+y*speed*dt,-2.75,1.43);
 s.gait=Math.min(1,Math.hypot(x,y));
 if(s.gait){s.angle=Math.atan2(-x,y);s.phase+=dt*14;}
 if(s.flight&&s.elapsed-s.flight.start>=.44){
  const flight=s.flight;s.flight=null;
  if(flight.caught===false){
   s.dropped={x:flight.tx,y:flight.ty,kind:flight.kind};s.note='Ingredient dropped. Pick it up or grab another.';
  }else{
   s.step++;
   if(s.step===s.recipe.pattern.length){s.oven=s.elapsed;s.note='Pie in the oven. Serve when the cue turns gold.';}
   else s.note='Caught! Next: '+ingredients[nextIngredient(s)];
  }
 }
 if(s.elapsed>=presets[s.preset].time){s.done=true;s.aim=null;s.note=`Time’s up · ${s.served} pies served`;}
}
