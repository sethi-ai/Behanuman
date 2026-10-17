import valmikiStories from './hiStories.json';
import ramcharitmanasCandidates from './ramcharitmanasStories.json';
export type HiStory={id:string;revision:number;title:string;retelling:string;anchor:string;question:string;citation:string;url:string;presentation:string;reviewStatus:string;reviewer:string|null;rightsStatus:string;tags:string[];work?:string;sourceDocument?:string;rightsBasis?:string;rightsScope?:string};
// Keep legacy preview drafts visible as labelled samples. New scripture candidates
// enter neither matching, browsing nor model context until BOTH reviews pass.
export function buildStoryCorpus(candidates:HiStory[]):HiStory[]{return [...valmikiStories,...candidates.filter(story=>isGenerationEligible(story))];}
export const storyCorpus=buildStoryCorpus(ramcharitmanasCandidates);
const stories=storyCorpus;

export const INPUT_LIMIT = 1000;
export const safetyMessage = 'Your safety matters more than finding a story. If you might hurt yourself or someone else, or are in immediate danger, contact local emergency services or a trusted person who can stay with you now. This feature cannot provide crisis care.';
export function needsSupport(text: string) {
  return /suicid|kill\s+(myself|yourself|someone)|hurt\s+(myself|someone)|self[- ]?harm|end\s+(my|it all)|don.t want to (live|be here)|better off (dead|without me)|no reason to live|can.t go on|overdos|being abused|hits me|hit me|unsafe at home|immediate danger|marna chahta|jeena nahi/i.test(text);
}
export function matchStory(text: string) {
  const words = text.toLowerCase();
  const ranked = stories.map(story => ({story, score: story.tags.filter(tag => new RegExp('\\b'+tag+'\\b','i').test(words)).length})).sort((a,b)=>b.score-a.score);
  return ranked[0]?.score ? ranked[0].story : null;
}
export function parseReflection(raw: string): {status:'reflection';reflection:string;question:string|null}|{status:'safety'}|null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const v = value as Record<string,unknown>;
    if (v.status === 'safety') return {status:'safety'};
    if (v.status !== 'reflection' || typeof v.reflection !== 'string' || v.reflection.length < 20 || v.reflection.length > 1100 || !(v.question === null || typeof v.question === 'string' && v.question.length <= 180)) return null;
    const text = v.reflection+' '+(v.question||'');
    if (/\b(?:hanuman|jambavan|rama|ramcharitmanas|chalisa)\b/i.test(text)) return null;
    if (/https?:|<|>|\b(you must|you should|you need to|i am hanuman|hanuman (says|tells you)|will succeed|guarantee|diagnos|cure|step \d|scripture says)\b/i.test(text)) return null;
    if (v.question && (String(v.question).match(/\?/g)||[]).length !== 1) return null;
    return {status:'reflection',reflection:v.reflection.trim(),question:typeof v.question==='string'?v.question.trim():null};
  } catch { return null; }
}

export function isGenerationEligible(story:{rightsScope?:unknown;reviewStatus?:unknown;rightsStatus?:unknown;reviewer?:unknown;revision?:unknown;citation?:unknown;presentation?:unknown;url?:unknown},scope:'public'|'test'='public'){
 if(story.rightsScope==='test_only'&&scope!=='test')return false;
 if(story.reviewStatus!=='approved'||story.rightsStatus!=='approved'||typeof story.reviewer!=='string'||!story.reviewer.trim()||!Number.isInteger(story.revision)||Number(story.revision)<1||typeof story.citation!=='string'||!story.citation.trim()||typeof story.presentation!=='string'||!story.presentation.trim()||typeof story.url!=='string')return false;
 try{const url=new URL(story.url);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
