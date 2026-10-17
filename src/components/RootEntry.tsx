"use client";
import {useEffect} from 'react';
import {useConvexAuth} from 'convex/react';
import {entryDestination} from '@/lib/entryRouting';
export default function RootEntry(){
 const {isLoading,isAuthenticated}=useConvexAuth();
 useEffect(()=>{
  if(isLoading)return;
  let simpleMode=false,pendingWelcome=false;
  try{if(new URLSearchParams(window.location.search).get('qa')==='1')sessionStorage.setItem('bh_launch_qa','1');simpleMode=localStorage.getItem('bh_simple')==='1';pendingWelcome=!!sessionStorage.getItem('bh_welcome_auth');}catch{}
  // A new document lets the preserved reading renderer bind its handlers once.
  window.location.replace(entryDestination({authenticated:isAuthenticated,simpleMode,pendingWelcome}));
 },[isLoading,isAuthenticated]);
 return <main className="practice-entry-check" role="status">Opening Be Hanuman…</main>;
}
