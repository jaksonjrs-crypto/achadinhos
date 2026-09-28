# Vitrine dos Achados v3.3.7 — Auditoria segura Mercado Livre

## Alterações
- Adiciona ao Diagnóstico Mercado Livre o teste **Aplicação e permissões**.
- Consulta a aplicação conectada e os grants usando o OAuth já armazenado.
- Exibe apenas dados não secretos: status, certificação, scopes e quantidade de grants.
- Detecta scopes `urn:mp:` para a exigência de separação Mercado Livre / Mercado Pago vigente desde 30/08/2026.
- Não altera aplicação, permissões, tokens, produtos ou ofertas.
- Mantém os testes anteriores de catálogo, item e vendedor.

## Banco de dados
Nenhuma migration necessária.
