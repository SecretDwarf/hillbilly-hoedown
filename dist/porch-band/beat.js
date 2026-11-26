const spacing=680,lead=1250,window=225;

export function newSong(now,random=Math.random){
 const notes=[];
 // Each phrase opens with a jug beat and ends with a stomp on the downbeat.
 for(let phrase=0;phrase<4;phrase++){
  const middle=random()<.5?[0,2]:[2,0];
  for(const pad of [1,...middle,3])notes.push({pad,at:now+lead+notes.length*spacing});
 }
 return {notes,next:0,points:0,hits:0,misses:0,last:'',done:false};
}
export function advance(song,now){
 while(song.notes[song.next]&&now>song.notes[song.next].at+window){
  song.misses++;song.next++;song.last='Missed';
 }
 song.done=song.next===song.notes.length;
}
export function strike(song,pad,now){
 advance(song,now);
 const n=song.notes[song.next];
 if(!n||Math.abs(n.at-now)>window)return false;
 if(pad!==n.pad){song.last='Try the highlighted instrument';return false;}
 const perfect=Math.abs(n.at-now)<=95;
 song.points+=perfect?100:60;
 song.hits++;song.next++;
 song.last=perfect?'On the beat!':'Good hit';
 song.done=song.next===song.notes.length;
 return true;
}
