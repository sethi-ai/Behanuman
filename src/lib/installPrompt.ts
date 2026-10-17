export type DeferredInstallEvent=Event&{prompt:()=>Promise<unknown>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
// The browser's event is single-use. Taking it removes it before any asynchronous work.
export class InstallPromptQueue{
 private pending:DeferredInstallEvent|null=null;
 keep(event:DeferredInstallEvent){this.pending=event;}
 take(){const event=this.pending;this.pending=null;return event;}
 clear(){this.pending=null;}
}
