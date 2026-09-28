import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {productSafetyCheck} from "@/lib/product-safety";
import {autopilotCandidate} from "@/lib/autopilot";
export const dynamic="force-dynamic";

export async function POST(){
  try{
    const sql=db();
    const rows=await sql`SELECT id,title,category,notes,score FROM product_candidates
      WHERE status='review' AND marketplace='Shopee' AND score>=80 ORDER BY score DESC LIMIT 20`;
    let approved=0,published=0,pending=0,blocked=0;
    for(const row of rows){
      if(!productSafetyCheck(String(row.title||""),String(row.category||""),String(row.notes||"")).allowed){blocked++;continue}
      const result=await autopilotCandidate(Number(row.id));
      if(!result.ok){blocked++;continue}
      approved++; result.published?published++:pending++;
    }
    return NextResponse.json({ok:true,approved,published,pending,blocked,considered:rows.length});
  }catch(e:any){
    console.error("Batch approve:",e?.message||e);
    return NextResponse.json({ok:false,error:"Não foi possível aprovar o lote."},{status:500});
  }
}
