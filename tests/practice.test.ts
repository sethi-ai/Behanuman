/// <reference types="vite/client" />
import { expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
async function fixture() {
  const t = convexTest(schema, modules);
  const a = await t.run(ctx => ctx.db.insert("users", { name: "A", email: "a@example.test" }));
  const b = await t.run(ctx => ctx.db.insert("users", { name: "B", email: "b@example.test" }));
  return { t, a: t.withIdentity({ subject: a }), b: t.withIdentity({ subject: b }) };
}
const initial = { bh_user: '{"name":"Test"}', bh_onb: "1", bh_dg: "1", bh_rounds: '{"2026-10-12":2}' };
test("guests cannot read or write account practice", async () => {
  const { t } = await fixture(); expect(await t.query(api.practice.get, {})).toBeNull();
  await expect(t.mutation(api.practice.bootstrap, { snapshot: initial, deviceId: "device-a", merge: true })).rejects.toThrow("Please sign in");
});
test("accounts are isolated and importing twice does not duplicate history", async () => {
  const { a, b } = await fixture();
  await a.mutation(api.practice.bootstrap, { snapshot: initial, deviceId: "device-a", merge: true });
  const again = await a.mutation(api.practice.bootstrap, { snapshot: initial, deviceId: "device-a", merge: true });
  expect(JSON.parse(again.snapshot.bh_rounds)["2026-10-12"]).toBe(2);
  expect((await b.query(api.practice.get, {}))?.state).toBeNull();
});
test("round retries count once; distinct device events both count", async () => {
  const { a } = await fixture(); await a.mutation(api.practice.bootstrap, { snapshot: initial, deviceId: "device-a", merge: true });
  await a.mutation(api.practice.recordRound, { eventId: "event-device-a-001", date: "2026-10-12" });
  await a.mutation(api.practice.recordRound, { eventId: "event-device-a-001", date: "2026-10-12" });
  const result = await a.mutation(api.practice.recordRound, { eventId: "event-device-b-001", date: "2026-10-12" });
  expect(JSON.parse(result.snapshot.bh_rounds)["2026-10-12"]).toBe(4);
});
test("a stale settings save cannot overwrite another device", async () => {
  const { a } = await fixture(); const state = await a.mutation(api.practice.bootstrap, { snapshot: initial, deviceId: "device-a", merge: true });
  await a.mutation(api.practice.save, { changes: { bh_dg: "3" }, revision: state.revision });
  const stale = await a.mutation(api.practice.save, { changes: { bh_dg: "7" }, revision: state.revision });
  expect(stale.saved).toBe(false); expect(stale.state.snapshot.bh_dg).toBe("3");
});
test("malformed history and non-owner analytics requests are rejected", async () => {
  const { a } = await fixture();
  await expect(a.mutation(api.practice.bootstrap, { snapshot: { bh_rounds: '{"not-a-date":-1}' }, deviceId: "device-a", merge: true })).rejects.toThrow("Invalid history");
  await expect(a.query(api.practice.ownerReport, {})).rejects.toThrow("Owner access required");
});
test("account deletion blocks stale tokens and preserves other accounts", async () => {
  vi.useFakeTimers();
  try {
    const { t, a, b } = await fixture();
    await a.mutation(api.practice.bootstrap, { snapshot: initial, deviceId: "device-a", merge: true });
    await b.mutation(api.practice.bootstrap, { snapshot: initial, deviceId: "device-b", merge: true });
    await a.mutation(api.accountDeletion.request, { confirmation: "DELETE" });
    expect(await a.query(api.practice.get, {})).toBeNull();
    await expect(a.mutation(api.practice.recordRound, { eventId: "stale-event-001", date: "2026-10-12" })).rejects.toThrow("Please sign in");
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await a.query(api.practice.get, {})).toBeNull();
    expect((await b.query(api.practice.get, {}))?.state?.snapshot.bh_user).toBe(initial.bh_user);
  } finally { vi.useRealTimers(); }
});

test("new journey commitments sync safely and demo phone fields are rejected", async()=>{
 const {a,t}=await fixture();
 const journey=JSON.stringify({tab:'learn',days:21,start:'2026-10-16'});
 const sankalp=JSON.stringify({days:3,start:'2026-10-16',intent:'',promise:''});
 const state=await a.mutation(api.practice.bootstrap,{snapshot:{...initial,bh_journey:journey,bh_sk2:sankalp},deviceId:'welcome-v3',merge:true});
 expect(state.snapshot.bh_journey).toBe(journey);
 expect(JSON.parse(state.snapshot.bh_sk2).days).toBe(3);
 await expect(a.mutation(api.practice.save,{changes:{bh_demo_profile:'{"phone":"9999999999"}'},revision:state.revision})).rejects.toThrow('Invalid practice data');
 await expect(a.mutation(api.practice.save,{changes:{bh_user:'{"name":"A","phone":"9999999999"}'},revision:state.revision})).rejects.toThrow('Invalid profile');
 await expect(a.mutation(api.practice.save,{changes:{bh_journey:'{"tab":"learn","days":7,"start":null}'},revision:state.revision})).rejects.toThrow('Invalid journey');
 expect(await t.query(api.practice.get,{})).toBeNull();
});

test("all wheel durations sync; invalid durations are rejected",async()=>{const {a}=await fixture();let state=await a.mutation(api.practice.bootstrap,{snapshot:initial,deviceId:'wheel',merge:true});for(let days=1;days<=21;days++){const result=await a.mutation(api.practice.save,{changes:{bh_journey:JSON.stringify({tab:'chant',days,start:'2026-10-16'}),bh_sk2:JSON.stringify({days,start:'2026-10-16',intent:'',promise:''})},revision:state.revision});expect(result.saved).toBe(true);state=result.state;}for(const days of [0,22,2.5])await expect(a.mutation(api.practice.save,{changes:{bh_journey:JSON.stringify({tab:'chant',days,start:'2026-10-16'})},revision:state.revision})).rejects.toThrow('Invalid journey');});
