import {db} from "./db";
import {productSafetyCheck} from "./product-safety";

export const CHANNELS=["pinterest","instagram","facebook","telegram","whatsapp","tiktok"] as const;
export type Channel=typeof CHANNELS[number];
export const isChannel=(value:string):value is Channel=>CHANNELS.includes(value as Channel);

export function brazilDate(date=new Date()){
  return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}

// An idempotent migration lets an existing deployment acquire the queue without
// a manual SQL step. The admin middleware protects the routes that call this.
export async function ensurePublicationQueue(){
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS publication_tasks (
    id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('pinterest','instagram','facebook','telegram','whatsapp','tiktok')),
    cycle_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','scheduled','publishing','published','failed','skipped')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    external_id TEXT,
    last_error TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (offer_id,channel,cycle_date)
  )`;
  return sql;
}

// Manual registrations use the same channel queue as discovered offers. A
// previously queued channel is not re-enqueued on refresh or a price edit.
export async function queueManualOffers(offerId?:number,date=brazilDate()){
  const sql=await ensurePublicationQueue();
  const offers=await sql`SELECT id,title,category,image_url,affiliate_url,price FROM offers o
    WHERE status='published' AND (opportunity_score IS NULL OR id=${offerId??null}::bigint)
      AND (${offerId??null}::bigint IS NULL OR id=${offerId??null}::bigint)
      AND price>0 AND NULLIF(TRIM(title),'') IS NOT NULL AND NULLIF(TRIM(image_url),'') IS NOT NULL
      AND NULLIF(TRIM(affiliate_url),'') IS NOT NULL
      AND EXISTS(SELECT 1 FROM unnest(ARRAY['telegram','pinterest','instagram','facebook','whatsapp','tiktok']) AS channels(channel)
        WHERE NOT EXISTS(SELECT 1 FROM publication_tasks t WHERE t.offer_id=o.id AND t.channel=channels.channel))
    ORDER BY created_at DESC,id DESC LIMIT 120`;
  let queued=0,queuedTasks=0;
  for(const o of offers){
    if(!productSafetyCheck(String(o.title||''),String(o.category||'')).allowed)continue;
    try{
      if(!['http:','https:'].includes(new URL(String(o.affiliate_url)).protocol)
        ||!['http:','https:'].includes(new URL(String(o.image_url)).protocol))continue;
    }catch{continue}
    const rows=await sql`INSERT INTO publication_tasks(offer_id,channel,cycle_date,status)
      SELECT ${o.id},channels.channel,${date}::date,'ready'
      FROM unnest(ARRAY['telegram','pinterest','instagram','facebook','whatsapp','tiktok']) AS channels(channel)
      WHERE NOT EXISTS(SELECT 1 FROM publication_tasks WHERE offer_id=${o.id} AND channel=channels.channel)
      ON CONFLICT(offer_id,channel,cycle_date) DO NOTHING RETURNING id`;
    if(rows.length){queued++;queuedTasks+=rows.length}
  }
  return {queued,queuedTasks};
}

export async function listPublicationTasks(){
  await queueManualOffers();
  const sql=await ensurePublicationQueue();
  const rows=await sql`SELECT t.id,t.offer_id,t.channel,t.cycle_date,t.status,t.scheduled_at,t.published_at,
    t.external_id,t.last_error,t.attempts,o.title,o.price,o.image_url,o.marketplace
    FROM publication_tasks t JOIN offers o ON o.id=t.offer_id
    ORDER BY CASE t.status WHEN 'failed' THEN 0 WHEN 'ready' THEN 1 WHEN 'scheduled' THEN 2 ELSE 3 END,
      t.scheduled_at ASC NULLS LAST,t.created_at DESC LIMIT 200`;
  return rows.map((r:any)=>({...r,id:Number(r.id),offer_id:Number(r.offer_id),price:Number(r.price)}));
}
