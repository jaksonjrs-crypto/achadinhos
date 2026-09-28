import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const sql=db();
    const columns=await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='offer_clicks' ORDER BY ordinal_position`;
    const names=columns.map((x:any)=>String(x.column_name));
    const total=await sql`SELECT COUNT(*)::int AS clicks FROM offer_clicks`;
    let latest:any[]=[];
    if(names.includes("created_at")) latest=await sql`SELECT MAX(created_at) AS last_click FROM offer_clicks`;
    else if(names.includes("clicked_at")) latest=await sql`SELECT MAX(clicked_at) AS last_click FROM offer_clicks`;
    return NextResponse.json({ok:true,clicks:Number(total[0]?.clicks||0),columns:names,lastClick:latest[0]?.last_click||null},{headers:{"Cache-Control":"no-store"}});
  }catch(error:any){
    return NextResponse.json({ok:false,error:String(error?.message||"Falha no diagnóstico").slice(0,300)},{status:500,headers:{"Cache-Control":"no-store"}});
  }
}
