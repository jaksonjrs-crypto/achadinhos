# Vitrine dos Achados v3.3.8 — Garimpo manual seguro

- A rota antiga de importação do Mercado Livre responde 409 e não grava candidatos enquanto a API de anúncios de terceiros retornar 403. O bloqueio vale também para chamadas diretas, independentemente do botão desativado.
- O avaliador manual permite escolher Shopee, Mercado Livre, Amazon ou Outro; o candidato deixa de ser salvo automaticamente como Shopee.
- O campo de link explica que, após a aprovação de um candidato completo, esse endereço será usado na Vitrine. Recomenda usar o link de afiliado quando disponível.
- Sem alterações no banco, OAuth, tokens, Vitrine ou Autopiloto.

Verificação: `npm run typecheck` e `npm run build`.
