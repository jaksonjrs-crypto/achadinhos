import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {productSafetyCheck} from "@/lib/product-safety";
export const dynamic="force-dynamic";

export async function POST(){
  try{
    const sql=db();
    const rows=await sql`SELECT id,title,category,marketplace,image_url,price,affiliate_url
      FROM offers WHERE status='draft' AND marketplace='Shopee'
      ORDER BY created_at DESC LIMIT 20`;
    let published=0,blocked=0,incomplete=0;
    for(const o of rows as any[]){
      if(!productSafetyCheck(String(o.title||""),String(o.category||"")).allowed){blocked++;continue}
      if(!o.title||!o.image_url||!o.affiliate_url||!(Number(o.price)>0)){incomplete++;continue}
      await sql`UPDATE offers SET status='published',updated_at=NOW() WHERE id=${o.id} AND status='draft'`;
      published++;
    }
    return NextResponse.json({ok:true,published,blocked,incomplete,considered:rows.length});
  }catch(e:any){
    console.error("Batch publish:",e?.message||e);
    return NextResponse.json({ok:false,error:"Não foi possível publicar o lote."},{status:500});
  }
}
