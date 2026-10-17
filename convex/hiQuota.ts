import {v} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {query,internalMutation,internalQuery,type QueryCtx,type MutationCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
import {reserveBudget,readBudget,ROLLOUT_KEY} from './hiBudget';
export const USER_LIMIT=3;
const LEASE_MS=60_000;
const admission=v.union(v.literal('allowed'),v.literal('quota_exhausted'),v.literal('budget_exhausted'),v.literal('in_progress'),v.literal('already_submitted'),v.literal('auth_required'),v.literal('unavailable'));
async function validAccount(ctx:QueryCtx|MutationCtx,userId:Id<'users'>){return !!await ctx.db.get(userId)&&!await ctx.db.query('accountDeletions').withIndex('by_userId',q=>q.eq('userId',userId)).unique();}
const quota=(ctx:QueryCtx|MutationCtx,userId:Id<'users'>)=>ctx.db.query('hiUserQuotas').withIndex('by_userId',q=>q.eq('userId',userId)).unique();
const initialized=(ctx:QueryCtx|MutationCtx)=>ctx.db.query('hiQuotaConfig').withIndex('by_key',q=>q.eq('key',ROLLOUT_KEY)).unique();
// Idempotent cutover. Never resets any existing counter or fabricates per-user history.
// A nonzero unassigned historical ledger requires review instead of silently granting three more.
export const initialize=internalMutation({args:{},returns:v.object({ready:v.boolean(),priorReservedCents:v.number()}),handler:async ctx=>{
 const prior=await initialized(ctx);if(prior)return {ready:true,priorReservedCents:prior.priorReservedCents};
 const used=await readBudget(ctx);if(used!==0)return {ready:false,priorReservedCents:used};
 await ctx.db.insert('hiQuotaConfig',{key:ROLLOUT_KEY,startedAt:Date.now(),priorReservedCents:0});return {ready:true,priorReservedCents:0};
}});
export const usage=query({args:{},returns:v.object({limit:v.number(),remaining:v.union(v.number(),v.null()),ready:v.boolean(),activeUntil:v.union(v.number(),v.null())}),handler:async ctx=>{
 const id=await getAuthUserId(ctx);if(!id||!await validAccount(ctx,id))return {limit:USER_LIMIT,remaining:null,ready:false,activeUntil:null};
 const config=await initialized(ctx),row=await quota(ctx,id);return {limit:USER_LIMIT,remaining:config?Math.max(0,USER_LIMIT-(row?.used??0)):null,ready:!!config,activeUntil:row?.activeUntil??null};
}});
export const begin=internalMutation({args:{userId:v.id('users'),requestId:v.string()},returns:admission,handler:async(ctx,{userId,requestId})=>{
 if(!await validAccount(ctx,userId))return 'auth_required';if(!await initialized(ctx))return 'unavailable';
 const row=await quota(ctx,userId),prior=await ctx.db.query('hiReflectionRequests').withIndex('by_user_request',q=>q.eq('userId',userId).eq('requestId',requestId)).unique();
 if(prior)return row?.activeRequestId===requestId&&Number(row.activeUntil)>Date.now()?'in_progress':'already_submitted';
 if(row&&(!Number.isSafeInteger(row.used)||row.used<0))return 'unavailable';
 if((row?.used??0)>=USER_LIMIT)return 'quota_exhausted';
 if(row?.activeUntil&&row.activeUntil>Date.now())return 'in_progress';
 if(await readBudget(ctx)>=500)return 'budget_exhausted';
 const active={activeRequestId:requestId,activeUntil:Date.now()+LEASE_MS};
 if(row)await ctx.db.patch(row._id,active);else await ctx.db.insert('hiUserQuotas',{userId,used:0,...active});
 return 'allowed';
}});
// User allowance and shared budget are committed atomically, only after free token validation.
export const admit=internalMutation({args:{userId:v.id('users'),requestId:v.string()},returns:admission,handler:async(ctx,{userId,requestId})=>{
 if(!await validAccount(ctx,userId))return 'auth_required';
 const row=await quota(ctx,userId);if(!row||row.activeRequestId!==requestId||Number(row.activeUntil)<=Date.now())return 'in_progress';
 const prior=await ctx.db.query('hiReflectionRequests').withIndex('by_user_request',q=>q.eq('userId',userId).eq('requestId',requestId)).unique();if(prior)return 'already_submitted';
 if(!Number.isSafeInteger(row.used)||row.used<0)return 'unavailable';if(row.used>=USER_LIMIT)return 'quota_exhausted';
 if(!await reserveBudget(ctx))return 'budget_exhausted';
 await ctx.db.insert('hiReflectionRequests',{userId,requestId,admittedAt:Date.now()});await ctx.db.patch(row._id,{used:row.used+1});return 'allowed';
}});
export const finish=internalMutation({args:{userId:v.id('users'),requestId:v.string()},returns:v.null(),handler:async(ctx,{userId,requestId})=>{const row=await quota(ctx,userId);if(row?.activeRequestId===requestId)await ctx.db.patch(row._id,{activeRequestId:undefined,activeUntil:undefined});return null;}});
export const report=internalQuery({args:{},returns:v.object({initialized:v.boolean(),priorReservedCents:v.union(v.number(),v.null()),limit:v.number()}),handler:async ctx=>{const row=await initialized(ctx);return {initialized:!!row,priorReservedCents:row?.priorReservedCents??null,limit:USER_LIMIT};}});
