# v3.3.1 — Mercado Livre catálogo + buy box

- Substitui a busca geral restrita `/sites/MLB/search?q=` por `/products/search`.
- Resolve detalhes do produto de catálogo e o `buy_box_winner`.
- Enriquece os itens vencedores via `/items/bulk?ids=` (endpoint novo de 2026).
- Só cria candidato quando existe uma oferta ativa/comprável com URL.
- Mantém score, segurança, deduplicação e fila do Garimpo/Autopiloto.
- Não cria dados simulados quando a API recusa acesso.
