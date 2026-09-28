# v3.3.5 — Mercado Livre: diagnóstico consolidado

- Corrige o extrator de URLs do diagnóstico para priorizar `item_id:MLB...` sobre o ID de produto de catálogo `/p/MLB...`.
- Mantém entrada direta por código `MLB...`.
- Evita apresentar o catálogo → Buy Box como garimpo operacional enquanto a descoberta de ofertas de terceiros não está disponível para esta aplicação.
- Exibe no Garimpo Inteligente o estado real da integração: OAuth ativo, catálogo acessível e ofertas de terceiros bloqueadas nos testes atuais.
- Mantém os três testes de diagnóstico para revalidação futura, sem alterar OAuth, tokens, produtos ou ofertas.
- Nenhuma alteração de banco de dados ou migration.
- Base de rollback: v3.3.4.
