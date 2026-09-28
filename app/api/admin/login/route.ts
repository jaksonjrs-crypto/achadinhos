import {NextRequest,NextResponse} from "next/server";
import {ADMIN_COOKIE,createAdminSession} from "@/lib/admin-auth";
export async function POST(req:NextRequest){
  const f=await req.formData(); const password=String(f.get("password")||"");
  const configured=process.env.ADMIN_PASSWORD||"";
  if(!configured||password!==configured){const u=new URL("/admin/login",req.url);u.searchParams.set("erro","1");return NextResponse.redirect(u,303)}
  const next=String(f.get("next")||"/operacao"); const safe=next.startsWith("/")&&!next.startsWith("//")?next:"/operacao";
  const res=NextResponse.redirect(new URL(safe,req.url),303);
  res.cookies.set(ADMIN_COOKIE,await createAdminSession(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*12}); return res;
}
