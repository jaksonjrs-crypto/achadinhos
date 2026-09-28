import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";

const channelMap:Record<string,string>={w:"whatsapp",i:"instagram",t:"telegram",p:"pinterest",v:"vitrine"};
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const short=(s:string,n=70)=>s.length>n?s.slice(0,n-1).trim()+"…":s;

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const n=Number(id);
  if(!Number.isInteger(n)||n<1)return new NextResponse("Oferta inválida",{status:404});

  const c=req.nextUrl.searchParams.get("c")||"v";
  const channel=channelMap[c]||"vitrine";
  const ua=req.headers.get("user-agent")||"";
  const isPreviewBot=/facebookexternalhit|Facebot|Twitterbot|TelegramBot|Pinterestbot/i.test(ua);

  // Pessoas nunca veem uma tela intermediária: o servidor envia direto ao rastreador.
  if(!isPreviewBot){
    const response=NextResponse.redirect(new URL(`/go/${n}?channel=${encodeURIComponent(channel)}`,req.url),302);
    response.headers.set("Cache-Control","no-store, max-age=0");
    response.headers.set("Vary","User-Agent");
    return response;
  }

  try{
    const sql=db();
    const rows=await sql`SELECT title,image_url,price FROM offers WHERE id=${n} AND status='published' LIMIT 1`;
    const o:any=rows[0];
    if(!o)return new NextResponse("Oferta indisponível",{status:404});
    const title=short(String(o.title),70);
    const description=`${money(Number(o.price))} • Promoção sujeita a alteração a qualquer momento.`;
    const canonical=`${req.nextUrl.origin}/o/${n}?c=${encodeURIComponent(c)}`;
    const image=o.image_url?String(o.image_url):"";
    const body=`<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${image?`<meta property="og:image" content="${esc(image)}">`:""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image?`<meta name="twitter:image" content="${esc(image)}">`:""}
</head><body></body></html>`;
    return new NextResponse(body,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store, max-age=0","Vary":"User-Agent"}});
  }catch{
    return new NextResponse("Oferta indisponível",{status:503});
  }
}
