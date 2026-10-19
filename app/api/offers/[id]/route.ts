import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queueManualOffers } from "@/lib/publication-queue";
import { productSafetyCheck } from "@/lib/product-safety";

import {ensureAffiliateRegistry} from '@/lib/affiliate-registry';

import {acceptManualLink} from '@/lib/manual-affiliate';

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const offerId=Number(id);
  if(!Number.isInteger(offerId)||offerId<1) return NextResponse.json({error:"Oferta inválida"},{status:400});
  const form=await req.formData();
  const action=String(form.get("action")||"");
  const sql=db();
  let savedNote='';
  if(action==="edit"){
    const title=String(form.get("title")||"").trim(), category=String(form.get("category")||"Casa").trim();
    const marketplace=String(form.get("marketplace")||"Outro").trim(), image=String(form.get("image_url")||"").trim();
    let affiliate=String(form.get("affiliate_url")||"").trim();
    const price=Number(String(form.get("price")||"").replace(",",".")), originalRaw=String(form.get("original_price")||"").replace(",",".");
    const original=originalRaw?Number(originalRaw):null;
    const externalId=String(form.get("external_id")||"").trim()||null;
    if(marketplace.toLowerCase()==="shopee" && externalId && !/^\d+$/.test(externalId))return NextResponse.json({error:"ID Shopee inválido: use o ID numérico do anúncio."},{status:400});
    if(!title||!affiliate||!Number.isFinite(price)||price<=0)return NextResponse.json({error:"Dados inválidos"},{status:400});
    if(!productSafetyCheck(title,category).allowed)return NextResponse.json({error:"Categoria de produto não permitida neste projeto."},{status:400});
    for(const [label,value] of [["Link",affiliate],["Imagem",image]] as const){if(value){try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))throw 0}catch{return NextResponse.json({error:`${label} inválido`},{status:400})}}}
    let affiliateStatus:string|null=null,subId=String(form.get('sub_id')||'').trim();
    if(marketplace.toLowerCase()==='shopee'){
      try{const accepted=await acceptManualLink(externalId||'',affiliate,subId,form.get('manual_link')==='on');affiliateStatus=accepted.status;savedNote=accepted.note;subId=accepted.subId;}
      catch(e:any){return NextResponse.json({error:e.message||'Não foi possível validar o link Shopee.'},{status:400})}
    }
    await ensureAffiliateRegistry();
    await sql`WITH previous AS (SELECT id,affiliate_url FROM offers WHERE id=${offerId} FOR UPDATE), changed AS (
      UPDATE offers o SET title=${title},category=${category},marketplace=${marketplace},image_url=${image||null},price=${price},original_price=${original},affiliate_url=${affiliate},affiliate_status=${affiliateStatus},affiliate_sub_id=${subId},affiliate_note=${savedNote||null},external_id=${externalId},sync_status=${externalId?"linked":"unlinked"},updated_at=NOW()
      FROM previous p WHERE o.id=p.id RETURNING o.id,p.affiliate_url AS old_url
    ) INSERT INTO affiliate_link_audit(offer_id,old_url,new_url,external_id,status,message)
      SELECT id,old_url,${affiliate},${externalId},'manual',${`Correção manual; Sub ID: ${subId||'não informado'}. ${savedNote}`} FROM changed`;
  }
  else if(action==="publish"){
    const rows=await sql`SELECT title,category,image_url,price,affiliate_url FROM offers WHERE id=${offerId} LIMIT 1`;
    const offer:any=rows[0];
    if(!offer)return NextResponse.json({error:"Oferta não encontrada"},{status:404});
    const missing:string[]=[];
    if(!String(offer.title||"").trim())missing.push("produto");
    if(!String(offer.image_url||"").trim())missing.push("imagem");
    if(!(Number(offer.price)>0))missing.push("preço");
    if(!String(offer.affiliate_url||"").trim())missing.push("link de afiliado");
    if(!productSafetyCheck(String(offer.title||""),String(offer.category||"")).allowed)missing.push("categoria de produto não permitida");
    if(missing.length)return NextResponse.redirect(new URL(`/central?publish_blocked=${encodeURIComponent(missing.join(","))}`,req.url),303);
    await sql`UPDATE offers SET status='published', updated_at=NOW() WHERE id=${offerId}`;
  }
  else if(action==="expire") await sql`UPDATE offers SET status='expired', updated_at=NOW() WHERE id=${offerId}`;
  else if(action==="feature") await sql`UPDATE offers SET featured=TRUE, updated_at=NOW() WHERE id=${offerId}`;
  else if(action==="unfeature") await sql`UPDATE offers SET featured=FALSE, updated_at=NOW() WHERE id=${offerId}`;
  else return NextResponse.json({error:"Ação inválida"},{status:400});
  if(action==="publish"||action==="edit"){try{await queueManualOffers(offerId)}catch{console.error("Oferta salva; inclusão na fila pendente.")}}
  return NextResponse.redirect(new URL(savedNote?`/central?saved=${encodeURIComponent(savedNote)}`:'/central',req.url),303);
}
