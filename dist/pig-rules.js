export const roundLength = 30_000;
export const grabReach = 19;
const botReach = 11;

export function canGrab({ human, distance, hasOwner, ownerIsHuman = false, sameOwner, now, safeUntil, botsAfter }) {
  if (sameOwner || now < safeUntil) return false;
  if (human) return distance <= grabReach;
  return (!hasOwner || ownerIsHuman) && now >= botsAfter && distance <= botReach;
}

export function holdTimes(human, now) {
  return human ? { safeUntil: now + 1400, slipAt: now + 8500 } :
    { safeUntil: now + 250, slipAt: now + 2600 };
}

const sides=['left','right'];
export function beginGrip(now,random=Math.random){
 const first=random()<.5?0:1,second=random()<.5?0:1;
 return {showAt:now+1350,slipAt:now+3800,pattern:[sides[first],sides[second]],index:0,braced:false,guardUntil:0};
}
export function shiftGrip(grip,side,now,random=Math.random){
 if(!grip||now<grip.showAt||now>=grip.slipAt)return {grip,result:'waiting'};
 if(grip.pattern[grip.index]!==side)return {grip,result:'wrong'};
 grip.index++;
 if(grip.index<grip.pattern.length)return {grip,result:'step'};
 const next=beginGrip(now,random);
 next.braced=grip.braced;next.guardUntil=grip.guardUntil;
 return {grip:next,result:'saved'};
}
export function braceGrip(grip,now){
 if(!grip||grip.braced||now>=grip.slipAt)return false;
 grip.braced=true;grip.guardUntil=now+900;grip.slipAt+=900;
 return true;
}

export const bonusReach=12;
export function pigScore(){
 return {points:[0,0],bonus:null,nextBonus:Infinity,bonusCount:0};
}
export function setCarrierScore(score,now){
 score.bonus=null;score.nextBonus=now+1250;
}
export function tickPigScore(score,team,now,dt,hasTeammate){
 if(team===null){score.bonus=null;return;}
 score.points[team]+=dt;
 if(score.bonus&&now>=score.bonus.until)score.bonus=null;
 if(hasTeammate&&!score.bonus&&now>=score.nextBonus){
  score.bonus={part:score.bonusCount++%2===0?'collar':'tail',until:now+1100};
  score.nextBonus=now+2800;
 }
}
export function takePigBonus(score,{teammate,carrier,distance,team,now}){
 if(!score.bonus||!teammate||carrier||distance>bonusReach||now>=score.bonus.until)return false;
 score.points[team]+=2;score.bonus=null;
 return true;
}
export function winningTeam(score){
 const [a,b]=score.points.map(n=>Math.floor(n));
 return a===b?null:a>b?0:1;
}
