export function launchContext(){let qa=false;try{qa=sessionStorage.getItem('bh_launch_qa')==='1'||new URLSearchParams(window.location.search).get('qa')==='1';}catch{}return {origin:window.location.origin,occurredAt:Date.now(),qa};}
export function markLaunchLogin(){try{sessionStorage.setItem('bh_launch_login_pending',JSON.stringify({eventId:crypto.randomUUID(),...launchContext()}));}catch{}}
