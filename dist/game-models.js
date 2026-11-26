// Small meshes projected onto the existing game canvas so scoring and camera coordinates stay aligned.
function ellipsoid(mesh, center, radius, color, steps = 10, rings = 6) {
  function point(i,j) {
    const a=i*Math.PI*2/steps,b=j*Math.PI/rings;
    return center.map((v,k)=>v+radius[k]*[Math.sin(b)*Math.cos(a),Math.sin(b)*Math.sin(a),Math.cos(b)][k]);
  }
  for(let i=0;i<steps;i++)for(let j=0;j<rings;j++){
    const a=point(i,j),b=point(i,j+1),c=point(i+1,j+1),d=point(i+1,j);
    if(j!==rings-1)mesh.push([a,b,c,color]);
    if(j!==0)mesh.push([a,c,d,color]);
  }
}
function box(mesh,x,y,z,w,d,h,color) {
  const p=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[x+a*w/2,y+b*d/2,z-h/2]);
  const v=[...p,...p.map(([a,b,c])=>[a,b,c+h])];
  for(const [a,b,c,d] of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]]){
    mesh.push([v[a],v[b],v[c],color],[v[a],v[c],v[d],color]);
  }
}
function bar(mesh,a,b,width,color) {
  const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz);
  const block=[];
  box(block,0,0,0,width,width,length,color);
  const f=[dx/length,dy/length,dz/length], norm=Math.hypot(f[0],f[1]);
  const r=norm?[-f[1]/norm,f[0]/norm,0]:[1,0,0];
  const u=[f[1]*r[2]-f[2]*r[1],f[2]*r[0]-f[0]*r[2],f[0]*r[1]-f[1]*r[0]];
  const center=a.map((x,i)=>(x+b[i])/2);
  for(const [p,q,s,c] of block)mesh.push(...[[p,q,s].map(v=>center.map((x,i)=>x+r[i]*v[0]+u[i]*v[1]+f[i]*v[2])).concat([c])]);
}
const pig=[],cart=[];
const pink=[235,128,150], rose=[255,171,178], hoof=[121,58,77], eye=[58,34,41];
ellipsoid(pig,[0,-.12,.56],[.45,.66,.40],pink,14,8);
ellipsoid(pig,[0,.44,.56],[.34,.37,.31],rose,12,7);
ellipsoid(pig,[0,.738,.49],[.228,.14,.148],rose);
for(const side of [-1,1]){
  ellipsoid(pig,[side*.241,.412,.836],[.099,.125,.171],pink);
  ellipsoid(pig,[side*.245,.490,.858],[.055,.049,.105],rose);
  ellipsoid(pig,[side*.219,.662,.648],[.044,.034,.052],eye,8,5);
  ellipsoid(pig,[side*.078,.862,.49],[.032,.017,.025],hoof,8,5);
  for(const front of [-1,1]){
    ellipsoid(pig,[side*.267,front*.32,.26],[.105,.125,.218],pink,8,5);
    ellipsoid(pig,[side*.267,front*.32,.075],[.103,.116,.073],hoof,8,5);
  }
}
const tailPoints=Array.from({length:12},(_,i)=>[.13*Math.sin(i*.50),-.75-i*.012,.57+.12*Math.cos(i*.50)]);
for(let i=1;i<tailPoints.length;i++)bar(pig,tailPoints[i-1],tailPoints[i],.051,rose);
const teal=[67,176,159], pale=[170,224,206], steel=[190,201,196], rubber=[57,57,53], handle=[195,75,62];
box(cart,0,.03,.33,.76,1.0,.075,teal);
for(const x of [-.32,.32])for(const y of [-.43,.44]){
  ellipsoid(cart,[x,y,.12],[.066,.134,.117],rubber,8,5);
  ellipsoid(cart,[x*1.13,y,.12],[.032,.062,.057],steel,8,5);
  box(cart,x,y,.22,.048,.056,.15,steel);
}
for(const x of [-.39,.39]){
  for(const y of [-.49,-.31,-.12,.08,.27,.47])bar(cart,[x*.93,y,.36],[x,y*1.09,.77],.028,steel);
  for(const z of [.49,.63,.77])box(cart,x,.01,z,.032,1.11,.033,pale);
  bar(cart,[x,-.49,.72],[x,-.80,.95],.042,teal);
}
for(const y of [-.54,.55]){
  for(const z of [.49,.63,.77])box(cart,0,y,z,.80,.028,.034,pale);
  for(const x of [-.25,0,.25])bar(cart,[x,y*.92,.36],[x,y,.77],.027,steel);
}
box(cart,0,-.80,.95,.91,.077,.08,handle);
box(cart,0,-.563,.63,.24,.024,.20,teal);
for(const x of [-.05,.05])box(cart,x,-.58,.63,.026,.014,.118,[250,227,163]);
box(cart,0,-.58,.63,.12,.014,.026,[250,227,163]);

export const faceCounts = { pig: pig.length, cart: cart.length };
export function drawModel(ctx,kind,x,y,scale,angle,lift=0,pose) {
  const mesh=pose??(kind==='pig'?pig:cart);
  const c=Math.cos(angle),s=Math.sin(angle);
  const projected=mesh.map(([a,b,d,color])=>{
    const vertices=[a,b,d].map(v=>{
      const vx=v[0]*c-v[1]*s,vy=v[0]*s+v[1]*c;
      return [x+vx*scale,y-(vy*.64+(v[2]+lift)*.77)*scale,vy*.77-v[2]*.64];
    });
    const [p,q,r]=vertices;
    const nx=(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]);
    const ny=(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]);
    const nz=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
    const length=Math.hypot(nx,ny,nz);
    const shade=length?.60+.40*Math.abs((-.35*nx-.58*ny-.72*nz)/length):.8;
    return {vertices,color,shade,depth:(p[2]+q[2]+r[2])/3};
  }).sort((a,b)=>b.depth-a.depth);
  for(const {vertices:[a,b,c],color,shade} of projected){
    const [r,g,h]=color.map(v=>Math.round(v*shade));
    ctx.fillStyle='rgb('+r+','+g+','+h+')';
    ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.45;
    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();ctx.fill();ctx.stroke();
  }
}

// Transform the same cart mesh into race-world coordinates for the follow camera.
export function cartWorldFaces(x, y, z, heading, size) {
  const c=Math.cos(heading),s=Math.sin(heading);
  return cart.map(([a,b,d,color])=>({
    color,
    points:[a,b,d].map(([px,py,pz])=>[
      x+(px*c-py*s)*size,
      y+(px*s+py*c)*size,
      z+pz*size
    ])
  }));
}
