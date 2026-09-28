import {NextRequest,NextResponse} from "next/server";import {syncCatalog} from "@/lib/catalog-sync";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){const secret=process.env.CRON_SECRET;const auth=req.headers.get("authorization");if(!secret||auth!==`Bearer ${secret}`)return NextResponse.json({error:"Não autorizado"},{status:401});try{return NextResponse.json({ok:true,...await syncCatalog(80)})}catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Falha na sincronização"},{status:500})}}
