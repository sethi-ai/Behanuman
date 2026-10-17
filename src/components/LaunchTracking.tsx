"use client";
import {useEffect} from 'react';
import {useConvexAuth,useMutation} from 'convex/react';
import {api} from '../../convex/_generated/api';
import {launchContext} from '@/lib/launchContext';
export default function LaunchTracking(){const {isAuthenticated,isLoading}=useConvexAuth(),visit=useMutation(api.launchTracking.visit);
 useEffect(()=>{if(isLoading)return;let active=true;const record=async()=>{try{const deviceId=localStorage.getItem('bh_launch_device')||crypto.randomUUID();localStorage.setItem('bh_launch_device',deviceId);if(isAuthenticated){const pending=JSON.parse(sessionStorage.getItem('bh_launch_login_pending')||'null');if(!pending)return;const receipt=await visit({kind:'login',deviceId,...pending});if(active&&receipt.saved&&sessionStorage.getItem('bh_launch_login_pending')===JSON.stringify(pending))sessionStorage.removeItem('bh_launch_login_pending');}else{const eventId=sessionStorage.getItem('bh_launch_guest_event')||crypto.randomUUID();sessionStorage.setItem('bh_launch_guest_event',eventId);await visit({kind:'guest',deviceId,eventId,...launchContext()});}}catch{/* Counting never blocks reading or progress sync. */}};void record();window.addEventListener('online',record);return()=>{active=false;window.removeEventListener('online',record);};},[isLoading,isAuthenticated,visit]);return null;}
