"use client";
import {markLaunchLogin} from '@/lib/launchContext';
/* eslint-disable @next/next/no-img-element -- Preserve the existing local devotional artwork. */
import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useAuthActions} from '@convex-dev/auth/react';
import {useConvexAuth,useQuery} from 'convex/react';
import {api} from '../../convex/_generated/api';
import {defaultWelcome,welcomeEntry,normalizeWelcome,welcomeSnapshot,todayLocal,type WelcomeDraft,type Journey} from '@/lib/welcomeState';

function DayWheel({value,onChange}:{value:number|null;onChange:(day:number)=>void}){
 const wheel=useRef<HTMLDivElement>(null),initialDay=useRef(value??3);
 useEffect(()=>{const el=wheel.current;if(el)el.scrollTop=(initialDay.current-1)*48;},[]);
 return <div className="sankalp-wheel-frame"><span className="wheel-caption">Choose your days</span><div className="sankalp-wheel" ref={wheel} role="group" aria-label="Sankalp duration" onScroll={e=>{const day=Math.max(1,Math.min(21,Math.round(e.currentTarget.scrollTop/48)+1));if(day!==value)onChange(day);}}>{Array.from({length:21},(_,i)=>i+1).map(day=><button type="button" key={day} className={[3,7,11,21].includes(day)?'wheel-milestone':''} aria-pressed={value===day} onClick={()=>{onChange(day);wheel.current?.scrollTo({top:(day-1)*48,behavior:'smooth'});}}>{day} {day===1?'day':'days'}</button>)}</div><span className="wheel-hint">3 · 7 · 11 · 21</span></div>;
}
function loadDraft(){try{return normalizeWelcome(JSON.parse(sessionStorage.getItem('bh_welcome_draft')||'null'));}catch{return defaultWelcome();}}
function resumeTab():Journey|'home'{return new URLSearchParams(window.location.search).get('entry')==='home'?'home':savedJourney();}
function savedJourney():Journey{try{return JSON.parse(localStorage.getItem('bh_journey')||'{}').tab==='learn'?'learn':'chant';}catch{return 'chant';}}
export default function WelcomeExperience(){
 const {isAuthenticated,isLoading}=useConvexAuth(),{signIn}=useAuthActions();
 const status=useQuery(api.practice.status,{});
 const [accountRestored,setAccountRestored]=useState(false),[entryChecked,setEntryChecked]=useState(false);
 const [host,setHost]=useState<HTMLElement|null>(null),[draft,setDraft]=useState<WelcomeDraft>(defaultWelcome),[phone,setPhone]=useState(''),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(entryChecked)document.documentElement.dataset.practiceEntry='ready';return()=>{delete document.documentElement.dataset.practiceEntry;};},[entryChecked]);
 const heading=useRef<HTMLHeadingElement>(null),initial=useRef(false),dialog=useRef<HTMLDialogElement>(null);
 const finish=useCallback((journey:Journey)=>{setOpen(false);setBusy(false);sessionStorage.removeItem('bh_welcome_auth');sessionStorage.removeItem('bh_welcome_draft');sessionStorage.removeItem('bh_welcome_return');localStorage.setItem('bh_welcome_v3','1');window.dispatchEvent(new CustomEvent('bh:welcome-complete',{detail:{journey}}));},[]);
 useEffect(()=>{const attach=()=>setHost(document.getElementById('welcome-root'));const frame=requestAnimationFrame(attach);window.addEventListener('bh:ready',attach);return()=>{cancelAnimationFrame(frame);window.removeEventListener('bh:ready',attach);};},[]);
 const restoreEntry=useCallback(()=>{
  setEntryChecked(true);
  if(localStorage.getItem('bh_onb')==='1'||localStorage.getItem('bh_guest_read')==='1'){
   if(sessionStorage.getItem('bh_welcome_auth'))finish(savedJourney());
   else {sessionStorage.removeItem('bh_welcome_return');setBusy(false);setOpen(false);window.dispatchEvent(new CustomEvent('bh:navigate',{detail:{tab:resumeTab()}}));if(localStorage.getItem('bh_guest_read')==='1'&&resumeTab()==='chant')window.dispatchEvent(new Event('bh:guest-read'));}
  }else{
   sessionStorage.removeItem('bh_welcome_auth');sessionStorage.removeItem('bh_welcome_return');
   setDraft(loadDraft());setBusy(false);setError('');setOpen(true);
  }
 },[finish]);
 useEffect(()=>{
  const start=()=>{setEntryChecked(true);setDraft(loadDraft());setOpen(true);setError('');};
  const openAccount=()=>setEntryChecked(true);
  const accountReady=()=>{setAccountRestored(true);initial.current=true;restoreEntry();};
  const signedOut=()=>{setAccountRestored(false);initial.current=true;restoreEntry();};
  window.addEventListener('bh:open-account',openAccount);window.addEventListener('bh:open-onboarding',start);window.addEventListener('bh:account-ready',accountReady);window.addEventListener('bh:session-ended',signedOut);
  return()=>{window.removeEventListener('bh:open-account',openAccount);window.removeEventListener('bh:open-onboarding',start);window.removeEventListener('bh:account-ready',accountReady);window.removeEventListener('bh:session-ended',signedOut);};
 },[restoreEntry]);
 useEffect(()=>{
  if(!host||isLoading||initial.current)return;
  if(new URLSearchParams(window.location.search).get('guest')==='1'){const frame=requestAnimationFrame(()=>{initial.current=true;localStorage.setItem('bh_guest_read','1');sessionStorage.removeItem('bh_welcome_auth');sessionStorage.removeItem('bh_welcome_return');setEntryChecked(true);setOpen(false);window.history.replaceState(null,'','/app');window.dispatchEvent(new Event('bh:guest-read'));});return()=>cancelAnimationFrame(frame);}
  const decision=welcomeEntry({authenticated:isAuthenticated,accountRestored,localComplete:localStorage.getItem('bh_onb')==='1',guestReading:localStorage.getItem('bh_guest_read')==='1',authPending:!!(sessionStorage.getItem('bh_welcome_auth')||sessionStorage.getItem('bh_welcome_return'))});
  if(decision==='wait')return;
  const frame=requestAnimationFrame(()=>{
   initial.current=true;setEntryChecked(true);
   if(decision==='resume'){restoreEntry();return;}
   const interrupted=sessionStorage.getItem('bh_welcome_auth')||sessionStorage.getItem('bh_welcome_return');
   setDraft(sessionStorage.getItem('bh_welcome_auth')?{...loadDraft(),step:4}:loadDraft());setBusy(false);setOpen(true);
   if(interrupted)setError('Sign-in was not completed. Try Google again, or continue as a guest.');
  });return()=>cancelAnimationFrame(frame);
 },[host,isLoading,isAuthenticated,accountRestored,restoreEntry]);
 useEffect(()=>{const el=dialog.current;if(!el)return;document.documentElement.classList.toggle('welcome-open',open);if(open&&!el.open)el.showModal();if(!open&&el.open)el.close();if(open)heading.current?.focus();return()=>{document.documentElement.classList.remove('welcome-open');};},[open,draft.step,host]);
 useEffect(()=>{if(open)sessionStorage.setItem('bh_welcome_draft',JSON.stringify(draft));},[draft,open]);
 useEffect(()=>{const restore=(event:PageTransitionEvent)=>{if(!event.persisted||isAuthenticated||!sessionStorage.getItem('bh_welcome_auth'))return;setBusy(false);setDraft({...loadDraft(),step:4});setOpen(true);setError('Sign-in was not completed. Try Google again, or continue as a guest.');};window.addEventListener('pageshow',restore);return()=>window.removeEventListener('pageshow',restore);},[isAuthenticated]);
 function next(step:number){setError('');setDraft(v=>({...v,step}));}
 function profile(){if(phone.trim()&&!/^[+\d\s().-]{6,24}$/.test(phone)){setError('Enter a phone number, or leave it blank.');return;}try{localStorage.setItem('bh_demo_profile',JSON.stringify({name:draft.name.trim().slice(0,60),phone:phone.trim(),verified:false}));next(2);}catch{setError('Device storage is unavailable. Allow storage to keep your demo registration.');}}
 function store(){const snapshot=welcomeSnapshot(draft,todayLocal());for(const [key,value]of Object.entries(snapshot))localStorage.setItem(key,value);window.dispatchEvent(new Event('bh:restore'));}
 async function complete(google:boolean){setError('');try{store();if(google&&!isAuthenticated){sessionStorage.setItem('bh_welcome_auth','1');setBusy(true);markLaunchLogin();await signIn('google',{redirectTo:window.location.origin+'/'});}else{finish(draft.journey);}}catch{setBusy(false);sessionStorage.removeItem('bh_welcome_auth');setError('Could not continue. Your choices are kept here; please try again.');}}
 async function returning(){sessionStorage.setItem('bh_welcome_return','1');setBusy(true);try{markLaunchLogin();await signIn('google',{redirectTo:window.location.origin+'/'});}catch{sessionStorage.removeItem('bh_welcome_return');setBusy(false);setError('Google sign-in could not start. Please try again.');}}
 if(!host)return null;
 return createPortal(<dialog className="welcome-dialog" ref={dialog} aria-labelledby="welcome-title" onCancel={e=>e.preventDefault()}><div className={`welcome-card welcome-screen-${draft.step}`}><p className="welcome-step">{draft.step} of 4</p>
 {draft.step===1&&<><h2 id="welcome-title" ref={heading} tabIndex={-1}>Welcome to Be Hanuman</h2><img className="welcome-lotus" src="/images/ui/x01-meditate.webp" width={180} height={180} alt="Hanuman sitting on a lotus"/><p>A little space for devotion, understanding and daily practice.</p><label>Your Name<input autoComplete="given-name" maxLength={60} value={draft.name} onChange={e=>setDraft(v=>({...v,name:e.target.value}))}/></label><label>Phone Number <small>(optional)</small><input type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={phone} onChange={e=>setPhone(e.target.value)}/></label><p className="welcome-note">Demo registration only. Your number stays on this device and is not verified. No OTP or SMS is sent. If you enter a number and finish onboarding, we count a phone-flow completion. Only a random event ID and timestamp are sent, not your name or number. This does not verify your identity.</p><button className="welcome-primary" onClick={profile} disabled={busy}>Get Started</button><button onClick={()=>void returning()} disabled={busy||!status?.googleReady}>Already have an account? Sign in with Google</button></>}
 {draft.step===2&&<><h2 id="welcome-title" ref={heading} tabIndex={-1}>Start Your Journey</h2><p>Choose where you would like to begin. Both paths remain available.</p><div className="welcome-options">{(['chant','learn']as const).map(j=><button key={j} aria-pressed={draft.journey===j} onClick={()=>setDraft(v=>({...v,journey:j,days:null}))}><b>{j==='chant'?'Chant Chalisa':'Learn Chalisa'}</b><span>{j==='chant'?'Read at your pace, with optional recitation.':'Understand the verses, one lesson at a time.'}</span></button>)}</div><button className="welcome-primary" onClick={()=>next(3)}>Continue</button><button onClick={()=>next(1)}>Back</button></>}
 {draft.step===3&&<><h2 id="welcome-title" ref={heading} tabIndex={-1}>Take Your Sankalp</h2><p>{draft.journey==='chant'?'Choose a commitment to return to your practice.':'Spend 21 days exploring the Chalisa, at your own pace.'}</p>{draft.journey==='chant'?<DayWheel value={draft.days} onChange={days=>setDraft(v=>({...v,days}))}/>:<div className="welcome-days"><button aria-pressed={draft.days===21} onClick={()=>setDraft(v=>({...v,days:21}))}>21 days</button></div>}<p className="welcome-note">A Sankalp is optional. You can read or learn without making a commitment.</p><button className="welcome-primary" onClick={()=>{if(!draft.days){setError('Choose a duration, or continue without a Sankalp.');return;}next(4);}}>{draft.journey==='chant'?'Take Sankalp':'Begin Learning'}</button><button onClick={()=>{setDraft(v=>({...v,days:null,step:4}));setError('');}}>No Sankalp, Just Exploring</button><button onClick={()=>next(2)}>Back</button></>}
 {draft.step===4&&<><h2 id="welcome-title" ref={heading} tabIndex={-1}>Save Your Progress</h2><p>{draft.journey==='chant'?'Chant Chalisa':'Learn Chalisa'}{draft.days?` · ${draft.days}-day Sankalp`:' · No commitment required'}</p><p>Sign in with Google to save your Sankalp and build your streak across devices. We recommend it so your practice stays with you. Your feedback helps us understand what’s working and improve Be Hanuman.</p><button className="welcome-primary" onClick={()=>void complete(true)} disabled={busy||(!isAuthenticated&&!status?.googleReady)}>{busy?'Connecting…':'Continue with Google'}</button><button onClick={()=>void complete(false)} disabled={busy}>Continue as Guest</button><button onClick={()=>next(3)} disabled={busy}>Back</button></>}
 {error&&<p role="alert">{error}</p>}</div></dialog>,host);
}
