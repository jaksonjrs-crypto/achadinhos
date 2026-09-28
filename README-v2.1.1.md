# v2.1.1 — Correção de build Shopee

Corrige o uso do retorno de `productSafetyCheck`: a função retorna `{ allowed, matches }`, portanto a integração Shopee agora filtra por `.allowed`.

Mantém a integração server-side da v2.1.0 e não adiciona SQL nem variáveis de ambiente.
