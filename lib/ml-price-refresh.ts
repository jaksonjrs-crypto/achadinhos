// Preços do Mercado Livre (v3.6.3).
// A API do ML devolve 403 para anúncios de terceiros, então o preço não pode
// ser consultado automaticamente como na Shopee. O preço é renovado quando a
// lista de afiliado é importada de novo, e ofertas sem renovação recente
// ficam sinalizadas para conferência.

export const ML_STALE_DAYS=7;
const DAY=86_400_000;

type Priced={marketplace?:string|null;sync_status?:string|null;external_id?:string|null;last_synced_at?:string|Date|null;updated_at?:string|Date|null;created_at?:string|Date|null};

export function isMercadoLivre(marketplace:unknown){
  return ['mercado livre','mercadolivre'].includes(String(marketplace??'').toLocaleLowerCase('pt-BR').trim());
}

// Dias desde a última confirmação de preço (importação ou renovação da lista).
export function mlPriceAge(o:Priced,now=new Date()){
  const ref=o.last_synced_at||o.updated_at||o.created_at;
  const t=ref?new Date(ref).getTime():NaN;
  if(!Number.isFinite(t))return {days:null as number|null,stale:true};
  const days=Math.max(0,Math.floor((now.getTime()-t)/DAY));
  return {days,stale:days>=ML_STALE_DAYS};
}

// Texto curto do estado do preço, usado no catálogo do painel.
export function priceSyncLabel(o:Priced,now=new Date()){
  if(isMercadoLivre(o.marketplace)){
    const {days,stale}=mlPriceAge(o,now);
    if(days==null)return '⚠ conferir preço';
    const when=days===0?'hoje':days===1?'há 1 dia':`há ${days} dias`;
    return stale?`⚠ conferir preço (${when})`:`✓ preço da lista ${when}`;
  }
  const s=o.sync_status;
  return s==='ok'?'✓ preço verificado':s==='not_found'?'produto não encontrado':s==='error'?'falha ao atualizar'
    :s==='invalid_price'?'API sem preço válido':o.external_id?'aguarda verificação':'precisa vincular';
}

export type MlPriceInput={externalId:string;price:number;originalPrice:number|null};
export type MlPriceChange={id:number;title:string;oldPrice:number;newPrice:number};

// Renova o preço de ofertas e candidatos do ML já cadastrados, casando pelo ID
// do anúncio. Nunca cria ofertas nem altera links.
export async function refreshMlPrices(sql:any,products:MlPriceInput[]){
  let updated=0;const changes:MlPriceChange[]=[];
  for(const p of products){
    if(!/^MLB\d+$/.test(p.externalId)||!Number.isFinite(p.price)||p.price<=0)continue;
    const original=p.originalPrice!=null&&p.originalPrice>p.price?p.originalPrice:null;
    const rows=await sql`WITH old AS (
        SELECT id,price FROM offers WHERE external_id=${p.externalId}
          AND LOWER(TRIM(marketplace)) IN ('mercado livre','mercadolivre'))
      UPDATE offers o SET price=${p.price},original_price=${original},sync_status='ok',last_synced_at=NOW(),updated_at=NOW()
      FROM old WHERE o.id=old.id RETURNING o.id,o.title,old.price AS old_price`;
    for(const r of rows as any[]){
      updated++;
      const oldPrice=Number(r.old_price);
      if(Math.abs(oldPrice-p.price)>=0.01)changes.push({id:Number(r.id),title:String(r.title||''),oldPrice,newPrice:p.price});
    }
    await sql`UPDATE product_candidates SET price=${p.price},original_price=${original}
      WHERE external_id=${p.externalId} AND status IN ('review','approved')
        AND LOWER(TRIM(marketplace)) IN ('mercado livre','mercadolivre')`;
  }
  return {updated,changes};
}
