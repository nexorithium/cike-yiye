import { quotes, type Topic, type Preference } from "@/content/quotes";
export function selectQuotes(topic:Topic,preference:Preference,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){
 const candidates=quotes.filter(q=>q.status==="published"&&q.topics.includes(topic)&&!(preference==="comfort"&&q.action));
 const ranked=candidates.map(q=>({q,key:-Math.log(Math.max(random(),1e-9))/(1+(topic==="start"&&q.action?1:0)+(preference==="clarity"&&/视|判断|信息|观察/.test(q.note)?1:0))})).sort((a,b)=>a.key-b.key);
 const selected:typeof quotes=[];const works=new Set<string>();const authors=new Set<string>();
 for(const {q} of ranked){if(works.has(q.work)||authors.has(q.author))continue;selected.push(q);works.add(q.work);authors.add(q.author);if(selected.length===3)break}
 return selected;
}
