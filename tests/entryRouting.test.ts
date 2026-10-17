import {expect,test} from 'vitest';
import {entryDestination} from '../src/lib/entryRouting';
test('root uses authentication, not a saved demo profile, to select Welcome or Home',()=>{expect(entryDestination({authenticated:false,simpleMode:false,pendingWelcome:false})).toBe('/welcome');expect(entryDestination({authenticated:true,simpleMode:false,pendingWelcome:false})).toBe('/app?entry=home');});
test('explicit Simple mode and an interrupted welcome keep their app entry',()=>{for(const authenticated of [false,true]){expect(entryDestination({authenticated,simpleMode:true,pendingWelcome:false})).toBe('/app');expect(entryDestination({authenticated,simpleMode:false,pendingWelcome:true})).toBe('/app');}});
