import {NextResponse} from "next/server";
import {pinterestFetch} from "@/lib/pinterest";
import {connectionStatus} from "@/lib/pinterest";
export const dynamic="force-dynamic";

export async function GET(){
  const result:any={pinterest:{configured:false,ok:false},telegram:{configured:false,ok:false}};
  const pConfigured=Boolean(process.env.PINTEREST_APP_ID&&process.env.PINTEREST_APP_SECRET&&process.env.PINTEREST_REDIRECT_URI);
  result.pinterest.configured=pConfigured;
  if(pConfigured){
    const connection=await connectionStatus();
    if(connection.connected){
      try{const r=await pinterestFetch('/boards?page_size=1');result.pinterest={configured:true,connected:true,ok:r.ok,status:r.status}}
      catch{result.pinterest={configured:true,connected:true,ok:false,error:'Não foi possível consultar as pastas.'}}
    }
  }
  const token=process.env.TELEGRAM_BOT_TOKEN?.trim(),chatId=process.env.TELEGRAM_CHAT_ID?.trim();
  result.telegram.configured=Boolean(token&&chatId);
  if(token&&chatId){
    try{
      const [bot,chat]=await Promise.all([
        fetch(`https://api.telegram.org/bot${token}/getMe`,{cache:'no-store'}).then(r=>r.json()),
        fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`,{cache:'no-store'}).then(r=>r.json())
      ]);
      result.telegram={configured:true,ok:Boolean(bot.ok&&chat.ok),bot:bot.ok?bot.result?.username:null,chat:chat.ok?chat.result?.title||chat.result?.username||null:null,error:!bot.ok||!chat.ok?'Bot ou canal não acessível.':null};
    }catch{result.telegram={configured:true,ok:false,error:'Falha ao consultar o Telegram.'}}
  }
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
}
