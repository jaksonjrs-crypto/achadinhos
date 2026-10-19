// A short-code prefix does not establish affiliate ownership or commission.
export const REVIEW_PREFIXES = ['6VOl','9zyd','4VdX','20nl','8ATO','4VdK'];
export function isShopeeUrl(value:string){
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
    ['shopee.com.br','www.shopee.com.br','s.shopee.com.br','br.shp.ee','shope.ee'].includes(u.hostname)}catch{return false}
}
export function needsLinkReview(value:string){
  try{const u=new URL(value);return u.hostname==='s.shopee.com.br'&&REVIEW_PREFIXES.some(p=>u.pathname.slice(1).startsWith(p))}catch{return false}
}
export function productIdentity(value:string):{shopId:string;itemId:string}|null{
  if(!isShopeeUrl(value))return null;
  const u=new URL(value);
  if(!['shopee.com.br','www.shopee.com.br'].includes(u.hostname))return null;
  const m=u.pathname.match(/(?:-i\.|\/(?:product|opaanlp)\/)([1-9]\d*)[./]([1-9]\d*)(?:\/|$)/);
  return m?{shopId:m[1],itemId:m[2]}:null;
}
export function numericItemId(value:string){return /^[1-9]\d{0,18}$/.test(value)&&BigInt(value)<=BigInt("9223372036854775807")}
export function canonicalProductUrl(p:{itemId?:unknown;shopId?:unknown;productLink?:unknown}){
  const fromLink=productIdentity(String(p.productLink||''));
  const itemId=String(p.itemId||''),shopId=String(p.shopId||fromLink?.shopId||'');
  if(!numericItemId(itemId)||!numericItemId(shopId)||(fromLink&&fromLink.itemId!==itemId))throw Error('Identificação Shopee incompleta ou divergente.');
  return `https://shopee.com.br/product/${shopId}/${itemId}`;
}
