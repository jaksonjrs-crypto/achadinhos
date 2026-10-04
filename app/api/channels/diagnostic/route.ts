import {instagramConfigured,verifyInstagramConnection} from "@/lib/instagram";
import {NextResponse} from "next/server";
import {pinterestFetch} from "@/lib/pinterest";
import {connectionStatus} from "@/lib/pinterest";
import {facebookConfigured,verifyFacebookConnection} from '@/lib/facebook';
export const dynamic="force-dynamic";

export async function GET(){
  const result:any={facebook:{configured:facebookConfigured(),ok:false},instagram:{configured:instagramConfigured(),ok:false},pinterest:{configured:false,ok:false},telegram:{configured:false,ok:false}};
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
      const endpoint=`https://api.telegram.org/bot${token}/`;
      const [bot,chat]=await Promise.all([
        fetch(endpoint+"getMe",{cache:"no-store"}).then(r=>r.json()),
        fetch(endpoint+"getChat?chat_id="+encodeURIComponent(chatId),{cache:"no-store"}).then(r=>r.json())
      ]);
      if(!bot.ok){
        result.telegram={configured:true,ok:false,error:"Bot do Telegram inacessível. Confira o token."};
      }else if(!chat.ok){
        result.telegram={configured:true,ok:false,bot:bot.result?.username||null,error:"Canal inacessível. Confira o ID e adicione o bot ao canal."};
      }else{
        const name=chat.result?.title||chat.result?.username||null;
        if(chat.result?.type!=="channel"){
          result.telegram={configured:true,ok:false,bot:bot.result?.username||null,chat:name,error:"O destino configurado não é um canal do Telegram."};
        }else{
          const params=new URLSearchParams({chat_id:chatId,user_id:String(bot.result.id)});
          const member=await fetch(endpoint+"getChatMember?"+params,{cache:"no-store"}).then(r=>r.json());
          const status=member.result?.status;
          const canPost=member.ok&&(status==="creator"||(status==="administrator"&&member.result?.can_post_messages===true));
          result.telegram={
            configured:true,ok:canPost,bot:bot.result?.username||null,chat:name,
            error:canPost?null:!member.ok?"Não foi possível confirmar a permissão. Adicione o bot como administrador do canal.":"O bot precisa ser administrador do canal com permissão para publicar mensagens."
          };
        }
      }
    }catch{result.telegram={configured:true,ok:false,error:"Falha ao consultar o Telegram."}}
  }
  if(result.instagram.configured){
    try{const account=await verifyInstagramConnection();result.instagram={configured:true,ok:true,username:account.username,detail:"Conta acessível. A permissão de publicação será confirmada no envio."};}
    catch(e:any){result.instagram={configured:true,ok:false,error:String(e?.message||"Falha ao consultar o Instagram.").slice(0,300)};}
  }
  if(result.facebook.configured){
    try{const page=await verifyFacebookConnection();result.facebook={configured:true,ok:true,name:page.name,detail:'Página acessível. A publicação será confirmada no envio.'};}
    catch(e:any){result.facebook={configured:true,ok:false,error:e.message};}
  }
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
}
