import {env} from "cloudflare:workers";
import {z} from "zod";
import {cleanup,guard,HttpError,json,searchLimit} from "@/lib/server";

const responseSchema=z.object({
 Code:z.number(),
 Message:z.string().optional(),
 Data:z.object({Items:z.array(z.object({
  Title:z.string(),ContentText:z.string(),Url:z.string(),AuthorName:z.string(),ContentType:z.string(),
 }).passthrough()).default([])}).optional(),
}).passthrough();

function zhihuUrl(value:string){
 try{const url=new URL(value);return url.protocol==="https:"&&(url.hostname==="zhihu.com"||url.hostname.endsWith(".zhihu.com"))?url.toString():null}catch{return null}
}

export async function GET(req:Request){
 return guard(async()=>{
  const requestUrl=new URL(req.url),origin=req.headers.get("origin"),fetchSite=req.headers.get("sec-fetch-site");
  if((origin&&origin!==requestUrl.origin)||(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="none"))throw new HttpError(403,"请求来源不匹配，请刷新页面。");
  const query=(requestUrl.searchParams.get("q")||"").trim();
  if(query.length<2||query.length>80)throw new HttpError(400,"请输入 2 至 80 个字再去知乎寻找。");
  if(!env.ZHIHU_ACCESS_SECRET)throw new HttpError(503,"知乎搜索暂时无法连接。");
  await cleanup();await searchLimit(req);
  const url=new URL("https://developer.zhihu.com/api/v1/content/zhihu_search");
  url.searchParams.set("Query",`名人名言 ${query} 原文 作者 作品 出处`);url.searchParams.set("Count","10");
  const response=await fetch(url,{headers:{Authorization:`Bearer ${env.ZHIHU_ACCESS_SECRET}`,"X-Request-Timestamp":String(Math.floor(Date.now()/1000))},signal:AbortSignal.timeout(12000)});
  if(!response.ok){console.error("zhihu_search_failed",{status:response.status});throw new HttpError(response.status===429?429:503,response.status===429?"知乎搜索今天有些忙，请稍后再试。":"知乎搜索暂时没有回应，请稍后再试。");}
  const parsed=responseSchema.safeParse(await response.json());
  if(!parsed.success||parsed.data.Code!==0)throw new HttpError(503,"知乎搜索暂时没有回应，请稍后再试。");
  const results=(parsed.data.Data?.Items||[]).flatMap(item=>{const source=zhihuUrl(item.Url);if(!source)return[];const excerpt=item.ContentText.replace(/\uFFFD/g,"").replace(/\s+/g," ").trim().slice(0,260);if(!excerpt)return[];return[{title:item.Title.replace(/\uFFFD/g,"").trim().slice(0,120),author:item.AuthorName.replace(/\uFFFD/g,"").trim().slice(0,50),excerpt,url:source,type:item.ContentType==="Article"?"文章":item.ContentType==="Answer"?"回答":"内容"}]})
   .slice(0,6);
  return json({results,notice:"来自知乎搜索的内容线索，署名与出处尚未由本站逐条校勘。"});
 });
}
