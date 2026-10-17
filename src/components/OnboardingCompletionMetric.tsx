"use client";
import {useEffect} from 'react';
import {useMutation} from 'convex/react';
import {api} from '../../convex/_generated/api';
export default function OnboardingCompletionMetric(){
 const record=useMutation(api.onboardingMetrics.recordCompletion);
 useEffect(()=>{
  let active=true;
  async function flush(){
   try{
    const eventId=localStorage.getItem('bh_phone_completion_pending');
    if(!eventId)return;
    const test=new URLSearchParams(window.location.search).get('qa')==='1';
    await record({eventId,path:'phone_flow',completed:true,version:3,test});
    if(active){localStorage.setItem('bh_phone_completion_sent',eventId);localStorage.removeItem('bh_phone_completion_pending');}
   }catch{/* Aggregate-only telemetry must never block a person's journey. Retry on next visit/online. */}
  }
  function completed(){
   try{
    const profile=JSON.parse(localStorage.getItem('bh_demo_profile')||'null');
    if(!profile?.phone?.trim()||localStorage.getItem('bh_phone_completion_sent'))return;
    if(!localStorage.getItem('bh_phone_completion_pending'))localStorage.setItem('bh_phone_completion_pending',crypto.randomUUID());
    void flush();
   }catch{/* Storage unavailable: do not invent a registration. */}
  }
  void flush();window.addEventListener('bh:welcome-complete',completed);window.addEventListener('online',flush);
  return()=>{active=false;window.removeEventListener('bh:welcome-complete',completed);window.removeEventListener('online',flush);};
 },[record]);
 return null;
}
