import {v} from 'convex/values';
import {RateLimiter, HOUR, MINUTE} from '@convex-dev/rate-limiter';
import {action, query, internalQuery, internalAction} from './_generated/server';
import {components,internal} from './_generated/api';

import {getAuthUserId} from '@convex-dev/auth/server';
import {selectHiContext,hasRelevantPrimary} from './hiContext';
import {requestHiReflection} from './hiProvider';
import {INPUT_LIMIT,needsSupport} from './hiPolicy';

// Opaque account IDs key rate limits. No reader input, output, email, phone or story history is logged.
const limiter=new RateLimiter(components.rateLimiter,{
  hiCanaryOnce:{kind:'fixed window',rate:1,period:24*HOUR},
  hiUserBurst:{kind:'token bucket',rate:1,period:MINUTE,capacity:1},
  hiUserHour:{kind:'fixed window',rate:5,period:HOUR},
  hiUserDay:{kind:'fixed window',rate:10,period:24*HOUR},
  hiBurst:{kind:'token bucket',rate:2,period:MINUTE,capacity:2},
  hiHour:{kind:'fixed window',rate:30,period:HOUR},
  hiDay:{kind:'fixed window',rate:100,period:24*HOUR},
});
function config(){
  const provider=process.env.HI_PROVIDER||'';
  const model=process.env.HI_MODEL||'';
  const configured=process.env.HI_MODE==='preview'&&process.env.HI_ENABLED==='true'&&provider==='anthropic'&&!!process.env.ANTHROPIC_API_KEY&&model==='claude-haiku-5-5';
  const preview=process.env.HI_MODE==='preview';
  return {provider,model,configured,preview};
}
export const status=query({args:{},returns:v.object({available:v.boolean(),preview:v.boolean()}),handler:async()=>{const c=config();return {available:c.configured&&!!selectHiContext('knowledge service','test'),preview:c.preview};}});
const result=v.object({status:v.union(v.literal('reflection'),v.literal('safety'),v.literal('no_match'),v.literal('unavailable'),v.literal('limited'),v.literal('error'),v.literal('invalid'),v.literal('auth_required'),v.literal('budget_exhausted')),storyId:v.union(v.string(),v.null()),reflection:v.union(v.string(),v.null()),question:v.union(v.string(),v.null())});
export const reflect=action({args:{input:v.string()},returns:result,handler:async(ctx,{input})=>{
  const response=(status:'safety'|'no_match'|'unavailable'|'limited'|'error'|'invalid'|'auth_required'|'budget_exhausted',storyId:string|null=null)=>({status,storyId,reflection:null,question:null});
  if(input.length>INPUT_LIMIT||!input.trim())return response('invalid');
  if(needsSupport(input))return response('safety');
  let userId;try{userId=await ctx.runQuery(internal.hi.viewer,{});}catch{return response('unavailable');}
  if(!userId)return response('auth_required');
  if(!hasRelevantPrimary(input))return response('no_match');
  const context=selectHiContext(input,'test');
  if(!context)return response('unavailable');
  const story=context.supplement;
  const c=config();
  // Preview is never a bypass: editorial AND rights clearance apply to every provider request.
  if(!c.configured)return response('unavailable',story.id);
  try{
    for(const name of ['hiUserBurst','hiUserHour','hiUserDay'] as const)if(!(await limiter.limit(ctx,name,{key:userId})).ok)return response('limited',story.id);
    // Shared caps bound provider requests across all accounts; rejected attempts cannot spend tokens.
    for(const name of ['hiBurst','hiHour','hiDay'] as const)if(!(await limiter.limit(ctx,name)).ok)return response('limited',story.id);
    if(!await ctx.runMutation(internal.hiBudget.reserve,{}))return response('budget_exhausted',story.id);
    const output=await requestHiReflection(context,input,{model:c.model,key:process.env.ANTHROPIC_API_KEY!});
    if(output.status!=='reflection')return response(output.status,story.id);
    return {status:'reflection' as const,storyId:story.id,reflection:output.reflection,question:output.question};
  }catch{return response('error',story.id);}
}});

export const viewer=internalQuery({args:{},returns:v.union(v.id('users'),v.null()),handler:async ctx=>{const id=await getAuthUserId(ctx);if(!id||!await ctx.db.get(id))return null;if(await ctx.db.query('accountDeletions').withIndex('by_userId',q=>q.eq('userId',id)).unique())return null;return id;}});

// Read-only provider check: never returns a credential or sends a reader message.
export const providerCheck=internalAction({args:{},returns:v.object({keyPresent:v.boolean(),accepted:v.boolean(),haikuModels:v.array(v.string()),reason:v.string()}),handler:async()=>{
 const key=process.env.ANTHROPIC_API_KEY;if(!key)return {keyPresent:false,accepted:false,haikuModels:[],reason:'key_missing'};
 try{const res=await fetch('https://api.anthropic.com/v1/models',{headers:{'anthropic-version':'2023-06-01','x-api-key':key},signal:AbortSignal.timeout(10000)});if(!res.ok)return {keyPresent:true,accepted:false,haikuModels:[],reason:'provider_http_'+res.status};const body=await res.json() as {data?:{id:string}[]};return {keyPresent:true,accepted:true,haikuModels:(body.data||[]).map(m=>m.id).filter(id=>id.includes('haiku')),reason:'model_catalog_only'};}catch{return {keyPresent:true,accepted:false,haikuModels:[],reason:'provider_unreachable'};}
}});

// Admin-only one-shot synthetic test. It cannot be called by a website visitor.
export const canary=internalAction({args:{approvalId:v.literal('owner-retry-2026-10-17')},returns:result,handler:async(ctx)=>{
 const empty=(status:'unavailable'|'limited'|'error'|'invalid'|'safety')=>({status,storyId:null,reflection:null,question:null});
 if(process.env.HI_CANARY_ENABLED!=='true'||process.env.HI_MODE!=='preview'||process.env.HI_MODEL!=='claude-haiku-5-5'||process.env.HI_PROVIDER!=='anthropic'||!process.env.ANTHROPIC_API_KEY)return empty('unavailable');
 const input='I feel overwhelmed preparing for an interview';
 const context=selectHiContext(input,'test');if(!context)return empty('unavailable');
 if(!(await limiter.limit(ctx,'hiCanaryOnce',{key:'owner-retry-2026-10-17'})).ok)return empty('limited');
 if(!await ctx.runMutation(internal.hiBudget.reserve,{}))return empty('limited');
 const output=await requestHiReflection(context,input,{model:'claude-haiku-5-5',key:process.env.ANTHROPIC_API_KEY,diagnostics:true});
 return output.status==='reflection'?{status:'reflection' as const,storyId:context.supplement.id,reflection:output.reflection,question:output.question}:empty(output.status);
}});

