import {db} from './db';
import {fetchShopeeProducts,generateShopeeLink} from './shopee-affiliate';
import {canonicalProductUrl,isShopeeUrl,numericItemId,productIdentity} from './shopee-links';

export async function ensureAffiliateRegistry(){
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS affiliate_link_registry (
    affiliate_url TEXT PRIMARY KEY, external_id TEXT NOT NULL, original_url TEXT NOT NULL,
    sub_id TEXT NOT NULL, verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS affiliate_link_audit (
    id BIGSERIAL PRIMARY KEY, offer_id BIGINT NOT NULL, old_url TEXT NOT NULL, new_url TEXT,
    external_id TEXT, status TEXT NOT NULL, message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS affiliate_status TEXT,
    ADD COLUMN IF NOT EXISTS affiliate_sub_id TEXT,
    ADD COLUMN IF NOT EXISTS affiliate_note TEXT`;
  return sql;
}
export async function registerAffiliateLink(link:string,itemId:string,originalUrl:string,subId:string){
  const sql=await ensureAffiliateRegistry();
  await sql`INSERT INTO affiliate_link_registry(affiliate_url,external_id,original_url,sub_id)
    VALUES(${link},${itemId},${originalUrl},${subId}) ON CONFLICT(affiliate_url) DO UPDATE
    SET external_id=EXCLUDED.external_id,original_url=EXCLUDED.original_url,sub_id=EXCLUDED.sub_id,verified_at=NOW()`;
}
export async function convertShopeeOffer(itemId:string,inputLink:string,subId='VITRINEATUALIZACAO2026'){
  if(!numericItemId(itemId))throw Error('Informe o ID numérico do produto Shopee para validar o link e atualizar preços.');
  if(!isShopeeUrl(inputLink))throw Error('Use Compartilhe para Ganhar > Copiar Link, ou o endereço completo do produto Shopee.');
  const identity=productIdentity(inputLink);
  if(identity&&identity.itemId!==itemId)throw Error('O ID informado não corresponde ao produto do link.');
  const data=await fetchShopeeProducts(1,1,undefined,itemId);
  const product=(data.nodes||[]).find((p:any)=>String(p.itemId)===itemId);
  if(!product)throw Error('Produto não encontrado na API de afiliados. Link anterior preservado.');
  const originalUrl=canonicalProductUrl(product);
  if(identity&&identity.shopId!==productIdentity(originalUrl)?.shopId)throw Error('A loja do link não corresponde ao produto consultado.');
  const link=await generateShopeeLink(originalUrl,subId);
  await registerAffiliateLink(link,itemId,originalUrl,subId);
  return {link,itemId,originalUrl,subId};
}
export async function verifiedShopeeLink(itemId:string,link:string){
  if(!numericItemId(itemId))throw Error('Informe o ID numérico do produto Shopee.');
  const sql=await ensureAffiliateRegistry();
  const known=await sql`SELECT external_id FROM affiliate_link_registry WHERE affiliate_url=${link} AND external_id=${itemId} LIMIT 1`;
  if(known.length)return {link,itemId};
  return convertShopeeOffer(itemId,link,'VITRINECADASTRO2026');
}

export async function ensureOfferAffiliate(offerId:number){
  const sql=await ensureAffiliateRegistry();
  const rows=await sql`SELECT id,title,marketplace,status,affiliate_url,external_id FROM offers WHERE id=${offerId} LIMIT 1`;
  const offer:any=rows[0];
  if(!offer||offer.status!=='published')throw Error('Oferta não publicada ou indisponível.');
  if(String(offer.marketplace).toLowerCase()!=='shopee')return offer;
  // Publication reads the accepted current link; it must never reconvert a
  // manual campaign or make Shopee availability a prerequisite for sharing.
  if(!isShopeeUrl(String(offer.affiliate_url||'')))throw Error('Link Shopee inválido. Corrija a oferta.');
  return offer;
}
