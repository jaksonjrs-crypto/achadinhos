import { db } from "./db";
export async function listCandidates(){
  const sql=db();
  const rows=await sql`SELECT id,title,category,marketplace,product_url,image_url,price,original_price,score,status,notes,created_at,external_id,sold_quantity FROM product_candidates WHERE status IN ('review','approved') ORDER BY score DESC,created_at DESC LIMIT 100`;
  return rows.map((r:any)=>({...r,id:Number(r.id),price:r.price==null?null:Number(r.price),original_price:r.original_price==null?null:Number(r.original_price),score:Number(r.score),sold_quantity:r.sold_quantity==null?null:Number(r.sold_quantity)}));
}
