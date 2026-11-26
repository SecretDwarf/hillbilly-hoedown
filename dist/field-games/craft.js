export function craftMode(pick,random){
 if(pick==='random')return random()<.5?'timed':'craft';
 return pick==='craft'?'craft':'timed';
}
export function workScore(completed,flaws){
 const total=completed.reduce((sum,done,i)=>sum+(done?(flaws[i]?65:100):0),0);
 return Math.round(total/completed.length);
}
