"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {InstallPromptQueue,type DeferredInstallEvent} from '@/lib/installPrompt';
const InstallContext=createContext({ready:false,installed:false,canPrompt:false,busy:false,request:()=>{}});
const DISMISSED='bh_install_dismissed',OFFERED='bh_install_offered';
function stored(key:string){try{return localStorage.getItem(key)==='1';}catch{return false;}}
function remember(key:string){try{localStorage.setItem(key,'1');}catch{}}
export function InstallButton(){const install=useContext(InstallContext);if(!install.ready||install.installed)return null;return <button type="button" className="install-entry" disabled={install.busy} onClick={install.request}>{install.canPrompt?'Install app':'Add to Home Screen'}<span aria-hidden="true"> ↗</span></button>;}
export default function InstallProvider({children}:{children:ReactNode}){
 const prompts=useRef(new InstallPromptQueue()),dialog=useRef<HTMLDialogElement>(null);
 const [ready,setReady]=useState(false),[installed,setInstalled]=useState(false),[canPrompt,setCanPrompt]=useState(false),[busy,setBusy]=useState(false),[guide,setGuide]=useState(false),[offer,setOffer]=useState(false),[platform,setPlatform]=useState('desktop'),[message,setMessage]=useState('');
 const dismiss=useCallback(()=>{remember(DISMISSED);setOffer(false);},[]);
 const request=useCallback(async()=>{
  if(installed||busy)return;
  setOffer(false);setMessage('');
  const prompt=prompts.current.take();
  if(!prompt){setGuide(true);return;}
  setCanPrompt(false);setBusy(true);
  try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='dismissed')dismiss();}
  catch{setMessage('The browser could not open its install prompt. You can use the steps below or keep using the browser.');setGuide(true);}
  finally{setBusy(false);}
 },[installed,busy,dismiss]);
 useEffect(()=>{
  const mode=matchMedia('(display-mode: standalone)');
  const standalone=()=>mode.matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
  const markInstalled=()=>{prompts.current.clear();setInstalled(true);setCanPrompt(false);setOffer(false);setGuide(false);};
  const frame=requestAnimationFrame(()=>{setInstalled(standalone());const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);setPlatform(ios?'ios':/Android/.test(navigator.userAgent)?'android':'desktop');setReady(true);});
  const pending=(event:Event)=>{if(standalone())return;event.preventDefault();prompts.current.keep(event as DeferredInstallEvent);setCanPrompt(true);};
  const completed=()=>{if(standalone()||stored(DISMISSED)||stored(OFFERED))return;remember(OFFERED);setOffer(true);};
  const modeChanged=()=>{if(standalone())markInstalled();};
  window.addEventListener('beforeinstallprompt',pending);window.addEventListener('appinstalled',markInstalled);window.addEventListener('bh:round',completed);window.addEventListener('bh:welcome-complete',completed);mode.addEventListener('change',modeChanged);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('beforeinstallprompt',pending);window.removeEventListener('appinstalled',markInstalled);window.removeEventListener('bh:round',completed);window.removeEventListener('bh:welcome-complete',completed);mode.removeEventListener('change',modeChanged);};
 },[]);
 useEffect(()=>{const open=()=>void request();window.addEventListener('bh:install',open);return()=>window.removeEventListener('bh:install',open);},[request]);
 useEffect(()=>{const el=dialog.current;if(!el)return;if(guide&&!el.open)el.showModal();if(!guide&&el.open)el.close();},[guide]);
 function closeGuide(){setGuide(false);dismiss();}
 return <InstallContext.Provider value={{ready,installed,canPrompt,busy,request:()=>void request()}}>{children}{ready&&offer&&!installed&&<aside className="install-opportunity" aria-label="Add Be Hanuman to your Home Screen"><div><b>Keep your practice close</b><p>Add Be Hanuman to your Home Screen whenever you’re ready.</p></div><InstallButton/><button type="button" onClick={dismiss} aria-label="Dismiss install suggestion">Not now</button></aside>}<dialog className="install-guide" ref={dialog} aria-labelledby="install-title" onCancel={closeGuide}><h2 id="install-title">Add Be Hanuman to your Home Screen</h2>{message&&<p role="status">{message}</p>}{platform==='ios'?<p>In Safari, open Page Menu or Share, then choose <b>Add to Home Screen</b>. Turn on <b>Open as Web App</b> if it’s offered, then tap <b>Add</b>.</p>:platform==='android'?<p>Open this link in Chrome. In the ⋮ menu, look for <b>Install app</b> or <b>Add to Home screen</b>. If neither is offered, you can keep using Be Hanuman in your browser.</p>:<p>Check your browser’s address bar or menu for an install option. Availability varies by browser. You can keep using Be Hanuman here.</p>}<p>If this link opened inside another app, open it in Safari on iPhone or Chrome on Android first.</p><button type="button" onClick={closeGuide}>Got it</button></dialog></InstallContext.Provider>;
}
