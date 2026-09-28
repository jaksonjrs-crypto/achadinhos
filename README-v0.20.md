# v0.20 — Central de Integrações
- Configurações virou uma Central de Integrações.
- Novo endpoint `/api/integrations/status` verifica apenas presença de configuração no servidor.
- Nenhum valor de segredo, token, senha ou chave é devolvido ao navegador.
- Status de DATABASE_URL e TOKEN_ENCRYPTION_KEY.
- Prontidão Shopee reconhece nomes comuns de variáveis sem ativar um conector fictício.
- Mercado Livre preserva o OAuth existente e deixa claro que busca de produtos continua pendente.
- Filtro seguro do catálogo permanece ativo.
Sem SQL novo. Não é obrigatório adicionar novas variáveis de ambiente nesta versão.
