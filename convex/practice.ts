import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const KEYS = new Set(["bh_user", "bh_sk2", "bh_dg", "bh_onb", "bh_rounds", "bh_sank", "bh_journey"]);
const snapshotValidator = v.record(v.string(), v.string());
const stateValidator = v.object({ snapshot: snapshotValidator, revision: v.number() });
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
async function currentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId || !await ctx.db.get(userId)) return null;
  const deleting = await ctx.db.query("accountDeletions").withIndex("by_userId", q => q.eq("userId", userId)).unique();
  return deleting ? null : userId;
}
function validate(snapshot: Record<string, string>) {
  if (JSON.stringify(snapshot).length > 100_000) throw new ConvexError("Practice history is too large to sync.");
  for (const [key, value] of Object.entries(snapshot)) {
    if (!KEYS.has(key) || value.length > 80_000) throw new ConvexError("Invalid practice data.");
    if (key === "bh_rounds" || key === "bh_sank") counts(value);
    if (key === "bh_user" && value) { const user = JSON.parse(value); if (typeof user.name !== "string" || user.name.length > 60 || Object.keys(user).some(key=>key!=="name")) throw new ConvexError("Invalid profile."); }
    if (key === "bh_sk2" && value) {
      const sankalp = JSON.parse(value);
      if (!sankalp || typeof sankalp !== "object" || ![3, 7, 11, 21, 40].includes(sankalp.days) || typeof sankalp.start !== "string" || !datePattern.test(sankalp.start) || typeof sankalp.intent !== "string" || sankalp.intent.length > 140 || typeof sankalp.promise !== "string" || sankalp.promise.length > 140) throw new ConvexError("Invalid sankalp.");
    }
    if(key === "bh_journey"){const j=JSON.parse(value);if(!j||!Object.keys(j).every(k=>["tab","days","start"].includes(k))||!["chant","learn"].includes(j.tab)||!(j.days===null||[3,7,11,21].includes(j.days))||(j.tab==="learn"&&j.days!==null&&j.days!==21)||!(j.start===null||typeof j.start==="string"&&datePattern.test(j.start)))throw new ConvexError("Invalid journey.");}
    if (key === "bh_dg" && !["1", "3", "7", "11", "21"].includes(value)) throw new ConvexError("Invalid daily goal.");
  }
}
function counts(value?: string): Record<string, number> {
  if (!value) return {};
  const result = JSON.parse(value);
  if (!result || Array.isArray(result) || typeof result !== "object" || Object.keys(result).length > 3650) throw new ConvexError("Invalid history.");
  for (const [day, count] of Object.entries(result)) if (!datePattern.test(day) || !Number.isInteger(count) || Number(count) < 0 || Number(count) > 100_000) throw new ConvexError("Invalid history.");
  return result;
}
function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
async function activity(ctx: MutationCtx, userId: Id<"users">, isNew: boolean) {
  const date = today();
  const prior = await ctx.db.query("activeDays").withIndex("by_userId_and_date", q => q.eq("userId", userId).eq("date", date)).unique();
  if (prior) return;
  await ctx.db.insert("activeDays", { userId, date });
  const metric = await ctx.db.query("dailyMetrics").withIndex("by_date", q => q.eq("date", date)).unique();
  if (metric) await ctx.db.patch(metric._id, { activeUsers: metric.activeUsers + 1, newUsers: metric.newUsers + Number(isNew) });
  else await ctx.db.insert("dailyMetrics", { date, activeUsers: 1, newUsers: Number(isNew), rounds: 0 });
}
export const status = query({ args: {}, returns: v.object({ googleReady: v.boolean() }), handler: async () => ({ googleReady: !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET }) });
export const get = query({
  args: {}, returns: v.union(v.null(), v.object({ userId: v.id("users"), email: v.optional(v.string()), state: v.union(v.null(), stateValidator) })),
  handler: async ctx => {
    const userId = await currentUser(ctx); if (!userId) return null;
    const user = await ctx.db.get(userId);
    const state = await ctx.db.query("practice").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    return { userId, ...(user?.email ? { email: user.email } : {}), state: state ? { snapshot: state.snapshot, revision: state.revision } : null };
  },
});
export const bootstrap = mutation({
  args: { snapshot: snapshotValidator, deviceId: v.string(), merge: v.boolean() }, returns: stateValidator,
  handler: async (ctx, args) => {
    const userId = await currentUser(ctx); if (!userId) throw new ConvexError("Please sign in.");
    if (args.deviceId.length > 80) throw new ConvexError("Invalid device."); validate(args.snapshot);
    const existing = await ctx.db.query("practice").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    const imported = await ctx.db.query("practiceImports").withIndex("by_userId_and_deviceId", q => q.eq("userId", userId).eq("deviceId", args.deviceId)).unique();
    await activity(ctx, userId, !existing);
    let snapshot = existing?.snapshot ?? {};
    if (!imported) {
      await ctx.db.insert("practiceImports", { userId, deviceId: args.deviceId });
      if (args.merge) {
        snapshot = { ...args.snapshot, ...snapshot };
        for (const key of ["bh_rounds", "bh_sank"]) {
          const a = counts(snapshot[key]), b = counts(args.snapshot[key]);
          for (const [day, count] of Object.entries(b)) a[day] = Math.max(a[day] ?? 0, count);
          snapshot[key] = JSON.stringify(a);
        }
      }
    }
    const revision = (existing?.revision ?? 0) + 1;
    if (existing) await ctx.db.patch(existing._id, { snapshot, revision, updatedAt: Date.now() });
    else await ctx.db.insert("practice", { userId, snapshot, revision, updatedAt: Date.now() });
    return { snapshot, revision };
  },
});
export const save = mutation({
  args: { changes: snapshotValidator, revision: v.number() }, returns: v.object({ saved: v.boolean(), state: stateValidator }),
  handler: async (ctx, args) => {
    const userId = await currentUser(ctx); if (!userId) throw new ConvexError("Please sign in."); validate(args.changes);
    if ("bh_rounds" in args.changes) throw new ConvexError("Rounds must be recorded individually.");
    const state = await ctx.db.query("practice").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (!state) throw new ConvexError("Load your account first.");
    if (state.revision !== args.revision) return { saved: false, state: { snapshot: state.snapshot, revision: state.revision } };
    const snapshot = { ...state.snapshot, ...args.changes }, revision = state.revision + 1; validate(snapshot);
    await ctx.db.patch(state._id, { snapshot, revision, updatedAt: Date.now() });
    return { saved: true, state: { snapshot, revision } };
  },
});
export const recordRound = mutation({
  args: { eventId: v.string(), date: v.string() }, returns: stateValidator,
  handler: async (ctx, args) => {
    const userId = await currentUser(ctx); if (!userId) throw new ConvexError("Please sign in.");
    if (!datePattern.test(args.date) || args.eventId.length < 8 || args.eventId.length > 100) throw new ConvexError("Invalid round.");
    const state = await ctx.db.query("practice").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (!state) throw new ConvexError("Load your account first.");
    const prior = await ctx.db.query("roundEvents").withIndex("by_userId_and_eventId", q => q.eq("userId", userId).eq("eventId", args.eventId)).unique();
    if (prior) return { snapshot: state.snapshot, revision: state.revision };
    await ctx.db.insert("roundEvents", { userId, ...args });
    const rounds = counts(state.snapshot.bh_rounds); rounds[args.date] = (rounds[args.date] ?? 0) + 1;
    const snapshot = { ...state.snapshot, bh_rounds: JSON.stringify(rounds) }, revision = state.revision + 1; validate(snapshot);
    await ctx.db.patch(state._id, { snapshot, revision, updatedAt: Date.now() });
    await activity(ctx, userId, false);
    const date = today(), metric = await ctx.db.query("dailyMetrics").withIndex("by_date", q => q.eq("date", date)).unique();
    if (metric) await ctx.db.patch(metric._id, { rounds: metric.rounds + 1 });
    return { snapshot, revision };
  },
});
export const ownerReport = query({
  args: {}, returns: v.array(v.object({ date: v.string(), newUsers: v.number(), activeUsers: v.number(), rounds: v.number() })),
  handler: async ctx => {
    const userId = await currentUser(ctx);
    if (!process.env.OWNER_USER_ID || userId !== process.env.OWNER_USER_ID) throw new ConvexError("Owner access required.");
    const rows = await ctx.db.query("dailyMetrics").withIndex("by_date").order("desc").take(30);
    return rows.map(({ date, newUsers, activeUsers, rounds }) => ({ date, newUsers, activeUsers, rounds }));
  },
});
