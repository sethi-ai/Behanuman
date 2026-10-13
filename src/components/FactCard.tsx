"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import facts from "@/data/dyk.json";
import { stored, read, write } from "@/lib/storage";
import Breathing from "./Breathing";
const poses=["book","book","om-gift","magnifying-glass","hero-a","diya","magnifying-glass","book","diya","hero-b","om-gift","sun-thought","lotus-leaf","lotus-leaf","om-gift","hero-b","hero-a","lotus-leaf","hero-b","book","diya"];
export default function FactCard({theme,intention,onChant}:{theme:string;intention:string;onChant:()=>void}) {
 const [index]=useState(()=>{let order=stored<number[]>("bh_fq",[]),i=Number(read("bh_fi","0"));if(!order.length||i>=order.length){order=facts.map((_,n)=>n);for(let n=order.length-1;n>0;n--){const j=Math.floor(Math.random()*(n+1));[order[n],order[j]]=[order[j],order[n]];}i=0;}write("bh_fq",JSON.stringify(order));write("bh_fi",i+1);return order[i];});
 const swipe=useRef<number|null>(null);
 const f=facts[index];
 return <main className="fact-panel" onTouchStart={e=>{if(!(e.target as HTMLElement).closest("button"))swipe.current=e.touches[0].clientY;}} onTouchEnd={e=>{if(swipe.current!==null&&swipe.current-e.changedTouches[0].clientY>50)onChant();swipe.current=null;}}><h3>Did you know?</h3><img className="ui-art" alt="" src={`/images/dyk/${poses[index]}-${theme==="light"?"light":"dark"}.webp`}/><h2>{f[0]}</h2><p>{f[1]}</p><Breathing intention={intention} onChant={onChant}/><p className="swipe-hint">Swipe up to chant ↑</p></main>;
}

