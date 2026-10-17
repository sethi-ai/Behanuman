import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {RateLimiter,MINUTE} from '@convex-dev/rate-limiter';
import {mutation,internalMutation,internalQuery,type MutationCtx,type QueryCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
import {components} from './_generated/api';
import {emptyLaunchTotals,launchTotalsValidator} from './launchValidators';
const limiter=new RateLimiter(components.rateLimiter,{launchWrites:{kind:'token bucket',rate:100,period:MINUTE,capacity:100}});
const config=(ctx:MutationCtx|QueryCtx)=>ctx.db.query('launchConfig').withIndex('by_key',q=>q.eq('key','main')).unique();
function qaOrigin(origin?:string){return !['https://www.behanuman.com','https://behanuman.com'].includes(origin||'');}
async function totals(ctx:MutationCtx,launchId:Id<'launchConfig'>,qa:boolean){const row=await ctx.db.query('launchTotals').withIndex('by_launch_and_qa',q=>q.eq('launchId',launchId).eq('qa',qa)).unique();if(row)return row;const id=await ctx.db.insert('launchTotals',{launchId,qa,counts:emptyLaunchTotals()});return (await ctx.db.get(id))!;}
export async function recordLaunchUse(ctx:MutationCtx,userId:Id<'users'>,eventId:string,kind:'login'|'round'|'learn',origin?:string,occurredAt?:number,explicitQa=false){
 const launch=await config(ctx);if(!launch||!occurredAt||occurredAt<launch.startedAt||occurredAt>Date.now()+60_000)return false;
 const receipt=await ctx.db.query('launchEvents').withIndex('by_launch_user_event',q=>q.eq('launchId',launch._id).eq('userId',userId).eq('eventId',eventId)).unique();if(receipt)return true;
 const qa=explicitQa||qaOrigin(origin)||launch.qaUserIds.includes(userId);
 const person=await ctx.db.query('launchPeople').withIndex('by_launch_user_qa',q=>q.eq('launchId',launch._id).eq('userId',userId).eq('qa',qa)).unique();
 const summary=await totals(ctx,launch._id,qa),counts={...emptyLaunchTotals(),...summary.counts};const user=await ctx.db.get(userId);const emailBacked=typeof user?.email==='string'&&user.email.includes('@');const newAccount=!!user&&Math.floor(user._creationTime)>launch.startedAt;const meaningful=kind==='round'||kind==='learn';
 if(!person)counts.authenticatedAccounts++;
 if(meaningful&&!person?.meaningful)counts.meaningfulAccounts++;
 if(meaningful&&emailBacked&&!person?.emailBackedFirstUse)counts.emailBackedMeaningfulAccounts=(counts.emailBackedMeaningfulAccounts??0)+1;
 if(meaningful&&emailBacked&&newAccount&&!person?.newAccountFirstUse)counts.newAccountFirstUses=(counts.newAccountFirstUses??0)+1;
 if(kind==='login')counts.loginCompletions++;if(kind==='round')counts.completedReadings++;if(kind==='learn')counts.learnedVerseActions++;
 if(person)await ctx.db.patch(person._id,{meaningful:person.meaningful||meaningful,emailBackedFirstUse:person.emailBackedFirstUse||meaningful&&emailBacked,newAccountFirstUse:person.newAccountFirstUse||meaningful&&emailBacked&&newAccount,lastSeenAt:Date.now()});else await ctx.db.insert('launchPeople',{launchId:launch._id,userId,qa,meaningful,emailBackedFirstUse:meaningful&&emailBacked,newAccountFirstUse:meaningful&&emailBacked&&newAccount,firstSeenAt:Date.now(),lastSeenAt:Date.now()});
 await ctx.db.insert('launchEvents',{launchId:launch._id,userId,eventId,kind,qa,occurredAt,receivedAt:Date.now()});await ctx.db.patch(summary._id,{counts});return true;
}
export const begin=internalMutation({args:{qaEmails:v.array(v.string())},returns:v.object({startedAt:v.number(),created:v.boolean()}),handler:async(ctx,{qaEmails})=>{const prior=await config(ctx);if(prior)return {startedAt:prior.startedAt,created:false};if(qaEmails.length>20)throw new ConvexError('Too many QA accounts');const qaUserIds:Id<'users'>[]=[];for(const email of qaEmails){const users=await ctx.db.query('users').withIndex('email',q=>q.eq('email',email.trim().toLowerCase())).take(10);if(!users.length)throw new ConvexError('QA account not found');qaUserIds.push(...users.map(u=>u._id));}const startedAt=Date.now();await ctx.db.insert('launchConfig',{key:'main',startedAt,qaUserIds:[...new Set(qaUserIds)]});return {startedAt,created:true};}});
export const visit=mutation({args:{kind:v.union(v.literal('guest'),v.literal('login')),deviceId:v.string(),eventId:v.string(),origin:v.string(),occurredAt:v.number(),qa:v.optional(v.boolean())},returns:v.object({saved:v.boolean()}),handler:async(ctx,args)=>{
 if(!/^[0-9a-f-]{36}$/i.test(args.deviceId)||!/^[0-9a-f-]{36}$/i.test(args.eventId)||args.origin.length>200)return {saved:false};
 const launch=await config(ctx);if(!launch||args.occurredAt<launch.startedAt||args.occurredAt>Date.now()+60_000)return {saved:false};
 const userId=await getAuthUserId(ctx);
 if(args.kind==='login'){if(!userId||!await ctx.db.get(userId)||await ctx.db.query('accountDeletions').withIndex('by_userId',q=>q.eq('userId',userId)).unique())return {saved:false};if(!(await limiter.limit(ctx,'launchWrites')).ok)return {saved:false};const saved=await recordLaunchUse(ctx,userId,'login:'+args.eventId,'login',args.origin,args.occurredAt,args.qa);if(saved){const guest=await ctx.db.query('launchGuests').withIndex('by_launch_and_device',q=>q.eq('launchId',launch._id).eq('deviceId',args.deviceId)).unique();if(guest&&!guest.userId){const ownerQa=launch.qaUserIds.includes(userId);let qa=guest.qa;if(ownerQa&&!qa){const old=await totals(ctx,launch._id,false),next=await totals(ctx,launch._id,true);await ctx.db.patch(old._id,{counts:{...old.counts,guestDevices:Math.max(0,old.counts.guestDevices-1)}});await ctx.db.patch(next._id,{counts:{...next.counts,guestDevices:next.counts.guestDevices+1}});qa=true;}const row=await totals(ctx,launch._id,qa);await ctx.db.patch(row._id,{counts:{...row.counts,linkedGuestDevices:(row.counts.linkedGuestDevices??0)+1}});await ctx.db.patch(guest._id,{userId,qa});}}return {saved};}
 if(userId)return {saved:false};
 const existing=await ctx.db.query('launchGuests').withIndex('by_launch_and_device',q=>q.eq('launchId',launch._id).eq('deviceId',args.deviceId)).unique();if(existing)return {saved:true};
 if(!(await limiter.limit(ctx,'launchWrites')).ok)return {saved:false};
 const qa=args.qa===true||qaOrigin(args.origin),summary=await totals(ctx,launch._id,qa);await ctx.db.insert('launchGuests',{launchId:launch._id,deviceId:args.deviceId,qa,firstSeenAt:Date.now()});await ctx.db.patch(summary._id,{counts:{...summary.counts,guestDevices:summary.counts.guestDevices+1}});return {saved:true};
}});
export const report=internalQuery({args:{},returns:v.union(v.null(),v.object({startedAt:v.number(),qa:launchTotalsValidator,live:launchTotalsValidator,payments:v.literal('not_connected')})),handler:async ctx=>{const launch=await config(ctx);if(!launch)return null;const rows=await ctx.db.query('launchTotals').withIndex('by_launch_and_qa',q=>q.eq('launchId',launch._id)).take(2);return {startedAt:launch.startedAt,qa:{...emptyLaunchTotals(),...rows.find(r=>r.qa)?.counts},live:{...emptyLaunchTotals(),...rows.find(r=>!r.qa)?.counts},payments:'not_connected' as const};}});
