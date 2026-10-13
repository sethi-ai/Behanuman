export const read = (key: string, fallback = "") => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
export const write = (key: string, value: string | number) => { try { localStorage.setItem(key, String(value)); } catch {} };
export function stored<T>(key: string, fallback: T): T { try { return JSON.parse(read(key)) ?? fallback; } catch { return fallback; } }
export function clearProfile() { try { Object.keys(localStorage).filter(k => k.startsWith("bh_")).forEach(k => localStorage.removeItem(k)); Object.keys(sessionStorage).filter(k => k.startsWith("bh_")).forEach(k => sessionStorage.removeItem(k)); } catch {} }
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export type Sankalp = { intent: string; promise: string; days: number; start: string; ts: number };
export function dayOf(s: Sankalp) { const today = new Date(dateKey()+"T00:00:00"); return Math.round((+today - +new Date(s.start+"T00:00:00"))/86400000)+1; }
export function clipsFor(index: number) { return index === 0 ? ["d1"] : index === 1 ? ["d2"] : index === 42 ? ["d41"] : index === 43 ? ["j1","j2"] : [`c${index-1}`]; }
