import {NextResponse} from "next/server";import {syncCatalog} from "@/lib/catalog-sync";
export const dynamic="force-dynamic";
export async function POST(){try{return NextResponse.json({ok:true,...await syncCatalog(60)})}catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Falha ao atualizar catálogo"},{status:500})}}
