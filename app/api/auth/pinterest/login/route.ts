import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { authorizationUrl } from "@/lib/pinterest";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const state=crypto.randomBytes(24).toString("base64url");
    const r=NextResponse.redirect(authorizationUrl(state));
    r.cookies.set("pinterest_oauth_state",state,{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
    return r;
  }catch(e:any){
    return NextResponse.json({ok:false,error:e?.message||"Falha ao iniciar Pinterest OAuth."},{status:500});
  }
}
