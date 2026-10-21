import crypto from "node:crypto";
import {isShopeeUrl,productIdentity} from './shopee-links';

const ENDPOINT="https://open-api.affiliate.shopee.com.br/graphql";

const QUERY=`query ProductOfferV2($page:Int,$limit:Int,$keyword:String){
  productOfferV2(page:$page,limit:$limit,keyword:$keyword){
    nodes{
      productName itemId commissionRate commission price sales imageUrl shopName
      productLink offerLink periodStartTime periodEndTime priceMin priceMax
      productCatIds ratingStar priceDiscountRate shopId shopType
      sellerCommissionRate shopeeCommissionRate
    }
    pageInfo{page limit hasNextPage scrollId}
  }
}`;

function credentials(){
  const appId=process.env.SHOPEE_APP_ID?.trim();
  const secret=process.env.SHOPEE_SECRET?.trim();
  if(!appId || !secret) throw new Error("Shopee API não configurada.");
  return {appId,secret};
}

function signedHeaders(body:string){
  const {appId,secret}=credentials();
  const timestamp=Math.floor(Date.now()/1000);
  const signature=crypto.createHash("sha256")
    .update(appId+timestamp+body+secret).digest("hex");
  return {
    "Content-Type":"application/json",
    "Authorization":`SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
  };
}

export function shopeeProductPayload(page=1,limit=20,keyword?:string,itemId?:string){
  if(itemId){
    if(!/^[1-9]\d*$/.test(itemId)||BigInt(itemId)>BigInt("9223372036854775807"))throw new Error("ID Shopee inválido.");
    // Shopee Explorer V2 emits Int64 as a GraphQL integer literal. The API
    // rejects this custom scalar when supplied as a JSON numeric variable (10010).
    const query=QUERY
      .replace("query ProductOfferV2($page:Int,$limit:Int,$keyword:String)","query ProductOfferV2")
      .replace("productOfferV2(page:$page,limit:$limit,keyword:$keyword)",`productOfferV2(page:1,limit:1,itemId:${itemId})`);
    return {query};
  }
  const variables:any={page,limit};
  if(keyword?.trim())variables.keyword=keyword.trim();
  return {query:QUERY,variables};
}

export async function fetchShopeeProducts(page=1,limit=20,keyword?:string,itemId?:string){
  const body=JSON.stringify(shopeeProductPayload(page,limit,keyword,itemId));
  const res=await fetch(ENDPOINT,{method:"POST",headers:signedHeaders(body),body,cache:"no-store",signal:AbortSignal.timeout(15000)});
  const json=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(`Shopee HTTP ${res.status}`);
  if(json?.errors?.length) throw new Error(`Shopee API${json.errors[0]?.extensions?.code||json.errors[0]?.code?` [${json.errors[0]?.extensions?.code||json.errors[0]?.code}]`:""}: ${json.errors[0]?.message || "Erro na consulta"}`);
  return json?.data?.productOfferV2 ?? {nodes:[],pageInfo:null};
}

export function shortLinkPayload(originUrl:string,subId:string|string[]){
  if(!productIdentity(originUrl))throw Error('Use o endereço completo do produto Shopee.');
  const subIds=(Array.isArray(subId)?subId:[subId]).slice(0,5);
  if(!subIds.length||subIds.some(s=>!/^[A-Za-z0-9]{1,50}$/.test(s)))throw Error('Sub ID da API: use somente letras e números, sem sublinhados.');
  return {query:`mutation { generateShortLink(input: {originUrl: ${JSON.stringify(originUrl)}, subIds: [${subIds.map(s=>JSON.stringify(s)).join(', ')}]}) { shortLink } }`};
}
export async function generateShopeeLink(originUrl:string,subId:string|string[]){
  const body=JSON.stringify(shortLinkPayload(originUrl,subId));
  const res=await fetch(ENDPOINT,{method:'POST',headers:signedHeaders(body),body,cache:'no-store',signal:AbortSignal.timeout(15000)});
  const json=await res.json().catch(()=>({}));
  // Never fall back to the original product URL on a conversion failure.
  if(!res.ok||json?.errors?.length){
    const error=json?.errors?.[0];
    let detail=String(error?.message||'Resposta não confirmada').slice(0,400);
    for(const value of [process.env.SHOPEE_APP_ID,process.env.SHOPEE_SECRET])if(value)detail=detail.split(value).join('[oculto]');
    throw Error(`Shopee conversão HTTP ${res.status} [${String(error?.extensions?.code||error?.code||'sem código').slice(0,30)}]: ${detail}`);
  }
  const link=String(json?.data?.generateShortLink?.shortLink||'');
  if(!isShopeeUrl(link)||link===originUrl)throw Error('Shopee retornou um link inválido.');
  return link;
}

// v3.6.0 — Relatório de conversões (vendas e comissões) do programa de afiliados.
export const CONVERSION_FIELDS_FULL=`purchaseTime clickTime conversionId totalCommission utmContent
      orders{ orderId orderStatus items{ itemId itemName itemPrice qty itemTotalCommission } }`;
export function conversionPayload(start:number,end:number,limit=100,scrollId?:string){
  const args=[`purchaseTimeStart:${Math.floor(start)}`,`purchaseTimeEnd:${Math.floor(end)}`,`limit:${Math.min(500,Math.max(1,Math.floor(limit)))}`];
  if(scrollId){if(!/^[A-Za-z0-9_\-=+/.:]{1,500}$/.test(scrollId))throw Error('scrollId inválido');args.push(`scrollId:${JSON.stringify(scrollId)}`);}
  return {query:`query{ conversionReport(${args.join(',')}){ nodes{ ${CONVERSION_FIELDS_FULL} } pageInfo{ limit hasNextPage scrollId } } }`};
}
export async function fetchConversionPage(start:number,end:number,scrollId?:string,limit=100){
  const body=JSON.stringify(conversionPayload(start,end,limit,scrollId));
  const res=await fetch(ENDPOINT,{method:'POST',headers:signedHeaders(body),body,cache:'no-store',signal:AbortSignal.timeout(20000)});
  const json=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(`Shopee HTTP ${res.status}`);
  if(json?.errors?.length){
    const e=json.errors[0];let detail=String(e?.message||'Erro na consulta').slice(0,300);
    for(const v of [process.env.SHOPEE_APP_ID,process.env.SHOPEE_SECRET])if(v)detail=detail.split(v).join('[oculto]');
    throw new Error(`Shopee relatório [${e?.extensions?.code||e?.code||'sem código'}]: ${detail}`);
  }
  return json?.data?.conversionReport??{nodes:[],pageInfo:{hasNextPage:false}};
}
