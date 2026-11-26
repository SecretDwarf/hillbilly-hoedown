export function decodePigMotion(buffer) {
  const view=new DataView(buffer);
  if(view.byteLength<16||view.getUint32(0,false)!==0x48485047)throw Error('Invalid pig animation');
  const count=view.getUint32(4,true), poses=view.getUint32(8,true);
  const colorOffset=16+count*poses*36;
  if(count===0||poses!==16||colorOffset+count*3!==buffer.byteLength)throw Error('Incomplete pig animation');
  const vertices=new Float32Array(buffer,16,count*poses*9);
  const ink=new Uint8Array(buffer,colorOffset);
  const colors=Array.from({length:count},(_,i)=>[ink[i*3],ink[i*3+1],ink[i*3+2]]);
  return Array.from({length:poses},(_,frame)=>colors.map((color,i)=>{
    const offset=(frame*count+i)*9;
    return [0,3,6].map(j=>[vertices[offset+j],vertices[offset+j+1],vertices[offset+j+2]]).concat([color]);
  }));
}
export function poseAt(frames,elapsed,kind) {
  if(!frames)return undefined;
  if(kind==='idle')return frames[0];
  const frame=Math.floor(Math.max(0,elapsed)/125)%8;
  return frames[(kind==='caught'?8:0)+frame];
}
