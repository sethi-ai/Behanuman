import {v,ConvexError} from 'convex/values';
import {mutation,internalQuery} from './_generated/server';
export const recordCompletion=mutation({
 args:{eventId:v.string(),path:v.literal('phone_flow'),completed:v.literal(true),version:v.literal(3),test:v.boolean()},
 returns:v.object({recorded:v.boolean(),test:v.boolean()}),
 handler:async(ctx,args)=>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(args.eventId))throw new ConvexError('Invalid completion event.');
  const prior=await ctx.db.query('onboardingCompletions').withIndex('by_eventId',q=>q.eq('eventId',args.eventId)).unique();
  if(prior)return {recorded:false,test:prior.test};
  const test=args.test||!!process.env.PREVIEW_AUTH_ORIGIN;
  const timestamp=Date.now(),date=new Date(timestamp).toISOString().slice(0,10);
  await ctx.db.insert('onboardingCompletions',{eventId:args.eventId,path:args.path,timestamp,test});
  const daily=await ctx.db.query('onboardingDailyMetrics').withIndex('by_date_and_test',q=>q.eq('date',date).eq('test',test)).unique();
  if(daily)await ctx.db.patch(daily._id,{phoneFlowCompletions:daily.phoneFlowCompletions+1});
  else await ctx.db.insert('onboardingDailyMetrics',{date,test,phoneFlowCompletions:1});
  return {recorded:true,test};
 }
});
// Internal aggregate only: no public endpoint exposes registration activity or event IDs.
export const dailyCount=internalQuery({args:{date:v.string()},returns:v.object({phoneFlowCompletions:v.number(),testCompletions:v.number()}),handler:async(ctx,{date})=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new ConvexError('Invalid date.');
 const real=await ctx.db.query('onboardingDailyMetrics').withIndex('by_date_and_test',q=>q.eq('date',date).eq('test',false)).unique();
 const test=await ctx.db.query('onboardingDailyMetrics').withIndex('by_date_and_test',q=>q.eq('date',date).eq('test',true)).unique();
 return {phoneFlowCompletions:real?.phoneFlowCompletions||0,testCompletions:test?.phoneFlowCompletions||0};
}});
