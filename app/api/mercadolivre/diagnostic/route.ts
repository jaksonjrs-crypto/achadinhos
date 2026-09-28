import {NextResponse} from "next/server";
import {mlFetch,SITE_ID} from "@/lib/ml";
export const dynamic="force-dynamic";
async function safeJson(res:Response){return res.json().catch(()=>({}));}
function upstream(res:Response,data:any){return {status:res.status,ok:res.ok,error:data?.error||null,message:data?.message||null};}
function itemIdFrom(value:string){
  const raw=value.trim();
  const direct=raw.match(/^MLB[-_ ]?(\d{6,})$/i);
  if(direct)return `MLB${direct[1]}`;
  // Product pages may contain both /p/MLB<catalog_id> and the real listing id
  // inside pdp_filters=item_id:MLB<item_id>. Prefer the explicit item_id.
  const explicit=raw.match(/(?:item_id(?:%3A|:|=)|itemId(?:=|%3D))\s*(MLB[-_ ]?\d{6,})/i);
  if(explicit)return explicit[1].replace(/[-_ ]/g,"").toUpperCase();
  try{
    const decoded=decodeURIComponent(raw);
    const decodedItem=decoded.match(/item_id(?:\s*[:=]\s*)(MLB[-_ ]?\d{6,})/i);
    if(decodedItem)return decodedItem[1].replace(/[-_ ]/g,"").toUpperCase();
  }catch{}
  const generic=raw.match(/MLB[-_ ]?(\d{6,})/i);
  return generic?`MLB${generic[1]}`:null;
}
function compactItem(b:any){if(!b||typeof b!=="object")return null;return{id:b.id||null,title:b.title||null,price:b.price??null,original_price:b.original_price??null,permalink:b.permalink||null,status:b.status||null,available_quantity:b.available_quantity??null,sold_quantity:b.sold_quantity??null,seller_id:b.seller_id??null,catalog_product_id:b.catalog_product_id||null,free_shipping:!!b?.shipping?.free_shipping};}
export async function GET(req:Request){try{const u=new URL(req.url);const mode=String(u.searchParams.get("mode")||"");
if(mode==="item"){const input=String(u.searchParams.get("value")||"");const id=itemIdFrom(input);if(!id)return NextResponse.json({ok:false,error:"Informe um item MLB válido ou uma URL que contenha o código MLB."},{status:400});const attrs=["id","title","price","original_price","permalink","status","available_quantity","sold_quantity","seller_id","catalog_product_id","shipping"].join(",");const res=await mlFetch(`/items/${encodeURIComponent(id)}?attributes=${encodeURIComponent(attrs)}`);const data=await safeJson(res);return NextResponse.json({ok:res.ok,test:"item",input,id,upstream:upstream(res,data),item:res.ok?compactItem(data):null});}
if(mode==="seller"){const seller=String(u.searchParams.get("seller")||"").trim();if(!seller)return NextResponse.json({ok:false,error:"Informe o seller_id ou nickname do vendedor."},{status:400});const numeric=/^\d+$/.test(seller);const path=numeric?`/users/${encodeURIComponent(seller)}/items/search?status=active&limit=10`:`/sites/${SITE_ID}/search?nickname=${encodeURIComponent(seller)}&limit=10`;const res=await mlFetch(path);const data=await safeJson(res);const ids=Array.isArray(data?.results)?data.results.slice(0,10):[];return NextResponse.json({ok:res.ok,test:"seller",seller,method:numeric?"user-items":"site-nickname",upstream:upstream(res,data),count:ids.length,item_ids:ids});}
if(mode==="catalog"){const q=String(u.searchParams.get("q")||"").trim();if(q.length<2)return NextResponse.json({ok:false,error:"Informe uma busca de catálogo."},{status:400});const qs=new URLSearchParams({status:"active",site_id:SITE_ID,q,limit:"5",offset:"0"});const res=await mlFetch(`/products/search?${qs.toString()}`);const data=await safeJson(res);const results=Array.isArray(data?.results)?data.results:[];const samples:any[]=[];for(const base of results.slice(0,5)){const id=String(base?.id||"");if(!id)continue;const dr=await mlFetch(`/products/${encodeURIComponent(id)}`);const d=await safeJson(dr);samples.push({catalog_id:id,name:d?.name||base?.name||null,detail_status:dr.status,buy_box:d?.buy_box_winner?{item_id:d.buy_box_winner.item_id||null,price:d.buy_box_winner.price??null,seller_id:d.buy_box_winner.seller_id??null,status:d.buy_box_winner.status||null}:null});}return NextResponse.json({ok:res.ok,test:"catalog",query:q,upstream:upstream(res,data),received:results.length,with_buy_box:samples.filter(x=>x.buy_box?.item_id).length,samples});}
return NextResponse.json({ok:false,error:"Modo de diagnóstico inválido."},{status:400});}catch(e:any){console.error("ML diagnostic:",e?.message||e);return NextResponse.json({ok:false,error:e?.message||"Falha no diagnóstico do Mercado Livre."},{status:502});}}
