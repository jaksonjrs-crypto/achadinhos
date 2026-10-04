import {ensurePublicationQueue,brazilDate} from './publication-queue';
import {PUBLICATION_TIMES,duePublicationSlot} from './autopilot-schedule';
import {productSafetyCheck} from './product-safety';
import {syncCatalog} from './catalog-sync';
import {publishInstagramImage} from './instagram';
import {sendTelegramOffer} from './telegram-publisher';
import {facebookConfigured,publishFacebookPhoto} from './facebook';
import type {AutopilotPolicy} from './autopilot-policy';

export async function publishScheduledOffers(policy:AutopilotPolicy,now=new Date()) {
  const times=policy.publication_times||[...PUBLICATION_TIMES];
  const slot=duePublicationSlot(now,policy.start_hour,policy.end_hour,times);
  let instagramSent=0,instagramFailed=0,telegramSent=0,telegramFailed=0,facebookSent=0,facebookFailed=0;
  if(!slot)return {slot,instagramSent,instagramFailed,telegramSent,telegramFailed,facebookSent,facebookFailed};
  const sql=await ensurePublicationQueue(),date=brazilDate(now);
  await sql`CREATE TABLE IF NOT EXISTS autopilot_publication_slots (
    cycle_date DATE NOT NULL, slot TEXT NOT NULL, channel TEXT NOT NULL,
    task_id BIGINT REFERENCES publication_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(cycle_date,slot,channel)
  )`;
  const start=new Date(`${date}T00:00:00-03:00`),end=new Date(start.getTime()+86400000);
  for(const channel of ['telegram','instagram','facebook'] as const){
    const enabled=channel==='telegram'?policy.telegram_auto_publish:channel==='facebook'?policy.facebook_auto_publish:policy.instagram_auto_publish;
    if(!enabled)continue;
    const configured=channel==='telegram'
      ? Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID)
      : channel==='facebook'?facebookConfigured():Boolean(process.env.INSTAGRAM_ACCESS_TOKEN&&process.env.INSTAGRAM_USER_ID);
    if(!configured){channel==='telegram'?telegramFailed++:channel==='facebook'?facebookFailed++:instagramFailed++;continue;}
    // Published/manual sends and uncertain in-flight sends consume the budget.
    const counts=await sql`SELECT COUNT(*)::int AS total FROM publication_tasks
      WHERE channel=${channel} AND (published_at>=${start.toISOString()} AND published_at<${end.toISOString()}
        OR status='publishing' AND updated_at>=${start.toISOString()} AND updated_at<${end.toISOString()})`;
    if(Number(counts[0]?.total||0)>=times.length)continue;
    const previous=await sql`SELECT slot FROM autopilot_publication_slots WHERE cycle_date=${date}::date AND slot=${slot} AND channel=${channel}`;
    if(previous.length)continue;
    // Shopee products can have their current price checked immediately before
    // dispatch. Other marketplaces remain assisted until refresh is supported.
    const tasks=await sql`SELECT t.id,t.offer_id FROM publication_tasks t JOIN offers o ON o.id=t.offer_id
      WHERE t.channel=${channel} AND t.status IN ('ready','scheduled') AND t.cycle_date<=${date}::date
        AND (t.scheduled_at IS NULL OR t.scheduled_at<=${now.toISOString()})
        AND o.status='published' AND LOWER(TRIM(o.marketplace))='shopee' AND o.price>0
        AND NULLIF(TRIM(o.image_url),'') IS NOT NULL AND NULLIF(TRIM(o.affiliate_url),'') IS NOT NULL
        AND NOT EXISTS(SELECT 1 FROM publication_tasks prev WHERE prev.offer_id=t.offer_id AND prev.channel=${channel}
          AND (prev.status='publishing' OR prev.published_at>NOW()-(${policy.cooldown_days}::int*INTERVAL '1 day')))
      ORDER BY o.opportunity_score DESC NULLS LAST,o.updated_at DESC,t.id ASC LIMIT 1`;
    if(!tasks.length)continue;
    const taskId=Number(tasks[0].id),offerId=Number(tasks[0].offer_id);
    // Reservation is permanent even on ambiguous API failures. Automatic retries
    // could duplicate a post that the provider accepted before the timeout.
    const reserved=await sql`INSERT INTO autopilot_publication_slots(cycle_date,slot,channel,task_id)
      VALUES(${date}::date,${slot},${channel},${taskId}) ON CONFLICT DO NOTHING RETURNING slot`;
    if(!reserved.length)continue;
    const claimed=await sql`UPDATE publication_tasks SET status='publishing',attempts=attempts+1,updated_at=NOW()
      WHERE id=${taskId} AND status IN ('ready','scheduled') AND (scheduled_at IS NULL OR scheduled_at<=NOW())
        AND NOT EXISTS(SELECT 1 FROM publication_tasks prev WHERE prev.offer_id=${offerId} AND prev.channel=${channel}
          AND (prev.status='publishing' OR prev.published_at>NOW()-(${policy.cooldown_days}::int*INTERVAL '1 day'))) RETURNING id`;
    if(!claimed.length)continue;
    let accepted=false;
    try{
      const refreshed=await syncCatalog(1,undefined,offerId);
      if(refreshed.failed||refreshed.unlinked||refreshed.checked!==1)throw new Error('Preço não confirmado na Shopee. Oferta precisa de revisão antes de enviar.');
      const offers=await sql`SELECT title,category,image_url,price,status FROM offers WHERE id=${offerId} LIMIT 1`;
      const offer:any=offers[0];
      if(!offer||offer.status!=='published'||Number(offer.price)<=0||!productSafetyCheck(String(offer.title||''),String(offer.category||'')).allowed)throw new Error('Oferta indisponível ou bloqueada.');
      let externalId:string;
      if(channel==='telegram')externalId=await sendTelegramOffer(offer,offerId,'https://www.minhavitrinedeachados.com.br');
      else if(channel==='facebook'){
        const price=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(offer.price));
        const message=`🔥 Achado de hoje!\n\n${String(offer.title).slice(0,140)}\n💰 ${price}\n\n🔗 Confira a promoção:\nhttps://www.minhavitrinedeachados.com.br/go/${offerId}?channel=facebook\n\nSiga a Vitrine para acompanhar novos achados.\nPromoção sujeita a alteração a qualquer momento. Podemos receber comissão pelas compras.\n\n#VitrineDosAchados #Achadinhos #Ofertas`;
        externalId=(await publishFacebookPhoto({imageUrl:String(offer.image_url),message})).postId;
      }else{
        const price=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(offer.price));
        const caption=`🔥 Achado de hoje!\n\n${String(offer.title).slice(0,140)}\n💰 ${price}\n\n🔗 Confira a promoção pelo link da bio.\nSiga a Vitrine para acompanhar novos achados.\n\nPromoção sujeita a alteração a qualquer momento. Podemos receber comissão pelas compras.\n\n#VitrineDosAchados #Achadinhos #Ofertas`;
        externalId=(await publishInstagramImage({imageUrl:String(offer.image_url),caption})).mediaId;
      }
      accepted=true;
      channel==='telegram'?telegramSent++:channel==='facebook'?facebookSent++:instagramSent++;
      await sql`UPDATE publication_tasks SET status='published',external_id=${externalId},published_at=NOW(),last_error=NULL,updated_at=NOW() WHERE id=${taskId}`;
    }catch{
      channel==='telegram'?telegramFailed++:channel==='facebook'?facebookFailed++:instagramFailed++;
      if(!accepted)await sql`UPDATE publication_tasks SET status='failed',last_error='Envio automático não confirmado. Confira preço e canal antes de repetir.',updated_at=NOW() WHERE id=${taskId}`;
      // An accepted send stays 'publishing' if recording failed, never retryable.
    }
  }
  return {slot,instagramSent,instagramFailed,telegramSent,telegramFailed,facebookSent,facebookFailed};
}
