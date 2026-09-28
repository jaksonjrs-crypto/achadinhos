import {NextRequest,NextResponse} from "next/server";
import {brazilDate,ensurePublicationQueue,isChannel,listPublicationTasks} from "@/lib/publication-queue";
export const dynamic="force-dynamic";

export async function GET(){
  try{return NextResponse.json({ok:true,tasks:await listPublicationTasks()},{headers:{"Cache-Control":"no-store"}})}
  catch(e:any){console.error("Publication queue:",e?.message||e);return NextResponse.json({ok:false,error:"Não foi possível carregar a fila."},{status:500})}
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json().catch(()=>({}));
    const sql=await ensurePublicationQueue();
    if(body.action==="enqueue"){
      const offerId=Number(body.offerId),channel=String(body.channel||"");
      if(!Number.isSafeInteger(offerId)||offerId<1||!isChannel(channel)) return NextResponse.json({ok:false,error:"Oferta ou canal inválido."},{status:400});
      const scheduled=body.scheduledAt?new Date(String(body.scheduledAt)):null;
      if(scheduled&&!Number.isFinite(scheduled.getTime())) return NextResponse.json({ok:false,error:"Data inválida."},{status:400});
      const cycle=brazilDate(scheduled||new Date());
      const rows=await sql`INSERT INTO publication_tasks(offer_id,channel,cycle_date,status,scheduled_at)
        SELECT id,${channel},${cycle}::date,${scheduled?'scheduled':'ready'},${scheduled?.toISOString()||null}
        FROM offers WHERE id=${offerId} AND status='published'
        ON CONFLICT (offer_id,channel,cycle_date) DO NOTHING RETURNING id`;
      return NextResponse.json({ok:rows.length>0,created:rows.length>0,error:rows.length?null:"Oferta indisponível ou já incluída neste dia."},{status:rows.length?201:409});
    }
    if(body.action==="mark"){
      const id=Number(body.id),status=String(body.status||"");
      if(!Number.isSafeInteger(id)||id<1||!["ready","published","skipped"].includes(status)) return NextResponse.json({ok:false,error:"Estado inválido."},{status:400});
      const rows=await sql`UPDATE publication_tasks SET status=${status},published_at=${status==='published'?new Date().toISOString():null},last_error=NULL,updated_at=NOW()
        WHERE id=${id} AND status IN ('ready','scheduled','failed','published','skipped') RETURNING id`;
      return NextResponse.json({ok:rows.length>0},{status:rows.length?200:409});
    }
    return NextResponse.json({ok:false,error:"Ação inválida."},{status:400});
  }catch(e:any){console.error("Publication queue action:",e?.message||e);return NextResponse.json({ok:false,error:"Não foi possível atualizar a fila."},{status:500})}
}
