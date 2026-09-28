# Vitrine dos Achados v0.9.2

Correções do fluxo Candidato → Oferta:
- Campo `URL da imagem` no Avaliador de Candidatos.
- A imagem fica salva em `product_candidates`.
- Ao criar a oferta, a imagem é transferida para `offers.image_url`.
- Após conversão bem-sucedida, o candidato é removido de `Candidatos salvos`.
- A oferta continua sendo criada como Rascunho para revisão.

Antes do deploy execute, como uma única instrução no Neon:
ALTER TABLE product_candidates ADD COLUMN IF NOT EXISTS image_url TEXT;

Nenhuma variável de ambiente nova.
