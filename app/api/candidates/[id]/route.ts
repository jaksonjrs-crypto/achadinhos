import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {productSafetyCheck} from "@/lib/product-safety";
import {queueManualOffers} from "@/lib/publication-queue";
import {autopilotCandidate} from "@/lib/autopilot";

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params; const candidateId=Number(id); const f=await req.formData(); const action=String(f.get("action")||"");
 if(!Number.isInteger(candidateId)||candidateId<1)return NextResponse.json({error:"Candidato inválido"},{status:400});
 const sql=db();

 if(action==="delete"){
   await sql`DELETE FROM product_candidates WHERE id=${candidateId}`;
   return NextResponse.redirect(new URL("/garimpo-inteligente?candidate_deleted=1",req.url),303);
 }

 if(action==="edit"){
   const title=String(f.get("title")||"").trim();
   const category=String(f.get("category")||"Casa").trim()||"Casa";
   const productUrl=String(f.get("product_url")||"").trim();
   const imageUrl=String(f.get("image_url")||"").trim();
   const priceRaw=String(f.get("price")||"").replace(",",".");
   const price=priceRaw?Number(priceRaw):null;
   const originalRaw=String(f.get("original_price")||"").replace(",",".");
   const originalPrice=originalRaw?Number(originalRaw):null;
   const notes=String(f.get("notes")||"").trim();
   if(!title)return NextResponse.json({error:"Nome obrigatório"},{status:400});
   if(!productSafetyCheck(title,category,notes).allowed)return NextResponse.json({error:"Categoria de produto não permitida neste projeto."},{status:400});
   for(const [label,value] of [["Link",productUrl],["Imagem",imageUrl]] as const){
     if(value){try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))throw 0}catch{return NextResponse.json({error:`${label} inválido`},{status:400})}}
   }
   await sql`UPDATE product_candidates SET title=${title},category=${category},product_url=${productUrl||null},image_url=${imageUrl||null},price=${price},original_price=${originalPrice},notes=${notes||null},updated_at=NOW() WHERE id=${candidateId}`;
   return NextResponse.redirect(new URL("/garimpo-inteligente?candidate_updated=1",req.url),303);
 }

 if(action==="promote"||action==="approve"){
   const result=await autopilotCandidate(candidateId);
   if(!result.ok)return NextResponse.json({error:result.reason||"Falha no Autopiloto"},{status:400});
   if(result.published&&result.offerId){try{await queueManualOffers(result.offerId)}catch{console.error("Oferta publicada; inclusão na fila pendente.")}}
   const target=result.published?`/garimpo-inteligente?autopilot_published=1`:`/garimpo-inteligente?autopilot_pending=1`;
   return NextResponse.redirect(new URL(target,req.url),303);
 }

 const status=action==="reject"?"rejected":action==="review"?"review":null;
 if(!status)return NextResponse.json({error:"Ação inválida"},{status:400});
 await sql`UPDATE product_candidates SET status=${status},updated_at=NOW() WHERE id=${candidateId}`;
 return NextResponse.redirect(new URL("/garimpo-inteligente",req.url),303);
}
