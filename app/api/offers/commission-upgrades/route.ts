import {NextResponse} from "next/server";
import {applyCommissionUpgrade,dismissSuggestion,replaceListing,listOpenSuggestions,scanCommissionUpgrades} from "@/lib/commission-upgrade";
export const dynamic="force-dynamic";
export const maxDuration=60;

export async function GET(){
  try{return NextResponse.json({ok:true,suggestions:await listOpenSuggestions()})}
  catch(e:any){return NextResponse.json({ok:false,error:"Não foi possível ler as sugestões."},{status:500})}
}
// action=scan | apply | dismiss | replace (offerId + itemId)
export async function POST(req:Request){
  try{
    const body=await req.json().catch(()=>({}));const action=String(body.action||'scan');
    if(action==='scan')return NextResponse.json({ok:true,...await scanCommissionUpgrades(Number(body.limit)||25,undefined,Number(body.offset)||0)});
    const id=Number(body.offerId);
    if(!Number.isSafeInteger(id)||id<=0)return NextResponse.json({ok:false,error:"Oferta inválida."},{status:400});
    if(action==='replace')return NextResponse.json({ok:true,...await replaceListing(id,String(body.itemId||'').trim())});
    if(action==='apply')return NextResponse.json({ok:true,...await applyCommissionUpgrade(id)});
    if(action==='dismiss'){await dismissSuggestion(id);return NextResponse.json({ok:true})}
    return NextResponse.json({ok:false,error:"Ação inválida."},{status:400});
  }catch(e:any){
    console.error("Commission upgrades:",e?.message||e);
    return NextResponse.json({ok:false,error:String(e?.message||"Falha ao comparar comissões.").slice(0,200)},{status:500});
  }
}
