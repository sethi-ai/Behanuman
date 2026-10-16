"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";

type Snapshot = Record<string, string>;
type State = { snapshot: Snapshot; revision: number };
type Round = { eventId: string; date: string };
const KEYS = ["bh_user", "bh_sk2", "bh_dg", "bh_onb", "bh_rounds", "bh_sank", "bh_journey"];
const OWNER = "bh_cloud_owner", GUEST = "bh_cloud_guest_backup", DEVICE = "bh_cloud_device";
function readSnapshot(): Snapshot { const result: Snapshot = {}; for (const key of KEYS) { const value = localStorage.getItem(key); if (value !== null) result[key] = key === "bh_user" ? JSON.stringify({name:String(JSON.parse(value).name||"").slice(0,60)}) : value; } return result; }
function readQueue(owner: string): Round[] { try { return JSON.parse(localStorage.getItem(`bh_cloud_rounds_${owner}`) ?? "[]"); } catch { return []; } }
function writeQueue(owner: string, queue: Round[]) { localStorage.setItem(`bh_cloud_rounds_${owner}`, JSON.stringify(queue)); }
function baseSnapshot(snapshot: Snapshot, queue: Round[]) {
  const copy = { ...snapshot }, counts = JSON.parse(copy.bh_rounds || "{}");
  for (const round of queue) counts[round.date] = Math.max(0, (counts[round.date] ?? 0) - 1);
  copy.bh_rounds = JSON.stringify(counts); return copy;
}
function applySnapshot(snapshot: Snapshot, queue: Round[] = []) {
  const merged = { ...snapshot }, counts = JSON.parse(merged.bh_rounds || "{}");
  for (const round of queue) counts[round.date] = (counts[round.date] ?? 0) + 1;
  merged.bh_rounds = JSON.stringify(counts);
  for (const key of KEYS) { if (merged[key] !== undefined) localStorage.setItem(key, merged[key]); else localStorage.removeItem(key); }
  window.dispatchEvent(new Event("bh:restore"));
}
export default function AccountPanel() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const account = useQuery(api.practice.get, isAuthenticated ? {} : "skip");
  const status = useQuery(api.practice.status, {});
  const bootstrap = useMutation(api.practice.bootstrap), save = useMutation(api.practice.save), recordRound = useMutation(api.practice.recordRound);
  const deleteAccount = useMutation(api.accountDeletion.request);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [slot, setSlot] = useState<HTMLElement | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [ready, setReady] = useState(false), [mergeChoice, setMergeChoice] = useState(false);
  const base = useRef<State | null>(null), owner = useRef<string | null>(null), syncing = useRef(false), started = useRef(false), initializing = useRef(false), flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(async () => {
    const userId = owner.current; if (!userId || !base.current || syncing.current) return;
    syncing.current = true;
    try {
      setMessage("Saving…");
      let queue = readQueue(userId);
      while (queue.length) {
        if (owner.current !== userId) return;
        const state = await recordRound(queue[0]);
        if (owner.current !== userId) return;
        // Re-read: another completed round may have joined the queue while online.
        queue = readQueue(userId).filter(r => r.eventId !== queue[0].eventId);
        writeQueue(userId, queue); base.current = state;
        const local = readSnapshot(); applySnapshot({ ...state.snapshot, ...Object.fromEntries(Object.entries(local).filter(([k]) => k !== "bh_rounds")) }, queue);
      }
      const changes: Snapshot = {};
      const local = readSnapshot();
      for (const key of KEYS) if (key !== "bh_rounds" && local[key] !== undefined && local[key] !== base.current.snapshot[key]) changes[key] = local[key];
      if (Object.keys(changes).length) {
        let result = await save({ changes, revision: base.current.revision }); base.current = result.state;
        if (!result.saved) { result = await save({ changes, revision: result.state.revision }); base.current = result.state; }
        if (!result.saved) { setMessage("Another device updated your practice. Your changes are kept here; tap Save again."); return; }
      }
      localStorage.setItem(`bh_cloud_base_${userId}`, JSON.stringify(base.current.snapshot));
      setMessage("Practice saved to your account.");
    } catch { setMessage("Couldn’t connect. Your practice is kept on this device; tap Save to retry."); }
    finally { syncing.current = false; setSyncVersion(value => value + 1); }
  }, [recordRound, save]);
  const initialize = useCallback(async (merge: boolean) => {
    if (!account || initializing.current) return;
    initializing.current = true; setBusy(true);
    try {
      const previousOwner = localStorage.getItem(OWNER), local = readSnapshot();
      const cached: Snapshot = JSON.parse(localStorage.getItem(`bh_cloud_base_${account.userId}`) || "{}");
      const offlineChanges = previousOwner === account.userId ? Object.fromEntries(Object.entries(local).filter(([key, value]) => key !== "bh_rounds" && value !== cached[key])) : {};
      if (!previousOwner) localStorage.setItem(GUEST, JSON.stringify(local));
      const guestQueue = previousOwner === account.userId ? [] : readQueue("guest");
      const queue = [...readQueue(account.userId), ...(merge ? guestQueue : [])];
      const deviceId = localStorage.getItem(DEVICE) || crypto.randomUUID(); localStorage.setItem(DEVICE, deviceId);
      const snapshot = baseSnapshot(local, queue);
      let state = await bootstrap({ snapshot, deviceId, merge });
      if(sessionStorage.getItem("bh_welcome_auth")){const changes:Snapshot={bh_onb:"1",bh_journey:local.bh_journey};if(local.bh_sk2)changes.bh_sk2=local.bh_sk2;if(local.bh_user)changes.bh_user=local.bh_user;const result=await save({changes,revision:state.revision});if(!result.saved)throw Error("Practice changed during welcome");state=result.state;}
      writeQueue(account.userId, queue); writeQueue("guest", []);
      localStorage.setItem(OWNER, account.userId); owner.current = account.userId; base.current = state;
      localStorage.setItem(`bh_cloud_base_${account.userId}`, JSON.stringify(state.snapshot));
      applySnapshot({ ...state.snapshot, ...offlineChanges }, queue); setReady(true); setMergeChoice(false);
      setMessage("Practice saved to your account."); window.dispatchEvent(new Event("bh:account-ready")); void flush();
    } catch { started.current = false; setMessage("Couldn’t load your account. Your device’s practice is unchanged.");window.dispatchEvent(new Event("bh:open-account")); }
    finally { initializing.current = false; setBusy(false); }
  }, [account, bootstrap, flush, save]);
  useEffect(() => {
    const attach = () => setSlot(document.getElementById("cloud-account"));
    const frame = requestAnimationFrame(attach); window.addEventListener("bh:ready", attach);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("bh:ready", attach); };
  }, []);
  useEffect(() => {
    if (owner.current && owner.current !== account?.userId) { owner.current = null; base.current = null; started.current = false; }
  }, [account?.userId]);
  useEffect(() => {
    if (!account || started.current || !slot) return;
    const frame = requestAnimationFrame(() => {
      started.current = true;
      const priorOwner = localStorage.getItem(OWNER);
      if (priorOwner && priorOwner !== account.userId) { const guest = JSON.parse(localStorage.getItem(GUEST) || "{}"); applySnapshot(guest); localStorage.removeItem(OWNER); }
      if (!sessionStorage.getItem("bh_welcome_auth") && account.state && priorOwner !== account.userId && Object.keys(readSnapshot()).some(k => k === "bh_sk2" || k === "bh_rounds")) {
        setMergeChoice(true); window.dispatchEvent(new Event("bh:open-account"));
      } else void initialize(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [account, initialize, slot]);
  // Apply updates from other sessions while preserving unsent edits.
  useEffect(() => {
    if (!ready || !account?.state || owner.current !== account.userId || !base.current || syncing.current) return;
    if (account.state.revision <= base.current.revision) return;
    const local = readSnapshot();
    const pending = Object.fromEntries(Object.entries(local).filter(([key, value]) => key !== "bh_rounds" && value !== base.current!.snapshot[key]));
    base.current = account.state;
    localStorage.setItem(`bh_cloud_base_${account.userId}`, JSON.stringify(account.state.snapshot));
    applySnapshot({ ...account.state.snapshot, ...pending }, readQueue(account.userId));
  }, [account, ready, syncVersion]);
  useEffect(() => {
    const schedule = () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => void flush(), 500);
    };
    const round = (event: Event) => {
      const detail = (event as CustomEvent<Round>).detail, key = owner.current || "guest";
      const queue = readQueue(key); if (!queue.some(r => r.eventId === detail.eventId)) writeQueue(key, [...queue, detail]); schedule();
    };
    document.addEventListener("click", schedule); document.addEventListener("keyup", schedule); window.addEventListener("bh:round", round); window.addEventListener("online", schedule);
    return () => { document.removeEventListener("click", schedule); document.removeEventListener("keyup", schedule); window.removeEventListener("bh:round", round); window.removeEventListener("online", schedule); if (flushTimer.current) clearTimeout(flushTimer.current); };
  }, [flush]);
  useEffect(() => {
    const reset = async () => {
      setBusy(true);
      try {
        await signOut();
        owner.current = null; base.current = null; started.current = false;
        if (flushTimer.current) clearTimeout(flushTimer.current);
        for (const storage of [localStorage, sessionStorage]) {
          const keys = Array.from({length: storage.length}, (_, i) => storage.key(i)).filter((key): key is string => !!key && key.startsWith('bh_'));
          for (const key of keys) storage.removeItem(key);
        }
        window.location.reload();
      } catch { setMessage('Could not reset this device. Please try again. Your account is unchanged.'); setBusy(false); }
    };
    window.addEventListener('bh:reset-device', reset);
    return () => window.removeEventListener('bh:reset-device', reset);
  }, [signOut]);
  const logout = async () => {
    await flush(); await signOut();
    owner.current = null; base.current = null; started.current = false; setReady(false); setMergeChoice(false); localStorage.removeItem(OWNER);
    applySnapshot(JSON.parse(localStorage.getItem(GUEST) || "{}")); setMessage("Signed out. You can keep chanting as a guest.");
  };
  const removeAccount = async () => {
    setBusy(true);
    try {
      await deleteAccount({ confirmation: "DELETE" }); await signOut();
      owner.current = null; base.current = null; started.current = false; setReady(false); localStorage.removeItem(OWNER);
      applySnapshot(JSON.parse(localStorage.getItem(GUEST) || "{}")); setConfirmDelete(false); setMessage("Your account and saved practice are being removed.");
    } catch { setMessage("Couldn’t remove the account. Please try again."); }
    finally { setBusy(false); }
  };
  if (!slot) return null;
  return createPortal(<section className="cloud-account" aria-label="Account and saved practice">
    <h4>Account & saved practice</h4>
    {isLoading ? <p>Checking your account…</p> : isAuthenticated ? <>
      <p>Signed in{account?.email ? ` as ${account.email}` : ""}.</p>
      {!ready&&!mergeChoice&&!busy&&<button onClick={()=>void initialize(true)}>Retry loading practice</button>}
      {mergeChoice ? <><p>This device also has practice saved. Would you like to keep it in this account?</p><button onClick={() => void initialize(true)} disabled={busy}>Keep this device’s practice</button><button onClick={() => void initialize(false)} disabled={busy}>Use account practice</button></> : <button onClick={() => void flush()} disabled={!ready || busy}>Save practice</button>}
      <button onClick={() => void logout()} disabled={busy}>Sign out</button>
      <button onClick={() => setConfirmDelete(true)} disabled={busy}>Delete account</button>
      {confirmDelete && <div role="alert"><p>Delete your account and all practice saved to it? This cannot be undone.</p><button onClick={() => void removeAccount()} disabled={busy}>Yes, delete my account</button><button onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</button></div>}
    </> : <><p>Chant as a guest, or sign in to save your practice across devices.</p><button disabled={!status?.googleReady || busy} onClick={async () => { setBusy(true); try { await signIn("google", { redirectTo: window.location.origin + "/" }); } catch { setMessage("Google sign-in couldn’t start. Please try again."); setBusy(false); } }}>Continue with Google</button>{status && !status.googleReady && <p className="cloud-note">Google sign-in is being connected. Guest chanting is ready to use.</p>}</>}
    {message && <p role="status">{message}</p>}
  </section>, slot);
}
