import {ensureAffiliateRegistry,convertShopeeOffer} from './affiliate-registry';
import {resolveShopeeItemId,shopeeItemId} from './catalog-sync';
import {needsLinkReview,numericItemId} from './shopee-links';

// Small resumable batches avoid function timeouts. A verified link is never reconverted.
export async function repairAffiliateBatch(afterId=0,dryRun=true){
  const sql=await ensureAffiliateRegistry();
  const rows=await sql`SELECT o.id,o.title,o.affiliate_url,o.external_id,p.external_id AS product_external_id,
    r.affiliate_url AS verified_url FROM offers o LEFT JOIN products p ON p.id=o.product_id AND LOWER(p.marketplace)='shopee'
    LEFT JOIN affiliate_link_registry r ON r.affiliate_url=o.affiliate_url AND r.external_id=o.external_id
    WHERE LOWER(TRIM(o.marketplace))='shopee' AND o.id>${afterId} ORDER BY o.id LIMIT 3`;
  const details=[];let updated=0,unlinked=0,failed=0,skipped=0,selected=0;
  for(const o of rows as any[]){
    const id=Number(o.id),oldUrl=String(o.affiliate_url||'');
    if(o.verified_url||!needsLinkReview(oldUrl)){skipped++;continue}
    selected++;
    if(dryRun){details.push({id,title:o.title,status:'review',message:'Selecionada para reconversão. Prefixo não comprova ausência de comissão.'});continue}
    let itemId=String(o.external_id||o.product_external_id||shopeeItemId(oldUrl)||'');
    try{
      if(!itemId)itemId=await resolveShopeeItemId(oldUrl)||'';
      if(!numericItemId(itemId)){
        unlinked++;const message='Sem vínculo: informe o ID real do produto. Link preservado.';
        await sql`INSERT INTO affiliate_link_audit(offer_id,old_url,status,message) VALUES(${id},${oldUrl},'unlinked',${message})`;
        details.push({id,title:o.title,status:'unlinked',message});continue;
      }
      const converted=await convertShopeeOffer(itemId,oldUrl);
      // Compare-and-swap prevents overwriting a simultaneous manual correction.
      const saved=await sql`WITH changed AS (
        UPDATE offers SET affiliate_url=${converted.link},external_id=${itemId},updated_at=NOW()
        WHERE id=${id} AND affiliate_url=${oldUrl} AND external_id IS NOT DISTINCT FROM ${o.external_id||null}
        RETURNING id
      ) INSERT INTO affiliate_link_audit(offer_id,old_url,new_url,external_id,status,message)
        SELECT id,${oldUrl},${converted.link},${itemId},'updated','Link reconvertido pela API Shopee; ID da oferta preservado.' FROM changed RETURNING offer_id`;
      if(!saved.length)throw Error('Oferta alterada durante a correção. Execute novamente.');
      updated++;details.push({id,title:o.title,status:'updated',message:'Link convertido e anterior registrado no histórico.'});
    }catch(error:any){
      failed++;
      const message='Falha na conversão ou gravação; confira o vínculo e a API Shopee. Nenhuma substituição não confirmada foi aplicada.';
      await sql`INSERT INTO affiliate_link_audit(offer_id,old_url,external_id,status,message) VALUES(${id},${oldUrl},${itemId||null},'failed',${message})`;
      details.push({id,title:o.title,status:'failed',message});
    }
  }
  return {dryRun,checked:rows.length,selected,updated,unlinked,failed,skipped,details,nextCursor:rows.length?Number(rows[rows.length-1].id):afterId,done:rows.length<3};
}
