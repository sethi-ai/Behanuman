import {v} from 'convex/values';
import {getServiceToken} from 'convex/server';
import {internalAction} from './_generated/server';
// Read-only capability check; never returns or logs the short-lived credential.
export const inspect=internalAction({args:{},returns:v.object({available:v.boolean(),haikuModels:v.array(v.string()),reason:v.string()}),handler:async()=>{
 try{
  const token=await getServiceToken('ai-gateway');
  const res=await fetch('https://ai-gateway.convex.dev/v1/models',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
  if(!res.ok)return {available:false,haikuModels:[],reason:`catalog_http_${res.status}`};
  const body=await res.json() as {data?:{id:string}[]};
  return {available:true,haikuModels:(body.data||[]).map(m=>m.id).filter(id=>id.includes('haiku')),reason:'catalog_read'};
 }catch(error){
  const message=error instanceof Error?error.message:'';
  const known=['AiGatewayDisabled','AiGatewayUnavailable','SpendingLimitExceeded','TeamSuspended'].find(code=>message.includes(code));
  return {available:false,haikuModels:[],reason:known||'gateway_access_unavailable'};
 }
}});
