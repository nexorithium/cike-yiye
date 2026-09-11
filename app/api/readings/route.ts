import { env } from "cloudflare:workers";
import { z } from "zod";
import { body,cleanup,db,guard,hash,HttpError,json,limit,modelLimit,newToken,ownerCookie,ownerToken,slots,type ReadingRow } from "@/lib/server";
import { selectQuotes } from "@/lib/reading";
import { generateReading,sealReading,ModelServiceError } from "@/lib/model";
const schema=z.object({text:z.string().max(500).default(""),topic:z.enum(["start","rest","read"]).optional(),preference:z.enum(["auto","comfort","clarity","action"]).default("auto"),request_key:z.string().uuid()}).strict();
export async function POST(req:Request){
 let headers:Record<string,string>={};
 const response=await guard(async()=>{
  const parsed=schema.safeParse(await body(req));
  if(!parsed.success)throw new HttpError(400,"请使用 500 字以内的内容。");
  const {text,topic:chosen,preference,request_key}=parsed.data;
  if(!text.trim()&&!chosen)throw new HttpError(400,"写下一句话，或者选择下面的情境。");
  const token=ownerToken(req)||newToken();headers={"Set-Cookie":ownerCookie(req,token)};
  await cleanup();await limit(req,token);const owner=await hash(token);
  const find=()=>db().prepare("SELECT * FROM readings WHERE owner_hash = ? AND request_key = ? AND expires_at > ?").bind(owner,request_key,Date.now()).first<ReadingRow>();
  let row=await find();
  if(row?.generation_status==="pending")throw new HttpError(409,"书签还在准备，请稍后重试。");
  if(row?.generation_status==="failed"){
   await db().prepare("DELETE FROM readings WHERE id = ? AND generation_status = 'failed'").bind(row.id).run();row=null;
  }
  if(!row){
   const id=crypto.randomUUID(),now=Date.now();
   // Explicit no-input literary browsing needs no external model or user data.
   const editorial=!text.trim()&&chosen==="read";
   if(!editorial&&!env.ZHIHU_ACCESS_SECRET)throw new HttpError(503,"个性化解读暂时无法连接，请稍后重试，或选择只读一句。");
   const ids=editorial?selectQuotes("read","comfort").map(q=>q.id):[];
   await db().prepare("INSERT OR IGNORE INTO readings(id,owner_hash,request_key,topic,preference,quote_ids,created_at,expires_at,generation_status) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(id,owner,request_key,chosen||"read",preference,JSON.stringify(ids),now,now+(editorial?1800000:120000),editorial?"editorial":"pending").run();
   row=await find();
   if(!row)throw new HttpError(503,"书签暂未准备好，请重试。");
   if(row.id!==id)throw new HttpError(409,"书签还在准备，请稍后重试。");
   if(!editorial){
    try{
     await modelLimit(req);
     const generated=await generateReading(env.ZHIHU_ACCESS_SECRET!,env.ZHIHU_MODEL||"zhida-fast-1p5",text.trim(),chosen,preference);
     if(generated.status!=="ready"){
      await db().prepare("DELETE FROM readings WHERE id = ?").bind(id).run();
      return json({status:generated.status});
     }
     const encrypted=await sealReading(generated,token,id);
     await db().prepare("UPDATE readings SET topic=?,quote_ids=?,model_data=?,generation_status='ready',expires_at=? WHERE id=? AND generation_status='pending'")
      .bind(generated.topic,JSON.stringify(generated.bookmarks.map(b=>b.quote_id)),encrypted,Date.now()+1800000,id).run();
     row=await find();
    }catch(e){
     console.error("reading_generation_failed",{kind:e instanceof Error?e.name:"unknown"});
     await db().prepare("UPDATE readings SET generation_status='failed' WHERE id=? AND generation_status='pending'").bind(id).run();
     if(e instanceof HttpError)throw e;
     if(e instanceof ModelServiceError&&e.status===429)throw new HttpError(429,"知乎直答暂时限制了调用，请过一会儿再试。输入已保留，也可以先选择只读一句。");
     throw new HttpError(503,"这次没能生成贴合的解读。你的输入还在，可以重试，或选择只读一句。");
    }
   }
  }
  if(!row)throw new HttpError(503,"书签暂未准备好，请重试。");
  return json({id:row.id,status:"ready",topic:row.topic,preference:row.preference,bookmarks:slots(row),expires_at:row.expires_at,origin:row.generation_status==="ready"?"ai":"editorial"});
 });
 for(const [key,value] of Object.entries(headers))response.headers.set(key,value);
 return response;
}
