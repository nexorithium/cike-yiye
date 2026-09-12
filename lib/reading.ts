import { quotes, type Topic, type Preference } from "@/content/quotes";
export function selectQuotes(topic:Topic,preference:Preference,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){
 const candidates=quotes.filter(q=>q.status==="published"&&q.topics.includes(topic)&&!(preference==="comfort"&&q.action));
 const ranked=candidates.map(q=>({q,key:-Math.log(Math.max(random(),1e-9))/(1+(topic==="start"&&q.action?1:0)+(preference==="clarity"&&/视|判断|信息|观察/.test(q.note)?1:0))})).sort((a,b)=>a.key-b.key);
 const selected:typeof quotes=[];const works=new Set<string>();const authors=new Set<string>();
 for(const {q} of ranked){if(works.has(q.work)||authors.has(q.author))continue;selected.push(q);works.add(q.work);authors.add(q.author);if(selected.length===3)break}
 return selected;
}

// A stable 24-card pool keeps pagination and refreshed reveals consistent.
export function readingPool(ids:string[],topic:Topic,seed:string){
 let state=2166136261;for(const char of seed)state=Math.imul(state^char.charCodeAt(0),16777619)>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const pool=[...ids],seen=new Set(ids);const works=new Set(ids.map(id=>quotes.find(q=>q.id===id)?.work));
 const candidates=quotes.filter(q=>q.status==='published'&&!seen.has(q.id)).map(q=>({q,score:random()+(q.topics.includes(topic)?1:0)})).sort((a,b)=>b.score-a.score);
 for(const {q} of candidates){if(works.has(q.work))continue;pool.push(q.id);seen.add(q.id);works.add(q.work);if(pool.length===24)return pool}
 for(const {q} of candidates){if(seen.has(q.id))continue;pool.push(q.id);seen.add(q.id);if(pool.length===24)break}return pool;
}
