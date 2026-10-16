"use client";
import { useCallback,useEffect,useRef,useState } from 'react';
import { createPortal } from 'react-dom';
import { useConvexAuth,useMutation,useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { reflections } from '@/data/reflections';
import { DECK,type VerseCard } from '@/lib/deck';
import { emptyLearning,changeLearning,elapsedDays,lessons,type LearningState,type LearningChange } from '@/lib/learningState';

const verses=DECK.filter((v):v is VerseCard=>v.kind==='verse');
type Cache={state:LearningState;pending:LearningChange[]};
const guestKey='bh_learning_v2_guest';
function load(key:string):Cache {try{const c=JSON.parse(localStorage.getItem(key)||'null');if(c?.state&&Array.isArray(c.pending))return c;}catch{}return {state:emptyLearning(),pending:[]};}
function write(key:string,value:Cache){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function hasProgress(s:LearningState){return !!s.start||s.learned.length>0||s.revisit.length>0||s.favourites.length>0;}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

export default function LearningApp(){
 const {isAuthenticated,isLoading}=useConvexAuth();
 const remote=useQuery(api.learning.get,isAuthenticated?{}:'skip');
 const change=useMutation(api.learning.change),importGuest=useMutation(api.learning.importGuest);
 const [loadedKey,setLoadedKey]=useState<string|null>(null),[todayDate,setTodayDate]=useState('');
 const [targets,setTargets]=useState<{screen:HTMLElement;settings:HTMLElement}|null>(null);
 const [state,setState]=useState<LearningState>(emptyLearning),[ready,setReady]=useState(false),[message,setMessage]=useState(''),[migration,setMigration]=useState(false),[busy,setBusy]=useState(false),[view,setView]=useState<'journey'|'verse'>('journey');
 const cache=useRef<Cache>({state:emptyLearning(),pending:[]}),active=useRef<string|null>(null),flushing=useRef(false),device=useRef('');
 const ownerKey=isLoading?null:isAuthenticated?(remote?`bh_learning_v2_${remote.userId}`:null):guestKey;
 const flush=useCallback(async()=>{
  const key=active.current;if(!key||key===guestKey||flushing.current)return;
  flushing.current=true;const owner=key;
  try{while(active.current===owner&&cache.current.pending.length){const op=cache.current.pending[0];const saved=await change(op);if(active.current!==owner)return;const pending=cache.current.pending.slice(1);cache.current={state:pending.reduce(changeLearning,saved),pending};write(owner,cache.current);setState(cache.current.state);}if(active.current===owner)setMessage('Learning progress saved to your account.');}
  catch{if(active.current===owner)setMessage('Saved on this device. Account sync will retry when you reconnect.');}
  finally{flushing.current=false;}
 },[change]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{const screen=document.getElementById('learning-screen'),settings=document.getElementById('learning-settings');if(screen&&settings){setTargets({screen,settings});setTodayDate(today());document.documentElement.classList.add('learn-enhanced');}device.current=localStorage.getItem('bh_learning_device')||crypto.randomUUID();localStorage.setItem('bh_learning_device',device.current);});return()=>{cancelAnimationFrame(frame);document.documentElement.classList.remove('learn-enhanced');};},[]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{if(active.current===ownerKey)return;active.current=ownerKey;setLoadedKey(ownerKey);setReady(false);setMigration(false);if(!ownerKey)return;const local=load(ownerKey);cache.current=ownerKey===guestKey||local.pending.length?local:{state:remote?.state??emptyLearning(),pending:[]};setState(cache.current.state);write(ownerKey,cache.current);setReady(true);const ask=ownerKey!==guestKey&&hasProgress(load(guestKey).state)&&!localStorage.getItem(`bh_learning_choice_${ownerKey}_${device.current}`);setMigration(ask);if(!ask)void flush();});return()=>cancelAnimationFrame(frame);},[ownerKey,remote,flush]);
 useEffect(()=>{if(!remote||active.current!==ownerKey||cache.current.pending.length)return;const frame=requestAnimationFrame(()=>{if(active.current!==ownerKey||cache.current.pending.length)return;cache.current={state:remote.state,pending:[]};setState(remote.state);write(ownerKey!,cache.current);});return()=>cancelAnimationFrame(frame);},[remote,ownerKey]);
 useEffect(()=>{const online=()=>{void flush();};window.addEventListener('online',online);return()=>window.removeEventListener('online',online);},[flush]);
 useEffect(()=>{if(ready)window.dispatchEvent(new CustomEvent('bh:learn-visibility',{detail:{hidden:state.hidden}}));},[state.hidden,ready]);
 const act=(op:LearningChange)=>{const key=active.current;if(!key||!ready||migration)return;if(key===guestKey){device.current=crypto.randomUUID();localStorage.setItem('bh_learning_device',device.current);}
 cache.current={state:changeLearning(cache.current.state,op),pending:key===guestKey?[]:[...cache.current.pending,op]};setState(cache.current.state);if(!write(key,cache.current))setMessage('Device storage is unavailable. Keep this page open to retain your changes.');else setMessage(key===guestKey?'Saved on this device.':'Saving learning progress…');void flush();};
 async function migrate(merge:boolean){const key=active.current;if(!key||key===guestKey)return;setBusy(true);try{if(merge){const saved=await importGuest({guest:load(guestKey).state,deviceId:device.current});if(active.current!==key)return;cache.current={state:saved,pending:cache.current.pending};setState(saved);write(key,cache.current);}localStorage.setItem(`bh_learning_choice_${key}_${device.current}`,'1');setMigration(false);setMessage(merge?'Guest learning added safely. Chant history is unchanged.':'Using your account learning progress. Guest learning remains on this device.');void flush();}catch{setMessage('Could not finish the import. Your guest learning is still saved here.');}finally{setBusy(false);}}
 function openVerse(n:number){act({field:'current',verse:n});setView('verse');targets?.screen.scrollTo({top:0});}
 useEffect(()=>{if(!ready||migration||active.current!==ownerKey)return;const apply=()=>{try{const journey=JSON.parse(localStorage.getItem('bh_journey')||'{}');if(journey.tab!=='learn'||journey.days!==21||!journey.start||cache.current.state.start)return;const op:LearningChange={field:'start',date:journey.start};const pending=ownerKey===guestKey?[]:[...cache.current.pending,op];cache.current={state:changeLearning(cache.current.state,op),pending};write(ownerKey!,cache.current);setState(cache.current.state);void flush();}catch{}};const frame=requestAnimationFrame(apply);window.addEventListener('bh:welcome-complete',apply);window.addEventListener('bh:account-ready',apply);return()=>{cancelAnimationFrame(frame);window.removeEventListener('bh:welcome-complete',apply);window.removeEventListener('bh:account-ready',apply);};},[ready,migration,ownerKey,flush]);
 const day=elapsedDays(state.start,todayDate),complete=lessons.filter(l=>l.every(n=>state.learned.includes(n))).length,verse=verses[state.current]??verses[0];
 const disabled=!ready||loadedKey!==ownerKey||migration||busy;
 const meaningParts=verse.ex.split(/(?<=[.!?])\s+/);const meaning=meaningParts[0],explanation=meaningParts.slice(1).join(' ');
 if(!targets)return null;
 return <>{createPortal(<section className="learning-content" aria-label="Learn Hanuman Chalisa">
  <header className="learning-header"><h2>Learn</h2><p>One lesson at a time.</p></header>
  {migration&&<section className="learning-box" aria-label="Import guest learning"><h3>Keep your guest learning?</h3><p>Add learned verses, revisits and favourites from this device to this account. Your account’s existing progress stays intact.</p><button disabled={busy} onClick={()=>void migrate(true)}>Add guest learning</button><button disabled={busy} onClick={()=>void migrate(false)}>Use account learning</button></section>}
  <p className="learning-status" role="status">{message||(!ready?'Loading learning progress…':isAuthenticated?'Learning saves to your account.':'Kept on this device. Google sign-in is required to save your progress and Sankalp to your account across devices.')}</p>
  {view==='journey'?<>
   {!state.start?<section className="learning-box"><h3>21 days with Hanuman</h3><p>Go beyond reciting the Chalisa. Understand its verses, one lesson at a time.</p><button disabled={disabled} onClick={()=>act({field:'start',date:today()})}>Begin Sankalp</button></section>:<section className="learning-box"><h3>21 days with Hanuman</h3><p>Started {state.start} · Day {day}</p><p>{complete} of 21 lessons completed · {state.learned.length} of 43 verses learned</p><progress aria-label="Verses explicitly marked learned" value={state.learned.length} max={43}/><p>Missed a day? Continue at your pace. Your progress stays with you.</p><button disabled={disabled} onClick={()=>openVerse(state.current)}>Resume {verse.label}</button></section>}
   {day>=21&&!state.milestone&&<section className="learning-box"><h3>Twenty-one days with Hanuman</h3><p>A moment to celebrate your commitment. You have marked {state.learned.length} of 43 verses learned. There is room to keep exploring.</p><button disabled={disabled} onClick={()=>{act({field:'hidden',value:false});act({field:'milestone',value:true});}}>Keep Learn in Navigation</button><button disabled={disabled} onClick={()=>{act({field:'hidden',value:true});act({field:'milestone',value:true});window.dispatchEvent(new Event('bh:open-account'));}}>Hide Learn from Navigation</button></section>}
   <h3>Your journey</h3><div className="learning-lessons">{lessons.map((list,i)=><button key={i} disabled={disabled} onClick={()=>openVerse(list.find(n=>!state.learned.includes(n))??list[0])}><span>Lesson {i+1}</span><small>{verses[list[0]].label} – {verses[list.at(-1)!].label}</small><small>{list.every(n=>state.learned.includes(n))?'Learned':'Explore'}</small></button>)}</div>
   <details><summary>Favourites ({state.favourites.length})</summary>{state.favourites.map(n=><button key={n} disabled={disabled} onClick={()=>openVerse(n)}>{verses[n].label}</button>)}</details>
   <details><summary>Revisit ({state.revisit.length})</summary>{state.revisit.map(n=><button key={n} disabled={disabled} onClick={()=>openVerse(n)}>{verses[n].label}</button>)}</details>
  </>:<article className="learning-verse"><button onClick={()=>setView('journey')}>Back to journey</button><label className="learning-jump">Jump to verse<select value={state.current} disabled={disabled} onChange={e=>openVerse(Number(e.target.value))}>{verses.map((v,i)=><option value={i} key={v.id}>{v.label}</option>)}</select></label><h3>{verse.label}</h3>
   {/* Existing devotional artwork and copy; additional editorial claims stay out until sourced. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img className="learning-art" src={`/images/${verse.img}.jpg`} alt={`Hanuman illustration for ${verse.label}`} width={160} height={160}/>
   <h4>Hindi</h4><p lang="hi" className="learning-hindi">{verse.dev.join(' ')}॥</p><h4>Hinglish</h4><p>{verse.hing.join(' | ')} ||</p><h4>English translation</h4><p>{verse.mt}</p><h4>Meaning</h4><p>{meaning}</p><h4>Explanation</h4><p>{explanation||'Further commentary is awaiting source review.'}</p><p className="learning-note">Story or context: a verified source is still needed for this lesson.</p>
   <aside className="learning-reflection" aria-label="Let’s reflect"><h4>Let’s reflect</h4><p>{reflections[state.current]}</p><p className="learning-note">A modern interpretation for everyday life.</p></aside>
   <p className="learning-note">Preview content: existing app text retained. Detailed source and scripture review is pending. Additional stories and research claims are not included.</p>
   <div className="learning-actions"><button disabled={disabled} aria-pressed={state.learned.includes(state.current)} onClick={()=>act({field:'learned',verse:state.current,value:!state.learned.includes(state.current)})}>{state.learned.includes(state.current)?'Learned ✓':'Mark Learned'}</button><button disabled={disabled} aria-pressed={state.revisit.includes(state.current)} onClick={()=>act({field:'revisit',verse:state.current,value:!state.revisit.includes(state.current)})}>Revisit{state.revisit.includes(state.current)?' ✓':''}</button><button disabled={disabled} aria-pressed={state.favourites.includes(state.current)} onClick={()=>act({field:'favourites',verse:state.current,value:!state.favourites.includes(state.current)})}>Favourite{state.favourites.includes(state.current)?' ♥':''}</button></div>
   <div className="learning-actions"><button disabled={disabled||state.current===0} onClick={()=>openVerse(state.current-1)}>Previous verse</button><button disabled={disabled} onClick={()=>state.current<42?openVerse(state.current+1):setView('journey')}>{state.current<42?'Next Verse':'Back to journey'}</button></div><p>{state.current+1} of 43 verses. Only Mark Learned changes completion.</p>
  </article>}
 </section>,targets.screen)}{createPortal(<section className="learning-settings-panel"><h4>Learning</h4><button disabled={disabled} onClick={()=>{act({field:'hidden',value:false});window.dispatchEvent(new Event('bh:open-learn'));}}>Open Learn</button><button disabled={disabled} onClick={()=>act({field:'hidden',value:!state.hidden})}>{state.hidden?'Show Learn in Navigation':'Hide Learn from Navigation'}</button><p>Hiding Learn never deletes your learning progress.</p></section>,targets.settings)}</>;
}
