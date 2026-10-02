import {productSafetyCheck} from './product-safety';
import {opportunityScore} from './score';

export type MlListProduct={externalId:string;title:string;category:string;price:number;originalPrice:number|null;imageUrl:string;productUrl:string;notes:string;score:number;priceCondition:string|null};
export type MlListPreview={listName:string;affiliateUrl:string;totalItems:number;loadedItems:number;products:MlListProduct[];skipped:number};
export const ML_LIST_MAX_BYTES=2*1024*1024;

// Read only the JSON object assigned to Nordic's render context. Never evaluate
// saved scripts: an HTML export also contains unrelated account/session data.
function renderState(html:string):any{
  for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)){
    const match=/_n\.ctx\.r\s*=\s*/.exec(script[1]);
    if(!match)continue;
    const input=script[1].slice(match.index+match[0].length).trimStart();
    if(input[0]!=='{')continue;
    let depth=0,inString=false,escaped=false;
    for(let i=0;i<input.length;i++){
      const c=input[i];
      if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue}
      if(c==='"')inString=true;
      else if(c==='{')depth++;
      else if(c==='}'&&--depth===0){try{return JSON.parse(input.slice(0,i+1))}catch{break}}
    }
  }
  throw new Error('O arquivo não contém os dados da lista. Salve a página da lista como HTML após carregar os produtos.');
}
export function validateMlListUrl(value:string){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.port)throw new Error('Link da lista inválido.');
  if(u.hostname==='meli.la'&&/^\/[A-Za-z0-9]+\/?$/.test(u.pathname))return value;
  if(u.hostname==='www.mercadolivre.com.br'&&/^\/social\/[^/]+\/lists\/[a-f0-9-]+\/?$/i.test(u.pathname)&&u.searchParams.get('matt_tool'))return value;
  throw new Error('Use o link de Compartilhar lista do Mercado Livre, com seu rastreamento de afiliado.');
}
function category(title:string){
  const t=title.toLocaleLowerCase('pt-BR');
  if(/calça|short|vestido|body|bolsa|mochila|conjunto feminino/.test(t))return 'Moda';
  if(/celular|notebook|carregador/.test(t))return 'Eletrônicos';
  if(/whey|creatina|proteína/.test(t))return 'Saúde';
  if(/sanduicheira|purificador/.test(t))return 'Cozinha';
  return 'Casa';
}
export function parseMlListHtml(html:string,affiliateOverride?:string):MlListPreview{
  if(Buffer.byteLength(html,'utf8')>ML_LIST_MAX_BYTES)throw new Error('O arquivo deve ter até 2 MB.');
  const p=renderState(html)?.appProps?.pageProps;
  if(p?.siteId!=='MLB'||!Array.isArray(p.polycards)||typeof p.listId!=='string')throw new Error('Escolha um HTML de lista de afiliado do Mercado Livre Brasil.');
  if(p.polycards.length>200)throw new Error('Importe até 200 produtos por arquivo.');
  const affiliateUrl=validateMlListUrl(String(affiliateOverride||p.shareLink||'').trim());
  const products:MlListProduct[]=[],seen=new Set<string>();let skipped=0;
  for(const card of p.polycards){
    const components=Array.isArray(card.components)?card.components:[];
    const title=String(components.find((c:any)=>c.type==='title')?.title?.text||'').trim().slice(0,500);
    const meta=card.metadata||{},fragment=String(meta.url_fragments||'');
    // Catalog MLB IDs identify a product page; wid is the actual listing ID.
    const externalId=String(/(?:[&#]|^)wid=(MLB\d+)/.exec(fragment)?.[1]||meta.id||'');
    const priceData=components.find((c:any)=>c.type==='price')?.price||{};
    const current=Number(priceData.current_price?.value);
    const label=String(priceData.discount_label?.text||'');
    const standard=priceData.installments?.values?.find((v:any)=>v.key==='price_total')?.price?.value;
    const conditional=/pix/i.test(label);
    const price=conditional&&Number(standard)>0?Number(standard):current;
    const priceCondition=conditional?`No Pix: R$ ${current.toFixed(2).replace('.',',')}`:null;
    const original=Number(priceData.previous_price?.value);
    const picture=String(card.pictures?.pictures?.[0]?.id||'');
    const square=String(card.pictures?.square||p.polycardContext?.picture_square_default||'Q');
    const size=String(p.polycardContext?.picture_size_default||'AB');
    const imageUrl=`https://http2.mlstatic.com/D_${square}_NP_2X_${picture}-${size}.webp`;
    const cat=category(title);
    if(!/^MLB\d+$/.test(externalId)||!title||!Number.isFinite(price)||price<=0
      ||!/^\d+-ML[A-Z]\d+_\d+$/.test(picture)||! /^[A-Z]+$/.test(square)||! /^[A-Z]+$/.test(size)
      ||!productSafetyCheck(title,cat).allowed){skipped++;continue}
    if(seen.has(externalId)){skipped++;continue}seen.add(externalId);
    const shipping=String(components.find((c:any)=>c.type==='shipping')?.shipping?.text||'');
    const score=opportunityScore({price,original_price:original,free_shipping:/frete gr[aá]tis/i.test(shipping)}).score;
    products.push({externalId,title,category:cat,price,originalPrice:Number.isFinite(original)&&original>price?original:null,imageUrl,productUrl:affiliateUrl,score,priceCondition,
      notes:`Importado do HTML da lista do Mercado Livre. Preço do arquivo; confirmar disponibilidade. Destino de compra: lista de afiliado.${priceCondition?` ${priceCondition}.`:''}`});
  }
  const total=Number(p.totalItems);
  return {listName:String(p.listName||'Lista Mercado Livre').slice(0,150),affiliateUrl,totalItems:Number.isSafeInteger(total)&&total>=0?total:p.polycards.length,loadedItems:p.polycards.length,products,skipped};
}
