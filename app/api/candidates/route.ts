import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {productSafetyCheck} from "@/lib/product-safety";
export async function POST(req:NextRequest){
  const f=await req.formData();
  const title=String(f.get("title")||"").trim();
  const marketplace=String(f.get("marketplace")||"Shopee").trim();
  const category=String(f.get("category")||"Casa").trim()||"Casa";
  const productUrl=String(f.get("product_url")||"").trim();
  const imageUrl=String(f.get("image_url")||"").trim();
  const priceRaw=String(f.get("price")||"").replace(",",".");
  const price=priceRaw?Number(priceRaw):null;
  const originalRaw=String(f.get("original_price")||"").replace(",",".");
  const originalPrice=originalRaw?Number(originalRaw):null;
  const score=Number(f.get("score"));
  const notes=String(f.get("notes")||"").trim();
  if(!title||!Number.isInteger(score)||score<0||score>100)return NextResponse.json({error:"Dados inválidos"},{status:400});
  const safety=productSafetyCheck(title,category,notes);
  if(!safety.allowed)return NextResponse.json({error:"Categoria de produto não permitida neste projeto."},{status:400});
  if(productUrl){try{const u=new URL(productUrl);if(!["http:","https:"].includes(u.protocol))throw 0}catch{return NextResponse.json({error:"Link inválido"},{status:400})}}
  if(imageUrl){try{const u=new URL(imageUrl);if(!["http:","https:"].includes(u.protocol))throw 0}catch{return NextResponse.json({error:"URL da imagem inválida"},{status:400})}}
  const sql=db();
  await sql`INSERT INTO product_candidates(title,category,marketplace,product_url,image_url,price,original_price,score,status,notes)
    VALUES(${title},${category},${marketplace},${productUrl||null},${imageUrl||null},${price},${originalPrice},${score},'review',${notes||null})`;
  return NextResponse.redirect(new URL("/garimpo-inteligente?saved=1",req.url),303);
}
