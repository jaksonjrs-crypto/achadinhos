import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {fetchShopeeProducts} from "@/lib/shopee-affiliate";
import {productSafetyCheck} from "@/lib/product-safety";

export const dynamic="force-dynamic";

function num(v:any){const n=Number(v);return Number.isFinite(n)?n:0}
function optionalNum(v:any){if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null}
function score(p:any){
  const discount=Math.max(0,num(p.priceDiscountRate));
  const rating=Math.max(0,num(p.ratingStar));
  const commission=Math.max(0,num(p.commissionRate))*100;
  const sales=optionalNum(p.sales);
  return Math.max(0,Math.min(100,Math.round(
    Math.min(30,discount*.6)+
    Math.min(25,commission*1.5)+
    Math.min(25,rating*5)+
    (sales==null?10:Math.min(20,Math.log10(Math.max(0,sales)+1)*8))
  )));
}
function originalPrice(p:any){
  const price=num(p.price);
  const d=num(p.priceDiscountRate);
  return price>0&&d>0&&d<100 ? +(price/(1-d/100)).toFixed(2) : null;
}

export async function POST(req:Request){
  try{
    const u=new URL(req.url);
    const limit=Math.min(50,Math.max(1,Number(u.searchParams.get("limit")||20)));
    const page=Math.max(1,Number(u.searchParams.get("page")||1));
    const keyword=String(u.searchParams.get("keyword")||"").trim();
    const category=String(u.searchParams.get("category")||"Outros").trim()||"Outros";
    const minScore=Math.min(100,Math.max(0,Number(u.searchParams.get("minScore")||65)));
    const data=await fetchShopeeProducts(page,limit,keyword||undefined);
    const sql=db();
    let imported=0, skippedUnsafe=0, skippedDuplicate=0, skippedQuality=0;

    for(const p of data.nodes||[]){
      const title=String(p.productName||"").trim();
      const affiliateUrl=String(p.offerLink||"").trim();
      if(!title||!affiliateUrl) continue;
      if(!productSafetyCheck(title,"Shopee","Importado via Shopee Affiliate Open API").allowed){
        skippedUnsafe++; continue;
      }
      const externalId=String(p.itemId||"").trim()||null;
      const existingCatalog=externalId?await sql`SELECT id FROM offers WHERE marketplace='Shopee' AND external_id=${externalId} LIMIT 1`:[];
      if(existingCatalog.length){skippedDuplicate++;continue}
      const existing=externalId
        ? await sql`SELECT id FROM product_candidates WHERE marketplace='Shopee' AND external_id=${externalId} LIMIT 1`
        : await sql`SELECT id FROM product_candidates WHERE marketplace='Shopee' AND product_url=${affiliateUrl} LIMIT 1`;
      if(existing.length){skippedDuplicate++;continue}
      const candidateScore=score(p);
      const rating=num(p.ratingStar);
      const sales=optionalNum(p.sales);
      const discount=num(p.priceDiscountRate);
      const commissionRate=num(p.commissionRate)*100;
      const hasTrustSignal=rating>=4 || (sales!=null && sales>=10);
      const hasOfferSignal=discount>=10 || commissionRate>=8;
      if(candidateScore<minScore || !hasTrustSignal || !hasOfferSignal){
        skippedQuality++;continue
      }
      const price=num(p.price)||null;
      const notes=[
        "Importado via Shopee Affiliate Open API",
        p.itemId?`Item ID: ${p.itemId}`:"",
        p.shopName?`Loja: ${p.shopName}`:"",
        p.commissionRate?`Comissão: ${(num(p.commissionRate)*100).toFixed(1)}%`:"",
        p.ratingStar?`Avaliação: ${p.ratingStar}`:"",
        sales!=null?`Vendas informadas: ${sales}`:`Vendas não informadas`
      ].filter(Boolean).join(" | ");
      const inserted=await sql`INSERT INTO product_candidates
        (title,category,marketplace,product_url,image_url,price,original_price,score,status,notes,external_id,sold_quantity)
        VALUES(${title},${category},${"Shopee"},${affiliateUrl},
          ${p.imageUrl||null},${price},${originalPrice(p)},${candidateScore},'review',${notes},${externalId},${sales})
        ON CONFLICT DO NOTHING RETURNING id`;
      if(inserted.length) imported++; else skippedDuplicate++;
    }
    return NextResponse.json({ok:true,imported,skippedUnsafe,skippedDuplicate,skippedQuality,
      received:(data.nodes||[]).length,pageInfo:data.pageInfo,keyword:keyword||null,minScore});
  }catch(e:any){
    console.error("Shopee import:",e?.message||e);
    return NextResponse.json({ok:false,error:"Não foi possível importar produtos da Shopee."},{status:502});
  }
}
