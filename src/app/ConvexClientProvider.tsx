"use client";
import {usePathname} from 'next/navigation';
import InstallProvider from '@/components/InstallProvider';
import LaunchTracking from '@/components/LaunchTracking';
import SimpleMode from "@/components/SimpleMode";
import HanumanIntelligence from "@/components/HanumanIntelligence";
import WelcomeExperience from "@/components/WelcomeExperience";
import OnboardingCompletionMetric from "@/components/OnboardingCompletionMetric";
import AppTour from "@/components/AppTour";
import ReadingSavePrompt from "@/components/ReadingSavePrompt";
import LearningApp from "@/components/LearningApp";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import {useEffect,useState,type ReactNode} from "react";
import AccountPanel from "@/components/AccountPanel";
const client = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function AppRuntime(){
 const [ready,setReady]=useState(false);
 useEffect(()=>{const done=()=>setReady(true);window.addEventListener('bh:ready',done);const frame=requestAnimationFrame(()=>{if(document.documentElement.dataset.rendererReady==='1')done();});return()=>{cancelAnimationFrame(frame);window.removeEventListener('bh:ready',done);};},[]);
 return ready?<><LaunchTracking/><AccountPanel/><LearningApp/><HanumanIntelligence/><ReadingSavePrompt/><WelcomeExperience/><AppTour/><OnboardingCompletionMetric/><SimpleMode/></>:null;
}
export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const appPage=usePathname()==='/app';
  return <ConvexAuthProvider client={client}><InstallProvider>{children}{appPage&&<AppRuntime/>}</InstallProvider></ConvexAuthProvider>;
}
