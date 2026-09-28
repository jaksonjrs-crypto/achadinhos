import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {autopilotCandidate} from "@/lib/autopilot";
export const dynamic="force-dynamic";

export async function POST(){
 try{
  const sql=db();
  const rows=await sql`SELECT id FROM product_candidates WHERE status='approved' AND score>=80 ORDER BY score DESC LIMIT 20`;
  let published=0,pending=0,failed=0;
  for(const row of rows as any[]){const r=await autopilotCandidate(Number(row.id));if(!r.ok)failed++;else if(r.published)published++;else pending++}
  return NextResponse.json({ok:true,published,pending,failed,considered:rows.length});
 }catch(e:any){console.error("Autopilot batch:",e?.message||e);return NextResponse.json({ok:false,error:"Não foi possível executar o Autopiloto."},{status:500})}
}
