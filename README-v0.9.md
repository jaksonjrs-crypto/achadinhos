# Vitrine dos Achados v0.9

Fila persistente de candidatos do Garimpo Inteligente.

Antes do deploy, execute no Neon somente o conteúdo de:
`db/v0.9-product-candidates.sql`

É uma única instrução CREATE TABLE.

Depois:
- Avalie um produto.
- Clique em Salvar candidato.
- O candidato fica persistido no PostgreSQL.
- Pode ser aprovado ou rejeitado.
- A fila será a entrada do futuro importador da Shopee.

Nenhuma variável de ambiente nova.
