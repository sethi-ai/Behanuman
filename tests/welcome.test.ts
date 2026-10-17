import {expect,test} from 'vitest';
import {normalizeWelcome,welcomeSnapshot,welcomeEntry} from '../src/lib/welcomeState';
test('demo data never enters the account snapshot and optional commitment stays optional',()=>{const draft=normalizeWelcome({name:' A ',phone:'9999999999',journey:'learn',days:null,step:4});const saved=welcomeSnapshot(draft,'2026-10-16');expect(saved).not.toHaveProperty('bh_sk2');expect(JSON.parse(saved.bh_user)).toEqual({name:'A'});expect(JSON.stringify(saved)).not.toContain('9999999999');expect(JSON.parse(saved.bh_journey)).toEqual({tab:'learn',days:null,start:null});});
test('journey constraints preserve only valid learning and chanting commitments',()=>{expect(normalizeWelcome({journey:'learn',days:7}).days).toBeNull();for(const days of Array.from({length:21},(_,i)=>i+1)){const saved=welcomeSnapshot(normalizeWelcome({journey:'chant',days}), '2026-10-16');expect(JSON.parse(saved.bh_sk2!)).toMatchObject({days,start:'2026-10-16'});}expect(normalizeWelcome({journey:'other',step:99}).journey).toBe('chant');});

test('chant durations reject values outside the wheel',()=>{for(const days of [0,22,1.5,'7'])expect(normalizeWelcome({journey:'chant',days}).days).toBeNull();});

test('fresh and returning entries require completed setup, not sign-in alone',()=>{
 expect(welcomeEntry({authenticated:false,accountRestored:false,localComplete:false})).toBe('onboard');
 expect(welcomeEntry({authenticated:false,accountRestored:false,localComplete:true})).toBe('resume');
 expect(welcomeEntry({authenticated:true,accountRestored:false,localComplete:true})).toBe('wait');
 expect(welcomeEntry({authenticated:true,accountRestored:true,localComplete:false})).toBe('onboard');
 expect(welcomeEntry({authenticated:true,accountRestored:true,localComplete:true})).toBe('resume');
});

test('interrupted Google entry returns to welcome even if its draft was written before redirect',()=>{expect(welcomeEntry({authenticated:false,accountRestored:false,localComplete:true,authPending:true})).toBe('onboard');expect(welcomeEntry({authenticated:true,accountRestored:true,localComplete:true,authPending:true})).toBe('resume');});

test('direct guest reading is neither completed onboarding nor authentication',()=>{expect(welcomeEntry({authenticated:false,accountRestored:false,localComplete:false,guestReading:true})).toBe('resume');expect(welcomeEntry({authenticated:true,accountRestored:false,localComplete:false,guestReading:true})).toBe('wait');});
