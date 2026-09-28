import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productSafetyCheck } from "@/lib/product-safety";

export async function POST(req:NextRequest){
  const f=await req.formData();
  const title=String(f.get("title")||"").trim();
  const category=String(f.get("category")||"Casa").trim()||"Casa";
  const marketplace=String(f.get("marketplace")||"Outro").trim()||"Outro";
  const affiliate=String(f.get("affiliate_url")||"").trim();
  const image=String(f.get("image_url")||"").trim();
  const status=String(f.get("status")||"draft");
  const price=Number(String(f.get("price")||"").replace(",","."));
  const originalRaw=String(f.get("original_price")||"").replace(",",".");
  const original=originalRaw?Number(originalRaw):null;

  if(!title||!affiliate||!Number.isFinite(price)||price<=0)return NextResponse.json({error:"Dados inválidos"},{status:400});
  if(!["draft","published"].includes(status))return NextResponse.json({error:"Status inválido"},{status:400});
  for(const [label,value] of [["Link",affiliate],["Imagem",image]] as const){
    if(value){try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))throw 0}catch{return NextResponse.json({error:`${label} inválido`},{status:400})}}
  }
  const safety=productSafetyCheck(title,category);
  if(!safety.allowed)return NextResponse.json({error:"Categoria de produto não permitida neste projeto."},{status:400});
  if(status==="published"&&!image)return NextResponse.json({error:"Inclua uma imagem antes de publicar."},{status:400});

  const sql=db();
  await sql`INSERT INTO offers(title,category,marketplace,image_url,price,original_price,affiliate_url,status)
    VALUES(${title},${category},${marketplace},${image||null},${price},${original},${affiliate},${status})`;
  return NextResponse.redirect(new URL("/central",req.url),303);
}
