const turn=Math.PI*2;

function lap(model,x,y,rx,ry,period,offset=0,gait=0){
 return time=>{
  const a=time/period*turn+offset;
  return {model,x:x+rx*Math.cos(a),y:y+ry*Math.sin(a),
   angle:Math.atan2(rx*Math.sin(a),ry*Math.cos(a)),gait,phase:time*10};
 };
}

const crews=[0,1,2,3].map(i=>time=>({
 model:'crew-'+i,x:(i%2?1:-1)*1.77,
 y:(i<2?-1:1)*1.69+Math.sin(time*3)*.23,
 z:.024*Math.abs(Math.sin(time*6)),angle:i<2?0:Math.PI
}));

const stages={
 yard:[lap('goose',0,-2.52,1.25,.24,10),lap('fox',.90,-1.49,.48,.25,6,0,.72)],
 pen:[lap('pig',0,0,1.91,1.92,7),lap('farmer',0,0,2,1.96,7,-.65,.87)],
 lane:[lap('farmer',0,.32,.54,3.1,12,0,.75)],
 chase:[
  lap('rabbit',-.05,-.61,.43,2.46,7,0,.84),
  lap('rabbit',1.68,1.60,.56,.51,4,1.6,.84)
 ],
 pond:[
  ()=>({model:'farmer',x:0,y:-.94,z:.08,angle:0}),
  time=>({model:'bobber',x:-.32,y:.33,z:.016+Math.sin(time*4)*.035,angle:0})
 ],
 sheep:[lap('ewe',-.5,-1.62,1.19,.43,8),lap('ewe',.42,-1.72,1.12,.56,9,1.5)],
 tug:crews,
 pie:[
  time=>({model:'pie-prop',x:-1.55+3.10*(time%2.8)/2.8,y:-1.26,
   z:.60+Math.sin(Math.PI*(time%2.8)/2.8)*.95,angle:time*6}),
  ...[0,1,2,3].map(i=>time=>({model:'crew-'+i,x:i%2?1.57:-1.57,
   y:i<2?-.83:1.87,z:.035*Math.abs(Math.sin(time*5+i)),angle:0}))
 ]
};

const gaits={fox:1,farmer:2,rabbit:3,goose:5};
export function activityAt(key,time){
 return (stages[key]??[]).map(actor=>{
  const {model,x,y,z=0,angle=0,gait=0,phase=0}=actor(time);
  const hop=model==='pig'||model==='ewe'?Math.abs(Math.sin(time*9))* .04:0;
  return {model,position:[x,y,z+hop],angle,motion:[gaits[model]??0,gait,phase]};
 });
}
