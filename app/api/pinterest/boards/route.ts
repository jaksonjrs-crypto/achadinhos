import { NextResponse } from "next/server";
import { listPinterestBoards,pinterestFetch,pinterestEnvironment } from "@/lib/pinterest";
export const dynamic="force-dynamic";
export async function GET(){
  try{return NextResponse.json({ok:true,environment:pinterestEnvironment,items:await listPinterestBoards()},{headers:{"Cache-Control":"no-store"}})}
  catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Pinterest indisponível."},{status:502})}
}
// Explicit admin action: create a Sandbox destination, never a production board.
export async function POST(){
  if(pinterestEnvironment!=="sandbox")return NextResponse.json({ok:false,error:"Disponível apenas no Sandbox."},{status:409});
  try{
    const name="Vitrine dos Achados — Testes";
    const boards=await listPinterestBoards();
    const existing=boards.find(b=>b.name===name);
    if(existing)return NextResponse.json({ok:true,board:existing});
    const r=await pinterestFetch("/boards",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,description:"Demonstração do Garimpo no Sandbox do Pinterest.",privacy:"PUBLIC"})});
    const data=await r.json();
    if(!r.ok)throw new Error(data?.message||"Falha ao criar pasta de teste.");
    return NextResponse.json({ok:true,board:{id:String(data.id),name:String(data.name)}});
  }catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Falha no Sandbox."},{status:502})}
}
