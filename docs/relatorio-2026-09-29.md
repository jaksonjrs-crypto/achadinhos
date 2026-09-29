# Relatório de desenvolvimento — 29/09/2026

## Concluído nesta sessão
- Captura Shopee incorporada ao Autopiloto quando ele está habilitado, dentro do horário e abaixo do limite diário.
- Até 10 produtos consultados por execução, usando as credenciais oficiais já previstas pelo projeto.
- Novos candidatos aprovados automaticamente somente após filtros de qualidade, segurança, duplicidade e dados completos. Importação manual continua enviando para revisão.
- Falha da consulta Shopee não impede o processamento de candidatos previamente aprovados; o resultado registra o estado da captura.
- Timeout de 15 segundos para a consulta Shopee.
- Lockfile e exclusões de arquivos gerados adicionados para builds reproduzíveis.

## Validação
- Typecheck e build de produção concluídos com sucesso.
- Testes com API e banco simulados: aprovação automática, revisão manual, dados incompletos, qualidade insuficiente, produto bloqueado e duplicidade.
- Não foi feito teste real da API Shopee nem envio externo nesta sessão.

## Situação das integrações
- Telegram: controle de envio automático e foto com legenda já integrados em main antes desta sessão. Ativação e entrega real ainda precisam ser verificadas.
- Metricool: Facebook, Instagram, Pinterest e TikTok constam conectados. O código da plataforma ainda não tem integração Metricool; conexão da conta não comprova postagem automática.
- Mercado Livre: fora do caminho crítico deste lançamento.
- Cron atual do Autopiloto: uma vez por dia, às 12h de Brasília. Não representa publicações distribuídas durante o dia.

## Bloqueios e próximos passos
1. Acesso ao projeto e deploy Vercel confirmado sem enviar o escopo explicitamente. A consulta anterior com teamId retornava 403. Logs e fetch autenticado continuam indisponíveis nos testes realizados.
2. Confirmar deploy, variáveis Shopee, banco, segredo de cron e opções do Autopiloto em produção.
3. Testar Shopee → candidato → vitrine → fila → Telegram com oferta real.
4. Implementar integração da fila com Metricool e validar os canais individualmente.
5. Conferir preços e indisponibilidade antes de divulgar, revisar erros e confirmar recuperação de envios.

## Ativação
Alteração publicada e integrada em main pelo PR #4, commit de merge c5dcbd356fabedf0ca41717311e4b57534ab19d0. O build de preview da Vercel passou. Deploy de produção confirmado READY (dpl_F5MbHxkMTC7mkdMiP6KR4RTQTR1W), vinculado ao domínio público. Opções de execução diária e envio Telegram foram ativadas na etapa posterior descrita abaixo. Quando integrada e com Autopiloto habilitado, a próxima execução passa a capturar candidatos Shopee automaticamente. O envio Telegram continua condicionado à opção específica existente.

## Verificação posterior de produção
- Vercel confirmou a publicação do commit 3c75f685b3e98c1f09379581b4072d92dc5c99ea em produção.
- Consulta Metricool não encontrou posts agendados entre 29/09 e 01/10/2026.
- Painel administrativo exige sessão própria; o conector Vercel não forneceu acesso autenticado aos endpoints internos. Ainda não foram confirmadas as opções do Autopiloto ou a consulta real Shopee.
- A API HTTP do Metricool exige Advanced ou Custom, conforme https://help.metricool.com/mcp-vs-api-access-what-is-the-difference-5y3ib. O conector conversacional é distinto dessa API. O plano da conta ainda não foi confirmado.

## Ativação operacional desta sessão
- Login administrativo realizado pelo formulário seguro.
- Consulta real Shopee respondeu: 0 importados, 17 abaixo do corte, 3 duplicados e 0 bloqueados, no tema Casa.
- Diagnóstico confirmou bot autorizado a publicar no canal Vitrine dos Achados | Ofertas.
- Oferta Escama De Peixe Pano De Limpeza enviada uma vez pela API; painel confirmou publicação e fila Concluído.
- Autopiloto e envio Telegram ativados e salvos: score 80, máximo 3 ofertas/dia, horário permitido 9h–21h, repetição 7 dias. Próximo horário programado: 30/09/2026 às 12h de Brasília. Primeira execução automática ainda não verificada.
- Metricool pelo navegador ainda sem login. Usuário escolheu Facebook; revisão automática bloqueou a autenticação por solicitação ampla de permissões (publicação, mensagens, anúncios e gerenciamento de negócios). Necessária autorização específica ou escolha do usuário por login direto Metricool.

## Continuação — execução pelo painel
- Consulta Shopee real repetida com sucesso: 20 produtos, 17 abaixo do corte, 3 duplicados, 0 importados e 0 bloqueados.
- Bot Telegram confirmado autorizado pelo diagnóstico; quatro tarefas de envios anteriores aparecem concluídas.
- PR #5 integrado: botão Executar agora, sessão administrativa e verificação de origem, mesmas regras do cron e contadores do resultado. Typecheck, build e testes de proteção passaram. Novo botão verificado em produção.
- Teste real do novo botão bloqueado antes da execução pela revisão automática de aprovação: exige autorização específica para publicar ofertas na vitrine e enviar mensagens Telegram. Nenhuma execução disparada por esse clique.
- Facebook: apresentação corrigida e botão Saiba mais configurado para a vitrine.
- Pendente: teste completo do Autopiloto, confirmação do cron de 30/09 às 12h, integração e validação Metricool/redes, preços e disponibilidade e versão estável com rollback.

## Publicação real autorizada e teste de links
- Usuário autorizou uma publicação real e o teste dos links até a Shopee.
- Executar agora retornou: Shopee 1 novo candidato; vitrine 1 publicada; Telegram 1 enviada; 0 falhas de envio, 0 pendentes Telegram e 0 falhas de ofertas.
- Oferta 29: Parafusadeira Furadeira 25V Nakasaki Sem Fio a Bateria Profissional Kit Completo com Maleta, R$ 85,00 no momento da captura.
- Oferta visível na vitrine pública; tarefa Telegram confirmada CONCLUÍDO. Outros cinco canais permanecem PRONTO, sem publicação confirmada.
- Link Telegram /o/29?c=t e botão da vitrine /go/29?channel=vitrine chegaram à Shopee com destino product/728389176/58217601055 e parâmetros utm_medium=affiliates e utm_source=an_18321581244 preservados.
- A Shopee exibiu Login Necessário neste navegador. O nome da loja vendedora e a associação do identificador de afiliado à conta Vitrine dos Achados não foram confirmados; parâmetros presentes não comprovam comissão.
- Pendente: confirmar loja e conta de afiliado após autenticação Shopee, primeira execução pelo cron de 30/09 às 12h de Brasília e publicação automática dos outros canais.
