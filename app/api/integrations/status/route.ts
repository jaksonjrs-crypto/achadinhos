import { NextResponse } from "next/server";

export const dynamic="force-dynamic";

export async function GET(){
  const database=Boolean(process.env.DATABASE_URL?.trim());
  const encryption=Boolean(process.env.TOKEN_ENCRYPTION_KEY?.trim());

  const shopeeApp=Boolean(process.env.SHOPEE_APP_ID?.trim());
  const shopeeSecret=Boolean(process.env.SHOPEE_SECRET?.trim());
  const shopeeReady=shopeeApp&&shopeeSecret;

  return NextResponse.json({
    database:{configured:database},
    encryption:{configured:encryption},
    shopee:{
      configured:shopeeReady,
      appConfigured:shopeeApp,
      secretConfigured:shopeeSecret,
      liveConnector:shopeeReady,
      note:shopeeReady
        ?"Credenciais configuradas. Use o Garimpo para testar a consulta; a API pode responder com erro de permissão."
        :"Configure SHOPEE_APP_ID e SHOPEE_SECRET para consultar a API de afiliados."
    }
  },{headers:{"Cache-Control":"no-store"}});
}
