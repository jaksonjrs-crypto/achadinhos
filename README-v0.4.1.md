# Vitrine dos Achados / Garimpo Afiliados v0.4.1

Atualização incremental da v0.4.

## Alterações
- Central com ações Publicar, Expirar e Destacar/Remover destaque.
- Correção de contraste da tabela administrativa.
- Dashboard atualizado para v0.4.1 e links da Central/Vitrine.
- Correção do registro de cliques para usar as colunas `channel`, `referrer` e `user_agent` já criadas na tabela `offer_clicks`.

## Banco de dados
Nenhum SQL novo é necessário se as tabelas `offers` e `offer_clicks` da v0.4 já foram criadas.

## Deploy
Mantenha as mesmas variáveis de ambiente já configuradas na Vercel. O registro de oferta já existente permanece no PostgreSQL/Neon.
