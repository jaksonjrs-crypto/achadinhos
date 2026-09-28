import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pinterestFetch } from "@/lib/pinterest";
import { productSafetyCheck } from "@/lib/product-safety";
export const dynamic="force-dynamic";

export async function POST(req:NextRequest){
  try{
    const {offerId,boardId}=await req.json();
    if(!offerId||!boardId) return NextResponse.json({ok:false,error:"Oferta e pasta são obrigatórias."},{status:400});
    const sql=db();
    const rows=await sql`SELECT id,title,image_url,price,marketplace,status FROM offers WHERE id=${Number(offerId)} LIMIT 1`;
    const o=rows[0] as any;
    if(!o||o.status!=="published") return NextResponse.json({ok:false,error:"Oferta publicada não encontrada."},{status:404});
    const safe=productSafetyCheck(String(o.title||""));
    if(!safe.allowed) return NextResponse.json({ok:false,error:"Produto bloqueado pelo filtro de segurança."},{status:400});
    if(!o.image_url) return NextResponse.json({ok:false,error:"A oferta precisa de imagem pública para criar o Pin."},{status:400});

    const origin=new URL(req.url).origin;
    const link=`${origin}/o/${o.id}?c=p`;
    const payload={
      board_id:String(boardId),
      title:String(o.title).slice(0,100),
      description:`Achado da Vitrine dos Achados. Confira preço e disponibilidade no link. Promoção sujeita a alteração a qualquer momento.`.slice(0,500),
      link,
      media_source:{source_type:"image_url",url:String(o.image_url)}
    };
    const r=await pinterestFetch("/pins",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok) return NextResponse.json({ok:false,error:data?.message||"Pinterest recusou a publicação.",details:data},{status:r.status});
    return NextResponse.json({ok:true,pin:{id:data.id,link:data.link||null,title:data.title||o.title}});
  }catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Falha ao publicar no Pinterest."},{status:500});}
}
