import {db} from "./db";
import {productSafetyCheck} from "./product-safety";

export type AutopilotResult={ok:boolean;offerId?:number;published?:boolean;created?:boolean;reason?:string};

const complete=(c:any)=>Boolean(String(c.title||"").trim()&&String(c.image_url||"").trim()&&Number(c.price)>0&&String(c.product_url||"").trim());

export async function autopilotCandidate(candidateId:number):Promise<AutopilotResult>{
 const sql=db();
 const rows=await sql`SELECT id,title,category,marketplace,product_url,image_url,price,original_price,score,status,external_id,sold_quantity,notes FROM product_candidates WHERE id=${candidateId} LIMIT 1`;
 const c:any=rows[0];
 if(!c)return {ok:false,reason:"Candidato não encontrado"};
 if(!productSafetyCheck(String(c.title||""),String(c.category||""),String(c.notes||"")).allowed)return {ok:false,reason:"Produto bloqueado pela política do catálogo"};
 if(!complete(c)){
   await sql`UPDATE product_candidates SET status='approved',updated_at=NOW() WHERE id=${candidateId}`;
   return {ok:true,published:false,reason:"Aguardando imagem, preço ou link"};
 }
 let productId:number|null=null;
 if(c.external_id){
   const p=await sql`INSERT INTO products(marketplace,external_id,title,permalink,thumbnail,price,original_price,currency_id,sold_quantity,opportunity_score,updated_at)
    VALUES(${c.marketplace},${c.external_id},${c.title},${c.product_url},${c.image_url||null},${Number(c.price)},${c.original_price==null?null:Number(c.original_price)},'BRL',${c.sold_quantity==null?null:Number(c.sold_quantity)},${Number(c.score)},NOW())
    ON CONFLICT (marketplace,external_id) DO UPDATE SET title=EXCLUDED.title,permalink=EXCLUDED.permalink,thumbnail=EXCLUDED.thumbnail,price=EXCLUDED.price,original_price=EXCLUDED.original_price,sold_quantity=EXCLUDED.sold_quantity,opportunity_score=EXCLUDED.opportunity_score,updated_at=NOW() RETURNING id`;
   productId=Number((p[0] as any).id);
   await sql`INSERT INTO price_history(product_id,price,original_price) VALUES(${productId},${Number(c.price)},${c.original_price==null?null:Number(c.original_price)})`;
 }
 const existing=c.external_id
   ? await sql`SELECT id FROM offers WHERE marketplace=${c.marketplace} AND external_id=${c.external_id} LIMIT 1`
   : await sql`SELECT id FROM offers WHERE marketplace=${c.marketplace} AND (affiliate_url=${c.product_url} OR LOWER(TRIM(title))=LOWER(TRIM(${c.title}))) ORDER BY status='published' DESC,id DESC LIMIT 1`;
 let offerId:number; let created=false;
 if(existing.length){
   offerId=Number((existing[0] as any).id);
   await sql`UPDATE offers SET title=${c.title},category=${c.category||'Casa'},image_url=${c.image_url},price=${Number(c.price)},original_price=${c.original_price==null?null:Number(c.original_price)},affiliate_url=${c.product_url},status='published',external_id=COALESCE(external_id,${c.external_id||null}),product_id=COALESCE(product_id,${productId}),opportunity_score=${Number(c.score)},sync_status=${c.external_id?'linked':'unlinked'},updated_at=NOW() WHERE id=${offerId}`;
 }else{
   const ins=await sql`INSERT INTO offers(title,category,marketplace,image_url,price,original_price,affiliate_url,status,external_id,product_id,opportunity_score,sync_status,last_synced_at)
    VALUES(${c.title},${c.category||'Casa'},${c.marketplace},${c.image_url},${Number(c.price)},${c.original_price==null?null:Number(c.original_price)},${c.product_url},'published',${c.external_id||null},${productId},${Number(c.score)},${c.external_id?'linked':'unlinked'},${c.external_id?new Date():null}) RETURNING id`;
   offerId=Number((ins[0] as any).id); created=true;
 }
 // Remove o candidato: a oferta publicada passa a alimentar Vitrine, Conteúdo, Criativos e Divulgação.
 await sql`DELETE FROM product_candidates WHERE id=${candidateId}`;
 return {ok:true,offerId,published:true,created};
}
