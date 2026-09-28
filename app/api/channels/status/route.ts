import {NextResponse} from "next/server";
import {connectionStatus} from "@/lib/pinterest";
export const dynamic="force-dynamic";
export async function GET(){
  const pinterestConfigured=Boolean(process.env.PINTEREST_APP_ID&&process.env.PINTEREST_APP_SECRET&&process.env.PINTEREST_REDIRECT_URI);
  const pinterest=pinterestConfigured?await connectionStatus():{connected:false};
  return NextResponse.json({
    pinterest:{configured:pinterestConfigured,connected:pinterest.connected},
    telegram:{configured:Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID)},
    instagram:{configured:false,mode:'assisted'},facebook:{configured:false,mode:'assisted'},
    whatsapp:{configured:false,mode:'assisted'},tiktok:{configured:false,mode:'assisted'}
  },{headers:{'Cache-Control':'no-store'}});
}
