# Vitrine dos Achados — v3.3.0

## Mercado Livre integrado ao Garimpo
- Novo importador do Mercado Livre dentro do Garimpo Inteligente.
- Produtos retornados pela API entram em `product_candidates`, o mesmo fluxo usado pelo Autopiloto.
- Deduplicação por marketplace + `external_id` antes da fila e antes da oferta.
- Candidatos existentes são atualizados em vez de duplicados.
- Ofertas já publicadas são ignoradas pela importação.
- Score de oportunidade, segurança de catálogo e vendas não informadas preservados.
- Paginação simples pelo botão “Próxima”.
- Se o Mercado Livre responder 401/403 para busca geral, a interface informa a restrição sem criar dados fictícios.

## Fluxo
Mercado Livre → Garimpo → candidato → Aprovar/Autopiloto → Oferta publicada → Vitrine → Conteúdo/Criativos/Divulgação.

## Observação de validação
O ambiente de empacotamento não conseguiu instalar as dependências dentro do tempo disponível. Por isso o `npm run typecheck`/`npm run build` não pôde ser concluído localmente. O build da Vercel é a validação definitiva desta versão.
