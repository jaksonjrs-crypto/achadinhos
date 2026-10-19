import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const n=Number(id);
  if(!Number.isInteger(n)||n<1)return new NextResponse('Oferta inválida',{status:404});
  const sql=db();
  const rows=await sql`SELECT affiliate_url FROM offers WHERE id=${n} AND status='published' LIMIT 1`;
  if(!rows[0])return new NextResponse('Oferta indisponível',{status:404});
  const requested=(req.nextUrl.searchParams.get('channel')||req.nextUrl.searchParams.get('src')||'vitrine').slice(0,100);
  const allowedChannels=new Set(['vitrine','instagram','facebook','whatsapp','telegram','pinterest','tiktok']);
  const channel=allowedChannels.has(requested)?requested:'vitrine';
  const referrer=req.headers.get('referer')?.slice(0,1000)||null;
  const userAgent=req.headers.get('user-agent')?.slice(0,500)||null;
  after(async()=>{
    try{await sql`INSERT INTO offer_clicks(offer_id,channel,referrer,user_agent,created_at) VALUES(${n},${channel},${referrer},${userAgent},NOW())`;}
    catch{try{await sql`INSERT INTO offer_clicks(offer_id,source,user_agent) VALUES(${n},${channel},${userAgent})`;}catch{console.error('[click-tracking] Falha ao registrar clique',{offerId:n,channel});}}
  });
  const destination=new URL(String(rows[0].affiliate_url));
  const response=NextResponse.redirect(destination,302);
  response.headers.set("Cache-Control","no-store, max-age=0");
  return response;
}
