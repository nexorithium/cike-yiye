import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
await build({entryPoints:['content/quotes.ts','lib/reading.ts','lib/candidates.ts'],bundle:true,platform:'node',format:'esm',outdir:'.sites-runtime/catalog-tests'});
const {quotes}=await import('../.sites-runtime/catalog-tests/content/quotes.js');
const {readingPool}=await import('../.sites-runtime/catalog-tests/lib/reading.js');
const {candidateQuotes}=await import('../.sites-runtime/catalog-tests/lib/candidates.js');
const normalize=t=>t.replace(/[^\p{L}\p{N}]/gu,'');
assert.equal(quotes.length,600);assert.equal(new Set(quotes.map(q=>normalize(q.text))).size,600);
assert.deepEqual(quotes.map(q=>q.id),Array.from({length:600},(_,i)=>`q${String(i+1).padStart(3,'0')}`));
const upstream=JSON.parse(fs.readFileSync('content/sources/tang-selection.upstream.json','utf8'));
for(const q of quotes.slice(60)){const source=upstream.find(p=>p.id===q.upstreamId);assert.ok(source?.paragraphs[q.upstreamParagraph]);assert.ok(q.fullText.includes(q.text.replace('\n','')));assert.ok(q.meaning.length>=20);assert.equal(q.annotationKind,'work-guide');assert.match(q.source,/b8594f81a89752241442f2ce267d6f66f96704ee/)}
for(const seed of ['old-reading','new-reading']){const pool=readingPool(['q001'],'rest',seed);assert.equal(pool.length,24);assert.equal(pool[0],'q001');assert.equal(new Set(pool).size,24);assert.deepEqual(pool,readingPool(['q001'],'rest',seed))}
for(const input of ['我已经很努力了，但还是没有结果','今天想念家乡','杜甫阁夜','我并不想独处']){const candidates=candidateQuotes(input);assert.equal(candidates.length,96);assert.equal(new Set(candidates.map(q=>q.id)).size,96);assert.deepEqual(candidates,candidateQuotes(input));assert.ok(candidates.some(q=>+q.id.slice(1)>60))}
console.log('PASS: 600 unique excerpts/IDs, source record references, context/guides, stable 24-card legacy pool, bounded 96-candidate retrieval.');
