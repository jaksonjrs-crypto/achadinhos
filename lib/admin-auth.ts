export const ADMIN_COOKIE="vda_admin_session";
const encoder=new TextEncoder();
function hex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,"0")).join("")}
async function hmac(value:string){
  const secret=process.env.ADMIN_SESSION_SECRET?.trim();
  if(!secret) return "";
  const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",key,encoder.encode(value)));
}
export async function createAdminSession(){
  const exp=Date.now()+1000*60*60*12;
  return `${exp}.${await hmac(String(exp))}`;
}
export async function verifyAdminSession(token?:string|null){
  if(!token) return false;
  const [expRaw,sig]=token.split(".");
  const exp=Number(expRaw);
  if(!exp||!sig||Date.now()>exp) return false;
  const expected=await hmac(expRaw);
  if(!expected||expected.length!==sig.length) return false;
  let diff=0; for(let i=0;i<expected.length;i++) diff|=expected.charCodeAt(i)^sig.charCodeAt(i);
  return diff===0;
}
