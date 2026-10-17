"use client";
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useQuery,useAction,useConvexAuth} from 'convex/react';
import {api} from '../../convex/_generated/api';
import {storyCorpus as legacyStories} from '../../convex/hiPolicy';
import {addStoryVisit,boundedHistory,type StoryVisit,type StorySnapshot} from '@/lib/hiHistory';
import {INPUT_LIMIT,matchStory,needsSupport,safetyMessage,isGenerationEligible} from '../../convex/hiPolicy';

import {selectHiContext} from '../../convex/hiContext';
import selectedSources from '../../convex/ramcharitmanasStories.json';

type Result={status:'sample'|'safety'|'no_match';storyId:string|null};
type ReaderMessage={text:string;at:number;sample:boolean;requestId:string};
function timeLabel(value:number){return new Date(value).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});}
function dateLabel(time:number){const d=new Date(time),now=new Date(),yesterday=new Date(now);yesterday.setDate(now.getDate()-1);return d.toDateString()===now.toDateString()?'Today':d.toDateString()===yesterday.toDateString()?'Yesterday':d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});}
function MessageMeta({name,at}:{name:string;at:number}){return <div className="hi-message-meta"><b>{name}</b><time dateTime={new Date(at).toISOString()}>{timeLabel(at)}</time></div>;}

export default function HanumanIntelligence(){
 const status=useQuery(api.hi.status,{}),reflect=useAction(api.hi.reflect),{isAuthenticated}=useConvexAuth();
 const allowance=useQuery(api.hiQuota.usage,isAuthenticated?{}:'skip');
 const [allowanceTime,setAllowanceTime]=useState(0);
 useEffect(()=>{if(!allowance?.activeUntil)return;const timer=setTimeout(()=>setAllowanceTime(Date.now()),Math.max(0,allowance.activeUntil-Date.now())+20);return()=>clearTimeout(timer);},[allowance?.activeUntil]);
 const inFlight=!!allowance?.activeUntil&&allowance.activeUntil>allowanceTime;
 const stories=status?.available?[...selectedSources.filter(s=>isGenerationEligible(s,'test')),...legacyStories]:legacyStories;
 const sending=useRef(false);
 const requestVersion=useRef(0),[reflecting,setReflecting]=useState(false),[liveReflection,setLiveReflection]=useState<{reflection:string;question:string|null}|null>(null),[reflectionNotice,setReflectionNotice]=useState('');
 function clearReflection(){requestVersion.current++;setReflecting(false);setLiveReflection(null);setReflectionNotice('');}
 useEffect(()=>()=>{requestVersion.current++;},[]);
 const [host,setHost]=useState<HTMLElement|null>(null),[open,setOpen]=useState(false),[input,setInput]=useState(''),[result,setResult]=useState<Result|null>(null);
 const [history,setHistory]=useState<StoryVisit[]>([]),[past,setPast]=useState(false),[snapshot,setSnapshot]=useState<StorySnapshot|null>(null),[clearConfirm,setClearConfirm]=useState(false),[historyNotice,setHistoryNotice]=useState('');
 const [conversation,setConversation]=useState<{text:string;at:number;reflection:string;question:string|null;source:{title:string;url:string}|null}[]>([]);
 const [submitted,setSubmitted]=useState<ReaderMessage|null>(null),[sampleInput,setSampleInput]=useState(false),[shownAt,setShownAt]=useState(0);
 const historyCache=useRef<StoryVisit[]>([]),scroll=useRef<HTMLDivElement>(null),resultHeading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const raw=JSON.parse(localStorage.getItem('bh_hi_history_v1')||'[]');const saved=Array.isArray(raw)?boundedHistory(raw,Date.now()):[];historyCache.current=saved;setHistory(saved);localStorage.setItem('bh_hi_history_v1',JSON.stringify(saved));}catch{setHistoryNotice('History is unavailable on this device.');}});return()=>cancelAnimationFrame(frame);},[]);
 useEffect(()=>{const f=requestAnimationFrame(()=>setHost(document.body));return()=>cancelAnimationFrame(f);},[]);
 useEffect(()=>{const update=()=>setOpen(document.documentElement.dataset.tab==='hi');update();const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-tab']});return()=>observer.disconnect();},[]);
 useEffect(()=>{scroll.current?.scrollTo({top:submitted?scroll.current.scrollHeight:0});},[result,past,submitted,liveReflection,reflectionNotice]);
 useEffect(()=>{if(!open)return;const viewport=window.visualViewport;const fit=()=>{const keyboard=!!viewport&&viewport.height<window.innerHeight-150;document.documentElement.dataset.hiKeyboard=String(keyboard);document.documentElement.style.setProperty('--hi-keyboard-height',keyboard?Math.max(120,viewport!.height-100)+'px':'auto');document.documentElement.style.setProperty('--hi-keyboard-bottom',keyboard?'auto':'92px');};fit();viewport?.addEventListener('resize',fit);return()=>{viewport?.removeEventListener('resize',fit);delete document.documentElement.dataset.hiKeyboard;document.documentElement.style.removeProperty('--hi-keyboard-height');document.documentElement.style.removeProperty('--hi-keyboard-bottom');};},[open]);
 function reset(){clearReflection();setInput('');setSampleInput(false);setSubmitted(null);setSnapshot(null);setResult(null);setPast(false);setClearConfirm(false);scroll.current?.scrollTo({top:0});}
 function close(){window.dispatchEvent(new CustomEvent('bh:navigate',{detail:{tab:'home'}}));}
 function showStory(id:string,time:number){clearReflection();const selected=stories.find(s=>s.id===id);if(!selected)return;setSnapshot(null);setPast(false);setShownAt(time);setResult({status:'sample',storyId:id});const saved=addStoryVisit(historyCache.current,selected,time);historyCache.current=saved;setHistory(saved);try{localStorage.setItem('bh_hi_history_v1',JSON.stringify(saved));}catch{setHistoryNotice('This story could not be saved on this device.');}}
 function browse(id:string,time:number){setSubmitted(null);setInput('');setSampleInput(false);showStory(id,time);}
 async function submit(event:React.FormEvent,time:number){event.preventDefault();if(sending.current||reflecting)return;if(submitted){const source=stories.find(item=>item.id===result?.storyId);const reply=liveReflection??{reflection:reflectionNotice||(result?.status==='safety'?safetyMessage:result?.status==='no_match'?'There isn’t a close match in this collection yet.':'You can read the related source below. No Claude reflection was requested.'),question:null};setConversation(turns=>[...turns,{text:submitted.text,at:submitted.at,...reply,source:source?{title:source.title,url:source.url}:null}]);}clearReflection();const text=input.trim();if(!text||text.length>INPUT_LIMIT)return;const message={text,at:time,sample:sampleInput,requestId:crypto.randomUUID()};setSubmitted(message);setInput('');setSampleInput(false);setPast(false);setSnapshot(null);setShownAt(time);if(needsSupport(text)){setResult({status:'safety',storyId:null});return;}const approvedContext=status?.available?selectHiContext(text,'test'):null;const match=approvedContext?.supplement??matchStory(text);if(match){showStory(match.id,time);await requestReflection(message);}else setResult({status:'no_match',storyId:null});}
 function reopen(visit:StoryVisit){clearReflection();setInput('');setSampleInput(false);setSubmitted(null);setSnapshot({...visit.story,anchor:visit.reflectionText});setShownAt(visit.shownAt);setResult({status:'sample',storyId:visit.story.id});setPast(false);}
 function clearHistory(){try{localStorage.removeItem('bh_hi_history_v1');historyCache.current=[];setHistory([]);setClearConfirm(false);}catch{setHistoryNotice('History could not be cleared. Please check device storage permissions.');}}
 function openPast(){clearReflection();setPast(true);setResult(null);setSubmitted(null);setSnapshot(null);setInput('');setSampleInput(false);setClearConfirm(false);}
 async function requestReflection(message:ReaderMessage){
  if(sending.current)return;
  if(!isAuthenticated){setReflectionNotice('Sign in through Settings to chat with Claude. Browsing stories stays free.');return;}
  if(!status?.available){setReflectionNotice('Claude is unavailable right now. You can still read the source.');return;}
  if(!allowance?.ready){setReflectionNotice('Your allowance is still loading. Please send again in a moment.');return;}
  if(!allowance.remaining){setReflectionNotice('You’ve used your three test reflections. You can still chant, learn and browse stories.');return;}
  if(inFlight){setReflectionNotice('Another reflection is in progress on your account. Please wait for it to finish.');return;}
  const selected=selectHiContext(message.text,'test')?.supplement;if(!selected){setReflectionNotice('I don’t have approved source material for that topic yet. This message did not use an attempt.');return;}
  sending.current=true;
  const version=++requestVersion.current;setReflecting(true);setReflectionNotice('');setLiveReflection(null);
  try{const response=await reflect({input:message.text,requestId:message.requestId});if(version!==requestVersion.current)return;
   if(response.status==='reflection'&&response.storyId===selected.id&&response.reflection)setLiveReflection({reflection:response.reflection,question:response.question});
   else setReflectionNotice(response.status==='quota_exhausted'?'You’ve used your three test reflections. You can still chant, learn and browse stories.':response.status==='in_progress'?'A reflection is already in progress on your account.':response.status==='already_submitted'?'This request was already submitted. It will not use another attempt.':response.status==='budget_exhausted'?'The shared test allowance has been used. You can still browse the stories.':response.status==='limited'?'You have reached the reflection limit. Please try later.':response.status==='auth_required'?'Sign in to request a reflection.':response.status==='safety'?safetyMessage:'Claude could not offer a reflection right now. Your story is still available.');
  }catch{if(version===requestVersion.current)setReflectionNotice('Claude could not connect. Your story is still available.');}
  finally{sending.current=false;if(version===requestVersion.current)setReflecting(false);}
 }
 const story=snapshot??stories.find(s=>s.id===result?.storyId),paragraphs=story?.retelling.split('\n\n')??[];
 const primary=story?.id===selectedSources[0].id?selectHiContext('knowledge service','test')?.primary:null;
 if(!status?.preview)return null;
 return <>{host&&open&&createPortal(<section id="hi-screen" className="hi-dialog hi-screen hi-chat-screen" aria-labelledby="hi-title"><div className="hi-content hi-message-layout">
  <header className="hi-chat-header"><div className="hi-chat-brand"><span className="hi-avatar" aria-hidden="true">h.i</span><div><h2 id="hi-title">h.i <span>Hanuman Intelligence</span></h2><p>Stories and a little space to reflect.</p></div></div><div className="hi-chat-tools"><button disabled={reflecting} onClick={event=>browse(stories[0].id,performance.timeOrigin+event.timeStamp)}>Browse stories</button><button disabled={reflecting} aria-pressed={past} onClick={openPast}>Past stories</button><button onClick={close} aria-label="Back to Home">Home</button></div></header>
  <p className="hi-chat-disclosure">{status.available?'Test app · Optional Claude reflections are modern interpretations, not scripture or advice.':'Claude is unavailable right now. You can still read the sourced stories.'}</p>
  {isAuthenticated&&status.available&&<p className="hi-note" role="status">{!allowance?.ready?'Loading your reflection allowance…':allowance.remaining===0?'You’ve used your three test reflections. You can still browse stories.':`${allowance.remaining} of 3 Claude attempts remaining for this test. Browsing stories is free.`}</p>}
  <div className="hi-message-scroll" ref={scroll}><div className="hi-stream-inner">
   {past?<section className="hi-history" aria-label="Past stories"><h3>Past stories</h3><p className="hi-note">Only on this device. Up to 30 stories for 30 days. Your typed concerns are never saved. Each row restores the sourced story.</p>{history.length===0?<p>Your stories will appear here after you open one.</p>:history.map((visit,i)=><div key={visit.id}>{(i===0||dateLabel(history[i-1].shownAt)!==dateLabel(visit.shownAt))&&<h4 className="hi-day-divider">{dateLabel(visit.shownAt)}</h4>}<button className="hi-history-row" onClick={()=>reopen(visit)}><span className="hi-avatar" aria-hidden="true">h.i</span><span className="hi-history-text"><span className="hi-history-meta"><b>h.i</b><time dateTime={new Date(visit.shownAt).toISOString()}>{timeLabel(visit.shownAt)}</time></span><b>{visit.story.title}</b><small>Story · Source included · Revision {visit.story.revision}</small></span></button></div>)}{history.length>0&&<button onClick={()=>setClearConfirm(true)}>Clear history</button>}{clearConfirm&&<section role="group" aria-label="Confirm clear history"><p>Clear saved stories from this device?</p><button onClick={clearHistory}>Yes, clear history</button><button onClick={()=>setClearConfirm(false)}>Keep history</button></section>}<button onClick={reset}>Back to stories</button></section>:<>
    {!result&&<section className="hi-chat-empty"><h3>What’s on your mind?</h3><p>Share a general feeling. h.i offers a little space to reflect, drawing on the approved Chalisa and Ramcharitmanas passages.</p><p className="hi-note">h.i means Hanuman Intelligence. It does not speak as Hanuman ji.</p></section>}
    {result&&shownAt>0&&<h3 className="hi-day-divider">{dateLabel(shownAt)}</h3>}
    {conversation.map((turn,index)=><div key={index}><section className="hi-message-row hi-reader-message"><div><MessageMeta name="You" at={turn.at}/><p>{turn.text}</p></div></section><section className="hi-message-row hi-story-message"><span className="hi-avatar" aria-hidden="true">h.i</span><div className="hi-message-body"><p>{turn.reflection}</p>{turn.question&&<p>{turn.question}</p>}{turn.source&&<a className="hi-note" href={turn.source.url} target="_blank" rel="noopener noreferrer">Source · {turn.source.title} ↗</a>}</div></section></div>)}
    {submitted&&<section className="hi-message-row hi-reader-message" aria-label="Your message"><span className="hi-avatar hi-reader-avatar" aria-hidden="true">Y</span><div><MessageMeta name="You" at={submitted.at}/><p>{submitted.text}</p></div></section>}
    {result&&<section className="hi-message-row hi-story-message" aria-label="h.i story and reflection"><span className="hi-avatar" aria-hidden="true">h.i</span><div className="hi-message-body"><MessageMeta name="h.i" at={shownAt}/>
     {result.status==='safety'&&<section className="hi-support"><h3 ref={resultHeading} tabIndex={-1}>A moment for support</h3><p>{safetyMessage}</p></section>}
     {result.status==='no_match'&&<p>I don’t have a well-sourced reflection for that topic in this small test collection yet. You can browse the available stories. This message did not use an attempt.</p>}
     {submitted&&(reflecting||liveReflection||reflectionNotice)&&<div className="hi-live-reply" role="status">{reflecting?<p>Thinking…</p>:liveReflection?<><p>{liveReflection.reflection}</p>{liveReflection.question&&<p>{liveReflection.question}</p>}</>:<p>{reflectionNotice}</p>}</div>}
     {story&&<article><details className="hi-citation"><summary>Read the source · {primary?.label??story.title}</summary>{primary&&<section className="hi-source" aria-label="Hanuman Chalisa primary text"><p className="hi-eyebrow">HANUMAN CHALISA · {primary.label}</p><h3>{primary.originalText.map(line=><span key={line} style={{display:'block'}} lang="hi">{line}</span>)}</h3><p>{primary.transliteration.join(' · ')}</p><h4>Traditional meaning</h4><p>{primary.meaning}</p><p className="hi-note">The passage below is a thematic connection from Ramcharitmanas, a separate work.</p></section>}<p className="hi-eyebrow">STORY · ORIGINAL EDITORIAL RETELLING</p><h3 ref={resultHeading} tabIndex={-1}>{story.title}</h3><p>{paragraphs[0]}</p>{paragraphs.length>1&&<details className="hi-story-more" key={story.id+'-'+shownAt}><summary>Read more</summary>{paragraphs.slice(1).map((text,i)=><p key={i}>{text}</p>)}</details>}<section className="hi-source"><h4>Source</h4><p>{story.citation}</p><a href={story.url} target="_blank" rel="noopener noreferrer">Read the source ↗</a><details><summary>Edition and review record</summary><p>{story.presentation}</p><p>Revision {story.revision}. {isGenerationEligible(story,'test')?'Approved for this test app. Wider publication review remains pending.':'Human devotional review and rights review pending.'} No quotation from a modern translation is reproduced.</p></details></section></details></article>}
     
    </div></section>}
   </>}
   {historyNotice&&<p role="status">{historyNotice}</p>}
  </div></div>
  <footer className="hi-composer-wrap"><form onSubmit={event=>void submit(event,Date.now())}><label htmlFor="hi-input">What’s on your mind?</label><div className="hi-composer-controls"><textarea id="hi-input" maxLength={INPUT_LIMIT} value={input} onChange={e=>{setInput(e.target.value);setSampleInput(false);}} placeholder="A general feeling is enough…" rows={2}/><button type="submit" disabled={reflecting||!input.trim()}>{reflecting?'Sending…':'Send'}</button></div><p className="hi-note">Sending shares your message and selected scripture context with Anthropic (Claude). Avoid sensitive details. Three attempts per account; provider errors count. Your conversation stays only in this open app, not saved.</p></form></footer>
 </div></section>,host)}</>;
}
