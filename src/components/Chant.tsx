"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DECK, DECK_SIZE } from "@/lib/deck";
import Card, { type Lang } from "./Card";

const STORE = { pos: "bh_pos", lang: "bh_lang" };
const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

export default function Chant({ onFinish, onRound, theme, music, hideMeaning, hideExplanation }: { onFinish: () => void; onRound: () => void; theme: string; music: boolean; hideMeaning: boolean; hideExplanation: boolean }) {
  const [cur, setCur] = useState(0);
  const [lang, setLang] = useState<Lang>("hing");
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const start = useRef<{ y: number; t: number } | null>(null);
  const lock = useRef(false);
  const runNext = useRef<number | null>(null);
  const voice = useRef<HTMLAudioElement | null>(null);
  const [muted,setMuted] = useState(false);
  const [replay,setReplay] = useState(0);

  // Restore saved position and language after mount (never during render, to avoid hydration mismatch).
  useEffect(() => {
    const frame=requestAnimationFrame(()=>{
    const p = parseInt(read(STORE.pos) ?? "", 10)-1;
    if (p >= 0 && p < DECK_SIZE) setCur(p);
    if (read(STORE.lang) === "hi") setLang("hi");
    setReady(true);
    });
    return ()=>cancelAnimationFrame(frame);
  }, []);

  const goTo = useCallback((n: number) => {
    const t = Math.max(0, Math.min(DECK_SIZE - 1, n));
    setCur(t);
    setDy(0);
    write(STORE.pos, String(t+1));
    try { sessionStorage.setItem("bh_card_s",String(t+1)); } catch {}
    if(t===0) runNext.current=1;
    else if(t===runNext.current) { if(t===DECK_SIZE-1) { onRound();runNext.current=null; } else runNext.current=t+1; }
    else if(runNext.current!==null && t>runNext.current) runNext.current=null;
  }, [onRound]);

  const step = useCallback(
    (d: number) => {
      if (lock.current) return;
      lock.current = true;
      setTimeout(() => (lock.current = false), 450);
      if(cur===DECK_SIZE-1&&d>0) onFinish(); else goTo(cur + d);
    },
    [cur, goTo, onFinish],
  );

  useEffect(() => {
    if(cur===0 && ready) runNext.current=1;
  },[cur,ready]);
  useEffect(() => {
    if(!ready || !music || muted) return;
    const clips=cur===0?["d1"]:cur===1?["d2"]:cur===42?["d41"]:cur===43?["j1","j2"]:[`c${cur-1}`];
    const audio=voice.current;if(!audio)return;audio.src=`/audio/${clips[0]}.mp3`;let i=0;
    audio.onended=()=>{ if(++i<clips.length){audio.src=`/audio/${clips[i]}.mp3`;void audio.play().catch(()=>{});} };
    audio.volume=Number(read("bh_vol")??100)/100;
    void audio.play().catch(()=>{});
    return ()=>{audio.pause();audio.onended=null;};
  },[cur,ready,music,muted,replay]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") step(1);
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { y: e.clientY, t: Date.now() };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    let d = e.clientY - start.current.y;
    if ((cur === 0 && d > 0) || (cur === DECK_SIZE - 1 && d < 0)) d *= 0.25; // rubber band at the ends
    setDy(d);
  };
  const onUp = () => {
    if (!start.current) return;
    const h = 600;
    const speed = Math.abs(dy) / Math.max(1, Date.now() - start.current.t);
    start.current = null;
    setDragging(false);
    if (Math.abs(dy) > h * 0.18 || speed > 0.5) {
      if (dy < 0) { if(cur===DECK_SIZE-1) return onFinish(); return goTo(cur + 1); }
      if (dy > 0 && cur > 0) return goTo(cur - 1);
    }
    setDy(0);
  };
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 24) step(e.deltaY > 0 ? 1 : -1);
  };

  const h = 600;
  const p = Math.min(1, Math.abs(dy) / h);
  const up = dy < 0 ? p : 0;
  const down = dy > 0 ? p : 0;

  const style = (rel: number): React.CSSProperties => {
    if (rel === 0) return { zIndex: 20, transform: `translate3d(0,${Math.min(dy, 0)}px,0) scale(${1 - 0.06 * down})`, borderRadius: down * 20 };
    if (rel === -1) return { zIndex: 30, transform: `translate3d(0,calc(-100% + ${Math.max(dy, 0)}px),0)` };
    return { zIndex: 10, borderRadius: (1 - up) * 20, transform: `translate3d(0,${(1 - up) * 0.03 * h}px,0) scale(${0.94 + 0.06 * up})` };
  };

  const card = DECK[cur];
  const count = `${cur + 1} / ${DECK_SIZE}`;

  return (
    <div
      ref={stage}
      className={`app${dragging ? " dragging" : ""}${hideMeaning?" hide-meaning":""}${hideExplanation?" hide-explanation":""}`}
      style={{ visibility: ready ? "visible" : "hidden" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
    >
      <audio ref={voice} preload="auto" aria-label="Verse recitation" />
      {[cur - 1, cur, cur + 1].map((i) =>
        i >= 0 && i < DECK_SIZE ? (
          <div key={DECK[i].id} className="card-slot" data-current={i===cur} aria-hidden={i!==cur} style={{ position: "absolute", inset: 0, ...style(i - cur) }}>
            <Card card={DECK[i]} lang={lang} index={i} theme={theme} />
          </div>
        ) : null,
      )}

      <header className="top">
        <div className="tl">
          <button
            className="pill"
            onClick={() => {
              const n: Lang = lang === "hing" ? "hi" : "hing";
              setLang(n);
              write(STORE.lang, n);
            }}
            aria-label="Switch between English and Hindi"
          >
            {lang === "hing" ? "हिन्दी" : "English"}
          </button>
        </div>
        <b>Be Hanuman</b>
        <span>|| Hanuman Chalisa ||</span>
        <div className="voice-controls"><button className="pill" onClick={()=>setMuted(v=>!v)} aria-label={muted?"Unmute voice":"Mute voice"}>{muted?"Unmute":"Mute"}</button><button className="pill" onClick={()=>{setMuted(false);setReplay(v=>v+1);}}>Replay</button></div>
      </header>

      <div className="foot">
        <div className="mid">
          <b>{card.label}</b>
          {count}
        </div>
        <span />
        <button className="pill" onClick={() => goTo(0)} aria-label="Restart from the beginning">
          ↺ Restart
        </button>
        {cur===DECK_SIZE-1&&<button className="pill finish-chant" onClick={onFinish}>{Number(read("bh_round")??1)<Number(read("bh_dg")??1)?`Complete round ${read("bh_round")??1} of ${read("bh_dg")??1}`:"Complete Sankalp"}</button>}
      </div>
    </div>
  );
}

