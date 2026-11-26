export const loads=[[-2.5,1.5,0],[-.94,1.79,1],[.94,1.79,0],[2.5,1.5,1]];
export const bays=[[-2.15,-1.94],[2.15,-1.94]];
export const swath=[[-.94,-3.1],[.94,-.95],[-.94,1.21],[.94,3.43],[-.94,5.57],[.94,7.83]];
export const ruts=[-1.78,2.36,6.78];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const feedNames=['Corn','Oats','Seed','Grain'];
export const feedColors=['Red','Teal'];
export function feedStart(random=Math.random){
 const order=loads.map((_,i)=>i);
 for(let i=order.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];
 }
 const first=random()<.5?0:1;
 return {game:'feed',x:0,y:-1.3,angle:0,gait:0,phase:0,elapsed:0,carrying:null,delivered:[],done:false,
  order,dest:order.map((_,i)=>(i+first)%2),heavy:order[1],braceUntil:0,note:'Read the order, then bring sacks to the truck'};
}
export function feedTicket(s){
 if(!s||s.done)return;
 const i=s.order[s.delivered.length];
 s.note=`Next: ${feedNames[i]} → ${feedColors[s.dest[i]]}${i===s.heavy?' · Heavy sack':''}`;
}
export function braceFeed(s){
 if(!s||s.done||s.carrying!==null)return;
 s.braceUntil=s.elapsed+1.7;s.note='Ready to lift the heavy sack';
}
export function returnFeed(s){
 if(!s||s.done||s.carrying===null)return;
 s.carrying=null;s.note='Sack returned to the rack';
}
export function hayStart(){
 return {game:'hay',elapsed:0,y:-5.1,lane:-1,loaded:[],stackSides:[],missed:[],carrying:null,slow:0,signals:3,brace:0,rut:0,done:false,note:'The tractor is rolling. Grab a bale when it gets close.'};
}
export function wagonBalance(s){
 return s.stackSides.reduce((sum,side)=>sum+side,0);
}
export function signalDriver(s){
 if(s.done||s.slow>0||!s.signals)return;
 s.signals--;s.slow=2;s.note='Driver slowing down';
}
export function braceWagon(s){
 if(s.done||s.brace>0)return;
 s.brace=2.75;s.note='Braced for the bump';
}
export function deliveryTick(s,dx,dy,dt){
 if(s.done)return;
 s.elapsed+=dt;
 if(s.game==='hay'){
  s.slow=Math.max(0,s.slow-dt);s.brace=Math.max(0,s.brace-dt);
  s.y+=dt*(s.slow>0?.58:1.12);
  if(s.y>=ruts[s.rut]){
   s.rut++;
   const lean=wagonBalance(s);
   if(Math.abs(lean)>=2&&s.brace<=0){
    const i=s.stackSides.lastIndexOf(Math.sign(lean));
    s.missed.push(s.loaded[i]);s.loaded.splice(i,1);s.stackSides.splice(i,1);
    s.note='A bale slid off the heavy side!';
   }else s.note=s.brace>0?'Brace held through the bump':'Balanced load held through the bump';
  }
  if(Math.abs(dx)>.28)s.lane=Math.sign(dx);
  for(const [i,[,y]] of swath.entries()){
   if(s.y>y+.95&&s.carrying!==i&&!s.loaded.includes(i)&&!s.missed.includes(i))s.missed.push(i);
  }
  if(s.y>=9.1){
   s.done=true;s.note=s.loaded.length===6?'Perfect load! All six bales aboard.':s.loaded.length>=4?'Hay run complete!':'Run over. Load at least four bales.';
  }
  return;
 }
 const n=Math.max(1,Math.hypot(dx,dy)),speed=s.carrying===null?3.2:s.carrying===s.heavy?2.15:2.5;
 s.x=clamp(s.x+dx/n*speed*dt,-3.05,3.05);
 s.y=clamp(s.y+dy/n*speed*dt,-2.62,2.23);
 s.gait=Math.min(1,Math.hypot(dx,dy));
 if(s.gait){s.angle=Math.atan2(-dx,dy);s.phase+=dt*speed*6;}
 if(s.elapsed>=35){s.done=true;s.note='Time’s up!';}
}
export function deliveryAction(s){
 if(s.done)return;
 if(s.game==='hay'){
  if(s.carrying!==null){
   s.loaded.push(s.carrying);s.stackSides.push(s.lane);s.carrying=null;
   s.note='Bale stacked '+(s.lane<0?'left':'right');
   return;
  }
  const i=swath.findIndex(([x,y],i)=>Math.sign(x)===s.lane&&Math.abs(y-s.y)<.83&&!s.loaded.includes(i)&&!s.missed.includes(i));
  if(i<0){s.note='Wait until a bale is beside the wagon';return;}
  s.carrying=i;s.note='Bale grabbed! Tap Load to stack it';
  return;
 }
 if(s.carrying===null){
  const i=loads.findIndex(([x,y],i)=>!s.delivered.includes(i)&&Math.hypot(x-s.x,y-s.y)<.64);
  if(i<0){s.note='Get closer to a feed sack';return;}
  if(i!==s.order[s.delivered.length]){feedTicket(s);return;}
  if(i===s.heavy&&s.elapsed>=s.braceUntil){s.note='Heavy sack. Brace, then pick up.';return;}
  s.carrying=i;s.note='Deliver '+feedNames[i]+' to the '+feedColors[s.dest[i]]+' bay';return;
 }
 const [bx,by]=bays[s.dest[s.carrying]];
 if(Math.hypot(bx-s.x,by-s.y)>.75){s.note='Find the matching color bay';return;}
 s.delivered.push(s.carrying);s.carrying=null;
 if(s.delivered.length===loads.length){s.done=true;s.note='All four sacks delivered!';}
 else feedTicket(s);
}
