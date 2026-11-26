const min=5,max=95;
// Different axes match the flattened arena projection and keep the farmers' feet apart.
export const spacingX=7;
export const spacingY=9;
export function moveFarmer(player,farmers,x,y,dt,carrying){
  const scale=Math.max(1,Math.hypot(x,y)),speed=carrying?33:38;
  const blocks=(a,b)=>farmers.some(other=>other!==player&&
    Math.hypot((a-other.x)/spacingX,(b-other.y)/spacingY)<1);
  const nx=Math.max(min,Math.min(max,player.x+x*speed*dt/scale));
  if(!blocks(nx,player.y))player.x=nx;
  const ny=Math.max(min,Math.min(max,player.y+y*speed*dt/scale));
  if(!blocks(player.x,ny))player.y=ny;
}
export function chaseFarmer(bot,farmers,x,y,dt,carrying,side){
  const oldX=bot.x,oldY=bot.y;
  moveFarmer(bot,farmers,x,y,dt,carrying);
  if(bot.x===oldX&&bot.y===oldY){
    // Step around a blocked lane instead of repeatedly pressing into another farmer.
    moveFarmer(bot,farmers,-side*y,side*x,dt,carrying);
  }
}
