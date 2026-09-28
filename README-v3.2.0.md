# Vitrine dos Achados v3.2.0 — Autopiloto

## Principais mudanças
- Aprovação de candidato completo agora cria/atualiza e publica a oferta automaticamente.
- Oferta publicada fica imediatamente disponível para Vitrine, Conteúdo, Criativos, links rastreados e Divulgação.
- Candidatos incompletos permanecem como pendência para intervenção humana.
- Deduplicação pública reforçada por product_id, external_id, link normalizado e título normalizado.
- Painel Operacional ganhou status do Autopiloto e foco em pendências/exceções.
- Central de Ofertas passa a ser catálogo/correção/exceção, não uma etapa obrigatória do fluxo.
- Manifesto PWA adicionado para experiência instalável/standalone no celular.
- Administração recebeu uma camada global mais compacta e consistente.

## Banco de dados
Esta versão não exige nova migração além da v3.1.2 já aplicada.

## Observação sobre notificações
A arquitetura visual e de pendências está preparada para a próxima etapa de alertas. Envio automático por WhatsApp depende de integração oficial/credenciais e não foi simulado nesta versão.
