# Vitrine dos Achados v3.4.0 — fila de Divulgação e regras do Autopiloto

## Garimpo
- Mercado Livre: mantém importação bloqueada no servidor enquanto anúncios de terceiros retornam 403; diagnóstico permanece disponível.
- Shopee: respeita a unicidade do ID externo mesmo em requisições concorrentes. O estado do conector reflete as credenciais realmente usadas (`SHOPEE_APP_ID` e `SHOPEE_SECRET`).
- Cadastro manual: verifica candidatos ativos e ofertas publicadas do mesmo marketplace por link ou título antes de criar duplicatas.

## Divulgação
- Fila persistente por oferta, canal e dia, com estados pronto, agendado, enviando, concluído, falhou e ignorado.
- Pinterest: publicação pela API oficial com pasta selecionada, quando OAuth estiver conectado.
- Telegram: publicação pelo Bot API quando `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` estiverem configurados. O teste de canais usa chamadas de leitura e não envia mensagens.
- Instagram, Facebook, WhatsApp e TikTok: preparo assistido, links rastreados e registro manual. A publicação por API depende de contas, tokens, escopos e aprovações próprios de cada plataforma.
- O envio só ocorre por ação explícita na fila. Um resultado incerto permanece em estado “enviando” para evitar repetição automática.

## Autopiloto de ofertas
- Configuração persistente: ligado/desligado, score mínimo, limite diário, horário de Brasília e intervalo para evitar repetição.
- Desligado por padrão. Quando ativado, um cron diário às 15h UTC (por volta de 12h em Brasília) avalia candidatos já aprovados e completos. Requer `CRON_SECRET` na Vercel.
- Não publica em redes sociais; isso é controlado na fila.

## Banco e rollback
- As tabelas `publication_tasks` e `autopilot_policy` são criadas de forma idempotente na primeira chamada autenticada/cron. Os scripts equivalentes estão em `db/v3.4-*.sql`.
- Antes de operar com dados reais, conferir permissões de criação de tabelas do usuário `DATABASE_URL` e executar o fluxo autenticado completo.
- Rollback de código: commit anterior da v3.3.8 (`43d0c178e6b141bc7424894b70aa61d979971ba0`), por redeploy na Vercel. As tabelas novas podem permanecer sem afetar a versão anterior.
- Backup de banco deve ser feito no provedor PostgreSQL antes de migrações destrutivas; esta versão não executa migrações destrutivas.
