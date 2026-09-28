# Garimpo Afiliados v0.3

## O que mudou
- Persistência PostgreSQL/Neon da conexão Mercado Livre.
- Access token e refresh token criptografados com AES-256-GCM.
- Renovação automática do token.
- Status real da conexão em `/settings`.
- Busca de produtos em `/products`.
- Score de oportunidade.
- Persistência de produtos e histórico de preço.
- Filtro de categorias inadequadas/restritas.
- Webhook continua respondendo 200 rapidamente.

## Publicação na Vercel
1. Substitua os arquivos da v0.2 pelos desta versão.
2. Na Vercel, adicione um Postgres via Marketplace (Neon é uma opção nativa).
3. Confirme que `DATABASE_URL` foi injetada no projeto.
4. No console SQL do banco, execute `db/schema.sql`.
5. Gere uma chave de 32 bytes em Base64 e salve como `TOKEN_ENCRYPTION_KEY` na Vercel.
   Exemplo local: `openssl rand -base64 32`
6. Preserve as variáveis já existentes do Mercado Livre.
7. Faça Redeploy.
8. Como a v0.2 não persistia os tokens, conecte o Mercado Livre novamente uma vez.
9. Teste `/settings` e depois `/products`.

## Segurança
Nunca use `NEXT_PUBLIC_` em Client Secret, access token, refresh token ou TOKEN_ENCRYPTION_KEY.
Nunca registre tokens em logs.

## Observação sobre afiliados
Esta versão usa o `permalink` oficial do item. Conversão/geração de link com tracking de afiliado deve ser implementada somente quando houver um mecanismo oficial/documentado e disponível para a conta. Não há transformação inventada de URL.

## v3.2.6 — fechamento do acabamento mobile
- Nomes de produtos compactados no seletor e preview do Gerador de Criativos.
- Mesma regra de nome curto aplicada à Central de Conteúdo e textos sociais.
- Título original permanece intacto no catálogo/banco; alteração é apenas visual/de divulgação.
