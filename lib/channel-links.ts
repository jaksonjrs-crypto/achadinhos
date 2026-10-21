// v3.6.0 — Link de afiliado próprio por canal (sub-ID VG<canal> + O<oferta>), para a
// Shopee informar no relatório de comissões de qual canal veio cada venda.
import {db} from './db';
import {fetchShopeeProducts,generateShopeeLink} from './shopee-affiliate';
import {canonicalProductUrl,isShopeeUrl,numericItemId} from './shopee-links';
import {channelSubIds,ensureCommissionTables} from './shopee-commissions';

export async function cachedChannelLink(offerId:number,channel:string):Promise<string|null>{
  try{
    const r=await db()`SELECT link FROM offer_channel_links WHERE offer_id=${offerId} AND channel=${channel} AND status='ok' LIMIT 1`;
    const link=String(r[0]?.link||'');
    return isShopeeUrl(link)?link:null;
  }catch{return null}
}

export async function ensureChannelLink(offer:{id:number;marketplace:string;external_id:string|null},channel:string){
  if(offer.marketplace!=='Shopee'||!offer.external_id||!numericItemId(String(offer.external_id)))return null;
  if(!process.env.SHOPEE_APP_ID||!process.env.SHOPEE_SECRET)return null;
  const sql=await ensureCommissionTables();
  const prev=await sql`SELECT status,created_at FROM offer_channel_links WHERE offer_id=${offer.id} AND channel=${channel} LIMIT 1`;
  if(prev[0]&&(prev[0].status==='ok'||new Date(prev[0].created_at).getTime()>Date.now()-86400_000))return null;
  try{
    const itemId=String(offer.external_id);
    let original=String((await sql`SELECT original_url FROM affiliate_link_registry WHERE external_id=${itemId} ORDER BY verified_at DESC LIMIT 1`.catch(()=>[]))[0]?.original_url||'');
    if(!original){const data=await fetchShopeeProducts(1,1,undefined,itemId);const node=data?.nodes?.[0];if(!node)throw Error('Produto não encontrado na API');original=canonicalProductUrl(node);}
    const link=await generateShopeeLink(original,channelSubIds(channel,offer.id));
    await sql`INSERT INTO offer_channel_links(offer_id,channel,link,status,created_at) VALUES(${offer.id},${channel},${link},'ok',NOW())
      ON CONFLICT(offer_id,channel) DO UPDATE SET link=EXCLUDED.link,status='ok',created_at=NOW()`;
    return link;
  }catch(e){
    await sql`INSERT INTO offer_channel_links(offer_id,channel,link,status,created_at) VALUES(${offer.id},${channel},NULL,'failed',NOW())
      ON CONFLICT(offer_id,channel) DO UPDATE SET status='failed',created_at=NOW()`;
    return null;
  }
}
