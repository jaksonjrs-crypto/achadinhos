# Vitrine dos Achados v0.12
O candidato agora guarda categoria e preço anterior. Esses dados seguem automaticamente para a oferta, eliminando o valor fixo `Casa` e permitindo desconto real nos criativos.

## SQL (executar uma vez no Neon)
ALTER TABLE product_candidates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Casa', ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2);

Nenhuma variável de ambiente nova.
