import {quoteById} from "@/content/quotes";
import {json} from "@/lib/server";
export function GET(req:Request){const ids=(new URL(req.url).searchParams.get("ids")||"").split(",").slice(0,100);return json({quotes:ids.map(quoteById).filter(Boolean)})}
