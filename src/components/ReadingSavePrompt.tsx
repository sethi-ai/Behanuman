"use client";
import {markLaunchLogin} from '@/lib/launchContext';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useAuthActions} from '@convex-dev/auth/react';
import {useConvexAuth,useQuery} from 'convex/react';
import {api} from '../../convex/_generated/api';

export default function ReadingSavePrompt(){
 const {isAuthenticated,isLoading}=useConvexAuth();
 const {signIn}=useAuthActions();
 const status=useQuery(api.practice.status,{});
 const [host,setHost]=useState<HTMLElement|null>(null);
 useEffect(()=>{const frame=requestAnimationFrame(()=>setHost(document.body));return()=>cancelAnimationFrame(frame);},[]);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),previousFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{const complete=()=>{if(!isAuthenticated&&!isLoading){setError('');setOpen(true);}};window.addEventListener('bh:round',complete);return()=>window.removeEventListener('bh:round',complete);},[isAuthenticated,isLoading]);
 useEffect(()=>{const el=dialog.current;if(!el)return;if(open&&!isAuthenticated){previousFocus.current=document.activeElement as HTMLElement;el.showModal();}else if(el.open){el.close();previousFocus.current?.focus();}return()=>{if(el.open)el.close();};},[open,isAuthenticated,host]);
 async function login(){setBusy(true);try{markLaunchLogin();await signIn('google',{redirectTo:window.location.origin+'/'});}catch{setError('Google sign-in could not start. Your reading is kept on this device.');setBusy(false);}}
 if(!host)return null;
 return createPortal(<dialog ref={dialog} className="reading-save-dialog" aria-labelledby="reading-save-title" onCancel={()=>setOpen(false)}><h2 id="reading-save-title">Carry your practice with you</h2><p>You have completed a reading. Sign in with Google to save your progress and Sankalp to your account and continue on another device.</p><p className="learning-note">Without signing in, your practice stays only in this browser and may be lost if its storage is cleared.</p><button disabled={busy||!status?.googleReady} onClick={()=>void login()}>Continue with Google</button>{status&&!status.googleReady&&<p role="status">Google sign-in is still being connected on this test version.</p>}<button disabled={busy} onClick={()=>setOpen(false)}>Continue without saving to an account</button>{error&&<p role="alert">{error}</p>}</dialog>,host);
}
