import {isShopeeUrl,numericItemId,productIdentity} from './shopee-links';
import {fetchShopeeProducts} from './shopee-affiliate';
import {ensureAffiliateRegistry} from './affiliate-registry';

export function validateManualLink(itemId:string,link:string,subId:string){
  if(!numericItemId(itemId))throw Error('Informe o ID numérico real do produto Shopee.');
  if(!isShopeeUrl(link))throw Error('Informe um endereço HTTPS válido da Shopee.');
  const identity=productIdentity(link);
  if(identity&&identity.itemId!==itemId)throw Error('O ID informado não corresponde ao produto do link.');
  if(subId&&!/^[A-Za-z0-9_]{1,50}$/.test(subId))throw Error('Sub ID: use até 50 letras, números ou sublinhados.');
}
// A short link generated in the app may carry a different campaign. Never
// replace it merely because a second API-generated link is available.
export async function acceptManualLink(itemId:string,link:string,subId:string,bypass=false){
  validateManualLink(itemId,link,subId);
  const sql=await ensureAffiliateRegistry();
  const known=await sql`SELECT sub_id FROM affiliate_link_registry WHERE affiliate_url=${link} AND external_id=${itemId} LIMIT 1`;
  if(known.length&&(!subId||known[0].sub_id===subId))return {link,status:'verified',note:'Link já registrado pela API.',subId:subId||String(known[0].sub_id)};
  let note='Link manual salvo. Verificação pendente; Sub ID registrado localmente, sem alterar o link da Shopee.';
  if(!bypass){
    try{
      const data=await fetchShopeeProducts(1,1,undefined,itemId);
      note=(data.nodes||[]).some((p:any)=>String(p.itemId)===itemId)
        ? 'Produto encontrado na API. Link manual preservado; comissão e Sub ID do link ainda não confirmados.'
        : 'API não encontrou o produto. Link manual salvo com verificação pendente.';
    }catch{note='API indisponível ou consulta recusada. Link manual salvo com verificação pendente.';}
  }
  return {link,status:'pending',note,subId};
}
