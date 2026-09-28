# v1.9.2 — WhatsApp + rastreamento
- WhatsApp passa a compartilhar `/oferta/<id>` com Open Graph da imagem, título e preço.
- Ao tocar na prévia, o navegador passa automaticamente por `/go/<id>` e segue para o marketplace.
- O clique continua identificado como `whatsapp`.
- Rastreamento agora aceita tanto o schema moderno (`channel`, `created_at`) quanto o schema legado v0.4 (`source`, `clicked_at`).
- Resultados também faz fallback automático entre os dois schemas.
- Falhas continuam registradas nos logs.
Sem SQL novo e sem novas variáveis de ambiente.
