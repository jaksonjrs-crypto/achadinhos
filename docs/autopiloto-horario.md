# Autopiloto horário — 01/10/2026

Solicitação: iniciar às 8h de Brasília e consultar a Shopee a cada hora.

## Alteração preparada
- GitHub Actions a cada hora, das 8h05 às 20h05 de Brasília; a rotina também aplica a janela salva no painel. O GitHub pode atrasar execuções sob carga; não garante horário exato.
- Início padrão de novas configurações: 8h. Para a configuração existente, salvar Início = 8 no painel administrativo; o padrão SQL não altera o registro atual.
- Fim atual: 21h, exclusivo (última busca às 20h).
- Manter máximo de 3 novas publicações/dia e prevenção de repetição por 7 dias.
- Continuar consultando candidatos após atingir o limite de publicações, sem enviar mais ofertas naquele dia.
- Trava de concorrência e autenticação do cron preservadas.

## Validação
Typecheck e build passaram. Testes simulados confirmaram início às 8h, bloqueio antes das 8h e às 21h, busca após o limite sem novos envios e bloqueio de execuções simultâneas.

## Ativação pendente
Vercel confirmou plano Hobby e rejeitou a versão com cron horário antes do deploy. A alternativa usa GitHub Actions com o secret de repositório AUTOPILOT_CRON_SECRET, cujo valor deve corresponder ao CRON_SECRET da Vercel. Obter autorização específica antes de transmitir esse segredo ao GitHub. Não integrar até configurar o segredo e salvar Início=8 no painel. Ao integrar, a Vercel mantém apenas a atualização diária de catálogo; o Actions passa a disparar o Autopiloto.

O workflow não acessa o conteúdo do repositório nem recebe permissões de escrita; não roda em pull requests. A credencial é enviada somente ao endpoint de produção, sem seguir redirecionamentos, sem imprimir o segredo e sem repetir requisições inconclusivas.

Validar primeiro com workflow_dispatch, conferir fila e Telegram e então confirmar uma execução agendada. Em repositórios públicos, o GitHub desativa schedules após 60 dias sem atividade.

Sessão administrativa expirou no navegador usado nesta sessão. Horário existente ainda não foi alterado no banco. Não declarar rotina horária em produção até confirmar deploy e salvar a regra.

Documentação: https://vercel.com/docs/cron-jobs/usage-and-pricing
https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
