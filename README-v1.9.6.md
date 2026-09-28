# v1.9.6 — Redirecionamento invisível
- A rota curta `/o/<id>?c=w` não renderiza mais uma página intermediária para pessoas.
- Usuário recebe 302 no servidor para `/go`, que registra o clique e redireciona para o marketplace.
- Crawlers de prévia (WhatsApp/Meta e canais suportados) recebem somente HTML Open Graph com foto, título e preço.
- Mantidos links curtos e rastreamento por canal.
Sem SQL novo e sem novas variáveis de ambiente.
