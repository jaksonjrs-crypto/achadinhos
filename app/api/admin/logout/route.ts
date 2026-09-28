import {NextResponse} from "next/server"; import {ADMIN_COOKIE} from "@/lib/admin-auth";
export async function POST(req:Request){const res=NextResponse.redirect(new URL("/admin/login",req.url),303);res.cookies.set(ADMIN_COOKIE,"",{httpOnly:true,path:"/",maxAge:0});return res}
