import {v} from 'convex/values';
import {internalMutation,internalQuery,type QueryCtx,type MutationCtx} from './_generated/server';
export const ROLLOUT_KEY='test-rollout-2026-10' as const;
const KEY=ROLLOUT_KEY;
export const LIMIT_CENTS=500,RESERVATION_CENTS=1;
// Conservative, non-resetting allowance: reserve one cent before every attempt,
// including failures. No refunds, daily reset, prompts, output or identity fields.
export async function readBudget(ctx:QueryCtx|MutationCtx){return (await ctx.db.query('hiBudget').withIndex('by_key',q=>q.eq('key',KEY)).unique())?.reservedCents??0;}
export async function reserveBudget(ctx:MutationCtx){
 const row=await ctx.db.query('hiBudget').withIndex('by_key',q=>q.eq('key',KEY)).unique();
 const used=row?.reservedCents??0;
 if(!Number.isSafeInteger(used)||used<0||used+RESERVATION_CENTS>LIMIT_CENTS)return false;
 if(row)await ctx.db.patch(row._id,{reservedCents:used+RESERVATION_CENTS});
 else await ctx.db.insert('hiBudget',{key:KEY,reservedCents:RESERVATION_CENTS});
 return true;
}
export const reserve=internalMutation({args:{},returns:v.boolean(),handler:reserveBudget});
export const report=internalQuery({args:{},returns:v.object({limitCents:v.number(),reservedCents:v.number(),remainingAttempts:v.number()}),handler:async ctx=>{
 const row=await ctx.db.query('hiBudget').withIndex('by_key',q=>q.eq('key',KEY)).unique();
 const reservedCents=row?.reservedCents??0;
 return {limitCents:LIMIT_CENTS,reservedCents,remainingAttempts:Math.max(0,Math.floor((LIMIT_CENTS-reservedCents)/RESERVATION_CENTS))};
}});
