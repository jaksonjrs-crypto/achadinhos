import {db} from "./db";
import {fetchShopeeProducts} from "./shopee-affiliate";

const n=(v:any)=>{const x=Number(v);return Number.isFinite(x)?x:null};
function originalPrice(p:any){const price=n(p.price),d=n(p.priceDiscountRate);return price!=null&&d!=null&&price>0&&d>0&&d<100?+(price/(1-d/100)).toFixed(2):null}

export async function syncCatalog(limit=40){
  const sql=db();
  const rows=await sql`SELECT id,title,marketplace,external_id,product_id,price FROM offers
    WHERE status IN ('published','draft') AND external_id IS NOT NULL
    ORDER BY last_synced_at ASC NULLS FIRST LIMIT ${Math.min(100,Math.max(1,limit))}`;
  let updated=0,unchanged=0,failed=0,unsupported=0;
  for(const o of rows as any[]){
    if(String(o.marketplace).toLowerCase()!=="shopee"){unsupported++;continue}
    try{
      const data=await fetchShopeeProducts(1,50,String(o.title).slice(0,80));
      const p=(data.nodes||[]).find((x:any)=>String(x.itemId)===String(o.external_id));
      if(!p){await sql`UPDATE offers SET sync_status='not_found',last_synced_at=NOW() WHERE id=${Number(o.id)}`;failed++;continue}
      const price=n(p.price); if(price==null||price<=0){failed++;continue}
      const old=Number(o.price),orig=originalPrice(p);
      const image=String(p.imageUrl||"").trim()||null,link=String(p.offerLink||"").trim()||null;
      await sql`UPDATE offers SET title=${String(p.productName||o.title)},image_url=COALESCE(${image},image_url),affiliate_url=COALESCE(${link},affiliate_url),price=${price},original_price=${orig},sync_status='ok',last_synced_at=NOW(),updated_at=CASE WHEN price<>${price} THEN NOW() ELSE updated_at END WHERE id=${Number(o.id)}`;
      if(o.product_id){
        await sql`UPDATE products SET title=${String(p.productName||o.title)},thumbnail=COALESCE(${image},thumbnail),permalink=COALESCE(${link},permalink),price=${price},original_price=${orig},sold_quantity=${n(p.sales)},updated_at=NOW() WHERE id=${Number(o.product_id)}`;
        if(old!==price) await sql`INSERT INTO price_history(product_id,price,original_price) VALUES(${Number(o.product_id)},${price},${orig})`;
      }
      old!==price?updated++:unchanged++;
    }catch{failed++;await sql`UPDATE offers SET sync_status='error',last_synced_at=NOW() WHERE id=${Number(o.id)}`}
  }
  return {checked:rows.length,updated,unchanged,failed,unsupported};
}
