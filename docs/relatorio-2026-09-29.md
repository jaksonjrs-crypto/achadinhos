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
1. Restabelecer acesso Vercel: o conector retornou 403 para o escopo jaksonjrs-3292 e solicitou reautenticação nesse escopo.
2. Confirmar deploy, variáveis Shopee, banco, segredo de cron e opções do Autopiloto em produção.
3. Testar Shopee → candidato → vitrine → fila → Telegram com oferta real.
4. Implementar integração da fila com Metricool e validar os canais individualmente.
5. Conferir preços e indisponibilidade antes de divulgar, revisar erros e confirmar recuperação de envios.

## Ativação
Alteração publicada e integrada em main pelo PR #4, commit de merge c5dcbd356fabedf0ca41717311e4b57534ab19d0. O build de preview da Vercel passou. O deploy de produção ainda precisa ser confirmado. Nenhuma opção de produção foi ativada nesta sessão. Quando integrada e com Autopiloto habilitado, a próxima execução passa a capturar candidatos Shopee automaticamente. O envio Telegram continua condicionado à opção específica existente.
