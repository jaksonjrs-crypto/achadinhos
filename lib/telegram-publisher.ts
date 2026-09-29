import {productDisplayTitle} from "./product-title";

type TelegramOffer={title:string;price:number|string;image_url?:string|null};

export async function sendTelegramOffer(offer:TelegramOffer,offerId:number,origin:string):Promise<string>{
  const token=process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId=process.env.TELEGRAM_CHAT_ID?.trim();
  if(!token||!chatId) throw new Error("Bot e canal do Telegram não configurados.");

  const title=productDisplayTitle(String(offer.title||""),80,12);
  const price=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(offer.price));
  const link=`${origin}/o/${offerId}?c=t`;
  const message=`🔥 ${title}\n💰 ${price}\n🔗 ${link}\n\nPromoção sujeita a alteração.`;
  const endpoint=`https://api.telegram.org/bot${token}/`;

  async function send(method:"sendPhoto"|"sendMessage",body:Record<string,unknown>){
    const response=await fetch(endpoint+method,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({chat_id:chatId,...body}),cache:"no-store"
    });
    const data=await response.json().catch(()=>null);
    return {response,data};
  }

  let imageUrl:string|undefined;
  try{
    const url=new URL(String(offer.image_url||""));
    if(url.protocol==="https:"||url.protocol==="http:") imageUrl=url.toString();
  }catch{}

  if(imageUrl){
    const photo=await send("sendPhoto",{photo:imageUrl,caption:message});
    if(photo.response.ok&&photo.data?.ok) return String(photo.data.result?.message_id||"");
    // Fall back only after Telegram explicitly rejects the image. Network failures
    // or unclear responses could mean the photo was already posted.
    if(!(photo.data?.ok===false||photo.response.status>=400&&photo.response.status<500)){
      throw new Error("Telegram: resposta inconclusiva ao enviar a imagem. Confira o canal antes de tentar novamente.");
    }
  }

  const sent=await send("sendMessage",{text:message,disable_web_page_preview:false});
  if(!sent.response.ok||!sent.data?.ok){
    throw new Error(`Telegram: ${String(sent.data?.description||sent.response.status).slice(0,180)}`);
  }
  return String(sent.data.result?.message_id||"");
}
