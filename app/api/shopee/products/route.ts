import {NextResponse} from "next/server";
import {fetchShopeeProducts} from "@/lib/shopee-affiliate";
import {productSafetyCheck} from "@/lib/product-safety";

export const dynamic="force-dynamic";

export async function GET(req:Request){
  try{
    const u=new URL(req.url);
    const page=Math.max(1,Number(u.searchParams.get("page")||1));
    const limit=Math.min(50,Math.max(1,Number(u.searchParams.get("limit")||20)));
    const data=await fetchShopeeProducts(page,limit);
    const nodes=(data.nodes||[]).filter((p:any)=>productSafetyCheck(p.productName||"","").allowed);
    return NextResponse.json({ok:true,nodes,pageInfo:data.pageInfo},{headers:{"Cache-Control":"no-store"}});
  }catch(e:any){
    console.error("Shopee products:",e?.message||e);
    return NextResponse.json({ok:false,error:"Não foi possível consultar a Shopee agora."},{status:502});
  }
}
