export type LearningState = { start: string | null; current: number; learned: number[]; revisit: number[]; favourites: number[]; hidden: boolean; milestone: boolean };
export type LearningChange = { field: 'start' | 'current' | 'learned' | 'revisit' | 'favourites' | 'hidden' | 'milestone'; verse?: number; value?: boolean; date?: string;origin?:string;occurredAt?:number;qa?:boolean };
export const emptyLearning = (): LearningState => ({ start:null,current:0,learned:[],revisit:[],favourites:[],hidden:false,milestone:false });
export const lessons = Array.from({length:21},(_,i)=>Array.from({length:i===20?3:2},(_,j)=>i*2+j));
export function elapsedDays(start: string | null, today: string) { return start ? Math.max(1,Math.floor((Date.parse(today+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000)+1) : 0; }
export function changeLearning(state:LearningState, change:LearningChange):LearningState {
  const next={...state}; const f=change.field;
  if(f==='start'){if(!next.start)next.start=change.date!;next.hidden=false;}
  else if(f==='current')next.current=change.verse!;
  else if(f==='hidden'||f==='milestone')next[f]=change.value!;
  else next[f]=change.value ? [...new Set([...next[f],change.verse!])].sort((a,b)=>a-b) : next[f].filter(v=>v!==change.verse);
  return next;
}
export function mergeLearning(account:LearningState,guest:LearningState):LearningState {
  return {...account,current:!account.start&&!account.learned.length?guest.current:account.current,start:account.start&&guest.start ? [account.start,guest.start].sort()[0] : account.start||guest.start,
    learned:[...new Set([...account.learned,...guest.learned])].sort((a,b)=>a-b),
    revisit:[...new Set([...account.revisit,...guest.revisit])].sort((a,b)=>a-b),
    favourites:[...new Set([...account.favourites,...guest.favourites])].sort((a,b)=>a-b)};
}
