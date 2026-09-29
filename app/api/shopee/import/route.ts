import {NextResponse} from "next/server";
import {importShopeeCandidates} from "@/lib/shopee-import";

export const dynamic="force-dynamic";

export async function POST(req:Request){
  try{
    const u=new URL(req.url);
    const limit=Math.min(50,Math.max(1,Number(u.searchParams.get("limit")||20)));
    const page=Math.max(1,Number(u.searchParams.get("page")||1));
    const keyword=String(u.searchParams.get("keyword")||"").trim();
    const category=String(u.searchParams.get("category")||"Outros").trim()||"Outros";
    const minScore=Math.min(100,Math.max(0,Number(u.searchParams.get("minScore")||65)));
    return NextResponse.json(await importShopeeCandidates({page,limit,keyword,category,minScore}));
  }catch(e:any){
    console.error("Shopee import:",e?.message||e);
    return NextResponse.json({ok:false,error:"Não foi possível importar produtos da Shopee."},{status:502});
  }
}
