export type Journey = 'chant' | 'learn';
export type WelcomeDraft = {name:string;journey:Journey;days:number|null;step:number};
export const defaultWelcome = ():WelcomeDraft => ({name:'',journey:'chant',days:null,step:1});
export function normalizeWelcome(value:unknown):WelcomeDraft {
 if(!value||typeof value!=='object')return defaultWelcome();
 const v=value as Partial<WelcomeDraft>,journey=v.journey==='learn'?'learn':'chant';
 return {name:typeof v.name==='string'?v.name.trim().slice(0,60):'',journey,days:journey==='learn'?(v.days===21?21:null):(Number.isInteger(v.days)&&Number(v.days)>=1&&Number(v.days)<=21)?v.days!:null,step:Math.min(4,Math.max(1,Number(v.step)||1))};
}
export function welcomeSnapshot(draft:WelcomeDraft,date:string){
 const safe=normalizeWelcome(draft);
 return {bh_user:JSON.stringify({name:safe.name}),bh_onb:'1',bh_journey:JSON.stringify({tab:safe.journey,days:safe.days,start:safe.days?date:null}),...(safe.days?{bh_sk2:JSON.stringify({intent:'',promise:'',days:safe.days,start:date,ts:Date.parse(date+'T00:00:00Z')})}:{})};
}
export function todayLocal(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

// Sign-in and completed onboarding are separate facts.
export function welcomeEntry(input:{authenticated:boolean;accountRestored:boolean;localComplete:boolean;authPending?:boolean;guestReading?:boolean}) {
 if(input.authenticated&&!input.accountRestored)return 'wait';
 if(input.guestReading)return 'resume';
 if(!input.authenticated&&input.authPending)return 'onboard';
 return input.localComplete?'resume':'onboard';
}
