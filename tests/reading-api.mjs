import assert from 'node:assert/strict';
const base=process.env.BOOKMARKS_TEST_URL||'http://localhost:5173';
let owner='';
async function call(path,method='GET',data, cookie=owner,origin=base){const r=await fetch(base+path,{method,headers:{connection:'close',...(cookie?{cookie}:{}),...(method!=='GET'?{'content-type':'application/json',origin}:{})},body:data===undefined?undefined:JSON.stringify(data)});const raw=await r.text();let v;try{v=JSON.parse(raw)}catch{v={error:raw}};return {r,v}}
const empty=await call('/api/readings','POST',{text:' ',request_key:crypto.randomUUID()});assert.equal(empty.r.status,400);
const long=await call('/api/readings','POST',{text:'a'.repeat(501),request_key:crypto.randomUUID()});assert.equal(long.r.status,400);
const cross=await call('/api/readings','POST',{topic:'read',request_key:crypto.randomUUID()},'', 'https://other.invalid');assert.equal(cross.r.status,403);
const first=await call('/api/readings','POST',{topic:'read',preference:'comfort',request_key:crypto.randomUUID()});assert.equal(first.r.status,200,JSON.stringify(first.v));owner=first.r.headers.get('set-cookie').split(';')[0];assert.match(first.r.headers.get('cache-control'),/no-store/);assert.match(first.r.headers.get('set-cookie'),/HttpOnly/);assert.equal(first.v.bookmarks.length,24);assert.equal(JSON.stringify(first.v).includes('quote_ids'),false);
const id=first.v.id;
const results=[];for(const bookmark_id of ['1','2','3','4','5','6','24'])results.push(await call(`/api/readings/${id}/reveal`,'POST',{bookmark_id}));
for(const x of results)assert.equal(x.r.status,200,JSON.stringify(x.v));
assert.equal(new Set(results.map(x=>x.v.quote.id)).size,7);assert.equal(new Set(results.map(x=>x.v.quote.work)).size,7);for(const x of results){assert.equal(x.r.status,200);assert.equal(x.v.guidance.small_action,null);assert.equal(x.v.guidance.origin,'editorial');assert.ok(/^https:\/\/(zh.wikisource.org|github.com)\//.test(x.v.quote.source))}
const again=await call(`/api/readings/${id}/reveal`,'POST',{bookmark_id:'1'});assert.deepEqual(again.v,results[0].v);
const forbidden=await call(`/api/readings/${id}`,'GET',undefined,'book_owner='+'a'.repeat(64));assert.equal(forbidden.r.status,404);
for(const [path,method,data] of [[`/api/readings/${id}/reveal`,'POST',{bookmark_id:'1'}],[`/api/readings/${id}/feedback`,'POST',{bookmark_id:'1',fit:'fit'}],[`/api/readings/${id}`,'DELETE',{}]]){const x=await call(path,method,data,'book_owner='+'b'.repeat(64));assert.equal(x.r.status,404)}
const invalid=await call(`/api/readings/${id}/reveal`,'POST',{bookmark_id:'25'});assert.equal(invalid.r.status,400);
const feedback=await call(`/api/readings/${id}/feedback`,'POST',{bookmark_id:'1',fit:'not_fit',reason:'unclear'});assert.equal(feedback.r.status,200);
const restored=await call(`/api/readings/${id}`);assert.equal(restored.v.reveals.length,7);assert.equal(restored.v.feedback.length,1);assert.equal(restored.v.feedback[0].reason,'unclear');
const key=crypto.randomUUID();const a=await call('/api/readings','POST',{topic:'read',preference:'comfort',request_key:key});const b=await call('/api/readings','POST',{topic:'read',preference:'comfort',request_key:key});assert.equal(a.v.id,b.v.id);
await call(`/api/readings/${a.v.id}`,'DELETE',{});
const removed=await call(`/api/readings/${id}`,'DELETE',{});assert.equal(removed.v.deleted,true);const after=await call(`/api/readings/${id}`);assert.equal(after.r.status,404);
console.log('PASS: validation, CSRF, 24 slots and 7 distinct revealed quotes/works, replay consistency, cross-owner read/reveal/feedback/delete denial, feedback persistence, idempotence, deletion.');
