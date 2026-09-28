import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const n=Number(id);
  if(!Number.isInteger(n)||n<1)return new NextResponse('Oferta inválida',{status:404});
  const sql=db();
  const rows=await sql`SELECT affiliate_url FROM offers WHERE id=${n} AND status='published' LIMIT 1`;
  if(!rows[0])return new NextResponse('Oferta indisponível',{status:404});
  const requested=(req.nextUrl.searchParams.get('channel')||req.nextUrl.searchParams.get('src')||'vitrine').slice(0,100);
  const allowedChannels=new Set(['vitrine','instagram','whatsapp','telegram','pinterest']);
  const channel=allowedChannels.has(requested)?requested:'vitrine';
  const referrer=req.headers.get('referer')?.slice(0,1000)||null;
  const userAgent=req.headers.get('user-agent')?.slice(0,500)||null;
  try{
    await sql`ALTER TABLE offer_clicks ADD COLUMN IF NOT EXISTS channel TEXT`;
    await sql`ALTER TABLE offer_clicks ADD COLUMN IF NOT EXISTS referrer TEXT`;
    await sql`ALTER TABLE offer_clicks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ`;
    await sql`UPDATE offer_clicks SET channel='vitrine' WHERE channel IS NULL`;
    await sql`UPDATE offer_clicks SET created_at=NOW() WHERE created_at IS NULL`;
  }catch(schemaError){
    console.warn("[click-tracking] Compatibilidade de schema",{schemaError});
  }
  try{
    await sql`INSERT INTO offer_clicks(offer_id,channel,referrer,user_agent,created_at) VALUES(${n},${channel},${referrer},${userAgent},NOW())`;
  }catch(modernError){
    try{await sql`INSERT INTO offer_clicks(offer_id,source,user_agent) VALUES(${n},${channel},${userAgent})`;}
    catch(legacyError){console.error("[click-tracking] Falha ao registrar clique",{offerId:n,channel,modernError,legacyError});}
  }
  const response=NextResponse.redirect(String(rows[0].affiliate_url),302);
  response.headers.set("Cache-Control","no-store, max-age=0");
  return response;
}
