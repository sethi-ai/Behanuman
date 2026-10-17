/// <reference types="vite/client" />
import {afterEach,expect,test,vi} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.ts');
const event={eventId:'36aa5f47-9b3f-4db7-a35d-005bbfe2fa74',path:'phone_flow' as const,completed:true as const,version:3 as const,test:false};
afterEach(()=>vi.unstubAllEnvs());
test('completion is idempotent and stores no phone/name/hash or account activity',async()=>{
 vi.stubEnv('PREVIEW_AUTH_ORIGIN','');const t=convexTest(schema,modules);
 expect((await t.mutation(api.onboardingMetrics.recordCompletion,event)).recorded).toBe(true);
 expect((await t.mutation(api.onboardingMetrics.recordCompletion,event)).recorded).toBe(false);
 const count=await t.query(internal.onboardingMetrics.dailyCount,{date:new Date().toISOString().slice(0,10)});expect(count).toEqual({phoneFlowCompletions:1,testCompletions:0});
 await t.run(async ctx=>{const rows=await ctx.db.query('onboardingCompletions').take(2);expect(rows).toHaveLength(1);expect(Object.keys(rows[0]).sort()).toEqual(['_creationTime','_id','eventId','path','test','timestamp'].sort());expect(await ctx.db.query('dailyMetrics').take(1)).toEqual([]);});
});
test('preview cannot claim real registrations and QA remains excluded',async()=>{
 vi.stubEnv('PREVIEW_AUTH_ORIGIN','https://preview.example.test');const t=convexTest(schema,modules);
 expect((await t.mutation(api.onboardingMetrics.recordCompletion,event)).test).toBe(true);
 expect(await t.query(internal.onboardingMetrics.dailyCount,{date:new Date().toISOString().slice(0,10)})).toEqual({phoneFlowCompletions:0,testCompletions:1});
});
test('malformed and additional identifying fields are rejected',async()=>{
 const t=convexTest(schema,modules);
 await expect(t.mutation(api.onboardingMetrics.recordCompletion,{...event,eventId:'not-an-event'})).rejects.toThrow();
 await expect(t.mutation(api.onboardingMetrics.recordCompletion,{...event,phone:'synthetic-forbidden-field'} as typeof event)).rejects.toThrow();
});
