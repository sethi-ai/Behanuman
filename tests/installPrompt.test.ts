import {expect,test} from 'vitest';
import {InstallPromptQueue,type DeferredInstallEvent} from '../src/lib/installPrompt';
test('an install event is retained without prompting and consumed only once',()=>{let prompts=0;const event={prompt:async()=>{prompts++;},userChoice:Promise.resolve({outcome:'dismissed'})} as DeferredInstallEvent;const queue=new InstallPromptQueue();queue.keep(event);expect(prompts).toBe(0);expect(queue.take()).toBe(event);expect(queue.take()).toBeNull();expect(prompts).toBe(0);});
test('appinstalled discards a retained prompt',()=>{const queue=new InstallPromptQueue();queue.keep({} as DeferredInstallEvent);queue.clear();expect(queue.take()).toBeNull();});
