// Configuration only: API reachability and successful posts require separate checks.
export function integrationStatus() {
  const present = (...keys: string[]) => keys.every(key => Boolean(process.env[key]?.trim()));
  const shopeeApp = present("SHOPEE_APP_ID");
  const shopeeSecret = present("SHOPEE_SECRET");
  const shopeeReady = shopeeApp && shopeeSecret;
  return {
    database: { configured: present("DATABASE_URL") },
    encryption: { configured: present("TOKEN_ENCRYPTION_KEY") },
    shopee: {
      configured: shopeeReady, appConfigured: shopeeApp, secretConfigured: shopeeSecret,
      liveConnector: shopeeReady,
      note: shopeeReady
        ? "Credenciais configuradas. Use o Garimpo para consultar ofertas; a resposta da API confirma o acesso."
        : "Cadastre as credenciais da Shopee para consultar a API de afiliados."
    },
    instagram: { configured: present("INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID") },
    facebook: { configured: present("FACEBOOK_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ID") },
    telegram: { configured: present("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID") },
    pinterest: { configured: present("PINTEREST_APP_ID", "PINTEREST_APP_SECRET", "PINTEREST_REDIRECT_URI") }
  };
}
