import { NextResponse } from "next/server";
import { connectionStatus } from "@/lib/pinterest";
export const dynamic="force-dynamic";
export async function GET(){
  const env=Boolean(process.env.PINTEREST_APP_ID&&process.env.PINTEREST_APP_SECRET&&process.env.PINTEREST_REDIRECT_URI);
  const status=env?await connectionStatus():{connected:false};
  return NextResponse.json({ok:true,envConfigured:env,...status},{headers:{"Cache-Control":"no-store"}});
}
