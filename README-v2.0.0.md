# Vitrine dos Achados v2.0.0 — Produção

Versão congelada para operação comercial do MVP.

## Fluxo validado
Vitrine pública → compartilhamento → prévia do WhatsApp → link curto → rastreamento interno → marketplace → Resultados.

## Operação atual
- Cadastro/garimpo manual de produtos.
- Publicação na Vitrine.
- Links curtos rastreados por canal.
- WhatsApp com prévia rica e redirecionamento invisível.
- Central de Conteúdo e Central de Divulgação.
- Criativos Feed/Story.
- Painel de Resultados com cliques por canal.
- Filtros de segurança de produtos.

## Integrações externas
A Shopee continua em modo manual até que o acesso oficial à API esteja disponível. A ausência dessa API não bloqueia a operação atual.

## Deploy
Variáveis já utilizadas pelo projeto:
- DATABASE_URL
- TOKEN_ENCRYPTION_KEY

Esta versão não adiciona SQL manual nem novas variáveis de ambiente.

## Smoke test após deploy
1. Abrir a Vitrine e confirmar ofertas publicadas.
2. Compartilhar uma oferta pelo WhatsApp.
3. Confirmar foto/título/preço na prévia.
4. Tocar no link e confirmar redirecionamento sem tela intermediária.
5. Confirmar abertura da oferta correta no marketplace.
6. Abrir Resultados e confirmar o novo clique no canal correto.

## Congelamento
Não adicionar novas funcionalidades antes da operação inicial, salvo correções de defeitos que bloqueiem publicação, compartilhamento, rastreamento ou redirecionamento.
