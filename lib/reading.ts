import { quotes, type Topic, type Preference } from "@/content/quotes";
export function safetyRoute(text:string):boolean{return /自杀|自殺|不想活|结束生命|結束生命|轻生|輕生|想死|去死|跳楼|跳樓|割腕|自残|自殘|伤害自己|傷害自己|杀人|殺人|杀了|殺了|捅死|报复|報復|炸掉|投毒|安眠药|安眠藥|suicid|kill myself|hurt myself|kill (him|her|them)|want to die/i.test(text)}
export function inferTopic(text:string,chosen?:Topic):Topic{if(chosen)return chosen;if(/累|疲|休息|压力|壓力|睡|难过|難過|失落|委屈|孤独|孤獨|烦|煩/.test(text))return "rest";if(/开始|開始|项目|項目|害怕|失败|失敗|不敢|完美|拖延|创业|創業|学习|學習|尝试|嘗試|犹豫|猶豫/.test(text))return "start";return "read"}
export function selectQuotes(topic:Topic,preference:Preference,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){
 const candidates=quotes.filter(q=>q.status==="published"&&q.topics.includes(topic)&&!(preference==="comfort"&&q.action));
 const ranked=candidates.map(q=>({q,key:-Math.log(Math.max(random(),1e-9))/(1+(topic==="start"&&q.action?1:0)+(preference==="clarity"&&/视|判断|信息|观察/.test(q.note)?1:0))})).sort((a,b)=>a.key-b.key);
 const selected:typeof quotes=[];const works=new Set<string>();const authors=new Set<string>();
 for(const {q} of ranked){if(works.has(q.work)||authors.has(q.author))continue;selected.push(q);works.add(q.work);authors.add(q.author);if(selected.length===3)break}
 return selected;
}
