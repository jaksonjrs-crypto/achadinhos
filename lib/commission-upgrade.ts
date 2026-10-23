// v3.6.8 — "Melhor comissão": o mesmo produto costuma ser vendido por várias lojas
// na Shopee com comissões diferentes. A varredura compara a oferta publicada com
// anúncios equivalentes e sugere a troca; a troca só acontece com um clique no painel
// e mantém o ID da oferta (links /o/ID, automações e agendamentos continuam valendo).
import {db} from './db';
import {fetchShopeeProducts} from './shopee-affiliate';
import {convertShopeeOffer} from './affiliate-registry';
import {canonicalProductUrl} from './shopee-links';

export type Listing={itemId:string;title:string;rate:number;price:number;sales:number;rating:number;shop:string;image:string;link:string};
export type Current={itemId:string;title:string;rate:number|null;price:number};

const STOP=new Set(['de','da','do','das','dos','com','sem','para','pra','e','em','a','o','as','os','um','uma','kit','novo','nova','original','promocao','oferta','frete','gratis']);
export function tokens(t:string){
  return new Set(String(t||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)));
}
export function similarity(a:string,b:string){
  const x=tokens(a),y=tokens(b);if(!x.size||!y.size)return 0;
  let inter=0;for(const w of x)if(y.has(w))inter++;
  return inter/Math.min(x.size,y.size);
}
// Palavras do título que servem de busca (as 6 primeiras significativas).
export function searchKeyword(title:string){return [...tokens(title)].slice(0,6).join(' ')}

// O ganho tem de vir da comissão, não de um preço mais alto para o cliente.
export const RULES={minRating:4.5,minSales:50,priceBand:0.25,maxPriceIncrease:0.05,minSimilarity:0.5,minGainPct:0.15,minGainBRL:1};

// Escolhe o melhor anúncio equivalente que paga mais por venda. Puro, testável.
export function pickBetterListing(cur:Current,cands:Listing[],rules=RULES,taken:Set<string>=new Set()):(Listing&{gain:number;similarity:number})|null{
  if(cur.rate==null||!(cur.price>0))return null;
  const base=cur.rate*cur.price;
  let best:(Listing&{gain:number;similarity:number})|null=null;
  for(const c of cands){
    if(!c.itemId||c.itemId===cur.itemId||taken.has(c.itemId))continue;
    if(!(c.rate>cur.rate))continue;
    if(!(c.rating>=rules.minRating)||!(c.sales>=rules.minSales)||!(c.price>0))continue;
    if(Math.abs(c.price-cur.price)/cur.price>rules.priceBand)continue;
    if(c.price>cur.price*(1+rules.maxPriceIncrease))continue;
    const sim=similarity(cur.title,c.title);if(sim<rules.minSimilarity)continue;
    const earn=c.rate*c.price,gain=earn-base;
    if(gain<rules.minGainBRL||earn<base*(1+rules.minGainPct))continue;
    if(!best||gain>best.gain)best={...c,gain:+gain.toFixed(2),similarity:+sim.toFixed(2)};
  }
  return best;
}

const num=(v:unknown)=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0};
export function toListing(n:any):Listing{
  return {itemId:String(n.itemId||''),title:String(n.productName||''),rate:num(n.commissionRate),price:num(n.price)||num(n.priceMin),
    sales:num(n.sales),rating:num(n.ratingStar),shop:String(n.shopName||''),image:String(n.imageUrl||''),link:canonicalProductUrl(n)};
}

export async function ensureSuggestionTable(){
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS offer_commission_suggestions(
    offer_id BIGINT PRIMARY KEY, current_item TEXT, current_rate NUMERIC, current_price NUMERIC,
    item_id TEXT NOT NULL, title TEXT, rate NUMERIC, price NUMERIC, sales NUMERIC, rating NUMERIC,
    shop TEXT, image_url TEXT, product_url TEXT, gain NUMERIC, status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  return sql;
}

// Varre as ofertas Shopee publicadas e grava sugestões (não altera ofertas).
export async function scanCommissionUpgrades(limit=25,fetchProducts=fetchShopeeProducts,offset=0){
  const sql=await ensureSuggestionTable();
  const offers=await sql`SELECT id,title,external_id,price FROM offers
    WHERE status='published' AND LOWER(TRIM(marketplace))='shopee' AND external_id ~ '^[0-9]+$'
    ORDER BY id DESC LIMIT ${Math.min(60,Math.max(1,limit))} OFFSET ${Math.max(0,Math.floor(offset))}`;
  // Anúncios que já são de outra oferta não são sugeridos (evita duas ofertas no mesmo item).
  const taken=new Set((await sql`SELECT external_id FROM offers WHERE LOWER(TRIM(marketplace))='shopee' AND external_id IS NOT NULL`).map((r:any)=>String(r.external_id)));
  let checked=0,found=0,failed=0;const results:any[]=[];
  for(const o of offers as any[]){
    checked++;
    try{
      const curNode=(await fetchProducts(1,1,undefined,String(o.external_id)))?.nodes?.[0];
      const cur:Current={itemId:String(o.external_id),title:String(o.title),rate:curNode?num(curNode.commissionRate):null,price:Number(o.price)};
      const kw=searchKeyword(String(o.title));
      const cands=kw?((await fetchProducts(1,40,kw))?.nodes||[]).map(toListing):[];
      const best=pickBetterListing(cur,cands,RULES,taken);
      if(best){
        found++;
        await sql`INSERT INTO offer_commission_suggestions(offer_id,current_item,current_rate,current_price,item_id,title,rate,price,sales,rating,shop,image_url,product_url,gain,status,created_at)
          VALUES(${o.id},${cur.itemId},${cur.rate},${cur.price},${best.itemId},${best.title},${best.rate},${best.price},${best.sales},${best.rating},${best.shop},${best.image},${best.link},${best.gain},'open',NOW())
          ON CONFLICT(offer_id) DO UPDATE SET current_item=EXCLUDED.current_item,current_rate=EXCLUDED.current_rate,current_price=EXCLUDED.current_price,
            item_id=EXCLUDED.item_id,title=EXCLUDED.title,rate=EXCLUDED.rate,price=EXCLUDED.price,sales=EXCLUDED.sales,rating=EXCLUDED.rating,
            shop=EXCLUDED.shop,image_url=EXCLUDED.image_url,product_url=EXCLUDED.product_url,gain=EXCLUDED.gain,
            status=CASE WHEN offer_commission_suggestions.status='dismissed' AND offer_commission_suggestions.item_id=EXCLUDED.item_id THEN 'dismissed' ELSE 'open' END,created_at=NOW()`;
        results.push({offerId:Number(o.id),title:o.title,currentRate:cur.rate,rate:best.rate,gain:best.gain,shop:best.shop});
      }else{
        await sql`DELETE FROM offer_commission_suggestions WHERE offer_id=${o.id} AND status='open'`;
      }
    }catch{failed++}
  }
  return {checked,found,failed,results};
}

export async function listOpenSuggestions(){
  const sql=await ensureSuggestionTable();
  return sql`SELECT s.*,o.title AS offer_title FROM offer_commission_suggestions s JOIN offers o ON o.id=s.offer_id
    WHERE s.status='open' ORDER BY s.gain DESC`;
}

// Troca a oferta para o anúncio sugerido: novo link de afiliado verificado, mesmo ID de oferta.
export async function applyCommissionUpgrade(offerId:number){
  const sql=await ensureSuggestionTable();
  const s:any=(await sql`SELECT * FROM offer_commission_suggestions WHERE offer_id=${offerId} AND status='open' LIMIT 1`)[0];
  if(!s)throw Error('Sugestão não encontrada ou já aplicada.');
  const converted=await convertShopeeOffer(String(s.item_id),String(s.product_url),'VITRINECOMISSAO2026');
  const old:any=(await sql`SELECT affiliate_url,external_id FROM offers WHERE id=${offerId} LIMIT 1`)[0];
  await sql.transaction([
    sql`UPDATE offers SET external_id=${converted.itemId},affiliate_url=${converted.link},price=${Number(s.price)},original_price=NULL,
      image_url=COALESCE(NULLIF(${s.image_url},''),image_url),affiliate_status='verified',sync_status='ok',last_synced_at=NOW(),updated_at=NOW() WHERE id=${offerId}`,
    sql`DELETE FROM offer_channel_links WHERE offer_id=${offerId}`,
    sql`UPDATE offer_commission_suggestions SET status='applied' WHERE offer_id=${offerId}`,
    sql`INSERT INTO affiliate_link_audit(offer_id,old_url,new_url,external_id,status,message)
      VALUES(${offerId},${String(old?.affiliate_url||'')},${converted.link},${converted.itemId},'ok',${`Troca por maior comissão: ${old?.external_id||'?'} → ${converted.itemId}`})`,
  ]);
  return {offerId,itemId:converted.itemId,link:converted.link};
}

// v3.6.10: troca manual de anúncio (ex.: o atual esgotou). Mantém o ID da oferta e gera link verificado.
export async function replaceListing(offerId:number,itemId:string,fetchProducts=fetchShopeeProducts){
  if(!/^\d+$/.test(itemId))throw Error('ID do anúncio inválido.');
  const sql=await ensureSuggestionTable();
  const o:any=(await sql`SELECT id,external_id,price FROM offers WHERE id=${offerId} AND LOWER(TRIM(marketplace))='shopee' LIMIT 1`)[0];
  if(!o)throw Error('Oferta Shopee não encontrada.');
  const used=await sql`SELECT id FROM offers WHERE external_id=${itemId} AND id<>${offerId} AND LOWER(TRIM(marketplace))='shopee' LIMIT 1`;
  if(used.length)throw Error(`Esse anúncio já é da oferta #${used[0].id}.`);
  const node=(await fetchProducts(1,1,undefined,itemId))?.nodes?.[0];
  if(!node||String(node.itemId)!==itemId)throw Error('Anúncio não encontrado na API de afiliados.');
  const c=toListing(node);
  await sql`INSERT INTO offer_commission_suggestions(offer_id,current_item,current_rate,current_price,item_id,title,rate,price,sales,rating,shop,image_url,product_url,gain,status,created_at)
    VALUES(${offerId},${String(o.external_id||'')},${null},${Number(o.price)},${c.itemId},${c.title},${c.rate},${c.price},${c.sales},${c.rating},${c.shop},${c.image},${c.link},${0},'open',NOW())
    ON CONFLICT(offer_id) DO UPDATE SET current_item=EXCLUDED.current_item,current_rate=NULL,current_price=EXCLUDED.current_price,item_id=EXCLUDED.item_id,title=EXCLUDED.title,
      rate=EXCLUDED.rate,price=EXCLUDED.price,sales=EXCLUDED.sales,rating=EXCLUDED.rating,shop=EXCLUDED.shop,image_url=EXCLUDED.image_url,product_url=EXCLUDED.product_url,gain=0,status='open',created_at=NOW()`;
  return {...await applyCommissionUpgrade(offerId),rate:c.rate,price:c.price,shop:c.shop};
}

export async function dismissSuggestion(offerId:number){
  const sql=await ensureSuggestionTable();
  await sql`UPDATE offer_commission_suggestions SET status='dismissed' WHERE offer_id=${offerId}`;
}
