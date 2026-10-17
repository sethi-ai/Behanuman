import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
export const request = mutation({
  args: { confirmation: v.literal("DELETE") }, returns: v.null(),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx); if (!userId || !await ctx.db.get(userId)) throw new ConvexError("Please sign in.");
    const existing = await ctx.db.query("accountDeletions").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (!existing) { const jobId = await ctx.db.insert("accountDeletions", { userId }); await ctx.scheduler.runAfter(0, internal.accountDeletion.purge, { jobId }); }
    return null;
  },
});
export const purge = internalMutation({
  args: { jobId: v.id("accountDeletions") }, returns: v.null(),
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId); if (!job) return null; const userId = job.userId;
    const again = async () => { await ctx.scheduler.runAfter(0, internal.accountDeletion.purge, { jobId }); return null; };
    for(const table of ['launchPeople','launchEvents','hiUserQuotas'] as const){const rows=await ctx.db.query(table).withIndex('by_userId',q=>q.eq('userId',userId)).take(100);for(const row of rows)await ctx.db.delete(row._id);if(rows.length===100)return again();}
    const hiRequests=await ctx.db.query('hiReflectionRequests').withIndex('by_user_request',q=>q.eq('userId',userId)).take(100);for(const row of hiRequests)await ctx.db.delete(row._id);if(hiRequests.length===100)return again();
    const launchGuests=await ctx.db.query('launchGuests').withIndex('by_userId',q=>q.eq('userId',userId)).take(100);for(const row of launchGuests)await ctx.db.patch(row._id,{userId:undefined});if(launchGuests.length===100)return again();
    const learningImports = await ctx.db.query("learningImports").withIndex("by_userId_and_deviceId", q => q.eq("userId", userId)).take(100);
    for (const row of learningImports) await ctx.db.delete(row._id); if (learningImports.length === 100) return again();
    const learning = await ctx.db.query("learningProgress").withIndex("by_userId", q => q.eq("userId", userId)).unique(); if (learning) await ctx.db.delete(learning._id);
    const events = await ctx.db.query("roundEvents").withIndex("by_userId_and_eventId", q => q.eq("userId", userId)).take(100);
    for (const row of events) await ctx.db.delete(row._id); if (events.length === 100) return again();
    const imports = await ctx.db.query("practiceImports").withIndex("by_userId_and_deviceId", q => q.eq("userId", userId)).take(100);
    for (const row of imports) await ctx.db.delete(row._id); if (imports.length === 100) return again();
    const days = await ctx.db.query("activeDays").withIndex("by_userId_and_date", q => q.eq("userId", userId)).take(100);
    for (const row of days) await ctx.db.delete(row._id); if (days.length === 100) return again();
    const state = await ctx.db.query("practice").withIndex("by_userId", q => q.eq("userId", userId)).unique(); if (state) await ctx.db.delete(state._id);
    const accounts = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", q => q.eq("userId", userId)).take(10);
    for (const account of accounts) {
      const codes = await ctx.db.query("authVerificationCodes").withIndex("accountId", q => q.eq("accountId", account._id)).take(100);
      for (const code of codes) await ctx.db.delete(code._id); if (codes.length === 100) return again();
      await ctx.db.delete(account._id);
    }
    if (accounts.length === 10) return again();
    const sessions = await ctx.db.query("authSessions").withIndex("userId", q => q.eq("userId", userId)).take(10);
    for (const session of sessions) {
      const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", q => q.eq("sessionId", session._id)).take(100);
      for (const token of tokens) await ctx.db.delete(token._id); if (tokens.length === 100) return again();
      const verifiers = await ctx.db.query("authVerifiers").withIndex("by_sessionId", q => q.eq("sessionId", session._id)).take(100);
      for (const verifier of verifiers) await ctx.db.delete(verifier._id); if (verifiers.length === 100) return again();
      await ctx.db.delete(session._id);
    }
    if (sessions.length === 10) return again();
    if (await ctx.db.get(userId)) await ctx.db.delete(userId); await ctx.db.delete(jobId); return null;
  },
});
