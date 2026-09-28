# Vitrine dos Achados v3.1.2

## Objetivo
Transformar o fluxo em catálogo persistente: o produto é identificado por marketplace + ID externo, entra uma vez e depois é atualizado, sem voltar ao Garimpo como duplicado.

## O que mudou
- Garimpo virou caixa de entrada: publicados saem da fila e ficam recolhidos no histórico.
- Cadastro/avaliador manual fica recolhido e secundário.
- Shopee importa `itemId` e vendas como dado opcional; ausência de vendas não vira zero.
- Deduplicação por marketplace + ID externo.
- Ao criar oferta, o produto passa para o catálogo persistente e ganha histórico de preço.
- Central tem `Atualizar preços agora`.
- Cron diário consulta produtos vinculados e atualiza preço, imagem e link quando a Shopee os devolve.
- Home prioriza destaque, score, desconto e atualização — produto antigo pode voltar ao topo com nova promoção.
- Categorias do Garimpo passam para a Vitrine (Casa, Eletrônicos, Infantil, Beleza etc.).
- Administrativo global mais compacto; WhatsApp usa botões com o mesmo padrão visual.

## Migração obrigatória (uma vez)
Execute `db/v3.1.2-catalog-sync.sql` no banco antes de testar a nova importação.

## Variável nova na Vercel
Crie `CRON_SECRET` com uma chave longa e aleatória. O cron diário roda às 06:17 UTC (aprox. 03:17 no horário de Brasília quando UTC-3).

## Observação sobre sincronização
A atualização automática só é aplicada a ofertas com `external_id` confiável. Ofertas antigas sem vínculo continuam funcionando e aparecem como `precisa vincular`; não inventamos o vínculo.
