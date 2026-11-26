export const courseEnd=7.6;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function pullStart(){
 return {elapsed:0,y:-5.6,throttle:0,spin:0,gear:1,clutch:0,done:false,note:'Raise the throttle into the gold zone'};
}
export function traction(s){
 const t=clamp((s.y+5.6)/13.2,0,1);
 return {low:30+t*18,high:66-t*5-(s.gear===2?8:0)};
}
export function throttle(s,amount){
 if(!s.done)s.throttle=clamp(s.throttle+amount,0,100);
}
export function clutch(s){
 if(!s.done){s.clutch=1.15;s.note='Clutch in. Shift now.';}
}
export function shift(s){
 if(s.done)return;
 if(!s.clutch){s.note='Tap Clutch before shifting';s.hint=.85;return;}
 s.gear=s.gear===1?2:1;s.clutch=0;s.note='Gear '+s.gear+' engaged';s.hint=.65;
}
export function pullTick(s,dt){
 if(s.done)return;
 s.elapsed+=dt;
 s.hint=Math.max(0,(s.hint??0)-dt);
 s.clutch=Math.max(0,s.clutch-dt);
 const {low,high}=traction(s);
 const cap=high;
 const slipping=!s.clutch&&s.throttle>cap;
 const good=!s.clutch&&s.throttle>=low&&!slipping;
 s.spin=clamp(s.spin+dt*(slipping?.49:-.72),0,1);
 s.y=Math.min(courseEnd,s.y+dt*(good?(s.gear===2?1.59:1.23):slipping?.18:0));
 if(!s.hint)s.note=s.clutch?'Clutch in. Shift now.':good?'Good traction':slipping?'Wheelspin! Ease off or shift low':'Raise the throttle';
 if(s.y>=courseEnd){s.done=true;s.note='Full pull!';}
 else if(s.spin>=1){s.done=true;s.note='The tires dug in. Try less throttle.';}
 else if(s.elapsed>=25){s.done=true;s.note='Time’s up. The sled is still on the track.';}
}
export const mudBounds={left:-1.65,right:1.29,near:-3.69,far:3.64};
export function bogStart(){
 return {x:0,y:-5.6,angle:0,elapsed:0,boost:0,charges:3,low:false,brake:0,winch:0,winchReady:true,done:false,note:'Pick a route and drive to the finish'};
}
export function muddy(x,y){
 const {left,right,near,far}=mudBounds;
 return x>left&&x<right&&y>near&&y<far;
}
export function boost(s){
 if(s.done||s.boost>0||s.charges===0)return;
 s.charges--;s.boost=1.7;
}
export function bogGear(s){if(!s.done)s.low=!s.low;}
export function bogBrake(s){if(!s.done)s.brake=.6;}
export function bogWinch(s){
 if(s.done||!s.winchReady||!muddy(s.x,s.y))return;
 s.winchReady=false;s.winch=.9;s.bank=s.x<-.18?-1:1;
}
export function bogTick(s,x,y,dt){
 if(s.done)return;
 s.elapsed+=dt;s.boost=Math.max(0,s.boost-dt);
 s.brake=Math.max(0,s.brake-dt);s.winch=Math.max(0,s.winch-dt);
 const wet=muddy(s.x,s.y);
 if(s.winch){x=s.bank;y=0;}
 const n=Math.max(1,Math.hypot(x,y));
 const normal=wet?(s.low?1.72:.85):(s.low?2.43:3.16);
 const speed=s.winch?3.05:s.brake?.62:s.boost?(wet?2.82:4.25):normal;
 s.x=clamp(s.x+x/n*speed*dt,-3.04,3.04);
 s.y=clamp(s.y+y/n*speed*dt,-5.8,courseEnd);
 if(Math.hypot(x,y)>.12){
  const delta=Math.atan2(-x,y)-s.angle;
  s.angle+=Math.atan2(Math.sin(delta),Math.cos(delta))*Math.min(1,dt*14);
 }
 s.note=s.winch?'Winching toward the bank':s.brake?'Braking':s.boost?'Boost engaged':wet?(s.low?'Low gear grips the mud':'Deep mud. Shift low or boost.'):'Dry ground';
 if(s.y>=courseEnd){s.done=true;s.note='You made it out of the bog!';}
 else if(s.elapsed>=18){s.done=true;s.note='Time’s up in the bog!';}
}
