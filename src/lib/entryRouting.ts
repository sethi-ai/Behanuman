export function entryDestination(input:{authenticated:boolean;simpleMode:boolean;pendingWelcome:boolean}){
 if(input.simpleMode||input.pendingWelcome)return '/app';
 return input.authenticated?'/app?entry=home':'/welcome';
}
