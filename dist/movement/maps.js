import {districts,slots,trailY,localStage} from './walkthrough.js';
const clay=[.75,.55,.38], grass=[.48,.62,.32], wood=[.65,.43,.24], straw=[.90,.69,.30];
const red=[.73,.25,.17], teal=[.24,.56,.49], cream=[.93,.82,.61], slate=[.32,.34,.29];
const faceIndices=[[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]];
function face(out,vertices,ids,color,shade=1){
 for(let i=1;i<ids.length-1;i++)for(const j of [ids[0],ids[i],ids[i+1]])out.push(...vertices[j],...color.map(c=>c*shade));
}
function box(out,x,y,z,w,d,h,color){
 const p=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[x+a*w/2,y+b*d/2,z-h/2]);
 const v=[...p,...p.map(([a,b,c])=>[a,b,c+h])];
 faceIndices.forEach((f,i)=>face(out,v,f,color,[.7,.9,.82,.77,.88,1][i]));
}
function roof(out,x,y,z,w,d,h){
 const v=[[-w,-d,0],[w,-d,0],[0,-d,h],[-w,d,0],[w,d,0],[0,d,h]].map(([a,b,c])=>[x+a,y+b,z+c]);
 [[0,1,2],[3,5,4],[0,2,5,3],[1,4,5,2]].forEach((f,i)=>face(out,v,f,slate,i===3?.8:1));
}
function fence(out,x,y,d,alongX){
 for(const z of [.25,.53])box(out,x,y,z,alongX?d:.10,alongX?.10:d,.10,wood);
 for(const s of [-1,1])box(out,x+(alongX?s*d/2:0),y+(alongX?0:s*d/2),.34,.15,.15,.68,wood);
}
function round(out,center,radii,color,coat=0,detailed=false,resolution=null){
 const [slices,rings]=resolution??(coat?[56,32]:detailed?[32,18]:[24,12]);
 const point=(i,j)=>{
  const a=i*Math.PI*2/slices,b=j*Math.PI/rings;
  const n=[Math.sin(b)*Math.cos(a),Math.sin(b)*Math.sin(a),Math.cos(b)];
  const normal=n.map((v,k)=>v/radii[k]);
  const lit=Math.max(0,(-.36*normal[0]-.43*normal[1]+.83*normal[2])/Math.hypot(...normal));
  const shade=.68+.30*lit;
  const ripples=1+coat*Math.sin(b)**1.25*(.54*Math.cos(a*12+b*6)*Math.cos(b*14)+.32*Math.sin(a*16-b*9));
  const tone=shade*(1-.32*(ripples-1));
  return [...n.map((v,k)=>center[k]+radii[k]*v*ripples),...color.map(c=>c*tone)];
 };
 for(let i=0;i<slices;i++)for(let j=0;j<rings;j++){
  const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);
  out.push(...a,...b,...c,...a,...c,...d);
 }
}
export function rabbitMesh(){
 const out=[],fur=[.88,.79,.64], white=[.97,.92,.81];
 round(out,[0,-.045,.235],[.155,.215,.171],fur);
 round(out,[0,.135,.34],[.13,.14,.14],fur);
 round(out,[0,-.244,.25],[.08,.08,.08],white);
 round(out,[0,.273,.314],[.04,.023,.026],[.38,.19,.17]);
 for(const side of [-1,1]){
  round(out,[side*.072,.112,.53],[.048,.045,.19],fur);
  round(out,[side*.072,.143,.547],[.025,.015,.138],[.82,.46,.42]);
  round(out,[side*.105,.208,.369],[.026,.025,.031],[.11,.08,.07]);
  round(out,[side*.106,-.094,.101],[.071,.119,.066],fur);
  round(out,[side*.083,.119,.083],[.045,.091,.056],fur);
 }
 return new Float32Array(out);
}
export const maps={
 yard:{title:'Coop raid yard',entry:null,extent:[-1.97,1.97,-3.01,2.05],center:[0,-.17,.32],overview:[2.6,-5.3,7.8]},
 pen:{title:'Greased Pig arena',entry:[0,-2.42],extent:[-2.64,2.64,-2.65,2.65],center:[0,0,.24],overview:[1.5,-6.2,9.0],
  solids:[[-1.93,-1.05,-.70,-.12],[.77,1.66,.60,1.18],[-.46,.46,1.33,1.93]],
  build(out){
   box(out,0,0,-.085,6,6,.16,clay);
   fence(out,0,2.83,5.66,true);
   for(const side of [-1,1]){fence(out,side*1.83,-2.83,2.0,true);fence(out,side*2.83,0,5.66,false);}
   for(const [x,y] of [[-1.49,-.41],[1.21,.89],[0,1.63]]){
    box(out,x,y,.22,.88,.58,.44,straw);
    for(const dx of [-.21,.21])box(out,x+dx,y,.449,.032,.59,.018,cream);
   }
   round(out,[.13,-.17,-.025],[.93,.61,.051],[.47,.32,.22]);
   round(out,[.18,-.10,.30],[.37,.26,.248],[.89,.56,.63]);
   round(out,[.45,-.10,.31],[.22,.20,.208],[.91,.59,.66]);
   round(out,[.62,-.10,.27],[.11,.14,.092],[.94,.65,.72]);
   for(const y of [-.24,.04])round(out,[.43,y,.47],[.07,.055,.078],[.89,.56,.63]);
  }},
 lane:{title:'Paper Route lane',entry:[0,-3.10],extent:[-2.47,2.47,-3.2,5.2],center:[0,1.0,.35],overview:[2.0,-8.7,12.9],
  solids:[],
  build(out){
   box(out,0,.95,-.055,2.8,8.9,.10,clay);
   const houses=[[-1, -1.8,red],[1,-.40,teal],[-1,1.38,straw],[1,3.04,red],[-1,4.40,teal]];
   for(const [side,y,color] of houses){
    const x=side*2.37,door=x-side*.59,mb=side*1.36;
    box(out,x,y,.63,1.12,1.10,1.25,color);
    roof(out,x,y,1.24,.65,.63,.33);
    box(out,door,y,.35,.092,.36,.69,slate);
    box(out,door-side*.23,y,.07,.53,.62,.14,wood);
    box(out,door-side*.33,y,.15,.24,.38,.022,cream);
    box(out,mb,y+.47,.24,.11,.11,.48,wood);
    box(out,mb,y+.47,.52,.27,.35,.22,color);
    box(out,mb-side*.153,y+.54,.61,.041,.052,.19,red);
   }
  }}
};
for(const [s,y] of [[-1,-1.8],[1,-.40],[-1,1.38],[1,3.04],[-1,4.40]]){
 const [a,b]=[s*1.79,s*2.95].sort((x,z)=>x-z);
 maps.lane.solids.push([a,b,y-.55,y+.55],[s*1.36-.13,s*1.36+.13,y+.33,y+.61]);
}
const blueWater=[.24,.55,.62], foam=[.62,.81,.79], mud=[.56,.39,.27], rock=[.52,.51,.43];
function bridgeDeck(out,x,y,width,length){
 for(let i=0;i<Math.ceil(length/.24);i++){
  const count=Math.ceil(length/.24), step=length/count;
  box(out,x,y-length/2+(i+.5)*step,-.012,width,step-.014,.06,wood);
 }
}
function bale(out,x,y,w,d){
 box(out,x,y,.25,w,d,.50,straw);
 for(const side of [-1,1])box(out,x+side*w*.22,y,.51,.027,d,.018,cream);
}
function burrow(out,x,y){
 round(out,[x,y,.02],[.41,.33,.20],mud);
 round(out,[x,y-.245,.102],[.202,.106,.111],[.25,.19,.15]);
}
function cattails(out,x,y){
 for(const dx of [-.07,0,.07]){
  box(out,x+dx,y,.17,.027,.027,.36,[.32,.48,.20]);
  round(out,[x+dx,y,.35],[.032,.028,.074],mud);
 }
}
function car(out,x,y,color){
 box(out,x,y,.27,.64,1.04,.28,color);
 box(out,x,y+.23,.42,.55,.41,.12,color);
 box(out,x,y-.23,.40,.43,.26,.13,wood);
 for(const sx of [-1,1])for(const sy of [-1,1])
  round(out,[x+sx*.32,y+sy*.30,.15],[.085,.147,.13],slate);
 for(const sy of [-1,1])box(out,x,y+sy*.50,.21,.74,.085,.14,slate);
}
Object.assign(maps,{
 chase:{
  title:'Rabbit Hunt paddock',hint:'Follow the zigzag between hay stacks and compare the two burrow approaches.',
  entry:[0,-3.04],extent:[-3.03,3.03,-3.18,3.18],center:[0,0,.22],overview:[2,-7.6,11.4],
  solids:[[-2.85,-.52,-1.86,-1.22],[.55,2.83,-.24,.41],[-2.82,-.62,1.04,1.68]],
  build(out){
   box(out,0,0,-.078,6.5,6.8,.14,[.55,.65,.36]);
   fence(out,0,3.3,6.5,true);
   for(const x of [-3.25,3.25])fence(out,x,0,6.6,false);
   for(const [a,b,c,d] of this.solids)bale(out,(a+b)/2,(c+d)/2,b-a,d-c);
   burrow(out,-2.3,-2.42);burrow(out,2.09,2.17);
   fence(out,-.95,2.32,1.55,true);
   box(out,0,-2.65,-.008,.66,.53,.02,mud);
  }},
 pond:{
  title:'Redneck Fishing pond',hint:'Try the dock and both banks. The water marks the edge of the walking route.',
  entry:[0,-2.84],extent:[-3.30,3.30,-3.05,3.45],center:[0,.27,.16],overview:[2.3,-8.4,12.7],
  solids:[[-2.20,-.64,-1.40,.02],[.64,2.25,-1.40,.02],[-2.20,2.25,.02,2.23]],
  build(out){
   box(out,.025,.415,-.030,4.45,3.63,.075,blueWater);
   bridgeDeck(out,0,-.68,1.28,1.48);
   for(const x of [-.59,.59])box(out,x,-.10,.17,.115,.115,.38,wood);
   for(const [x,y] of [[-2.26,-1.24],[2.29,-.80],[-2.25,1.42],[2.27,2.15],[-1.49,2.28]])cattails(out,x,y);
   for(const [x,y] of [[-.95,.79],[.74,1.48],[1.71,-.42],[-1.77,.77]])
    round(out,[x,y,.014],[.21,.12,.012],[.29,.49,.27]);
   bridgeDeck(out,1.4,.75,.65,1.23);
   box(out,1.4,.94,.062,.68,.13,.13,cream);
   box(out,1.4,.53,.062,.68,.13,.13,cream);
   round(out,[.32,.63,.035],[.06,.06,.07],red);
  }},
 derby:{
  title:'Demolition Derby ring',hint:'Walk the outside lane, then find gaps between parked cars and tire islands.',
  entry:[0,-2.72],extent:[-3.30,3.30,-2.89,2.89],center:[0,0,.20],overview:[1.64,-7.6,11.0],
  solids:[[-2.25,-1.52,-1.41,-.33],[1.46,2.19,-.62,.46],[-.38,.38,.72,1.48],[-.36,.36,-.53,.24]],
  build(out){
   box(out,0,0,-.056,7.2,6.25,.11,mud);
   fence(out,0,3.01,6.99,true);
   for(const side of [-1,1])fence(out,side*2.17,-3.01,2.65,true);
   for(const x of [-3.48,3.48])fence(out,x,0,6.01,false);
   for(const x of [-2.7,-1.35,0,1.35,2.7]){
    box(out,x,3.46,.19,1.1,.58,.34,wood);
    box(out,x,3.64,.47,1.1,.44,.17,teal);
   }
   car(out,-1.88,-.87,teal);car(out,1.83,-.08,red);
   for(const y of [1.10,-.14])for(const h of [.09,.25]){
    round(out,[0,y,h],[.36,.36,.09],slate);
    round(out,[0,y,h+.067],[.19,.19,.031],rock);
   }
   for(const [x,y] of [[-.7,1.9],[.81,1.64],[1.18,-1.45],[-2.4,1.23]])round(out,[x,y,.003],[.37,.17,.008],clay);
  }},
 ferry:{
  title:'Watermelon Ferry channel',hint:'Cross on the lashed-log ferry deck and check the view around the two landings.',
  entry:[-.12,-3.05],extent:[-3.16,3.16,-3.23,3.40],center:[0,.05,.20],overview:[1.8,-8.3,12.3],
  solids:[[-3.3,-.91,-1.78,1.78],[.91,3.3,-1.78,1.78],[-.84,-.52,.24,.89],[.48,.81,.21,.86]],
  build(out){
   box(out,0,0,-.032,7.1,3.56,.07,blueWater);
   bridgeDeck(out,0,-1.48,1.82,1.06);
   bridgeDeck(out,0,1.52,1.82,1.06);
   bridgeDeck(out,0,0,1.82,2.05);
   for(const x of [-.70,.70]){
    box(out,x,0,.032,.075,1.96,.05,cream);
    round(out,[x,.56,.16],[.19,.20,.16],[.32,.54,.22]);
    round(out,[x,.56,.208],[.10,.19,.12],[.52,.65,.26]);
   }
   for(const [x,y] of [[-2.5,-1.8],[2.5,-1.8],[-2.93,1.85],[2.62,1.82]])cattails(out,x,y);
   for(const [x,y] of [[-1.17,-.48],[-1.25,-.92],[1.18,.13],[1.29,.43],[-2.61,.45]])
    round(out,[x,y,.014],[.19,.042,.01],foam);
   for(const y of [-1.98,1.98])for(const x of [-.82,.82])box(out,x,y,.24,.14,.14,.50,wood);
  }}
});
function courseDeck(out,x,y,w,d,low,high,color){
 const v=[[x-w/2,y-d/2,low],[x+w/2,y-d/2,low],[x+w/2,y+d/2,high],[x-w/2,y+d/2,high]];
 face(out,v,[0,1,2,3],color);
}
const slalomHeight=(_,y)=>Math.max(0,Math.min(.78,(4-y)*.10));
const storeHeight=(x,y)=>Math.abs(x+.85)<.54?Math.max(0,Math.min(.37,(y+.48)*.37)):(y>.52&&y<2.1?.37:0);
function towerHeight(x,y){
 if(Math.abs(x)>.59)return 0;
 return Math.max(0,Math.min(1.08,(y+1.20)*.60));
}
function ladder(out,x,y,width,height){
 for(const side of [-1,1])box(out,x+side*width/2,y,height/2,.055,.055,height,wood);
 for(let z=.12;z<height;z+=.16)box(out,x,y,z,width,.07,.048,cream);
}
Object.assign(maps,{
 slalom:{
  title:'Shopping Cart Slalom hill',hint:'Follow the colored gates downhill. Look for the lane between the hay bales.',
  entry:[0,-3.45],extent:[-2.66,2.66,-3.65,4.35],center:[0,.35,.4],overview:[1.8,-8.5,12.2],
  solids:[[-2.24,-1.40,-.89,-.29],[1.22,2.08,.79,1.39],[-.79,.02,2.38,2.98]],height:slalomHeight,
  build(out){
   courseDeck(out,0,.10,5.55,7.8,.78,0,clay);
   courseDeck(out,0,4.22,5.55,.44,0,0,clay);
   for(const [x,y] of [[-1.82,-.59],[1.65,1.09],[-.39,2.68]]){
    const z=slalomHeight(x,y);
    box(out,x,y,z+.23,.84,.60,.46,straw);
    for(const side of [-1,1])box(out,x+side*.16,y,z+.47,.024,.60,.018,cream);
   }
   for(const [center,y,color] of [[0,-2.55,teal],[.93,-1.01,red],[-.91,.29,teal],[.93,1.89,red],[.78,3.37,teal]]){
    const z=slalomHeight(center,y);
    for(const side of [-1,1]){
     box(out,center+side*.65,y,z+.27,.094,.094,.54,wood);
     box(out,center+side*.56,y,z+.48,.24,.039,.14,color);
    }
   }
   for(let i=0;i<12;i++)box(out,-2.55+i*.46,4.04,.013,.46,.21,.024,i%2?slate:cream);
  }},
 bog:{
  title:'Mud Bog tow course',hint:'Compare the quick muddy route with the longer dry bypass. Mud slows movement.',
  entry:[0,-3.03],extent:[-3.22,3.22,-3.22,3.55],center:[0,.22,.13],overview:[2,-8.5,12.4],
  solids:[[-1.84,-1.22,-.81,-.25],[.66,1.58,.27,.96],[-2.6,-1.86,1.34,2.12]],
  surface:(x,y)=>Math.abs(x)<1.79&&y>-1.87&&y<2.20?.49:1,
  build(out){
   box(out,0,.14,-.070,6.7,6.9,.14,clay);
   box(out,0,.17,.003,3.58,4.07,.022,mud);
   for(const x of [-.68,.68])for(const y of [-1.4,-.47,.46,1.39])
    box(out,x,y,.017,.288,.86,.009,[.40,.28,.20]);
   for(const [a,b,c,d] of this.solids){
    const x=(a+b)/2,y=(c+d)/2;
    box(out,x,y,.16,b-a,d-c,.32,rock);
    round(out,[x-.12,y,.23],[.22,.17,.12],slate);
   }
   for(const y of [-2.3,-1.3,-.3,.7,1.7,2.7])box(out,2.30,y,.065,.19,.11,.13,teal);
   car(out,-2.52,2.72,red);
   box(out,-2.50,2.23,.15,.37,.16,.15,slate);
  }},
 feed:{
  title:'Feed Store loading yard',hint:'Take the left ramp to the dock, then weave around the stock crates.',
  entry:[-.85,-2.85],extent:[-2.90,2.90,-3.05,2.75],center:[0,.02,.28],overview:[1.75,-7.7,11.2],
  solids:[[-2.78,2.78,2.15,3],[-2.89,-1.43,.48,2.13],[1.47,2.89,.48,2.13],[-.31,1.46,.44,.51],[-2.01,-1.15,-1.55,-.91],[.64,1.30,-1.36,-.78],[.40,.95,1.03,1.57]],
  height:storeHeight,
  build(out){
   box(out,0,0,-.066,6,6,.13,clay);
   box(out,0,2.61,.77,5.62,.95,1.54,teal);
   box(out,0,2.07,1.22,5.65,.31,.15,red);
   box(out,0,1.32,.182,2.93,1.62,.364,wood);
   courseDeck(out,-.85,.02,1.08,1,0,.37,wood);
   for(const y of [-.39,-.23,-.07,.09,.25,.41])
    box(out,-.85,y,storeHeight(-.85,y)+.009,1.03,.043,.018,cream);
   for(const [a,b,c,d] of this.solids.slice(-3)){
    const x=(a+b)/2,y=(c+d)/2,z=y>0?.37:0;
    box(out,x,y,z+.21,b-a,d-c,.42,wood);
    box(out,x,y-(d-c)/2-.015,z+.24,.28,.029,.16,cream);
   }
   for(const x of [-1.07,-.60,-.13])round(out,[x,1.94,.61],[.16,.14,.24],straw);
   box(out,.83,1.94,.46,.41,.24,.16,teal);
   for(const x of [.72,.84,.96])round(out,[x,1.94,.55],[.05,.05,.07],cream);
  }},
 tower:{
  title:'Water Tower Dash climb',hint:'Try the central stairs and elevated landing. The side ladder shows an alternate route idea.',
  entry:[0,-2.64],extent:[-2.67,2.67,-2.78,2.52],center:[0,0,.58],overview:[1.3,-7.8,11.4],
  solids:[[-.87,-.63,-1.21,2.53],[.63,.87,-1.21,2.53],[-.58,.58,2.36,2.62],[-.63,.63,2.02,2.26]],
  height:towerHeight,
  build(out){
   box(out,0,0,-.07,5.65,5.65,.14,clay);
   for(let i=0;i<9;i++){
    const z=(i+1)*.12;
    box(out,0,-1.10+i*.2,z/2,1.19,.199,z,wood);
   }
   box(out,0,1.46,.53,1.22,1.52,1.06,wood);
   for(const x of [-.72,.72]){
    for(const y of [-1.11,-.05,1.02,2.09])box(out,x,y,towerHeight(0,y)+.28,.11,.11,.56,wood);
    for(const y of [-.57,.48,1.55])box(out,x,y,towerHeight(0,y)+.42,.09,1.0,.09,teal);
   }
   for(const x of [-.63,.63])for(const y of [1.56,2.29])
    box(out,x,y,1.06,.18,.18,2.12,wood);
   round(out,[0,1.92,2.18],[.75,.61,.47],teal);
   round(out,[0,1.92,2.58],[.77,.64,.16],red);
   ladder(out,1.07,1.93,.32,1.59);
   box(out,0,1.97,1.35,.07,.07,.52,cream);
   face(out,[[0,1.97,1.61],[.30,1.97,1.51],[0,1.97,1.40]],[0,1,2],red);
  }}
});
function checkpoint(out,x,y,color){
 box(out,x,y,.34,.058,.058,.68,cream);
 face(out,[[x,y,.67],[x+.27,y,.58],[x,y,.49]],[0,1,2],color);
}
function sheep(out,x,y){
 round(out,[x,y,.26],[.24,.30,.23],cream);
 for(const dx of [-.10,.10])for(const dy of [-.13,.13])
  round(out,[x+dx,y+dy,.09],[.051,.058,.09],slate);
 round(out,[x,y-.23,.25],[.105,.13,.12],slate);
 for(const dx of [-.10,.10])round(out,[x+dx,y-.24,.30],[.06,.041,.047],slate);
}
function shed(out,x,y,color){
 box(out,x,y,.46,1.46,1.01,.92,color);
 roof(out,x,y,.91,.83,.59,.35);
 box(out,x,y-.511,.32,.66,.025,.64,slate);
 for(const dx of [-.35,.35])box(out,x+dx,y-.541,.34,.055,.035,.68,cream);
}
function fairBooth(out,x,y,color){
 box(out,x,y+.19,.47,1.45,.85,.93,wood);
 box(out,x,y-.25,.53,1.48,.25,.12,color);
 for(const dx of [-.66,.66])
  box(out,x+dx,y-.36,.65,.10,.10,1.30,wood);
 box(out,x,y-.04,1.28,1.63,1.12,.10,color);
 for(let i=0;i<7;i++)box(out,x-.69+i*.23,y-.62,1.24,.21,.08,.16,i%2?cream:color);
}
Object.assign(maps,{
 sheep:{
  title:'Sheep Herdin’ pasture',hint:'Follow the central lane and try both pen entrances. The sheep mark places where flocks could bunch up.',
  entry:[0,-3.07],extent:[-3.22,3.22,-3.24,3.28],center:[0,0,.24],overview:[1.6,-8.5,12.4],
  solids:[[-3.25,-1.37,.83,.97],[1.37,3.25,.83,.97],[-.72,.72,-1.08,-.53],[-2.43,-.97,2.22,3.23],[.97,2.43,2.22,3.23]],
  build(out){
   box(out,0,0,-.079,6.75,6.85,.15,[.53,.66,.34]);
   box(out,0,-.86,.001,1.23,5.12,.012,clay);
   fence(out,-2.31,.90,1.88,true);fence(out,2.31,.90,1.88,true);
   for(const x of [-3.31,3.31])fence(out,x,0,6.60,false);
   shed(out,-1.70,2.72,red);shed(out,1.70,2.72,teal);
   bale(out,0,-.805,1.44,.55);
   for(const [x,y] of [[-1.62,.12],[-1.21,-.21],[-1.94,-.32],[1.83,1.48],[2.29,1.78],[1.54,1.87]])sheep(out,x,y);
   checkpoint(out,-1.26,1.35,red);checkpoint(out,1.26,1.35,teal);
  }},
 golf:{
  title:'Hillbilly Golf loop',hint:'Walk the three holes: around a hay bale, across a creek, and past the trough.',
  entry:[0,-3.27],extent:[-3.14,3.14,-3.43,3.68],center:[0,.17,.13],overview:[1.6,-8.7,12.7],
  solids:[[-3.22,-.59,-.28,.49],[.59,3.22,-.28,.49],[-1.45,-.48,-2.45,-1.86],[.69,1.70,1.30,1.94]],
  build(out){
   box(out,0,.12,-.078,6.45,7.26,.15,[.49,.63,.30]);
   box(out,0,.105,-.023,6.44,.77,.058,blueWater);
   bridgeDeck(out,0,.105,1.18,1.12);
   for(const [x,y] of [[-1.82,-2.13],[0,1.04],[1.81,2.82]]){
    round(out,[x,y,.010],[.80,.62,.025],[.38,.58,.29]);
    round(out,[x+.28,y+.29,.031],[.094,.067,.011],slate);
    checkpoint(out,x+.28,y+.29,red);
   }
   bale(out,-.965,-2.155,.97,.59);
   box(out,1.195,1.62,.16,1.01,.64,.32,wood);
   box(out,1.195,1.62,.328,.86,.50,.019,blueWater);
   for(const x of [-2.5,-1.52,1.53,2.58])cattails(out,x,.58);
   for(const [x,y] of [[-.10,-2.80],[.27,-.83],[1.59,2.53]])
    round(out,[x,y,.061],[.058,.058,.058],cream);
  }},
 junk:{
  title:'Junkyard Jamboree workshop',hint:'Try the center repair lane, the tight tool aisle, and the outside path around the tire stacks.',
  entry:[0,-3.12],extent:[-3.22,3.22,-3.30,3.12],center:[0,0,.22],overview:[1.7,-8.1,11.6],
  solids:[[-3.28,-1.40,.80,1.69],[1.36,3.29,.80,1.69],[-.57,.56,.14,1.35],[-2.70,-1.78,-.95,-.13],[1.67,2.63,-1.77,-.84],[-3.25,3.25,2.77,3.20]],
  build(out){
   box(out,0,0,-.068,6.65,6.63,.13,clay);
   fence(out,0,3.00,6.56,true);
   for(const side of [-1,1]){
    const x=side*2.34;
    box(out,x,1.245,.34,1.91,.89,.10,wood);
    for(const d of [-.76,.76])box(out,x+d,1.245,.16,.12,.68,.32,slate);
    box(out,x,1.27,.50,.44,.45,.24,teal);
    box(out,x+side*.59,1.35,.455,.38,.42,.15,red);
   }
   car(out,0,.72,teal);
   for(const [x,y] of [[-2.24,-.54],[2.15,-1.305]])for(const z of [.10,.27,.44]){
    round(out,[x,y,z],[.46,.41,.10],slate);
    round(out,[x,y,z+.08],[.20,.17,.024],rock);
   }
   for(const x of [-.76,.76])box(out,x,-.77,.004,.071,3.0,.017,cream);
   box(out,0,2.69,.006,1.44,.38,.019,mud);
  }},
 midway:{
  title:'County Fair midway',hint:'Walk between the stalls to the star stage. Compare the open plaza with the side approaches.',
  entry:[0,-3.06],extent:[-3.35,3.35,-3.23,3.06],center:[0,.05,.24],overview:[1.65,-8.4,12.2],
  solids:[[-3.31,-1.78,-1.48,-.40],[1.78,3.31,-1.48,-.40],[-3.31,-1.78,.74,1.82],[1.78,3.31,.74,1.82],[-1.35,1.35,2.0,2.89]],
  build(out){
   box(out,0,0,-.073,6.94,6.65,.14,[.74,.55,.39]);
   for(const [x,y,color] of [[-2.54,-.92,red],[2.54,-.92,teal],[-2.54,1.28,teal],[2.54,1.28,straw]])
    fairBooth(out,x,y,color);
   box(out,0,2.445,.11,2.70,.89,.22,wood);
   box(out,0,2.78,.78,2.70,.20,1.33,slate);
   for(const x of [-.85,0,.85]){
    const star=Array.from({length:10},(_,i)=>{
     const angle=i*Math.PI/5+Math.PI/2,r=i%2?.10:.24;
     return [x+Math.cos(angle)*r,2.669,.94+Math.sin(angle)*r];
    });
    face(out,star,star.map((_,i)=>i),straw);
   }
   for(const y of [-2.8,.19]){
    for(const side of [-1,1])box(out,side*1.54,y,.74,.083,.083,1.48,wood);
    for(let i=0;i<8;i++){
     const x=-1.36+i*.38,z=1.26+.13*Math.abs(x);
     face(out,[[x-.15,y,z],[x+.15,y,z],[x,y,z-.23]],[0,1,2],[red,teal,straw][i%3]);
    }
   }
  }}
});
const teamColors=[teal,red,[.75,.52,.18],[.43,.42,.68]];
const teamNames=['Teal','Red','Gold','Plum'];
export const matchup=[
 [teamNames[0],teamNames[1]],
 [teamNames[2],teamNames[3]]
];
const crewPoints=teamColors.flatMap((color,team)=>{
 const x=team%2?1.94:-1.94,y=team<2?-1.25:1.18;
 return [-1,1].flatMap(a=>[-1,1].map(b=>[x+a*.38,y+b*.32,color]));
});
function placeholder(out,x,y,color){
 const skin=[.80,.61,.44];
 for(const dx of [-.095,.095]){
  box(out,x+dx,y-.029,.054,.14,.22,.105,wood);
  box(out,x+dx,y,.177,.108,.116,.162,slate);
 }
 round(out,[x,y,.39],[.19,.135,.192],color);
 round(out,[x,y-.013,.644],[.118,.115,.122],skin);
 round(out,[x,y-.016,.737],[.18,.158,.032],straw);
 round(out,[x,y,.765],[.118,.101,.074],straw);
 box(out,x,y-.139,.402,.126,.037,.10,cream);
}
function pennant(out,x,y,z,color){
 box(out,x,y,z/2,.063,.063,z,wood);
 face(out,[[x,y,z],[x+.38,y,z-.095],[x,y,z-.23]],[0,1,2],color);
}
function fourCounters(out,x,y,color){
 box(out,x,y,.38,1.24,.56,.13,wood);
 for(const dx of [-.50,.50])box(out,x+dx,y,.17,.12,.42,.34,wood);
 box(out,x,y-.30,.38,1.16,.048,.18,color);
 for(const dx of [-.31,0,.31]){
  round(out,[x+dx,y,.47],[.13,.123,.046],cream);
  round(out,[x+dx,y,.50],[.115,.107,.048],straw);
 }
}
Object.assign(maps,{
 teams:{
  title:'Four-Team Matchup Plaza',hint:'Mock matchup · Teal vs. Red and Gold vs. Plum. Walk the center aisle to the board.',
  entry:[0,-3.05],extent:[-3.35,3.35,-3.18,3.13],center:[0,0,.34],overview:[1.3,-7.2,11.6],
  solids:[[-1.02,1.02,2.39,2.83],...crewPoints.map(([x,y])=>[x-.17,x+.17,y-.15,y+.13])],
  build(out){
   box(out,0,0,-.070,6.86,6.62,.14,clay);
   box(out,0,-.34,.002,1.62,5.08,.014,cream);
   for(let i=0;i<4;i++){
    const x=i%2?1.94:-1.94,y=i<2?-1.25:1.18,color=teamColors[i];
    box(out,x,y,.003,1.79,1.63,.018,color.map(c=>c*.83));
    pennant(out,x-1.04,y+.69,.98,color);
    for(const dx of [-.74,.74])box(out,x+dx,y+.78,.082,.17,.073,.17,color);
   }
   for(const [x,y,color] of crewPoints)placeholder(out,x,y,color);
   for(const x of [-.92,.92])box(out,x,2.61,.55,.12,.14,1.10,wood);
   box(out,0,2.61,.97,2.03,.14,.82,slate);
   for(let i=0;i<4;i++){
    const x=i%2?.45:-.45,z=i<2?1.15:.83;
    box(out,x,2.53,z,.67,.04,.20,teamColors[i]);
   }
   for(const z of [1.15,.83])box(out,0,2.523,z,.12,.022,.049,cream);
  }},
 tug:{
  title:'Tug of War twin lanes',hint:'Two crews can line up at each rope. Use the center path to move between the lanes.',
  entry:[0,-2.95],extent:[-3.14,3.14,-3.12,3.08],center:[0,0,.19],overview:[1.45,-7.4,11.1],
  solids:[[-2.65,-.89,-.81,.81],[.89,2.65,-.81,.81]],
  build(out){
   box(out,0,0,-.073,6.52,6.42,.14,grass);
   box(out,0,0,.002,1.42,6.17,.013,clay);
   for(const [i,x] of [-1.77,1.77].entries()){
    box(out,x,0,.004,1.76,1.62,.019,mud);
    round(out,[x-.26,.14,.018],[.42,.32,.012],[.47,.32,.23]);
    box(out,x,0,.43,.043,3.18,.041,cream);
    box(out,x,0,.35,.29,.07,.18,red);
    for(const side of [-1,1]){
     const y=side*1.79,color=teamColors[i*2+(side>0?1:0)];
     box(out,x,y,.004,1.24,.19,.015,color);
     pennant(out,x-.68,y,.84,color);
    }
   }
  }},
 pie:{
  title:'Pie Cookin’ courtyard',hint:'Walk the four bake stations and check the open space between the tables.',
  entry:[0,-3.03],extent:[-3.14,3.14,-3.19,3.17],center:[0,0,.22],overview:[1.5,-7.5,11.3],
  solids:[[-2.19,-.95,-1.65,-1.02],[.95,2.19,-1.65,-1.02],[-2.19,-.95,1.07,1.70],[.95,2.19,1.07,1.70]],
  build(out){
   box(out,0,0,-.071,6.55,6.56,.14,clay);
   fence(out,0,2.92,5.56,true);
   for(let i=0;i<4;i++){
    const x=i%2?1.57:-1.57,y=i<2?-1.34:1.38,color=teamColors[i];
    fourCounters(out,x,y,color);
    pennant(out,x+.80,y+.19,.85,color);
   }
   round(out,[0,0,.006],[.81,.75,.012],mud);
   for(const [x,y] of [[-.29,.10],[.12,-.21],[.26,.31]])round(out,[x,y,.022],[.16,.081,.025],cream);
  }}
});
function routeMarker(out,x,y,color){
 const h=.87;
 for(const dx of [-.46,.46])box(out,x+dx,y,h/2,.084,.084,h,wood);
 box(out,x,y,h,.98,.105,.16,color);
}
function routeTree(out,x,y){
 box(out,x,y,.40,.15,.15,.80,wood);
 round(out,[x,y,1.05],[.43,.36,.52],[.38,.58,.26]);
 round(out,[x-.22,y+.03,.91],[.33,.31,.36],[.42,.60,.29]);
}
function terrainAt(x,y,trait,fallback){
 const slot=localStage(maps,x,y);
 if(!slot)return fallback;
 const xx=x-slot.x,yy=y-slot.y;
 if(slot.key==='yard'&&trait==='height'&&xx>.02&&xx<.58&&yy>-.58)
  return Math.min(.58,(yy+.58)*.54);
 return maps[slot.key][trait]?.(xx,yy)??fallback;
}
maps.walk={
 title:'Farm & Fairground walkthrough',entry:[districts[0].x,trailY],
 extent:[-20.6,20.6,-18.2,33.7],
 center:[0,0,.2],overview:[0,-16,30],
 hint:'Trace the main path north or cross the south trail between the farm and fairground.',
 height:(x,y)=>terrainAt(x,y,'height',0),
 surface:(x,y)=>terrainAt(x,y,'surface',1),
 solids:[],
 build(out){
  box(out,0,7.7,-.22,44,53,.22,grass);
  box(out,0,trailY,-.042,24,2.2,.072,clay);
  for(const d of districts){
   const color=d.name==='Farm'?teal:red;
   const endY=d.name==='Fairground'?32:22.5;
   box(out,d.x,(trailY+endY)/2,-.042,2.25,endY-trailY,.072,clay);
   routeMarker(out,d.x,trailY+1.65,color);
   for(const slot of slots.filter(s=>s.district===d.name)){
    const approachY=slot.y-4.18;
    const span=Math.abs(d.x-slot.x);
    box(out,(d.x+slot.x)/2,approachY,-.041,span,1.10,.070,clay);
    box(out,slot.x,approachY+.65,-.040,1.06,1.45,.071,clay);
    routeMarker(out,slot.x,approachY+.35,color);
   }
   for(const y of [-14.6,-4.4,5.6,15.8,22]){
    routeTree(out,d.x-1.76,y);routeTree(out,d.x+1.76,y+.6);
   }
  }
 }
};
export function stageMesh(key){
 const out=[];
 maps[key].build(out);
 return new Float32Array(out);
}
export function mapMesh(key){
 const out=[];
 box(out,0,1,-.18,22,22,.22,grass);
 maps[key].build(out);
 return new Float32Array(out);
}

// Small meshes shared by all of the spectator scenes.
export function spectatorMeshes(){
 const meshes={};
 function make(name,build){
  const out=[];build(out);meshes[name]=new Float32Array(out);
 }
 const white=[.97,.94,.83],pink=[.93,.57,.56];
 meshes.goose=practiceAnimalMeshes('goose').goose;
 make('pig',out=>{
  round(out,[0,-.05,.31],[.24,.36,.24],pink);
  round(out,[0,.24,.34],[.19,.19,.17],pink);
  round(out,[0,.405,.31],[.115,.066,.080],[.85,.38,.42]);
  for(const x of [-.13,.13]){
   round(out,[x,.23,.48],[.069,.063,.124],pink);
   round(out,[x,.379,.39],[.025,.024,.031],slate);
   for(const y of [-.24,.15])box(out,x,y,.105,.092,.105,.21,pink);
  }
 });
 make('ewe',out=>sheep(out,0,0));
 make('pie-prop',out=>{
  box(out,0,0,.004,.22,.22,.025,wood);
  box(out,0,0,.046,.20,.20,.060,straw);
 });
 make('bobber',out=>{
  round(out,[0,0,.024],[.075,.075,.06],red);
  box(out,0,0,.088,.022,.022,.07,white);
 });
 for(const [i,color] of teamColors.entries())make('crew-'+i,out=>placeholder(out,0,0,color));
 return meshes;
}

export function golfCourseMesh(course){
 const out=[],x=p=>(p-320)/80,y=p=>(180-p)/80;
 box(out,0,0,-.08,8,4.5,.16,grass);
 for(let i=0;i<8;i++){
  box(out,0,-1.95+i*.55,.002,7.46,.27,.01,[.53,.68,.35]);
 }
 for(const side of [-1,1]){
  box(out,side*3.76,0,.09,.12,4.0,.18,wood);
  box(out,0,side*1.97,.09,7.52,.12,.18,wood);
 }
 if(course.creek){
  const [l,r,b,t]=course.creek;
  box(out,x((l+r)/2),0,.016,(r-l)/80,3.96,.02,blueWater);
  const length=(t-b)/80;
  for(let i=0;i<5;i++)box(out,x((l+r)/2),y((b+t)/2)+(i-2)*length/5,.042,(r-l)/80+.06,length/5-.012,.049,wood);
 }
 for(const [px,py,r] of course.walls){
  const a=x(px),b=y(py),size=r/80;
  if(course.par===3)round(out,[a,b,size*.65],[size,size,size*.65],straw);
  else{
   round(out,[a,b,.13],[size,size,.15],wood);
   round(out,[a,b,.243],[size*.79,size*.79,.043],blueWater);
  }
 }
 if(course.door){
  const [a,b,c,d]=course.door,ax=x(a),ay=y(b),bx=x(c),by=y(d),w=.055;
  car(out,bx+.26,by-.32,red);
  const vx=bx-ax,vy=by-ay,len=Math.hypot(vx,vy),nx=-vy/len*w,ny=vx/len*w;
  const door=[[ax,ay,.04],[bx,by,.04],[bx,by,.55],[ax,ay,.55]];
  for(const side of [-1,1])face(out,door.map(([x,y,z])=>[x+nx*side,y+ny*side,z]),[0,1,2,3],teal,side>0?.76:1);
  box(out,(ax+bx)/2,(ay+by)/2,.54,.17,.13,.04,cream);
 }
 const [px,py]=course.cup;
 round(out,[x(px),y(py),.016],[.145,.145,.018],slate);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;box(out,x(px)+Math.cos(a)*.156,y(py)+Math.sin(a)*.156,.023,.077,.077,.038,[.68,.52,.33]);}
 checkpoint(out,x(px)+.12,y(py)+.10,red);
 return new Float32Array(out);
}

export function fieldGameMeshes(){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 round(out,[0,0,.072],[.072,.072,.072],[1,.98,.88]);save('ball');
 box(out,0,.08,.022,.036,.16,.035,cream);
 face(out,[[0,.29,.035],[-.097,.15,.035],[.097,.15,.035]],[0,1,2],cream);save('aim');
 box(out,0,0,-.07,7.4,6.8,.14,grass);
 for(const x of [-3.57,3.57])fence(out,x,0,6.55,false);
 for(const y of [-3.29,3.29])fence(out,0,y,7.12,true);
 for(const x of [-1.04,1.04])fence(out,x,2.16,1.88,false);
 for(const x of [-.80,.80])fence(out,x,1.22,.48,true);
 box(out,0,2.20,.018,1.95,1.90,.025,teal);
 shed(out,0,2.79,teal);
 checkpoint(out,-.56,1.24,cream);checkpoint(out,.56,1.24,cream);
 save('pasture');
 sheep(out,0,0);save('sheep');
 round(out,[0,0,.06],[.144,.125,.126],straw);
 round(out,[0,0,-.047],[.041,.042,.043],wood);
 save('bell');
 round(out,[0,0,.13],[.08,.08,.135],[.96,.49,.13]);
 for(const dx of [-.046,0,.046])box(out,dx,0,.269,.028,.055,.106,grass);
 save('carrot');
 face(out,[[0,0,0],[-.12,0,.19],[.12,0,.19]],[0,1,2],[1,.83,.25]);
 face(out,[[0,0,0],[-.12,0,.19],[0,.12,.19]],[0,1,2],straw);
 face(out,[[0,0,0],[.12,0,.19],[0,.12,.19]],[0,1,2],straw);
 save('marker');
 return parts;
}

export function ferryMeshes(rocks){
 const out=[],meshes={};
 const save=name=>{meshes[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.09,7.8,11,.16,grass);
 box(out,0,0,-.042,5.54,9.84,.12,blueWater);
 for(const x of [-2.86,2.86]){
  box(out,x,0,-.015,.30,10.25,.16,mud);
  for(const y of [-3.32,-1.3,1.42,3.6])cattails(out,x,y);
 }
 for(const y of [-4.84,4.84]){
  const dockColor=y>0?teal:wood;
  for(let i=0;i<6;i++)box(out,0,y+(i-2.5)*.20,.066,1.83,.19,.093,dockColor);
  for(const x of [-.93,.93])box(out,x,y-Math.sign(y)*.5,.22,.14,.15,.48,wood);
 }
 for(const {x,y,r} of rocks){
  round(out,[x,y,.105],[r,r*.90,.245],slate);
  round(out,[x+r*.23,y-.06,.16],[r*.61,r*.68,.152],[.44,.46,.37]);
  round(out,[x-.18,y-.31,.024],[.23,.051,.012],foam);
 }
 save('channel');
 for(const x of [-.4,0,.4])round(out,[x,0,.11],[.135,.64,.16],wood);
 for(let i=0;i<7;i++)box(out,0,(i-3)*.145,.23,1.15,.139,.09,i%2?wood:[.73,.52,.31]);
 for(const x of [-.47,.47])box(out,x,0,.29,.055,1.09,.07,cream);
 save('raft');
 round(out,[0,0,.14],[.17,.21,.141],[.18,.46,.23]);
 for(const x of [-.09,.075])round(out,[x,0,.175],[.036,.173,.102],[.46,.65,.24]);
 save('melon');
 round(out,[0,0,.006],[.24,.044,.014],foam);
 save('wake');
 return meshes;
}

export function gardenMeshes(heads,lanes,forks){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.08,6.9,6.3,.16,grass);
 for(const y of [-1.33,-.49,.36,1.21,2.06]){
  box(out,0,y,.016,6.18,.18,.043,clay);
  for(const x of [-2.83,-2.24,-1.65,-1.06,-.47,.12,.71,1.30,1.89,2.48])
   box(out,x,y,.05,.17,.20,.088,[.35,.54,.22]);
 }
 for(const [x,y] of heads){
  box(out,x,y,.115,.11,.11,.23,teal);
  box(out,x,y,.253,.22,.11,.09,red);
 }
 function pipe(ax,ay,bx,by,z,width,color){
  const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),nx=-dy/len*width,ny=dx/len*width;
  face(out,[[ax+nx,ay+ny,z],[ax-nx,ay-ny,z],[bx-nx,by-ny,z],[bx+nx,by+ny,z]],[0,1,2,3],color);
 }
 for(const [i,[x,y]] of forks.entries()){
  pipe(x,y-.52,x,y,.064,.047,[.40,.35,.26]);
  box(out,x,y,.17,.13,.13,.30,wood);
  box(out,x,y,.33,.25,.19,.075,straw);
 }
 save('garden');
 for(const [fork,[ax,ay]] of forks.entries()){
  const hoseColor=[[.59,.34,.24],[.36,.29,.48],[.37,.43,.28]][fork];
  for(const [head,[x,y]] of heads.entries())for(const branch of [0,1]){
   const side=branch?1:-1,z=.108+fork*.017;
   const cx=ax+side*.23,cy=ay+.24,bx=x+side*.15,by=y-.21;
   pipe(ax,ay,cx,cy,z,.052,hoseColor);
   pipe(cx,cy,bx,by,z,.052,hoseColor);
   pipe(bx,by,x,y,z,.052,hoseColor);
   save(`hose-${fork}-${branch}-${head}`);
   pipe(ax,ay,cx,cy,z+.004,.026,[.35,.82,.94]);
   pipe(cx,cy,bx,by,z+.004,.026,[.35,.82,.94]);
   pipe(bx,by,x,y,z+.004,.026,[.35,.82,.94]);
   save(`flow-${fork}-${branch}-${head}`);
  }
 }
 round(out,[0,0,.02],[.22,.22,.025],straw);save('water-target');
 box(out,0,0,.022,.54,.41,.041,mud);save('crop-bed');

 box(out,0,0,.096,.32,.25,.188,wood);
 box(out,0,0,.192,.34,.27,.043,straw);
 for(const dx of [-.094,0,.094])round(out,[dx,0,.227],[.051,.063,.060],red);
 save('basket');
 round(out,[0,0,0],[.055,.043,.034],blueWater);save('droplet');
 box(out,0,0,-.082,6.06,11.7,.15,grass);
 for(const [i,x] of lanes.entries())box(out,x,0,.006,1.22,10.65,.018,i%2?clay:[.71,.51,.31]);
 for(const y of [-4.8,5.1])for(let i=0;i<20;i++)
  box(out,(i-9.5)*.246,y,.024,.246,.19,.027,i%2?slate:cream);
 for(const x of [-2.69,2.69])fence(out,x,0,11,false);
 save('sack-track');
 round(out,[0,0,.023],[.47,.32,.026],blueWater);
 round(out,[.09,-.08,.042],[.18,.09,.013],foam);save('sack-puddle');
 bale(out,0,0,.79,.30);
 for(let i=2;i<out.length;i+=6)out[i]*=.42;
 save('sack-hurdle');
 round(out,[0,0,.225],[.27,.23,.225],wood);
 round(out,[0,0,.394],[.27,.215,.057],straw);
 save('sack');
 return parts;
}

export function yardGameMeshes(holes){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.08,6.8,6.1,.16,grass);
 box(out,0,2.08,1.31,6.12,1.56,2.62,wood);
 roof(out,0,2.1,2.65,3.24,.91,.83);
 box(out,0,2.13,1.34,6.16,1.57,.12,slate);
 box(out,-2.55,-1.87,.18,.33,.31,.36,teal);
 round(out,[-2.55,-1.87,.36],[.17,.155,.039],red);
 save('paint-yard');
 box(out,0,0,0,.91,.09,.69,[.71,.56,.40]);save('bare-board');
 for(const [i,c] of [red,teal,straw].entries()){
  box(out,0,0,0,.91,.09,.69,c);save('painted-board-'+i);
  box(out,0,0,0,.14,.027,.12,c);save('stencil-chip-'+i);
 }
 box(out,0,0,0,.95,.023,.037,cream);save('board-marker');
 box(out,0,0,-.08,6.8,6.1,.16,grass);
 for(const [x,y] of holes){
  round(out,[x,y,.018],[.44,.37,.065],mud);
  round(out,[x,y,.069],[.28,.245,.037],slate);
 }
 for(const y of [-2.93,2.93])fence(out,0,y,6.48,true);
 save('gopher-yard');
 const brown=[.58,.37,.24],light=[.84,.63,.39];
 round(out,[0,0,.19],[.20,.17,.24],brown);
 round(out,[0,-.034,.38],[.19,.17,.16],brown);
 round(out,[0,-.15,.344],[.125,.078,.078],light);
 for(const x of [-.116,.116]){
  round(out,[x,.02,.49],[.049,.054,.077],brown);
  round(out,[x*.69,-.169,.414],[.026,.024,.028],slate);
 }
 box(out,0,-.193,.315,.07,.027,.071,cream);
 save('gopher');
 return parts;
}

export function deliveryMeshes(bays){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.08,7,6,.16,grass);
 box(out,0,0,.008,6.44,5.34,.026,clay);
 box(out,0,2.74,.74,6.45,.66,1.48,wood);
 roof(out,0,2.77,1.49,3.4,.48,.65);
 for(const [i,[x,y]] of bays.entries()){
  box(out,x,y,.04,1.59,1.41,.055,i?teal:red);
  checkpoint(out,x-.57,y+.47,i?teal:red);
 }
 save('feed-yard');
 for(const [i,c] of [red,teal].entries()){
  round(out,[0,0,.21],[.24,.20,.22],[.83,.69,.49]);
  box(out,0,-.19,.22,.26,.034,.14,c);
  box(out,0,0,.427,.12,.10,.09,c);
  save('feed-'+i);
 }
 box(out,0,1.5,-.08,6.6,18,.16,grass);
 box(out,0,1.5,.004,1.28,17.8,.02,clay);
 for(const x of [-2.85,-2.32,2.32,2.85])box(out,x,1.5,.024,.18,17.7,.038,straw);
 save('hayfield');
 box(out,0,0,.28,.96,1.30,.25,wood);
 box(out,0,.62,.29,.12,.46,.10,slate);
 for(const x of [-.53,.53]){
  round(out,[x,-.32,.23],[.12,.23,.23],slate);
  box(out,x,0,.44,.075,1.28,.17,teal);
 }
 save('wagon');
 box(out,0,.10,.34,.60,.89,.43,teal);
 box(out,0,.37,.57,.47,.35,.30,teal);
 for(const x of [-.37,.37]){
  round(out,[x,-.21,.30],[.14,.32,.32],slate);
  round(out,[x,.42,.15],[.10,.18,.18],slate);
 }
 box(out,.14,.46,.76,.06,.06,.32,slate);
 save('tractor');
 bale(out,0,0,.66,.42);save('hay-bale');
 return parts;
}

export function tractorGameMeshes(mudBounds){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,1,-.08,7,16,.16,grass);
 box(out,0,1,.006,2.96,15.1,.027,clay);
 for(const x of [-1.04,1.04])box(out,x,1,.03,.12,14.6,.03,[.46,.31,.21]);
 for(const y of [-5.6,7.6])for(let i=0;i<12;i++)
  box(out,(i-5.5)*.24,y,.036,.24,.17,.032,i%2?cream:slate);
 save('pull-track');
 box(out,0,0,.18,1.10,1.32,.24,slate);
 box(out,0,-.2,.38,.78,.58,.30,red);
 box(out,0,.59,.20,.12,.56,.09,wood);
 for(const x of [-.42,.42])box(out,x,-.32,.38,.16,.81,.23,wood);
 save('pull-sled');
 const {left,right,near,far}=mudBounds;
 box(out,0,1,-.08,7,16,.16,grass);
 box(out,(left+right)/2,(near+far)/2,.021,right-left,far-near,.04,mud);
 for(const x of [-3.24,3.24])fence(out,x,1,15,false);
 box(out,2.22,.1,.012,1.52,12.3,.027,clay);
 for(let i=0;i<9;i++)round(out,[-.19+Math.sin(i*1.58)*.82,near+.42+i*.77,.046],[.40,.17,.016],[.45,.30,.24]);
 for(const x of [-2.72,2.72])checkpoint(out,x,far+.4,x>0?teal:red);
 for(let i=0;i<24;i++)box(out,(i-11.5)*.25,7.6,.036,.25,.17,.029,i%2?cream:slate);
 save('bog-track');
 round(out,[0,0,0],[.11,.105,.078],mud);
 save('mud-spray');
 return parts;
}

export function workshopMeshes(windmills,mailboxes){
 const out=[],parts={};
 const colors=[red,teal,straw];
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 function ground(){
  box(out,0,0,-.08,7,6,.16,grass);
  box(out,0,-.50,.007,6.4,1.08,.026,clay);
 }
 ground();
 for(const [x,y] of windmills){
  box(out,x,y,.61,.26,.27,1.22,wood);
  box(out,x,y,.22,.69,.47,.44,slate);
  round(out,[x,y-.17,1.30],[.16,.11,.16],straw);
 }
 save('mill-yard');
 for(let frame=0;frame<16;frame++){
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+frame*Math.PI/48,c=Math.cos(a),s=Math.sin(a);
   face(out,[[c*.13,0,s*.13],[c*.74-s*.16,0,s*.74+c*.16],[c*.64+s*.14,0,s*.64-c*.14]],[0,1,2],i%2?cream:teal);
  }
  save('sails-'+frame);
 }
 ground();
 for(const [x,y] of mailboxes)box(out,x,y,.31,.10,.12,.62,wood);
 save('mail-yard');
 for(const [i,color] of [[0,red],[1,teal],[2,straw],[3,slate]]){
  box(out,0,0,.15,.41,.52,.30,color);
  round(out,[0,0,.29],[.205,.26,.105],color);
  box(out,0,-.269,.16,.30,.025,.20,color.map(channel=>channel*.74));
  save('mailbox-'+i);
 }
 for(const [i,c] of colors.entries()){
  box(out,0,0,.13,.056,.076,.28,c);
  box(out,.09,0,.25,.23,.10,.10,c);
  save('mail-flag-'+i);
 }
 box(out,0,0,0,.15,.028,.102,cream);
 box(out,0,-.022,0,.031,.026,.065,slate);
 save('house-number');
 return parts;
}

export function garageMeshes(racks,bench){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.08,6.9,6.5,.16,clay);
 for(const x of [-3.35,3.35])fence(out,x,0,6.3,false);
 for(const y of [-3.17,3.17])fence(out,0,y,6.7,true);
 save('derby-ring');
 for(const [i,c] of [teal,red,straw,[.55,.37,.59],slate].entries()){
  car(out,0,0,c);save('derby-car-'+i);
 }
 box(out,0,0,-.08,6.9,6,.16,grass);
 box(out,0,0,.009,6.3,5.55,.026,clay);
 for(const [x,y] of racks)box(out,x,y,.22,.95,.60,.44,wood);
 box(out,bench[0],bench[1]+.5,.25,1.24,.38,.50,teal);
 save('garage-yard');
 round(out,[0,0,.14],[.21,.12,.21],slate);
 round(out,[0,-.10,.14],[.113,.027,.113],cream);save('part-0');
 box(out,0,0,.12,.32,.25,.24,teal);
 for(const x of [-.10,.10])box(out,x,0,.27,.055,.055,.065,cream);
 save('part-1');
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  box(out,Math.cos(a)*.16,0,.19+Math.sin(a)*.16,.091,.095,.095,slate);
 }
 save('part-2');
 return parts;
}

export function homesteadMeshes(plots){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.08,6.8,6.1,.16,grass);
 for(const [x,y] of plots)box(out,x,y,.032,1.04,.76,.063,mud);
 save('plant-yard');
 for(const x of [-.23,0,.23]){
  box(out,x,0,.116,.047,.061,.225,[.38,.53,.20]);
  round(out,[x,.02,.19],[.088,.063,.034],[.60,.67,.25]);
 }
 save('weeds');
 for(const x of [-.23,0,.23]){
  round(out,[x,0,.103],[.055,.058,.070],[.34,.64,.27]);
  round(out,[x,.05,.063],[.086,.040,.036],teal);
 }
 save('sprouts');
 box(out,0,0,-.08,6.8,6.1,.16,grass);
 for(const x of [-3.3,3.3])fence(out,x,0,5.8,false);
 for(const x of [-1.89,1.89])fence(out,x,2.52,2.71,true);
 box(out,0,2.70,.021,1.08,.68,.031,teal);
 save('goat-yard');
 const fur=[.74,.63,.48];
 round(out,[0,-.01,.36],[.17,.31,.16],fur);
 round(out,[0,.27,.48],[.115,.15,.136],fur);
 for(const x of [-.10,.10]){
  for(const y of [-.19,.12])box(out,x,y,.13,.072,.076,.26,fur);
  round(out,[x*.71,.22,.601],[.027,.037,.090],cream);
  round(out,[x,.31,.51],[.032,.041,.026],slate);
 }
 box(out,0,.18,.44,.20,.06,.072,teal);
 box(out,0,.234,.384,.092,.037,.086,red);
 save('goat');
 return parts;
}

export function golfClubMeshes(){
 const out=[],parts=[];
 box(out,0,-.14,.033,.068,.31,.065,wood);
 round(out,[0,.10,.055],[.071,.24,.055],straw);
 parts.push(new Float32Array(out));out.length=0;
 box(out,0,-.15,.052,.069,.34,.067,slate);
 round(out,[0,.12,.084],[.138,.21,.082],[.56,.60,.60]);
 parts.push(new Float32Array(out));out.length=0;
 box(out,0,0,.042,.047,.61,.058,wood);
 box(out,0,.27,.055,.36,.13,.10,teal);
 parts.push(new Float32Array(out));
 return parts;
}

export function canHenMeshes(canRack,kitchen){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.08,6.88,6.1,.16,grass);
 box(out,0,0,.007,6.28,5.32,.028,clay);
 for(const x of [-3.3,3.3])fence(out,x,0,5.8,false);
 box(out,canRack[0],canRack[1],.22,.62,.55,.43,wood);
 box(out,-2.2,1.89,.08,1.27,1.22,.16,slate);
 fence(out,-2.2,2.5,1.28,true);
 save('can-yard');
 round(out,[0,0,.131],[.104,.104,.133],[.63,.69,.68]);
 round(out,[0,0,.256],[.104,.104,.019],cream);
 box(out,0,-.098,.13,.105,.021,.091,red);
 save('tin-can');
 box(out,0,0,-.08,6.88,6.1,.16,grass);
 box(out,0,.48,.009,5.91,4.40,.028,clay);
 for(const [i,[x,y]] of kitchen.entries()){
  box(out,x,y+.38,.30,1.04,.56,.61,[teal,wood,red][i]);
  box(out,x,y+.38,.64,1.10,.61,.10,cream);
 }
 save('hen-yard');
 round(out,[0,0,.18],[.159,.157,.192],cream);
 box(out,0,0,.39,.15,.14,.14,[.89,.92,.87]);
 save('milk-jug');
 round(out,[0,0,.20],[.17,.17,.207],wood);
 box(out,0,0,.40,.072,.072,.31,cream);
 save('butter-churn');
 round(out,[0,0,.162],[.24,.144,.162],straw);
 for(const x of [-.115,0,.115])box(out,x,0,.283,.034,.16,.024,cream);
 save('bread-loaf');
 return parts;
}

export function finaleMeshes(cows,coolers){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 const floor=()=>box(out,0,0,-.08,6.9,6.1,.16,grass);
 floor();
 shed(out,0,2.62,red);
 for(const x of [-3.3,3.3])fence(out,x,0,5.8,false);
 round(out,[0,2.04,.07],[.47,.33,.10],straw);
 save('fox-yard');
 round(out,[0,0,.13],[.088,.082,.13],cream);save('egg');
 floor();for(const [x,y] of cows)box(out,x,y,.021,1.47,.93,.038,clay);
 save('cow-yard');
 for(let frame=0;frame<11;frame++){
  box(out,0,0,.42,.57,1.0,.56,cream);
  box(out,0,.59,.54,.39,.36,.36,cream);
  box(out,-.29,.03,.43,.034,.38,.24,slate);
  box(out,.29,-.21,.48,.034,.28,.25,slate);
  for(const x of [-.19,.19])for(const y of [-.31,.30])box(out,x,y,.13,.098,.102,.26,wood);
  box(out,0,.76,.50,.31,.07,.16,[.79,.51,.49]);
  const theta=frame===10?Math.PI/2:(frame-4)*.058;
  for(let i=0;i<out.length;i+=6){
   const x=out[i],z=out[i+2]-.27;
   out[i]=x*Math.cos(theta)+z*Math.sin(theta);
   out[i+2]=(frame===10?.31:.27)+z*Math.cos(theta)-x*Math.sin(theta);
  }
  save('practice-cow-'+frame);
 }
 floor();
 for(const [i,[x,y]] of coolers.entries()){
  box(out,x,y,.27,.93,.68,.52,[red,teal,wood][i]);
  box(out,x,y,.56,1,.72,.12,cream);
  checkpoint(out,x+.33,y+.23,[red,teal,straw][i]);
 }
 save('butcher-yard');
 for(const [i,c] of [red,teal,straw].entries()){
  box(out,0,0,.105,.35,.26,.21,cream);
  box(out,0,0,.217,.15,.24,.015,c);
  save('wrapped-cut-'+i);
 }
 floor();shed(out,0,2.71,wood);
 for(const x of [-2.55,2.55]){bale(out,x,.22,1.3,.47);checkpoint(out,x,1.9,x<0?red:teal);}
 save('truth-yard');
 return parts;
}

export function pieRelayMeshes(pantry){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.08,6.95,6.4,.16,grass);
 box(out,0,.02,.012,6.04,4.1,.028,clay);
 for(const x of [-1.75,1.75]){
  box(out,x,2.20,.60,1.68,.68,1.24,red);
  box(out,x,1.84,.58,.09,.09,1.22,wood);
 }
 roof(out,0,2.27,1.62,2.64,.73,.64);
 for(const x of [-.93,.93])box(out,x,2.02,.85,.12,.13,1.68,wood);
 box(out,0,1.96,.62,1.85,.54,.13,cream);
 box(out,0,2.64,.31,1.39,.43,.65,slate);
 box(out,0,2.38,.37,.75,.12,.22,wood);
 for(const [x,y] of pantry)box(out,x,y,.18,.61,.49,.36,wood);
 save('pie-relay-yard');
 for(const [i,c] of [cream,[.97,.57,.20],[.52,.28,.57],straw].entries()){
  round(out,[0,0,.103],[.17,.16,i===0?.053:.114],c);
  if(i===1||i===2)round(out,[.09,-.04,.179],[.063,.065,.055],c.map(v=>v*.87));
  save('pie-ingredient-'+i);
 }
 round(out,[0,0,.032],[.44,.31,.03],[.87,.48,.28]);
 for(const x of [-.37,.29])round(out,[x,.27,.025],[.13,.11,.025],straw);
 save('pie-splat');
 return parts;
}

export function herdingMeshes(){
 const out=[];
 fence(out,0,0,1.10,true);
 const gate=new Float32Array(out);out.length=0;
 const coat=[.41,.29,.19],white=[.91,.85,.67];
 round(out,[0,-.02,.33],[.144,.27,.14],coat);
 round(out,[0,.21,.43],[.124,.127,.13],coat);
 round(out,[0,.32,.38],[.087,.090,.063],white);
 for(const x of [-.088,.088]){
  round(out,[x*.98,.17,.43],[.053,.071,.113],slate);
  for(const y of [-.18,.10])box(out,x,y,.135,.065,.079,.27,coat);
 }
 round(out,[0,-.31,.39],[.05,.136,.06],coat);
 box(out,0,.14,.36,.21,.061,.051,red);
 return {'sheep-gate':gate,'herding-dog':new Float32Array(out)};
}

export function teamPastureMeshes(barns){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.07,7.4,6.8,.14,grass);
 for(const x of [-3.57,3.57])fence(out,x,0,6.55,false);
 for(const y of [-3.29,3.29])fence(out,0,y,7.12,true);
 for(const [i,x] of barns.entries()){
  const color=i?red:teal;
  for(const dx of [-1.04,1.04])fence(out,x+dx,2.16,1.88,false);
  for(const dx of [-.80,.80])fence(out,x+dx,1.22,.48,true);
  box(out,x,2.20,.018,1.95,1.90,.025,color);
  shed(out,x,2.79,color);
 }
 save('team-pasture');
 fence(out,0,-.94,4.28,false);save('pasture-divider');
 for(const [i,c] of [teal,red].entries()){
  sheep(out,0,0);
  box(out,0,0,.47,.23,.30,.055,c);
  save('marked-sheep-'+i);
 }
 return parts;
}

export function cornholeMeshes(){
 const out=[],parts={};
 const save=name=>{parts[name]=new Float32Array(out);out.length=0;};
 box(out,0,0,-.085,7.5,8,.16,grass);
 box(out,0,.2,-.005,4.6,7.4,.028,clay);
 for(const x of [-2.41,2.41])fence(out,x,.2,6.8,false);
 for(const x of [-1.02,1.02])box(out,x,1.89,.26,.12,.19,.54,wood);
 const h=y=>.17+(y-.57)*.17;
 const center=[0,1.91],radius=.22;
 const boundary=(a)=>{
  const u=Math.cos(a),v=Math.sin(a),far=Math.min(1.10/Math.abs(u),v===0?Infinity:v>0?.31/v:-1.34/v);
  return [far*u,center[1]+far*v];
 };
 for(let i=0;i<64;i++){
  const a=i*Math.PI/32,b=(i+1)*Math.PI/32;
  const ring=t=>[radius*Math.cos(t),center[1]+radius*Math.sin(t)];
  const p=[ring(a),boundary(a),boundary(b),ring(b)].map(([x,y])=>[x,y,h(y)]);
  face(out,p,[0,1,2,3],i%8<4?teal:[.28,.59,.48]);
 }
 round(out,[0,1.91,.26],[.225,.228,.018],slate);
 save('corn-board');
 round(out,[0,0,.081],[.13,.24,.084],straw);
 for(const a of [-.077,0,.077])
  for(const b of [-.14,-.065,.01,.085,.16])round(out,[a,b,.13],[.034,.036,.035],[.98,.79,.31]);
 save('corn-ear');
 round(out,[0,0,.006],[.077,.077,.013],cream);
 save('corn-aim');
 return parts;
}

export function practiceAnimalMeshes(only){
 const models={};
 // A continuous tapered sweep for horns, neck and tail.
 function tube(out,curve,color,steps=32){
  const ring=(t,index)=>{
   const [x,y,z,r]=curve(t);
   const before=curve(Math.max(0,t-.001)),after=curve(Math.min(1,t+.001));
   const tangent=after.slice(0,3).map((v,i)=>v-before[i]);
   const d=Math.hypot(...tangent)||1;
   const u=tangent.map(v=>v/d);
   const guide=Math.abs(u[0])>.83?[0,0,1]:[1,0,0];
   const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
   const side=cross(u,guide), l=Math.hypot(...side);
   const a=side.map(v=>v/l),b=cross(u,a);
   const theta=index*Math.PI/8;
   const n=a.map((v,i)=>v*Math.cos(theta)+b[i]*Math.sin(theta));
   const shade=.69+.29*Math.max(0,-.36*n[0]-.43*n[1]+.83*n[2]);
   return [x+r*n[0],y+r*n[1],z+r*n[2],...color.map(c=>c*shade)];
  };
  for(let i=0;i<steps;i++)for(let j=0;j<16;j++){
   const a=ring(i/steps,j),b=ring((i+1)/steps,j),c=ring((i+1)/steps,j+1),d=ring(i/steps,j+1);
   out.push(...a,...b,...c,...a,...c,...d);
  }
 }
 function gooseClothes(out,ball){
  const felt=[.77,.48,.23], underside=[.53,.32,.17], leather=[.37,.22,.13];
  function brim(t,angle,z){
   const x=Math.cos(angle)*t,y=Math.sin(angle)*t;
   return [x*.181,.178+y*.151,z+.054*Math.abs(x)**4-.019*y*y-.008*y];
  }
  for(let i=0;i<48;i++){
   const a=i*Math.PI/24,b=(i+1)*Math.PI/24;
   for(let j=0;j<5;j++){
    const inner=.45+j*.11,outer=inner+.11;
    const top=[brim(inner,a,.861),brim(outer,a,.861),brim(outer,b,.861),brim(inner,b,.861)];
    const lower=[brim(inner,a,.849),brim(outer,a,.849),brim(outer,b,.849),brim(inner,b,.849)];
    face(out,top,[0,1,2,3],felt,.92+.06*Math.sin(a));
    face(out,lower,[3,2,1,0],underside,.89);
    if(j===4)face(out,[top[1],lower[1],lower[2],top[2]],[0,1,2,3],felt,.75);
   }
   const crown=(angle,r,z)=>[Math.cos(angle)*r,.177+Math.sin(angle)*r*.92,z];
   face(out,[crown(a,.103,.857),crown(b,.103,.857),crown(b,.101,.878),crown(a,.101,.878)],[0,1,2,3],leather);
   const cap=(angle,t)=>{
    const radius=.101-.031*t;
    return crown(angle,radius,.877+.100*t-.013*t*Math.abs(Math.sin(angle)));
   };
   for(let row=0;row<8;row++){
    const t=row/8,next=(row+1)/8;
    face(out,[cap(a,t),cap(b,t),cap(b,next),cap(a,next)],[0,1,2,3],felt,.80+.11*Math.cos(a)+.08*t);
   }
   face(out,[[0,.177,.961],cap(a,1),cap(b,1)],[0,1,2],felt,.96);
  }
  ball(0,.035,.517,.064,.064,.024,[.69,.18,.13]);
  const folds=[[-.068,.069,.529],[0,.123,.537],[.065,.069,.529],[-.046,.117,.468],[.011,.142,.431],[.052,.117,.474]];
  for(const [ids,shade] of [[[0,1,3],.87],[[1,2,5],.94],[[1,5,4],.82],[[1,4,3],.91]])
   face(out,folds,ids,[.88,.31,.20],shade);
  const hem=[[-.046,.118,.468],[.011,.143,.431],[.052,.118,.474],[-.043,.120,.476],[.011,.145,.440],[.049,.120,.480]];
  face(out,hem,[0,1,4,3],[1,.72,.48],.92);
  face(out,hem,[1,2,5,4],[1,.72,.48],.92);
  ball(-.056,-.010,.520,.026,.025,.021,[.70,.18,.13]);
 }
 const ivory=[.99,.93,.79],black=[.17,.12,.095],orange=[.97,.53,.15];
 const pink=[.95,.62,.58],deepPink=[.85,.40,.43],tan=[.79,.62,.42],darkFur=[.50,.34,.21];
 const wool=[.95,.86,.69],hoof=[.24,.17,.14],band=[.20,.64,.57];
 function make(key,build){
  if(only&&key!==only)return;
  const out=[];
  const ball=(x,y,z,w,d,h,color,coat)=>round(out,[x,y,z],[w,d,h],color,coat,true);
  const eyes=(x,y,z)=>{
   for(const side of [-1,1]){
    ball(side*x,y,z,.047,.038,.049,ivory);
    ball(side*x*1.10,y+.027,z-.004,.020,.014,.027,black);
    ball(side*x*1.10-.006,y+.039,z+.009,.009,.005,.009,[1,.98,.86]);
   }
  };
  build(ball,eyes,(curve,color,steps)=>tube(out,curve,color,steps),out);
  models[key]=new Float32Array(out);
 }
 make('goat',(b,eyes,sweep)=>{
  b(0,-.045,.365,.191,.329,.169,tan);
  b(0,.208,.433,.127,.172,.156,ivory);
  b(0,.296,.484,.128,.139,.133,tan);
  b(0,.393,.443,.106,.079,.072,ivory);
  b(0,.460,.466,.059,.026,.029,[.66,.40,.29]);
  b(0,.341,.360,.046,.062,.085,ivory);
  b(0,.115,.421,.146,.068,.114,band);
  b(0,.188,.342,.060,.043,.062,[.78,.26,.16]);
  b(0,.224,.333,.023,.017,.022,[.99,.73,.27]);
  for(const side of [-1,1]){
   b(side*.152,.277,.523,.094,.051,.043,tan);
   b(side*.182,.290,.522,.061,.036,.024,[.90,.58,.48]);
   sweep(t=>[side*(.078+.114*t),.266-.242*t,.581+.174*Math.sin(t*Math.PI*.89),
     (.048*(1-t)**.65+.002)*(1+.05*Math.sin(t*92))],[.91,.71,.44]);
   for(const y of [-.228,.124]){
    b(side*.12,y,.152,.052,.059,.143,tan);
    b(side*.12,y+.014,.043,.063,.076,.042,hoof);
   }
  }
  b(0,-.343,.417,.066,.112,.058,ivory);
  eyes(.094,.375,.532);
 });
 make('goose',(b,eyes,sweep,out)=>{
  b(0,-.104,.304,.176,.273,.158,ivory);
  b(0,-.303,.350,.100,.138,.062,ivory);
  for(const side of [-1,1]){
   b(side*.133,-.12,.346,.071,.180,.097,[.95,.87,.71]);
   for(let i=0;i<3;i++)b(side*(.162+.007*i),-.165-.039*i,.327+.019*i,.043,.103,.044,[.94,.86,.71]);
   b(side*.077,-.037,.128,.028,.031,.109,orange);
   b(side*.077,.012,.038,.064,.101,.033,orange);
  }
  sweep(t=>[0,.035+.148*t-.085*Math.sin(Math.PI*t),.329+.464*t,
    .058+.039*(1-t)**2-.009*Math.sin(Math.PI*t)],ivory,40);
  b(0,.186,.793,.092,.104,.086,ivory);
  b(0,.314,.771,.066,.107,.033,orange);
  b(0,.337,.747,.060,.084,.016,[.81,.39,.105]);
  eyes(.063,.246,.819);
  gooseClothes(out,b);
 });
 make('pig',(b,eyes,sweep)=>{
  b(0,-.058,.308,.264,.374,.241,pink);
  b(0,.239,.341,.225,.228,.192,pink);
  b(0,.441,.321,.143,.096,.092,deepPink);
  b(0,.491,.323,.124,.067,.074,[.99,.64,.63]);
  for(const side of [-1,1]){
   b(side*.049,.545,.335,.024,.012,.026,[.54,.20,.25]);
   b(side*.152,.229,.506,.092,.080,.112,pink);
   b(side*.169,.273,.512,.053,.041,.064,deepPink);
   for(const y of [-.242,.126]){
    b(side*.155,y,.122,.074,.079,.116,pink);
    b(side*.155,y+.012,.043,.073,.083,.041,deepPink);
   }
  }
  sweep(t=>[.061*Math.sin(t*Math.PI*2.75),-.375-.103*t,
    .369+.055*Math.cos(t*Math.PI*2.75),.023-.012*t],pink,37);
  b(0,.182,.31,.233,.046,.167,band);
  b(0,.367,.224,.051,.035,.047,[.99,.72,.25]);
  eyes(.141,.394,.418);
 });
 make('sheep',(b,eyes)=>{
  b(0,-.068,.324,.272,.351,.232,wool,.11);
  b(0,.171,.372,.204,.214,.185,ivory,.09);
  b(0,.292,.341,.130,.136,.127,[.40,.30,.24]);
  b(0,.395,.309,.101,.090,.069,[.31,.24,.21]);
  b(0,.280,.444,.133,.112,.079,ivory,.10);
  for(const side of [-1,1]){
   b(side*.145,.293,.372,.085,.041,.041,[.36,.27,.23]);
   for(const y of [-.20,.12]){
    b(side*.128,y,.106,.052,.060,.097,[.45,.35,.28]);
    b(side*.128,y+.008,.043,.059,.064,.042,hoof);
   }
  }
  b(0,-.358,.322,.090,.092,.090,ivory);
  eyes(.088,.378,.375);
 });
 return models;
}

export function farmLobbyPropMeshes(){
 const props={};
 const blades=[], rotor=[];
 const canvas=[.94,.83,.61], trim=[.27,.52,.45], iron=[.35,.33,.25];
 box(blades,0,0,.51,.075,.10,1.02,wood);
 box(blades,0,.015,.89,.27,.072,.54,trim);
 box(blades,0,-.033,.89,.213,.027,.47,canvas);
 for(const z of [.70,.81,.92,1.03,1.13])box(blades,0,-.055,z,.254,.026,.028,wood);
 for(let blade=0;blade<4;blade++){
  const angle=blade*Math.PI/2, c=Math.cos(angle), s=Math.sin(angle);
  for(let i=0;i<blades.length;i+=6){
   const [x,y,z,r,g,b]=blades.slice(i,i+6);
   rotor.push(x*c-z*s,y,x*s+z*c,r,g,b);
  }
 }
 round(rotor,[0,-.07,0],[.14,.105,.14],iron);
 round(rotor,[0,-.15,0],[.065,.031,.065],straw);
 props['windmill-sails']=new Float32Array(rotor);

 const stand=[];
 box(stand,0,.10,.50,.10,.11,1.08,wood);
 box(stand,0,-.025,1.03,.115,.40,.089,wood);
 round(stand,[0,-.18,.995],[.05,.052,.064],iron);
 props['bell-post']=new Float32Array(stand);

 const bell=[];
 const rings=[[.035,-.027],[.075,-.062],[.10,-.15],[.136,-.205],[.132,-.224],[.104,-.224],[.106,-.203]];
 for(let i=0;i<rings.length-1;i++){
  const vertices=[];
  for(const [radius,z] of rings.slice(i,i+2)){
   for(let j=0;j<32;j++){
    const a=j*Math.PI/16;
    vertices.push([radius*Math.cos(a),radius*Math.sin(a),z]);
   }
  }
  for(let j=0;j<32;j++){
   const next=(j+1)%32;
   face(bell,vertices,[j,next,next+32,j+32],straw,.81+.16*Math.cos(j*Math.PI/16+2));
  }
 }
 round(bell,[0,0,-.218],[.031,.032,.037],iron);
 props['coop-bell']=new Float32Array(bell);
 return props;
}

function farmTerrain(out){
 box(out,0,0,-.25,31,25,.40,[.46,.55,.27]);
 const grassPoint=(x,y)=>{
  const light=.5+.22*Math.sin(x*.49+y*.33)+.16*Math.cos(y*.83-x*.27);
  return [x,y,-.046,.42+.15*light,.54+.16*light,.25+.09*light];
 };
 for(let x=-15.5;x<15.5;x++)for(let y=-12.5;y<12.5;y++){
  const a=grassPoint(x,y),b=grassPoint(x+1,y);
  const c=grassPoint(x+1,y+1),d=grassPoint(x,y+1);
  out.push(...a,...b,...c,...a,...c,...d);
 }
 function path(from,to,center,width,vertical,layer){
  const z=-.038+layer*.002;
  const colors=[[.60,.46,.26],[.73,.56,.35],[.77,.60,.38],[.70,.53,.32],[.60,.46,.26]];
  const row=(t)=>colors.map((color,i)=>{
   const edge=(i-2)/2;
   const offset=center(t)+edge*width*(1+.09*Math.cos(t*1.5+edge));
   return [...(vertical?[offset,t,z]:[t,offset,z]),...color];
  });
  const segments=Math.ceil((to-from)*4);
  let previous=row(from);
  for(let i=1;i<=segments;i++){
   const next=row(from+(to-from)*i/segments);
   for(let j=0;j<4;j++)out.push(...previous[j],...previous[j+1],...next[j+1],...previous[j],...next[j+1],...next[j]);
   previous=next;
  }
 }
 path(-12.5,8.15,y=>.54*Math.sin(y*.48)+.32*Math.sin(y*.22),1.14,true,0);
 path(-13,12,x=>-.65*Math.sin(x*.37)+.22*Math.sin(x*.72),.76,false,1);
 path(-.45,5.76,y=>4.28+.86*Math.sin(y*.31),.45,true,2);
}

function farmPond(out){
 const cx=5.25,cy=8.18;
 const shoreline=(angle,scale,z)=>{
  const radius=scale*(1+.09*Math.sin(3*angle+.45)+.055*Math.cos(5*angle));
  return [cx+2.58*radius*Math.cos(angle),cy+1.83*radius*Math.sin(angle),z];
 };
 const contours=[
  [1.13,-.041,[.49,.59,.29]],[1.04,-.027,[.58,.47,.29]],
  [.94,-.020,[.30,.59,.49]],[.76,-.019,[.21,.51,.48]],[.29,-.018,[.15,.42,.45]]
 ];
 const segments=72;
 const vertex=(ring,i)=>{
  const [size,z,color]=contours[ring],angle=i*Math.PI*2/segments;
  const light=1+.045*Math.cos(angle-2);
  return [...shoreline(angle,size,z),...color.map(c=>c*light)];
 };
 for(let i=0;i<segments;i++){
  for(let j=0;j<contours.length-1;j++){
   const a=vertex(j,i),b=vertex(j,i+1),c=vertex(j+1,i+1),d=vertex(j+1,i);
   out.push(...a,...b,...c,...a,...c,...d);
  }
  out.push(...vertex(4,i),...vertex(4,i+1),cx,cy,-.018,.15,.42,.45);
 }
 for(const [x,y,length] of [[6.13,8.15,.72],[4.3,8.64,.45],[6.87,7.85,.39],[5.49,9.12,.63],[3.8,7.85,.47]]){
  const z=-.013;
  face(out,[[x-length/2,y,z],[x,y+.042,z],[x+length/2,y+.023,z],[x,y-.025,z]],[0,1,2,3],[.35,.65,.57]);
 }
 for(const [angle,size] of [[.12,.19],[.47,.11],[1.12,.18],[2.15,.20],[2.30,.13],[3.08,.15],[3.67,.12],[5.68,.16]]){
  const [x,y]=shoreline(angle,1.01,0);
  round(out,[x,y,.005],[size,size*.71,size*.52],[.53,.51,.38]);
 }
 for(const angle of [.23,.95,1.53,2.62,3.39,5.74]){
  const [x,y]=shoreline(angle,.98,0);
  for(const [i,dx] of [-.11,-.04,.036,.12].entries()){
   const h=.23+.087*((i+1)%3);
   const tip=dx*.45;
   face(out,[[x+dx-.029,y,-.022],[x+dx+.03,y,-.022],[x+dx+tip,y+.04,h]],[0,1,2],i%2?[.53,.66,.29]:[.35,.53,.24]);
   face(out,[[x+dx,y-.021,-.022],[x+dx,y+.034,-.022],[x+dx+tip,y+.04,h]],[0,1,2],[.44,.59,.27]);
  }
 }
 const dockX=5.10,dockY=6.64;
 for(const dx of [-.43,.43]){
  box(out,dockX+dx,dockY,.052,.10,1.96,.09,[.39,.25,.15]);
  for(const dy of [-.80,.59,.86])box(out,dockX+dx,dockY+dy,.09,.12,.12,.32,[.49,.31,.18]);
 }
 for(let i=0;i<11;i++){
  const y=dockY-.90+i*.178;
  box(out,dockX+(i%3-1)*.023,y,.13,1.10+i%3*.022,.165,.067,i%2?[.68,.47,.28]:[.73,.53,.32]);
  for(const dx of [-.43,.43])box(out,dockX+dx,y,.165,.024,.023,.005,[.35,.30,.23]);
 }
}

function farmBoundary(out){
 const cedar=[.59,.37,.21], endgrain=[.73,.51,.29], dark=[.33,.24,.17];
 function at(x,y,angle,build){
  const start=out.length;
  build();
  const c=Math.cos(angle),s=Math.sin(angle);
  for(let i=start;i<out.length;i+=6){
   const a=out[i],b=out[i+1];
   out[i]=x+a*c-b*s;
   out[i+1]=y+a*s+b*c;
  }
 }
 function post(x,height=.86){
  box(out,x,0,height/2,.19,.19,height,cedar);
  box(out,x,0,height,.24,.23,.073,endgrain);
  box(out,x,0,.054,.204,.203,.104,dark);
 }
 function section(x,y,length,angle){
  at(x,y,angle,()=>{
   const bays=Math.ceil(length/2.35);
   const spacing=length/bays;
   for(let i=0;i<=bays;i++)post(-length/2+i*spacing);
   for(let i=0;i<bays;i++){
    const center=-length/2+(i+.5)*spacing;
    for(const z of [.30,.60]){
     box(out,center,.01,z,spacing-.09,.11,.115,cedar);
     box(out,center,-.05,z+.037,spacing-.19,.017,.021,endgrain);
    }
   }
  });
 }
 function lantern(x,y){
  box(out,x,y,.68,.15,.15,1.36,cedar);
  box(out,x,y,.11,.28,.28,.22,[.51,.49,.39]);
  box(out,x,y,1.38,.33,.33,.09,dark);
  round(out,[x,y,1.54],[.158,.158,.206],[1,.79,.35]);
  round(out,[x,y-.095,1.53],[.104,.082,.146],[1,.92,.61]);
  for(const dx of [-.136,.136])for(const dy of [-.136,.136]){
   box(out,x+dx,y+dy,1.54,.031,.031,.28,dark);
  }
  box(out,x,y,1.70,.35,.35,.064,dark);
  round(out,[x,y,1.74],[.154,.154,.09],dark);
  round(out,[x,y,1.83],[.043,.043,.041],endgrain);
 }
 const emblemDetail=[12,7];
 function gate(x,y,angle){
  at(x,y,angle,()=>{
   for(const side of [-1,1]){
    const hinge=side*1.30;
    for(const z of [.31,.69])box(out,hinge,-.06,z,.24,.17,.09,dark);
    at(hinge,0,side*.91,()=>{
     for(const z of [.31,.69])box(out,-side*.55,0,z,1.1,.10,.11,endgrain);
     box(out,-side*1.06,0,.49,.11,.11,.52,cedar);
     box(out,-side*.55,-.041,.50,.46,.061,.38,cedar);
     const center=-side*.55;
     for(const faceSide of [-1,1]){
      for(let i=0;i<10;i++){
       const a=i*Math.PI/5;
       round(out,[center+Math.cos(a)*.111,faceSide*.078-.016,.50+Math.sin(a)*.111],
        [.041,.022,.043],i%2?[1,.76,.22]:[.94,.61,.13],0,false,emblemDetail);
      }
      round(out,[center,faceSide*.097-.016,.50],[.076,.032,.075],[.48,.28,.14],0,false,emblemDetail);
     }
    });
   }
   lantern(-1.30,0);
   lantern(1.30,0);
  });
 }

 const front=-10.7, entrance=.15, westGate=-.62;
 section((-14+entrance-1.30)/2,front,14+entrance-1.30,0);
 section((14+entrance+1.30)/2,front,14-entrance-1.30,0);
 section(14,.20,21.8,Math.PI/2);
 section(-14,(front+westGate-1.30)/2,westGate-1.30-front,Math.PI/2);
 section(-14,(11.1+westGate+1.30)/2,11.1-westGate-1.30,Math.PI/2);
 for(const x of [-8,8])section(x,11.1,12,0);
 gate(entrance,front,0);
 gate(-14,westGate,Math.PI/2);
}

export function farmLobbyMeshes(){
 const out=[];
 farmTerrain(out);
 farmPond(out);
 farmBoundary(out);
 for(const x of [-11,10])for(const y of [-8,5,9]){
  box(out,x,y,.66,.24,.26,1.38,[.44,.30,.16]);
  round(out,[x,y,1.57],[.85,.77,.72],[.43,.60,.26]);
  round(out,[x+.51,y-.19,1.44],[.59,.60,.51],[.53,.69,.32]);
 }
 shed(out,-5.4,5.8,[.72,.28,.17]);
 shed(out,7.6,6.1,[.29,.55,.48]);
 shed(out,8.2,-5.8,[.66,.48,.27]);
 for(const dx of [-.54,.54]){
  box(out,-8.8+dx,6.1,.15,.17,.42,.30,slate);
  box(out,-8.8+dx,6.1,.72,.13,.23,1.45,wood);
 }
 for(const z of [.45,.85,1.23])box(out,-8.8,6.1,z,1.22,.21,.11,wood);
 box(out,-8.8,6.1,1.36,.48,.41,.32,wood);
 for(const x of [-8.1,-7.1]){
  box(out,x,2.10,.008,.82,2.19,.10,wood);
  box(out,x,2.10,.060,.70,2.05,.025,[.39,.25,.14]);
 }
 round(out,[-8.8,5.90,1.47],[.21,.11,.21],straw);
 box(out,2.10,-5.20,.29,.11,.11,.62,wood);
 return new Float32Array(out);
}

export function phonePigArenaMeshes(){
 const out=[];
 box(out,0,0,-.16,9.2,8.2,.28,grass);
 box(out,0,0,-.035,6.6,5.5,.07,[.68,.48,.34]);
 for(const x of [-3.45,3.45])fence(out,x,0,5.82,false);
 fence(out,0,2.91,6.9,true);
 for(const x of [-2.36,2.36])fence(out,x,-2.91,2.15,true);
 for(const [x,y] of [[-3.82,2.4],[3.82,1.8],[2.8,3.33]])bale(out,x,y,.7,.50);
 for(const [x,y] of [[-.95,.42],[1.65,1.16],[.95,-1.65]])
  round(out,[x,y,-.012],[.56,.38,.027],[.43,.28,.19]);
 const player=[];
 round(player,[0,0,.30],[.17,.112,.22],teal);
 round(player,[0,.025,.54],[.111,.105,.111],[.94,.65,.45]);
 round(player,[0,.012,.62],[.153,.128,.028],[.77,.49,.20]);
 round(player,[0,.004,.657],[.109,.092,.061],[.82,.57,.27]);
 for(const x of [-.084,.084]){
  round(player,[x,0,.117],[.060,.064,.13],[.23,.31,.44]);
  round(player,[x,.05,.042],[.071,.10,.041],[.39,.27,.16]);
  round(player,[x*.77,.114,.56],[.013,.011,.018],[.21,.14,.11]);
 }
 return {arena:new Float32Array(out),player:new Float32Array(player)};
}
