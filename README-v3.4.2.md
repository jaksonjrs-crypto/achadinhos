# v3.4.2 — teste reversível da fila

- Divulgação permite remover itens ainda sem tentativa de envio nos estados pronto, agendado ou ignorado.
- Itens concluídos, em envio ou com tentativa de API permanecem no histórico para evitar perda de auditoria e repetição incerta.
- Fluxo para verificar a fila: adicionar uma oferta, tentar a mesma combinação de oferta, canal e dia, ignorar ou reabrir, e remover o item de teste.
