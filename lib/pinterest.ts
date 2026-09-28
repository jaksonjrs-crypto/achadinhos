import { db } from "./db";
import { decryptSecret, encryptSecret } from "./crypto";

const API="https://api.pinterest.com/v5";
const OAUTH="https://www.pinterest.com/oauth/";

type TokenResponse={
  access_token:string; refresh_token?:string; token_type?:string;
  expires_in?:number; refresh_token_expires_in?:number; scope?:string;
};

function creds(){
  const clientId=process.env.PINTEREST_APP_ID?.trim();
  const clientSecret=process.env.PINTEREST_APP_SECRET?.trim();
  const redirectUri=process.env.PINTEREST_REDIRECT_URI?.trim();
  if(!clientId||!clientSecret||!redirectUri) throw new Error("Credenciais Pinterest incompletas.");
  return {clientId,clientSecret,redirectUri};
}

export function authorizationUrl(state:string){
  const {clientId,redirectUri}=creds();
  const u=new URL(OAUTH);
  u.searchParams.set("client_id",clientId);
  u.searchParams.set("redirect_uri",redirectUri);
  u.searchParams.set("response_type","code");
  u.searchParams.set("scope","boards:read,pins:read,pins:write");
  u.searchParams.set("state",state);
  return u.toString();
}

async function tokenRequest(body:URLSearchParams){
  const {clientId,clientSecret}=creds();
  const basic=Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const r=await fetch(`${API}/oauth/token`,{
    method:"POST",
    headers:{Authorization:`Basic ${basic}`,"Content-Type":"application/x-www-form-urlencoded"},
    body,cache:"no-store"
  });
  const data=await r.json();
  if(!r.ok) throw new Error(data?.message||data?.error||"Falha na autenticação Pinterest.");
  return data as TokenResponse;
}

export async function exchangeCode(code:string){
  const {redirectUri}=creds();
  return tokenRequest(new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:redirectUri}));
}

async function userAccount(accessToken:string){
  const r=await fetch(`${API}/user_account`,{headers:{Authorization:`Bearer ${accessToken}`},cache:"no-store"});
  const data=await r.json();
  if(!r.ok) throw new Error(data?.message||"Não foi possível identificar a conta Pinterest.");
  return data as any;
}

export async function saveConnection(t:TokenResponse){
  const account=await userAccount(t.access_token);
  const external=String(account.id||account.username||"pinterest-account");
  const expiresAt=new Date(Date.now()+Math.max(60,(t.expires_in||2592000)-120)*1000);
  const sql=db();
  await sql`
    INSERT INTO marketplace_connections
      (marketplace,external_user_id,access_token_enc,refresh_token_enc,token_type,expires_at,scopes,updated_at)
    VALUES
      ('pinterest',${external},${encryptSecret(t.access_token)},
       ${t.refresh_token?encryptSecret(t.refresh_token):null},${t.token_type||"bearer"},
       ${expiresAt.toISOString()},${t.scope||null},NOW())
    ON CONFLICT (marketplace,external_user_id)
    DO UPDATE SET access_token_enc=EXCLUDED.access_token_enc,
      refresh_token_enc=COALESCE(EXCLUDED.refresh_token_enc,marketplace_connections.refresh_token_enc),
      token_type=EXCLUDED.token_type,expires_at=EXCLUDED.expires_at,
      scopes=EXCLUDED.scopes,updated_at=NOW()
  `;
  return account;
}

async function latest(){
  const sql=db();
  const rows=await sql`SELECT * FROM marketplace_connections WHERE marketplace='pinterest' ORDER BY updated_at DESC LIMIT 1`;
  return rows[0] as any;
}

async function refresh(row:any){
  if(!row?.refresh_token_enc) throw new Error("Refresh token Pinterest indisponível. Reconecte a conta.");
  const t=await tokenRequest(new URLSearchParams({
    grant_type:"refresh_token",refresh_token:decryptSecret(row.refresh_token_enc)
  }));
  await saveConnection(t);
  return t.access_token;
}

export async function accessToken(){
  const row=await latest();
  if(!row) throw new Error("Pinterest ainda não conectado.");
  if(row.expires_at && new Date(row.expires_at).getTime()>Date.now()+120000) return decryptSecret(row.access_token_enc);
  return refresh(row);
}

export async function pinterestFetch(path:string,init:RequestInit={}){
  let token=await accessToken();
  let r=await fetch(`${API}${path}`,{...init,headers:{...(init.headers||{}),Authorization:`Bearer ${token}`},cache:"no-store"});
  if(r.status===401){
    token=await refresh(await latest());
    r=await fetch(`${API}${path}`,{...init,headers:{...(init.headers||{}),Authorization:`Bearer ${token}`},cache:"no-store"});
  }
  return r;
}

export async function connectionStatus(){
  try{
    const row=await latest();
    return row?{connected:true,scopes:row.scopes||"",updated_at:row.updated_at}:{connected:false};
  }catch{return {connected:false};}
}
