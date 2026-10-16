export type Journey = 'chant' | 'learn';
export type WelcomeDraft = {name:string;journey:Journey;days:3|7|11|21|null;step:number};
export const defaultWelcome = ():WelcomeDraft => ({name:'',journey:'chant',days:null,step:1});
export function normalizeWelcome(value:unknown):WelcomeDraft {
 if(!value||typeof value!=='object')return defaultWelcome();
 const v=value as Partial<WelcomeDraft>,journey=v.journey==='learn'?'learn':'chant';
 return {name:typeof v.name==='string'?v.name.trim().slice(0,60):'',journey,days:journey==='learn'?(v.days===21?21:null):[3,7,11,21].includes(v.days as number)?v.days!:null,step:Math.min(4,Math.max(1,Number(v.step)||1))};
}
export function welcomeSnapshot(draft:WelcomeDraft,date:string){
 const safe=normalizeWelcome(draft);
 return {bh_user:JSON.stringify({name:safe.name}),bh_onb:'1',bh_journey:JSON.stringify({tab:safe.journey,days:safe.days,start:safe.days?date:null}),...(safe.days?{bh_sk2:JSON.stringify({intent:'',promise:'',days:safe.days,start:date,ts:Date.parse(date+'T00:00:00Z')})}:{})};
}
export function todayLocal(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
