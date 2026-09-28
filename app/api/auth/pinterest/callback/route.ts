import { NextRequest,NextResponse } from "next/server";
import { exchangeCode,saveConnection } from "@/lib/pinterest";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
  const url=new URL(req.url);
  const code=url.searchParams.get("code");
  const state=url.searchParams.get("state");
  const saved=req.cookies.get("pinterest_oauth_state")?.value;
  if(!code||!state||!saved||state!==saved) return NextResponse.redirect(new URL("/settings?pinterest=erro_state",url.origin));
  try{
    await saveConnection(await exchangeCode(code));
    const r=NextResponse.redirect(new URL("/settings?pinterest=conectado",url.origin));
    r.cookies.delete("pinterest_oauth_state");
    return r;
  }catch{
    return NextResponse.redirect(new URL("/settings?pinterest=erro",url.origin));
  }
}
