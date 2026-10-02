import { db } from "./db";

export type Offer = {
  id:number; title:string; category:string; marketplace:string; image_url:string|null;
  price:number; original_price:number|null; affiliate_url:string; status:string;
  featured:boolean; created_at:string; updated_at?:string; external_id?:string|null; product_id?:number|null;
  opportunity_score?:number|null; last_synced_at?:string|null; sync_status?:string;
};

const map=(r:any)=>({...r,id:Number(r.id),product_id:r.product_id==null?null:Number(r.product_id),price:Number(r.price),original_price:r.original_price==null?null:Number(r.original_price),opportunity_score:r.opportunity_score==null?null:Number(r.opportunity_score)});

export async function listPublishedOffers():Promise<Offer[]>{
  const sql=db();
  const rows=await sql`SELECT id,title,category,marketplace,image_url,price,original_price,affiliate_url,status,featured,created_at,updated_at,external_id,product_id,opportunity_score,last_synced_at,sync_status
    FROM offers WHERE status='published'
    ORDER BY featured DESC, opportunity_score DESC NULLS LAST,
      CASE WHEN original_price>price AND original_price>0 THEN (original_price-price)/original_price ELSE 0 END DESC,
      updated_at DESC LIMIT 120`;
  const mapped=rows.map(map) as Offer[];
  // A vitrine nunca deve repetir o mesmo item físico. Mantemos o registro
  // mais bem ranqueado/recente e preservamos todos os registros no admin.
  const productIds=new Set<string>(), externalIds=new Set<string>(), titles=new Set<string>(), links=new Set<string>();
  return mapped.filter((o)=>{
    const market=String(o.marketplace||"").trim().toLowerCase();
    const title=String(o.title||"").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g," ");
    const product=o.product_id==null?"":String(o.product_id);
    const external=o.external_id?`${market}:${String(o.external_id).trim()}`:"";
    let link=""; try{const u=new URL(String(o.affiliate_url||""));u.search="";u.hash="";link=u.toString().replace(/\/$/,"")}catch{}
    // Distinct manual ML products can intentionally share the affiliate store
    // URL. Product identity and title still prevent actual duplicate cards.
    if(market==='mercado livre'&&((!product&&!external)||/\/social\/[^/]+\/lists\//.test(link)||link.startsWith('https://meli.la/')))link="";
    const titleKey=`${market}:${title}`;
    if((product&&productIds.has(product))||(external&&externalIds.has(external))||(link&&links.has(link))||titles.has(titleKey)) return false;
    if(product)productIds.add(product); if(external)externalIds.add(external); if(link)links.add(link); titles.add(titleKey);
    return true;
  });
}
export async function listAllOffers():Promise<Offer[]>{
  const sql=db();
  const rows=await sql`SELECT id,title,category,marketplace,image_url,price,original_price,affiliate_url,status,featured,created_at,updated_at,external_id,product_id,opportunity_score,last_synced_at,sync_status
    FROM offers ORDER BY updated_at DESC LIMIT 200`;
  return rows.map(map) as Offer[];
}
