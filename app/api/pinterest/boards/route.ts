import { NextResponse } from "next/server";
import { pinterestFetch } from "@/lib/pinterest";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const r=await pinterestFetch("/boards?page_size=100");
    const data=await r.json();
    if(!r.ok) return NextResponse.json({ok:false,error:data?.message||"Falha ao listar pastas."},{status:r.status});
    return NextResponse.json({ok:true,items:data.items||[]},{headers:{"Cache-Control":"no-store"}});
  }catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Pinterest indisponível."},{status:500});}
}
