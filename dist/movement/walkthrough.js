// Slot origins are shared by rendering, collision and the directory.
export const districts=[
 {name:'Farm',x:-10.6,keys:['yard','pen','lane','chase','pond','sheep','feed','bog']},
 {name:'Fairground',x:10.6,keys:['teams','derby','slalom','ferry','golf','junk','tower','tug','pie','midway']}
];
export const trailY=-17.6;
export const slots=districts.flatMap(district=>district.keys.map((key,i)=>({
 key,district:district.name,
 x:district.x+(i%2?5.55:-5.55),
 y:-12.2+Math.floor(i/2)*10.1
})));
export function localStage(maps,x,y){
 return slots.find(s=>{
  const [l,r,d,u]=maps[s.key].extent;
  return x>=s.x+l&&x<=s.x+r&&y>=s.y+d&&y<=s.y+u;
 });
}
export function nearbyStage(x,y){
 let best=null,dist=4.6;
 for(const s of slots){
  const next=Math.hypot(x-s.x,y-s.y);
  if(next<dist){best=s;dist=next;}
 }
 return best;
}
const outerRails={
 pen:[[-2.92,2.92,2.75,2.91],[-2.92,-2.74,-2.91,2.91],[2.74,2.92,-2.91,2.91],
      [-2.92,-.76,-2.92,-2.74],[.76,2.92,-2.92,-2.74]],
 derby:[[-3.57,3.57,2.92,3.10],[-3.57,-3.39,-3.10,3.10],[3.39,3.57,-3.10,3.10],
        [-3.57,-.77,-3.10,-2.92],[.77,3.57,-3.10,-2.92]],
 chase:[[-3.34,3.34,3.21,3.39],[-3.34,-3.16,-3.39,3.39],[3.16,3.34,-3.39,3.39]]
};
export function translatedBounds(maps,coord,yardBounds){
 return slots.flatMap(slot=>(slot.key==='yard'?yardBounds:[...maps[slot.key].solids,...(outerRails[slot.key]??[])])
  .map(([l,r,d,u])=>[l+slot.x,r+slot.x,d+slot.y,u+slot.y])).concat(coord);
}
