import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://localhost:5173';
async function call(method,cookie,data){const r=await fetch(base+'/api/notes',{method,headers:{...(cookie?{cookie}:{}),...(data?{'content-type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
const a=await call('GET');assert.equal(a.status,200);const b=await call('GET');const id=crypto.randomUUID();
try {assert.equal((await call('PUT',null,{id,text:'测试随记',quoteId:null})).status,401);
assert.equal((await call('PUT',a.cookie,{id,text:'   ',quoteId:null})).status,400);
assert.equal((await call('PUT',a.cookie,{id,text:'接口验收随记',quoteId:'q001'})).status,200);
assert.equal((await call('GET',a.cookie)).data.notes.find(n=>n.id===id).text,'接口验收随记');
assert.equal((await call('GET',b.cookie)).data.notes.some(n=>n.id===id),false);
assert.equal((await call('PUT',b.cookie,{id,text:'不能覆盖别人的内容',quoteId:null})).status,404);
await call('DELETE',b.cookie,{id});assert.equal((await call('GET',a.cookie)).data.notes.some(n=>n.id===id),true);
await call('PUT',a.cookie,{id,text:'已修改',quoteId:null});assert.equal((await call('GET',a.cookie)).data.notes.find(n=>n.id===id).text,'已修改');
await call('DELETE',a.cookie,{id});assert.equal((await call('GET',a.cookie)).data.notes.some(n=>n.id===id),false);
console.log('Notes CRUD, validation, persistence and owner isolation passed.');
} finally {await call('DELETE',a.cookie,{id})}
