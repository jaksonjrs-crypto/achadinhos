import crypto from "node:crypto";

const ENDPOINT="https://open-api.affiliate.shopee.com.br/graphql";

const QUERY=`query ProductOfferV2($page:Int,$limit:Int,$keyword:String,$itemId:Int64){
  productOfferV2(page:$page,limit:$limit,keyword:$keyword,itemId:$itemId){
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

export async function fetchShopeeProducts(page=1,limit=20,keyword?:string,itemId?:string){
  const variables:any={page,limit};
  if(keyword?.trim()) variables.keyword=keyword.trim();
  if(itemId){
    const id=Number(itemId);
    if(!/^\d+$/.test(itemId)||!Number.isSafeInteger(id)||id<=0)throw new Error("ID Shopee inválido.");
    variables.itemId=id;
  }
  const body=JSON.stringify({query:QUERY,variables});
  const res=await fetch(ENDPOINT,{method:"POST",headers:signedHeaders(body),body,cache:"no-store",signal:AbortSignal.timeout(15000)});
  const json=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(`Shopee HTTP ${res.status}`);
  if(json?.errors?.length) throw new Error(`Shopee API${json.errors[0]?.extensions?.code||json.errors[0]?.code?` [${json.errors[0]?.extensions?.code||json.errors[0]?.code}]`:""}: ${json.errors[0]?.message || "Erro na consulta"}`);
  return json?.data?.productOfferV2 ?? {nodes:[],pageInfo:null};
}
