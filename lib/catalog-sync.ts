import {db} from "./db";
import {fetchShopeeProducts} from "./shopee-affiliate";

export function shopeeItemId(link:string):string|null {
  try {
    const url=new URL(link);
    if(url.hostname!=="shopee.com.br" && !url.hostname.endsWith(".shopee.com.br")) return null;
    return url.pathname.match(/\/product\/\d+\/(\d+)(?:\/|$)/)?.[1]
      || url.pathname.match(/-i\.\d+\.(\d+)(?:\/|$)/)?.[1] || null;
  } catch { return null; }
}
const n=(v:any)=>{if(v==null||v==="")return null;const x=Number(v);return Number.isFinite(x)?x:null};
function originalPrice(p:any,price:number){const d=n(p.priceDiscountRate);return d!=null&&d>0&&d<100?+(price/(1-d/100)).toFixed(2):null}

// Never match prices by title alone: similar names can belong to different sellers.
export async function findShopeeProduct(itemId:string,title:string,fetchProducts=fetchShopeeProducts){
  for(let page=1;page<=3;page++){
    const data=await fetchProducts(page,50,title.slice(0,80));
    const product=(data.nodes||[]).find((x:any)=>String(x.itemId)===itemId);
    if(product)return product;
    if(!data.pageInfo?.hasNextPage)break;
  }
  return null;
}

export async function syncCatalog(limit=40,dependencies={db,fetchProducts:fetchShopeeProducts}){
  const sql=dependencies.db();
  const rows=await sql`SELECT o.id,o.title,o.external_id,o.product_id,o.price,o.affiliate_url,
      p.external_id AS product_external_id,
      (SELECT c.external_id FROM product_candidates c WHERE LOWER(TRIM(c.marketplace))='shopee'
       AND c.product_url=o.affiliate_url AND c.external_id IS NOT NULL LIMIT 1) AS candidate_external_id
    FROM offers o LEFT JOIN products p ON p.id=o.product_id AND LOWER(TRIM(p.marketplace))='shopee'
    WHERE o.status IN ('published','draft') AND LOWER(TRIM(o.marketplace))='shopee'
    ORDER BY o.last_synced_at ASC NULLS FIRST,o.id ASC LIMIT ${Math.min(100,Math.max(1,limit))}`;
  let updated=0,unchanged=0,failed=0,unlinked=0;
  const details:{id:number;title:string;status:string;message:string}[]=[];
  for(const o of rows as any[]){
    const id=Number(o.id);
    const itemId=String(o.external_id||o.product_external_id||o.candidate_external_id||shopeeItemId(o.affiliate_url)||"").trim();
    try{
      if(!/^\d+$/.test(itemId)){
        await sql`UPDATE offers SET sync_status='unlinked',last_synced_at=NOW() WHERE id=${id}`;
        unlinked++;details.push({id,title:o.title,status:"unlinked",message:"Sem identificação do produto. Vincule o ID da Shopee em Corrigir oferta."});continue;
      }
      const p=await findShopeeProduct(itemId,String(o.title),dependencies.fetchProducts);
      if(!p){await sql`UPDATE offers SET sync_status='not_found',last_synced_at=NOW() WHERE id=${id}`;failed++;details.push({id,title:o.title,status:"not_found",message:"Produto não encontrado na API; preço mantido."});continue}
      const price=n(p.price) ?? n(p.priceMin);
      if(price==null||price<=0){await sql`UPDATE offers SET sync_status='invalid_price',last_synced_at=NOW() WHERE id=${id}`;failed++;details.push({id,title:o.title,status:"invalid_price",message:"API sem preço válido; preço mantido."});continue}
      const old=Number(o.price),orig=originalPrice(p,price);
      // Keep the affiliate URL and offer ID stable, including manually customized links.
      const queries=[sql`UPDATE offers SET external_id=${itemId},price=${price},original_price=${orig},sync_status='ok',last_synced_at=NOW(),updated_at=NOW() WHERE id=${id}`];
      if(o.product_id){
        queries.push(sql`UPDATE products SET price=${price},original_price=${orig},sold_quantity=${n(p.sales)},updated_at=NOW() WHERE id=${Number(o.product_id)}`);
        if(old!==price)queries.push(sql`INSERT INTO price_history(product_id,price,original_price) VALUES(${Number(o.product_id)},${price},${orig})`);
      }
      await sql.transaction(queries);
      old!==price?updated++:unchanged++;
      details.push({id,title:o.title,status:old!==price?"updated":"unchanged",message:old!==price?"Preço atualizado.":"API retornou o mesmo preço. Cupons e variações podem ter valores diferentes."});
    }catch{
      failed++;await sql`UPDATE offers SET sync_status='error',last_synced_at=NOW() WHERE id=${id}`;
      details.push({id,title:o.title,status:"error",message:"Falha ao consultar ou salvar. Preço não confirmado; tente novamente."});
    }
  }
  return {checked:rows.length,updated,unchanged,failed,unlinked,unsupported:0,details};
}
