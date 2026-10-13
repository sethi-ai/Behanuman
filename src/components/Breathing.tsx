"use client";
import { useEffect, useState } from "react";
export default function Breathing({ onChant, intention }: { onChant: () => void; intention: string }) {
  const [tick, setTick] = useState(-1);
  useEffect(() => { if(tick < 0 || tick >= 6) return; const timer = setTimeout(() => setTick(t => t+1),4000); return () => clearTimeout(timer); },[tick]);
  const label = tick < 0 ? "Tap to start" : tick >= 6 ? "Chant now" : tick % 2 === 0 ? "Breathe in" : "Breathe out";
  return <div className="breathing"><button className={`orb ${tick >= 0 && tick < 6 && tick % 2 === 0 ? "inhale" : ""}`} aria-label={`${label}${tick >= 0 && tick < 6 ? `, round ${Math.floor(tick/2)+1} of 3` : ""}`} onClick={() => { if(tick < 0) setTick(0); else if(tick >= 6) onChant(); }}><span className="orb-glow"/><span className="orb-core"/><span className="orb-label" aria-live="polite">{label}<small>{tick >= 0 && tick < 6 ? `${Math.floor(tick/2)+1}/3` : "\u00a0"}</small></span></button><p className="intention-line">Read your intention{intention && <em>“{intention}”</em>}</p></div>;
}
