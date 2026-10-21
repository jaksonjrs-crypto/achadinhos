// v3.6.0 — Vendas e comissões da Shopee dentro do Garimpo.
// Busca o relatório de conversões da API de afiliados, guarda cada item vendido
// e liga a venda à oferta da Vitrine (pelo ID do produto) e ao canal de origem
// (pelo sub-ID do link ou, na falta dele, pelo clique registrado no mesmo minuto).
import {db} from './db';
import {fetchConversionPage} from './shopee-affiliate';
import {BOT_PATTERN} from './click-policy';

export const CHANNEL_SUB_PREFIX='VG';
const KNOWN_CHANNELS=['vitrine','instagram','facebook','whatsapp','telegram','pinterest','tiktok'];

export type ConversionItem={conversion_id:string;order_id:string;item_id:string;item_name:string;item_price:number;qty:number;
  commission:number;order_status:string;purchase_time:string;click_time:string|null;utm_content:string};

const num=(v:unknown)=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0};
const toIso=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>0?new Date(n*1000).toISOString():null};

/** Sub-IDs que a Vitrine coloca nos links gerados por canal: VG<canal> e O<id da oferta>. */
export function parseUtm(utm:string){
  const text=String(utm||'');
  const ch=text.match(/(?:^|[-_ ])VG([a-z]+)(?=$|[-_ ])/i)?.[1]?.toLowerCase();
  const offer=text.match(/(?:^|[-_ ])O(\d{1,9})(?=$|[-_ ])/)?.[1];
  return {channel:ch&&KNOWN_CHANNELS.includes(ch)?ch:null,offerId:offer?Number(offer):null};
}

/** Achata o relatório (conversão → pedidos → itens) em linhas por item vendido. */
export function flattenConversions(nodes:any[]):ConversionItem[]{
  const rows:ConversionItem[]=[];
  for(const n of nodes||[]){
    const purchase=toIso(n?.purchaseTime);if(!purchase)continue;
    for(const o of n?.orders||[]){
      for(const it of o?.items||[]){
        const conversion_id=String(n?.conversionId??''),order_id=String(o?.orderId??''),item_id=String(it?.itemId??'');
        if(!conversion_id||!order_id||!item_id)continue;
        rows.push({conversion_id,order_id,item_id,item_name:String(it?.itemName||'').slice(0,300),item_price:num(it?.itemPrice),qty:Math.max(1,Math.round(num(it?.qty))||1),
          commission:num(it?.itemTotalCommission),order_status:String(o?.orderStatus||'PENDING').toUpperCase(),purchase_time:purchase,click_time:toIso(n?.clickTime),utm_content:String(n?.utmContent||'').slice(0,300)});
      }
    }
  }
  return rows;
}

export async function ensureCommissionTables(){
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS shopee_conversions (
    conversion_id TEXT NOT NULL, order_id TEXT NOT NULL, item_id TEXT NOT NULL,
    item_name TEXT, item_price NUMERIC(12,2), qty INTEGER NOT NULL DEFAULT 1,
    commission NUMERIC(12,2) NOT NULL DEFAULT 0, order_status TEXT NOT NULL,
    purchase_time TIMESTAMPTZ NOT NULL, click_time TIMESTAMPTZ, utm_content TEXT,
    offer_id BIGINT, channel TEXT, channel_source TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(conversion_id,order_id,item_id))`;
  await sql`CREATE INDEX IF NOT EXISTS shopee_conversions_purchase ON shopee_conversions(purchase_time)`;
  await sql`CREATE TABLE IF NOT EXISTS commission_sync_log (
    id BIGSERIAL PRIMARY KEY, started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), finished_at TIMESTAMPTZ,
    ok BOOLEAN, items INTEGER, pages INTEGER, message TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS offer_channel_links (
    offer_id BIGINT NOT NULL, channel TEXT NOT NULL, link TEXT, status TEXT NOT NULL DEFAULT 'ok',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(offer_id,channel))`;
  return sql;
}

const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

/** Sincroniza os últimos `days` dias (padrão 30) para também atualizar status de pedidos antigos. */
export async function syncShopeeCommissions({days=30,maxPages=40}:{days?:number;maxPages?:number}={}){
  if(!process.env.SHOPEE_APP_ID||!process.env.SHOPEE_SECRET)return {ok:false,items:0,pages:0,message:'Credenciais Shopee ausentes.'};
  const sql=await ensureCommissionTables();
  const log=await sql`INSERT INTO commission_sync_log(ok) VALUES(NULL) RETURNING id`;
  const logId=log[0].id;
  const end=Math.floor(Date.now()/1000), start=end-Math.min(90,Math.max(1,days))*86400;
  let scroll:string|undefined, pages=0, items=0;
  try{
    do{
      let page:any;
      try{page=await fetchConversionPage(start,end,scroll,100)}
      catch(e:any){ // limite de frequência da Shopee: espera e tenta uma vez
        if(/10030/.test(String(e?.message))&&pages<maxPages){await wait(3000);page=await fetchConversionPage(start,end,scroll,100)}else throw e;
      }
      pages++;
      const rows=flattenConversions(page?.nodes||[]);
      for(const r of rows){
        const utm=parseUtm(r.utm_content);
        await sql`INSERT INTO shopee_conversions(conversion_id,order_id,item_id,item_name,item_price,qty,commission,order_status,purchase_time,click_time,utm_content,offer_id,channel,channel_source,updated_at)
          VALUES(${r.conversion_id},${r.order_id},${r.item_id},${r.item_name},${r.item_price},${r.qty},${r.commission},${r.order_status},${r.purchase_time},${r.click_time},${r.utm_content},
            ${utm.offerId},${utm.channel},${utm.channel?'subid':null},NOW())
          ON CONFLICT(conversion_id,order_id,item_id) DO UPDATE SET item_name=EXCLUDED.item_name,item_price=EXCLUDED.item_price,qty=EXCLUDED.qty,
            commission=EXCLUDED.commission,order_status=EXCLUDED.order_status,click_time=EXCLUDED.click_time,utm_content=EXCLUDED.utm_content,
            offer_id=COALESCE(EXCLUDED.offer_id,shopee_conversions.offer_id),
            channel=COALESCE(EXCLUDED.channel,shopee_conversions.channel),
            channel_source=COALESCE(EXCLUDED.channel_source,shopee_conversions.channel_source),updated_at=NOW()`;
        items++;
      }
      scroll=page?.pageInfo?.hasNextPage&&page?.pageInfo?.scrollId?String(page.pageInfo.scrollId):undefined;
    }while(scroll&&pages<maxPages);
    await attributeConversions(sql);
    await sql`UPDATE commission_sync_log SET finished_at=NOW(),ok=TRUE,items=${items},pages=${pages},message='ok' WHERE id=${logId}`;
    return {ok:true,items,pages,message:'ok'};
  }catch(e:any){
    const message=String(e?.message||'Falha ao consultar a Shopee').slice(0,300);
    await sql`UPDATE commission_sync_log SET finished_at=NOW(),ok=FALSE,items=${items},pages=${pages},message=${message} WHERE id=${logId}`;
    return {ok:false,items,pages,message};
  }
}

/** Liga vendas sem sub-ID de canal à oferta (ID do produto) e ao clique mais próximo no tempo. */
export async function attributeConversions(sql:any){
  await sql`UPDATE shopee_conversions c SET offer_id=o.id FROM offers o
    WHERE c.offer_id IS NULL AND o.marketplace='Shopee' AND o.external_id=c.item_id`;
  // Clique na Vitrine até 10 min antes do clique registrado pela Shopee (mesma oferta).
  await sql`WITH m AS (
      SELECT c.conversion_id,c.order_id,c.item_id,(SELECT oc.channel FROM offer_clicks oc WHERE oc.offer_id=c.offer_id
          AND oc.created_at BETWEEN c.click_time-INTERVAL '10 minutes' AND c.click_time+INTERVAL '2 minutes'
        ORDER BY ABS(EXTRACT(EPOCH FROM (oc.created_at-c.click_time))) LIMIT 1) AS ch
      FROM shopee_conversions c WHERE c.channel IS NULL AND c.offer_id IS NOT NULL AND c.click_time IS NOT NULL)
    UPDATE shopee_conversions t SET channel=m.ch,channel_source='clique' FROM m
    WHERE t.conversion_id=m.conversion_id AND t.order_id=m.order_id AND t.item_id=m.item_id AND m.ch IS NOT NULL`;
}

export async function lastCommissionSync(){
  const sql=await ensureCommissionTables();
  const r=await sql`SELECT started_at,finished_at,ok,items,message FROM commission_sync_log WHERE finished_at IS NOT NULL ORDER BY id DESC LIMIT 1`;
  return r[0]||null;
}

/** Roda a sincronização se a última tiver mais de `hours` horas (usado pelo Autopiloto). */
export async function syncCommissionsIfStale(hours=3){
  const sql=await ensureCommissionTables();
  const r=await sql`SELECT 1 FROM commission_sync_log WHERE started_at>NOW()-make_interval(hours=>${Math.max(1,Math.round(hours))}::int) LIMIT 1`;
  if(r.length)return {ok:true,skipped:true};
  return syncShopeeCommissions();
}

export const PAID_STATUSES=['COMPLETED'];
export const OPEN_STATUSES=['PENDING','UNPAID'];

export async function commissionStats(days=30){
  const sql=await ensureCommissionTables();
  const since=new Date(Date.now()-days*86400_000).toISOString();
  const [summary,byChannel,byOffer,recent,clicks]=await Promise.all([
    sql`SELECT COUNT(DISTINCT order_id) FILTER (WHERE order_status<>'CANCELLED')::int AS orders,
        COALESCE(SUM(qty) FILTER (WHERE order_status<>'CANCELLED'),0)::int AS items,
        COALESCE(SUM(commission) FILTER (WHERE order_status IN ('PENDING','UNPAID')),0)::float AS pending,
        COALESCE(SUM(commission) FILTER (WHERE order_status='COMPLETED'),0)::float AS completed,
        COALESCE(SUM(commission) FILTER (WHERE order_status='CANCELLED'),0)::float AS cancelled,
        COALESCE(SUM(item_price*qty) FILTER (WHERE order_status<>'CANCELLED'),0)::float AS sales,
        COUNT(DISTINCT order_id) FILTER (WHERE order_status='CANCELLED')::int AS cancelled_orders
      FROM shopee_conversions WHERE purchase_time>=${since}`,
    sql`SELECT COALESCE(channel,'sem_canal') AS channel,COUNT(DISTINCT order_id)::int AS orders,COALESCE(SUM(commission),0)::float AS commission
      FROM shopee_conversions WHERE purchase_time>=${since} AND order_status<>'CANCELLED' GROUP BY 1 ORDER BY commission DESC`,
    sql`SELECT c.item_id,MAX(COALESCE(o.title,c.item_name)) AS title,MAX(o.id) AS offer_id,MAX(o.image_url) AS image_url,
        COALESCE(SUM(c.qty),0)::int AS qty,COALESCE(SUM(c.commission),0)::float AS commission
      FROM shopee_conversions c LEFT JOIN offers o ON o.id=c.offer_id
      WHERE c.purchase_time>=${since} AND c.order_status<>'CANCELLED' GROUP BY c.item_id ORDER BY commission DESC,qty DESC LIMIT 10`,
    sql`SELECT c.purchase_time,c.order_status,c.qty,c.commission,COALESCE(o.title,c.item_name) AS title,c.channel,c.offer_id
      FROM shopee_conversions c LEFT JOIN offers o ON o.id=c.offer_id ORDER BY c.purchase_time DESC LIMIT 12`,
    sql`SELECT COUNT(*)::int AS clicks FROM offer_clicks WHERE created_at>=${since} AND COALESCE(user_agent,'') !~* ${BOT_PATTERN}`,
  ]);
  const s=summary[0]||{};
  const clicks30=Number(clicks[0]?.clicks||0);
  return {summary:{...s,clicks:clicks30,conversion:clicks30>0?Number(s.orders||0)/clicks30:null},byChannel,byOffer,recent,last:await lastCommissionSync()};
}

// ---- Links por canal (sub-ID) ------------------------------------------------
export function channelSubIds(channel:string,offerId:number){
  const ch=KNOWN_CHANNELS.includes(channel)?channel:'vitrine';
  return [`${CHANNEL_SUB_PREFIX}${ch}`,`O${offerId}`];
}
