import {randomUUID} from 'node:crypto';
import {db} from './db';
import {brazilDate} from './publication-queue';

export type AutopilotPolicy={enabled:boolean;min_score:number;max_per_day:number;start_hour:number;end_hour:number;cooldown_days:number};
export async function getAutopilotPolicy():Promise<AutopilotPolicy>{
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS autopilot_policy (
    id INTEGER PRIMARY KEY CHECK (id=1),enabled BOOLEAN NOT NULL DEFAULT FALSE,
    min_score INTEGER NOT NULL DEFAULT 80 CHECK (min_score BETWEEN 0 AND 100),
    max_per_day INTEGER NOT NULL DEFAULT 3 CHECK (max_per_day BETWEEN 1 AND 20),
    start_hour INTEGER NOT NULL DEFAULT 9 CHECK (start_hour BETWEEN 0 AND 23),
    end_hour INTEGER NOT NULL DEFAULT 21 CHECK (end_hour BETWEEN 1 AND 24),
    cooldown_days INTEGER NOT NULL DEFAULT 7 CHECK (cooldown_days BETWEEN 1 AND 90),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    run_token TEXT,
    lease_until TIMESTAMPTZ
  )`;
  await sql`ALTER TABLE autopilot_policy ADD COLUMN IF NOT EXISTS run_token TEXT`;
  await sql`ALTER TABLE autopilot_policy ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ`;
  await sql`INSERT INTO autopilot_policy(id) VALUES(1) ON CONFLICT DO NOTHING`;
  const rows=await sql`SELECT enabled,min_score,max_per_day,start_hour,end_hour,cooldown_days FROM autopilot_policy WHERE id=1`;
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
  let published=0,pending=0,failed=0;
  for(const c of candidates){const r=await autopilotCandidate(Number(c.id));if(!r.ok)failed++;else if(r.published)published++;else pending++}
  return {ok:true,ran:true,date,considered:candidates.length,published,pending,failed,remaining:Math.max(0,remaining-published)};
  }finally{
    await sql`UPDATE autopilot_policy SET run_token=NULL,lease_until=NULL WHERE id=1 AND run_token=${token}`;
  }
}
