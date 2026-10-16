"use client";
import WelcomeExperience from "@/components/WelcomeExperience";
import AppTour from "@/components/AppTour";
import ReadingSavePrompt from "@/components/ReadingSavePrompt";
import LearningApp from "@/components/LearningApp";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import AccountPanel from "@/components/AccountPanel";
const client = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={client}>{children}<AccountPanel /><LearningApp /><ReadingSavePrompt /><WelcomeExperience /><AppTour /></ConvexAuthProvider>;
}
