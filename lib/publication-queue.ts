import {db} from "./db";

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

export async function listPublicationTasks(){
  const sql=await ensurePublicationQueue();
  const rows=await sql`SELECT t.id,t.offer_id,t.channel,t.cycle_date,t.status,t.scheduled_at,t.published_at,
    t.external_id,t.last_error,t.attempts,o.title,o.price,o.image_url,o.marketplace
    FROM publication_tasks t JOIN offers o ON o.id=t.offer_id
    ORDER BY CASE t.status WHEN 'failed' THEN 0 WHEN 'ready' THEN 1 WHEN 'scheduled' THEN 2 ELSE 3 END,
      t.scheduled_at ASC NULLS LAST,t.created_at DESC LIMIT 200`;
  return rows.map((r:any)=>({...r,id:Number(r.id),offer_id:Number(r.offer_id),price:Number(r.price)}));
}
