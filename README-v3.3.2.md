# Vitrine dos Achados v3.3.2 — Mercado Livre

- `/items/bulk` passa a ser enriquecimento opcional, não requisito para aceitar a oferta.
- Usa `buy_box_winner` oficial do produto de catálogo como fonte do item vencedor, preço, estoque e frete.
- Usa o permalink oficial do produto de catálogo como fallback.
- Mantém deduplicação, score, fila de revisão e Autopiloto.
- Não cria dados fictícios quando não existe `buy_box_winner`.
