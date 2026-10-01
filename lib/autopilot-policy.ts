import {importShopeeCandidates} from './shopee-import';
import {randomUUID} from 'node:crypto';
import {db} from './db';
import {productSafetyCheck} from './product-safety';
import {sendTelegramOffer} from './telegram-publisher';
import {brazilDate,ensurePublicationQueue} from './publication-queue';

export type AutopilotPolicy={enabled:boolean;min_score:number;max_per_day:number;start_hour:number;end_hour:number;cooldown_days:number;telegram_auto_publish:boolean};
export async function getAutopilotPolicy():Promise<AutopilotPolicy>{
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS autopilot_policy (
    id INTEGER PRIMARY KEY CHECK (id=1),enabled BOOLEAN NOT NULL DEFAULT FALSE,
    min_score INTEGER NOT NULL DEFAULT 80 CHECK (min_score BETWEEN 0 AND 100),
    max_per_day INTEGER NOT NULL DEFAULT 3 CHECK (max_per_day BETWEEN 1 AND 20),
    start_hour INTEGER NOT NULL DEFAULT 8 CHECK (start_hour BETWEEN 0 AND 23),
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
  // Automatic discovery is limited to the official Shopee connector. A failed
  // discovery must not prevent already approved offers from being processed.
  let discovery:Awaited<ReturnType<typeof importShopeeCandidates>>|{ok:false;reason:string}={ok:false,reason:'Credenciais Shopee ausentes'};
  if(process.env.SHOPEE_APP_ID?.trim()&&process.env.SHOPEE_SECRET?.trim()){
    try{discovery=await importShopeeCandidates({limit:10,minScore:policy.min_score,autoApprove:true})}
    catch{discovery={ok:false,reason:'Consulta Shopee falhou; verificar acesso à API'}}
  }
  // Keep searching within the allowed hours even after the publication budget
  // is exhausted. Approved candidates wait for a later day; no extra sends.
  if(!remaining)return {ok:true,ran:true,reason:'Limite diário atingido; busca realizada sem novas publicações',date,discovery,published:0,pending:0,failed:0,queued:0,queuedTasks:0,telegramSent:0,telegramFailed:0,remaining:0};
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
  let published=0,pending=0,failed=0,queued=0,queuedTasks=0,telegramSent=0,telegramFailed=0;
  for(const c of candidates){
    const r=await autopilotCandidate(Number(c.id));
    if(!r.ok){failed++;continue}
    if(!r.published||!r.offerId){pending++;continue}
    published++;
    // Prepare todos os canais. Somente o Telegram pode ser enviado automaticamente
    // aqui, quando o responsável tiver habilitado essa opção.
    const rows=await queue!`INSERT INTO publication_tasks(offer_id,channel,cycle_date,status)
      SELECT ${r.offerId}, channels.channel, ${date}::date, 'ready'
      FROM unnest(ARRAY['telegram','pinterest','instagram','facebook','whatsapp','tiktok']) AS channels(channel)
      ON CONFLICT (offer_id,channel,cycle_date) DO NOTHING RETURNING id,channel`;
    if(rows.length){
      queued++;
      queuedTasks+=rows.length;
      const telegramTask=rows.find((row:any)=>row.channel==='telegram');
      if(telegramTask && policy.telegram_auto_publish && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID){
        const taskId=Number(telegramTask.id);
        const claimedTask=await queue!`UPDATE publication_tasks
          SET status='publishing',attempts=attempts+1,updated_at=NOW()
          WHERE id=${taskId} AND status='ready' RETURNING id`;
        if(claimedTask.length){
          let accepted=false,externalId='';
          try{
            const offers=await queue!`SELECT title,image_url,price,status FROM offers WHERE id=${r.offerId} LIMIT 1`;
            const offer:any=offers[0];
            if(!offer||offer.status!=='published'||!productSafetyCheck(String(offer.title||'')).allowed)throw new Error('Oferta indisponível ou bloqueada.');
            externalId=await sendTelegramOffer(offer,r.offerId,'https://www.minhavitrinedeachados.com.br');
            accepted=true;
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
  return {ok:true,ran:true,date,discovery,considered:candidates.length,published,pending,failed,queued,queuedTasks,telegramSent,telegramFailed,remaining:Math.max(0,remaining-published)};
  }finally{
    await sql`UPDATE autopilot_policy SET run_token=NULL,lease_until=NULL WHERE id=1 AND run_token=${token}`;
  }
}
