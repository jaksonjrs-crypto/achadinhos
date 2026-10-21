import {CHANNELS} from '@/lib/click-policy';
import {NextRequest,NextResponse} from "next/server";
import {ADMIN_COOKIE,verifyAdminSession} from "@/lib/admin-auth";

const PUBLIC_PREFIXES=["/ofertas","/oferta/","/go/","/o/","/vitrine","/politica-de-privacidade","/admin/login","/api/admin/login","/api/tracking","/api/webhooks/","/api/catalog/cron","/api/autopilot/cron","/api/auth/mercadolivre/callback","/api/auth/pinterest/callback"];
function isPublic(path:string){return path==="/"||path==="/api/vitrine/inicial"||path.startsWith("/_next/")||path==="/favicon.ico"||path.startsWith("/brand/")||PUBLIC_PREFIXES.some(p=>path===p||path.startsWith(p));}
export async function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  if(isPublic(path)){
    const response=NextResponse.next();
    const channel=req.nextUrl.searchParams.get('channel');
    if(path==='/ofertas'&&CHANNELS.includes(channel as any))response.cookies.set('vitrine_channel',channel!,{httpOnly:true,sameSite:'lax',secure:req.nextUrl.protocol==='https:',path:'/'});
    return response;
  }
  const ok=await verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value);
  if(ok) return NextResponse.next();
  if(path.startsWith("/api/")) return NextResponse.json({error:"Não autorizado"},{status:401});
  const url=req.nextUrl.clone(); url.pathname="/admin/login"; url.searchParams.set("next",path); return NextResponse.redirect(url);
}
export const config={matcher:["/((?!_next/static|_next/image).*)"]};
