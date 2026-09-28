# v0.19 — Preparação segura para importação
- Camada central de segurança de catálogo em `lib/product-safety.ts`.
- Bloqueio aplicado ao cadastro de candidatos e ao cadastro manual de ofertas.
- Categorias incompatíveis com o projeto não entram no funil.
- Garimpo mostra o filtro como ativo.
- Estrutura pronta para reutilizar o mesmo filtro quando a importação Shopee for conectada.
- A Shopee Open API NÃO foi ativada: não há credenciais confirmadas e a documentação oficial não pôde ser verificada nesta etapa.
Sem SQL novo e sem novas variáveis de ambiente.
