import {quotes,type Quote} from '../content/quotes';
// Retrieval narrows the prompt; only the model makes the final semantic choice.
const grams=(s:string)=>{const text=s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');return new Set(Array.from({length:Math.max(0,text.length-1)},(_,i)=>text.slice(i,i+2)))};
const catalog=quotes.filter(q=>q.status==='published').map(q=>({q,terms:grams(q.text+q.author+q.work+q.meaning)}));
const frequency=new Map<string,number>();for(const {terms} of catalog)for(const term of terms)frequency.set(term,(frequency.get(term)||0)+1);
export function candidateQuotes(input:string):Quote[]{
 const terms=grams(input);const ranked=catalog.map(({q,terms:document})=>({q,score:[...terms].reduce((s,t)=>s+(document.has(t)?Math.log(1+catalog.length/(frequency.get(t)||1)):0),0)})).sort((a,b)=>b.score-a.score||a.q.id.localeCompare(b.q.id));
 // Keep the 60 established editorial passages, plus 36 relevant new excerpts.
 // On weak lexical overlap, deterministic sampling keeps the added set varied.
 let state=2166136261;for(const ch of input)state=Math.imul(state^ch.charCodeAt(0),16777619)>>>0;
 const chosen=quotes.slice(0,60).filter(q=>q.status==='published');const seen=new Set(chosen.map(q=>q.id));
 for(const {q,score} of ranked){if(chosen.length>=84||score<=0)break;if(!seen.has(q.id)){chosen.push(q);seen.add(q.id)}}
 const rest=catalog.filter(x=>!seen.has(x.q.id)).map(x=>x.q);
 while(chosen.length<96&&rest.length){state=(Math.imul(state,1664525)+1013904223)>>>0;chosen.push(rest.splice(state%rest.length,1)[0])}
 return chosen;
}
