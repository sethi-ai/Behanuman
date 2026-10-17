import {expect,test} from 'vitest';
import {hiStarters} from '../src/lib/hiStarters';
import {selectHiContext} from '../convex/hiContext';
test.each(hiStarters)('starter has an approved test source path: %s',text=>{const context=selectHiContext(text,'test');expect(context?.primary.verseId).toBe('C7');expect(context?.supplement.work).toBe('Ramcharitmanas');});
