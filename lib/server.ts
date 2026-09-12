import {readingPool} from "@/lib/reading";
import { env } from "cloudflare:workers";
import { openReading } from "@/lib/model";
import { quoteById, type Preference } from "@/content/quotes";
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function db(){if(!env.DB)throw new HttpError(503,"书页暂时没有准备好，请稍后重试。");return env.DB}
export function json(data:unknown,status=200,extra:Record<string,string>={}){return Response.json(data,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",...extra}})}
export async function guard(fn:()=>Promise<Response>){try{return await fn()}catch(e){return json({error:e instanceof HttpError?e.message:"这次没能打开书页，请重试。"},e instanceof HttpError?e.status:503)}}
export async function body(req:Request){const origin=req.headers.get("origin");if(origin&&origin!==new URL(req.url).origin)throw new HttpError(403,"请求来源不匹配，请刷新页面。");if(!req.headers.get("content-type")?.includes("application/json"))throw new HttpError(415,"请求格式不正确。");const reader=req.body?.getReader();if(!reader)throw new HttpError(400,"缺少请求内容。");let bytes=0;let result="";const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>8192){await reader.cancel();throw new HttpError(413,"内容太长，请缩短后重试。")}result+=decoder.decode(value,{stream:true})}result+=decoder.decode();try{return JSON.parse(result)}catch{throw new HttpError(400,"请求格式不正确。")}}
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,"0")).join("")}
export function ownerToken(req:Request){const token=req.headers.get("cookie")?.match(/(?:^|;\s*)book_owner=([a-f0-9]{64})(?:;|$)/)?.[1];return token||null}
export function newToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,"0")).join("")}
export function ownerCookie(req:Request,token:string){return `book_owner=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200${new URL(req.url).protocol==="https:"?"; Secure":""}`}
export type ReadingRow={id:string;owner_hash:string;topic:string;preference:Preference;quote_ids:string;expires_at:number;created_at:number;generation_status:"editorial"|"pending"|"ready"|"failed";model_data:string|null};
export async function cleanup(){const now=Date.now();await db().batch([db().prepare("DELETE FROM readings WHERE expires_at <= ?").bind(now),db().prepare("DELETE FROM rate_limits WHERE expires_at <= ?").bind(now)])}
export async function limit(req:Request,token:string){const now=Date.now();const window=Math.floor(now/3600000);const ip=req.headers.get("cf-connecting-ip")||"local";const key=await hash(`${ip}:${window}:book-create`);const r=await db().prepare("INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(key,(window+1)*3600000).first<{count:number}>();if(!r||r.count>60)throw new HttpError(429,"这一小时已经翻过很多页了，请稍后再来。");}
export async function owned(req:Request,id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new HttpError(404,"这页已失效或无法访问。");const token=ownerToken(req);if(!token)throw new HttpError(404,"这页已失效或无法访问。");const row=await db().prepare("SELECT * FROM readings WHERE id = ? AND owner_hash = ? AND expires_at > ?").bind(id,await hash(token),Date.now()).first<ReadingRow>();if(!row)throw new HttpError(404,"这页已失效或无法访问。");if(row.generation_status==="pending")throw new HttpError(409,"书签还在准备，请稍后重试。");if(row.generation_status==="failed")throw new HttpError(503,"这次没能准备好书签，请重新开始。");const oldIds=JSON.parse(row.quote_ids) as string[];if(oldIds.length<24){row.quote_ids=JSON.stringify(readingPool(oldIds,row.topic as "start"|"rest"|"read",row.id));await db().prepare("UPDATE readings SET quote_ids=? WHERE id=? AND owner_hash=?").bind(row.quote_ids,row.id,row.owner_hash).run()}return row}
export async function slots(req:Request,row:ReadingRow,token=ownerToken(req)){const aiIds=row.generation_status==="ready"&&row.model_data?(await openReading(row.model_data,token!,row.id)).bookmarks.map(b=>b.quote_id):[];return (JSON.parse(row.quote_ids) as string[]).map((id,index)=>({id:String(index+1),available:!!quoteById(id),origin:aiIds.includes(id)?"ai":"editorial"}))}
export function selected(row:ReadingRow,slot:unknown){if(typeof slot!=="string"||! /^(?:[1-9]|1[0-9]|2[0-4])$/.test(slot))throw new HttpError(400,"请选择这本书里的书签。");const ids=JSON.parse(row.quote_ids) as string[];const quote=quoteById(ids[Number(slot)-1]);if(!quote)throw new HttpError(410,"这段原文暂时撤下了，可以看看其他书签。");return quote}
export async function guidance(req:Request,row:ReadingRow,quote:NonNullable<ReturnType<typeof quoteById>>){if(row.generation_status==="ready"&&row.model_data){const data=await openReading(row.model_data,ownerToken(req)!,row.id);const b=data.bookmarks.find(b=>b.quote_id===quote.id);if(b)return {origin:"ai" as const,interpretation:b.interpretation,small_action:b.small_action}}return {origin:"editorial" as const,interpretation:quote.note,small_action:row.preference==="action"&&row.topic==="start"?quote.action:null}}

export async function modelLimit(req:Request){
 const now=Date.now(),hour=Math.floor(now/3600000),day=Math.floor((now+8*3600000)/86400000);
 const ipKey=await hash(`${req.headers.get("cf-connecting-ip")||"local"}:${hour}:model`);
 const ip=await db().prepare("INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(ipKey,(hour+1)*3600000).first<{count:number}>();
 if(!ip||ip.count>10)throw new HttpError(429,"这一小时的个性化阅读次数已用完，请稍后再来；仍可选择只读一句。");
 const cap=Number(env.AI_DAILY_LIMIT||80);
 const total=await db().prepare("INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(`model-day:${day}`,(day+1)*86400000-8*3600000).first<{count:number}>();
 if(!total||total.count>(Number.isFinite(cap)&&cap>0?cap:80))throw new HttpError(429,"今天的个性化阅读暂时用完了，仍可选择只读一句，明天再来。");
}

export async function searchLimit(req:Request){
 const now=Date.now(),hour=Math.floor(now/3600000),day=Math.floor((now+8*3600000)/86400000);
 const ipKey=await hash(`${req.headers.get("cf-connecting-ip")||"local"}:${hour}:zhihu-search`);
 const ip=await db().prepare("INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(ipKey,(hour+1)*3600000).first<{count:number}>();
 if(!ip||ip.count>30)throw new HttpError(429,"这一小时已经找过很多次了，请稍后再来。");
 const total=await db().prepare("INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(`zhihu-search-day:${day}`,(day+1)*86400000-8*3600000).first<{count:number}>();
 if(!total||total.count>3000)throw new HttpError(429,"知乎搜索今天有些忙，请明天再来看看。");
}
