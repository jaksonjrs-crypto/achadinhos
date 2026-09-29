import {NextRequest,NextResponse} from "next/server";
import {ensurePublicationQueue} from "@/lib/publication-queue";
import {pinterestFetch} from "@/lib/pinterest";
import {productSafetyCheck} from "@/lib/product-safety";
export const dynamic="force-dynamic";

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({}));
  const id=Number(body.id);
  if(!Number.isSafeInteger(id)||id<1) return NextResponse.json({ok:false,error:"Item inválido."},{status:400});
  try{
    const sql=await ensurePublicationQueue();
    const claimed=await sql`UPDATE publication_tasks SET status='publishing',attempts=attempts+1,updated_at=NOW()
      WHERE id=${id} AND status IN ('ready','scheduled') AND (scheduled_at IS NULL OR scheduled_at<=NOW())
      RETURNING offer_id,channel`;
    if(!claimed.length) return NextResponse.json({ok:false,error:"Item já processado ou agendado para mais tarde."},{status:409});
    const offerId=Number(claimed[0].offer_id),channel=String(claimed[0].channel);
    let accepted=false,externalId="";
    try{
      const offers=await sql`SELECT title,image_url,price,status FROM offers WHERE id=${offerId} LIMIT 1`;
      const offer:any=offers[0];
      if(!offer||offer.status!=='published'||!productSafetyCheck(String(offer.title||'')).allowed) throw new Error("Oferta indisponível ou bloqueada.");
      const link=`${new URL(req.url).origin}/o/${offerId}?c=${channel==='telegram'?'t':'p'}`;
      if(channel==='telegram'){
        const token=process.env.TELEGRAM_BOT_TOKEN?.trim(),chatId=process.env.TELEGRAM_CHAT_ID?.trim();
        if(!token||!chatId) throw new Error("Bot e canal do Telegram não configurados.");
        const message=`🔥 ${String(offer.title).slice(0,180)}\n💰 ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(offer.price))}\n🔗 ${link}\n\nPromoção sujeita a alteração.`;
        const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text:message,disable_web_page_preview:false}),cache:'no-store'});
        const data=await r.json().catch(()=>({}));
        if(!r.ok||!data.ok) throw new Error(`Telegram: ${String(data.description||r.status).slice(0,180)}`);
        externalId=String(data.result?.message_id||'');
      }else if(channel==='pinterest'){
        const boardId=String(body.boardId||'').trim();
        if(!boardId||!offer.image_url) throw new Error("Escolha uma pasta e verifique a imagem da oferta.");
        const r=await pinterestFetch('/pins',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({board_id:boardId,title:String(offer.title).slice(0,100),description:'Achado da Vitrine dos Achados. Confira preço e disponibilidade no link. Promoção sujeita a alteração.',link,media_source:{source_type:'image_url',url:String(offer.image_url)}})});
        const data=await r.json().catch(()=>({}));
        if(!r.ok) throw new Error(`Pinterest: ${String(data.message||r.status).slice(0,180)}`);
        externalId=String(data.id||'');
      }else throw new Error("Este canal usa publicação assistida nesta versão.");
      accepted=true;
      await sql`UPDATE publication_tasks SET status='published',external_id=${externalId||null},published_at=NOW(),last_error=NULL,updated_at=NOW() WHERE id=${id}`;
      return NextResponse.json({ok:true,externalId});
    }catch(e:any){
      if(accepted){
        console.error('Publication accepted but not recorded',{id,externalId,error:String(e?.message||e)});
        return NextResponse.json({ok:false,error:'A API aceitou o envio, mas não foi possível registrar a conclusão. Confira o canal antes de qualquer nova tentativa.'},{status:500});
      }
      const raw=String(e?.message||'Falha na publicação');
      const token=process.env.TELEGRAM_BOT_TOKEN?.trim();
      const message=(token?raw.replaceAll(token,'[redacted]'):raw).slice(0,300);
      await sql`UPDATE publication_tasks SET status='failed',last_error=${message},updated_at=NOW() WHERE id=${id}`;
      return NextResponse.json({ok:false,error:message},{status:502});
    }
  }catch(e:any){console.error('Publication dispatch:',e?.message||e);return NextResponse.json({ok:false,error:'Não foi possível processar a publicação.'},{status:500})}
}
