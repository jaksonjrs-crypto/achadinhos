import {db} from './db';
import {ensureOfferAffiliate} from './affiliate-registry';
export function manychatLink(origin:string,offerId:number,channel:string){
  const url=new URL(`/go/${offerId}`,origin);
  url.searchParams.set('channel',channel);url.searchParams.set('utm_source',channel);url.searchParams.set('utm_medium','manychat');
  return url.toString();
}
export function manychatKeyword(title:string){return title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim().split(' ').slice(0,5).join(' ').toUpperCase()}
async function manychatRequest(path:string,body?:unknown){
  const token=process.env.MANYCHAT_API_TOKEN?.trim();
  if(!token)throw Error('Manychat: cadastre MANYCHAT_API_TOKEN na Vercel para sincronizar campos.');
  const r=await fetch(`https://api.manychat.com/fb/page/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(12000)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j.status!=='success')throw Error(`Manychat não confirmou a atualização (HTTP ${r.status}). Confira a chave e o plano da conta.`);
  return j.data;
}
export async function prepareManychat(offerId:number,channel:string,origin:string,sync=false){
  if(!['instagram','facebook'].includes(channel))throw Error('Canal inválido. Threads não possui gatilho Manychat neste fluxo.');
  let offer:any;
  if(sync)offer=await ensureOfferAffiliate(offerId);
  else{const sql=db();const rows=await sql`SELECT title,status FROM offers WHERE id=${offerId} LIMIT 1`;offer=rows[0];}
  if(!offer||offer.status!=='published')throw Error('Oferta indisponível.');
  const link=manychatLink(origin,offerId,channel),fieldName=`VITRINE_${offerId}_${channel.toUpperCase()}_LINK`;
  let fieldSynced=false;
  if(sync&&process.env.MANYCHAT_API_TOKEN?.trim()){
    const fields=await manychatRequest('getBotFields');
    if(!Array.isArray(fields))throw Error('Manychat retornou uma lista de campos inválida.');
    const field=fields.find((f:any)=>f.name===fieldName);
    if(field)await manychatRequest('setBotFieldByName',{field_name:fieldName,field_value:link});
    else await manychatRequest('createBotField',{name:fieldName,type:'text',description:`Link estável da oferta ${offerId} da Vitrine dos Achados`,value:link});
    fieldSynced=true;
  }
  return {offerId,channel,keyword:manychatKeyword(String(offer.title)),link,fieldName,fieldSynced,
    configured:Boolean(process.env.MANYCHAT_API_TOKEN?.trim()),validated:sync,
    message:`🔥 Achado de hoje!\n${String(offer.title).slice(0,100)}\nConfira a promoção no botão abaixo.\n\n*Promoção sujeita a alteração a qualquer momento.`,
    setupRequired:true,
    note:fieldSynced?'Campo de link sincronizado. Vincule ou confira o botão e o gatilho na automação Manychat.':'Configure o gatilho e use este link no botão da automação Manychat. A criação de gatilhos não está disponível nesta integração de API.'};
}
