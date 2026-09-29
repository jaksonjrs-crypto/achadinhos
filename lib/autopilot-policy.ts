import {randomUUID} from 'node:crypto';
import {db} from './db';
import {brazilDate,ensurePublicationQueue} from './publication-queue';

export type AutopilotPolicy={enabled:boolean;min_score:number;max_per_day:number;start_hour:number;end_hour:number;cooldown_days:number;telegram_auto_publish:boolean};
export async function getAutopilotPolicy():Promise<AutopilotPolicy>{
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS autopilot_policy (
    id INTEGER PRIMARY KEY CHECK (id=1),enabled BOOLEAN NOT NULL DEFAULT FALSE,
    min_score INTEGER NOT NULL DEFAULT 80 CHECK (min_score BETWEEN 0 AND 100),
    max_per_day INTEGER NOT NULL DEFAULT 3 CHECK (max_per_day BETWEEN 1 AND 20),
    start_hour INTEGER NOT NULL DEFAULT 9 CHECK (start_hour BETWEEN 0 AND 23),
    end_hour INTEGER NOT NULL DEFAULT 21 CHECK (end_hour BETWEEN 1 AND 24),
    cooldown_days INTEGER NOT NULL DEFAULT 7 CHECK (cooldown_days BETWEEN 1 AND 90),
    telegram_auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    run_token TEXT,
    lease_until TIMESTAMPTZ
  )`;
  await sql`ALTER TABLE autopilot_policy ADD COLUMN IF NOT EXISTS run_token TEXT`;
  await sql`ALTER TABLE autopilot_policy ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ`;
  await sql`ALTER TABLE autopilot_policy ADD COLUMN IF NOT EXISTS telegram_auto_publish BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`INSERT INTO autopilot_policy(id) VALUES(1) ON CONFLICT DO NOTHING`;
  const rows=await sql`SELECT enabled,min_score,max_per_day,start_hour,end_hour,cooldown_days,telegram_auto_publish FROM autopilot_policy WHERE id=1`;
  return rows[0] as AutopilotPolicy;
}
export function brazilHour(now=new Date()){
  return Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',hourCycle:'h23'}).format(now));
}
export async function runAutopilot(now=new Date()){
  const policy=await getAutopilotPolicy();
  const date=brazilDate(now),hour=brazilHour(now);
  if(!policy.enabled)return {ok:true,ran:false,reason:'Autopiloto desativado',date};
  if(hour<policy.start_hour||hour>=policy.end_hour)return {ok:true,ran:false,reason:'Fora do horário permitido',date};
  const sql=db();
  const token=randomUUID();
  const claimed=await sql`UPDATE autopilot_policy SET run_token=${token},lease_until=NOW()+INTERVAL '2 minutes'
    WHERE id=1 AND (lease_until IS NULL OR lease_until<NOW()) RETURNING id`;
  if(!claimed.length)return {ok:true,ran:false,reason:'Outra execução do Autopiloto está em andamento',date};
  try{
  const dayStart=new Date(`${date}T00:00:00-03:00`),dayEnd=new Date(dayStart.getTime()+86400000);
  const count=await sql`SELECT COUNT(*)::int AS total FROM offers WHERE status='published' AND created_at>=${dayStart.toISOString()} AND created_at<${dayEnd.toISOString()}`;
  const remaining=Math.max(0,policy.max_per_day-Number(count[0]?.total||0));
  if(!remaining)return {ok:true,ran:false,reason:'Limite diário atingido',date};
  const candidates=await sql`SELECT c.id,c.title,c.marketplace,c.external_id FROM product_candidates c
    WHERE c.status='approved' AND c.score>=${policy.min_score}
      AND c.image_url IS NOT NULL AND c.product_url IS NOT NULL AND c.price>0
      AND NOT EXISTS (SELECT 1 FROM offers o WHERE
        LOWER(TRIM(o.marketplace))=LOWER(TRIM(c.marketplace))
        AND (c.external_id IS NOT NULL AND o.external_id=c.external_id OR LOWER(TRIM(o.title))=LOWER(TRIM(c.title)))
        AND (o.status='published' OR o.updated_at>NOW()-(${policy.cooldown_days}::int*INTERVAL '1 day')))
    ORDER BY c.score DESC,c.created_at ASC LIMIT ${remaining}`;
  // Lazy import avoids a dependency cycle with the candidate publishing flow.
  const {autopilotCandidate}=await import('./autopilot');
  const queue=candidates.length?await ensurePublicationQueue():null;
  let published=0,pending=0,failed=0,queued=0,telegramSent=0,telegramFailed=0;
  for(const c of candidates){
    const r=await autopilotCandidate(Number(c.id));
    if(!r.ok){failed++;continue}
    if(!r.published||!r.offerId){pending++;continue}
    published++;
    // A fila registra a divulgação sem disparar uma mensagem antes de haver regras por canal.
    const rows=await queue!`INSERT INTO publication_tasks(offer_id,channel,cycle_date,status)
      VALUES(${r.offerId},'telegram',${date}::date,'ready')
      ON CONFLICT (offer_id,channel,cycle_date) DO NOTHING RETURNING id`;
    if(rows.length){
      queued++;
      if(policy.telegram_auto_publish && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID){
        const taskId=Number(rows[0].id);
        const claimedTask=await queue!`UPDATE publication_tasks
          SET status='publishing',attempts=attempts+1,updated_at=NOW()
          WHERE id=${taskId} AND status='ready' RETURNING id`;
        if(claimedTask.length){
          let accepted=false,externalId='';
          try{
            const offers=await queue!`SELECT title,price,status FROM offers WHERE id=${r.offerId} LIMIT 1`;
            const offer:any=offers[0];
            if(!offer||offer.status!=='published')throw new Error('Oferta indisponível.');
            const token=process.env.TELEGRAM_BOT_TOKEN!.trim(),chatId=process.env.TELEGRAM_CHAT_ID!.trim();
            const link=`https://www.minhavitrinedeachados.com.br/o/${r.offerId}?c=t`;
            const message=`🔥 ${String(offer.title).slice(0,180)}\n💰 ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(offer.price))}\n🔗 ${link}\n\nPromoção sujeita a alteração.`;
            const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
              method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({chat_id:chatId,text:message,disable_web_page_preview:false}),cache:'no-store'
            });
            const data=await response.json().catch(()=>({}));
            if(!response.ok||!data.ok)throw new Error(`Telegram: ${String(data.description||response.status).slice(0,180)}`);
            accepted=true;
            externalId=String(data.result?.message_id||'');
            await queue!`UPDATE publication_tasks SET status='published',external_id=${externalId||null},published_at=NOW(),last_error=NULL,updated_at=NOW() WHERE id=${taskId}`;
            telegramSent++;
          }catch(e:any){
            if(accepted){
              console.error('Telegram accepted but task update failed',{taskId,externalId,error:String(e?.message||e)});
            }else{
              const token=process.env.TELEGRAM_BOT_TOKEN?.trim();
              const raw=String(e?.message||'Falha no Telegram');
              const error=(token?raw.replaceAll(token,'[redacted]'):raw).slice(0,300);
              await queue!`UPDATE publication_tasks SET status='failed',last_error=${error},updated_at=NOW() WHERE id=${taskId}`;
              telegramFailed++;
            }
          }
        }
      }
    }
  }
  return {ok:true,ran:true,date,considered:candidates.length,published,pending,failed,queued,telegramSent,telegramFailed,remaining:Math.max(0,remaining-published)};
  }finally{
    await sql`UPDATE autopilot_policy SET run_token=NULL,lease_until=NULL WHERE id=1 AND run_token=${token}`;
  }
}
