import chalisa from './hiChalisaSources.json';
import supplements from './ramcharitmanasStories.json';
import {isGenerationEligible} from './hiPolicy';
export type HiContext={primary:typeof chalisa[number];supplement:typeof supplements[number];relationship:'thematic'};
export function hasRelevantPrimary(input:string){const text=input.toLowerCase();return chalisa.some(v=>v.tags.some(tag=>new RegExp('\\b'+tag+'\\b','i').test(text))||/\b(?:c7|chaupai\s*7)\b/i.test(text)||text.includes('विद्यावान'));}
// Only the selected, separately reviewed records are considered. The full archive
// and the legacy Valmiki preview drafts are never a fallback for generation.
export function selectHiContext(input:string,scope:'public'|'test'='public'):HiContext|null{
 const text=input.toLowerCase();
 const primary=chalisa.find(v=>isGenerationEligible(v,scope)&&(v.tags.some(tag=>new RegExp('\\b'+tag+'\\b','i').test(text))||/\b(?:c7|chaupai\s*7)\b/i.test(text)||text.includes('विद्यावान')));
 if(!primary)return null;
 const supplement=supplements.find(v=>v.work==='Ramcharitmanas'&&isGenerationEligible(v,scope));
 return supplement?{primary,supplement,relationship:'thematic'}:null;
}
export function modelContext(context:HiContext){return {primary:{work:context.primary.work,verseId:context.primary.verseId,originalText:context.primary.originalText,meaning:context.primary.meaning},supplement:{work:context.supplement.work,passageId:context.supplement.id,citation:context.supplement.citation,originalEditorialParaphrase:context.supplement.retelling},relationship:context.relationship,editorialAnchor:context.supplement.anchor};}
