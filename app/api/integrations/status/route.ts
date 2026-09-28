import { NextResponse } from "next/server";

export const dynamic="force-dynamic";

function anyEnv(names:string[]){return names.some(name=>Boolean(process.env[name]?.trim()));}
function allEnv(names:string[]){return names.every(name=>Boolean(process.env[name]?.trim()));}

export async function GET(){
  const database=Boolean(process.env.DATABASE_URL?.trim());
  const encryption=Boolean(process.env.TOKEN_ENCRYPTION_KEY?.trim());

  // Support common names without assuming the final Shopee credential schema.
  const shopeeApp=anyEnv(["SHOPEE_APP_ID","SHOPEE_PARTNER_ID"]);
  const shopeeSecret=anyEnv(["SHOPEE_APP_SECRET","SHOPEE_PARTNER_KEY","SHOPEE_SECRET"]);
  const shopeeReady=shopeeApp&&shopeeSecret;

  return NextResponse.json({
    database:{configured:database},
    encryption:{configured:encryption},
    shopee:{
      configured:shopeeReady,
      appConfigured:shopeeApp,
      secretConfigured:shopeeSecret,
      liveConnector:false,
      note:shopeeReady
        ?"Credenciais detectadas no servidor. O conector ao vivo continua desativado até validação da documentação oficial e autenticação."
        :"Credenciais da Shopee ainda não foram detectadas no servidor."
    }
  },{headers:{"Cache-Control":"no-store"}});
}
