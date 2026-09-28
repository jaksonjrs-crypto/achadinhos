# v1.9.3 — Homologação de compartilhamento e cliques
- WhatsApp com texto curto, título resumido, preço, “Link promocional” e aviso “Promoção sujeita a alteração a qualquer momento”.
- URL de compartilhamento reduzida para `/o/<id>?c=w`.
- A rota curta mantém Open Graph para tentar exibir foto/título na prévia do WhatsApp.
- Rastreamento normaliza automaticamente as colunas canônicas `channel`, `referrer` e `created_at` antes de gravar o clique.
- `/api/tracking` informa somente estado técnico, quantidade de cliques, colunas e último clique; não expõe segredos, user-agent ou referrer.
- O redirecionamento continua funcionando mesmo se o registro do clique falhar.
Sem novas variáveis de ambiente.
