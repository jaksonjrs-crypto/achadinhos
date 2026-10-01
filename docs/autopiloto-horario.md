# Autopiloto horário — 01/10/2026

Solicitação: iniciar às 8h de Brasília e consultar a Shopee a cada hora.

## Alteração preparada
- Cron a cada hora em UTC; a rotina aplica a janela de Brasília salva no painel.
- Início padrão de novas configurações: 8h. Para a configuração existente, salvar Início = 8 no painel administrativo; o padrão SQL não altera o registro atual.
- Fim atual: 21h, exclusivo (última busca às 20h).
- Manter máximo de 3 novas publicações/dia e prevenção de repetição por 7 dias.
- Continuar consultando candidatos após atingir o limite de publicações, sem enviar mais ofertas naquele dia.
- Trava de concorrência e autenticação do cron preservadas.

## Validação
Typecheck e build passaram. Testes simulados confirmaram início às 8h, bloqueio antes das 8h e às 21h, busca após o limite sem novos envios e bloqueio de execuções simultâneas.

## Ativação pendente
Confirmar plano da Vercel antes de integrar: Hobby rejeita cron horário; Pro/Enterprise permitem. Não aplicar em main se o deploy da Vercel rejeitar a frequência. Alternativa: agendador externo autenticado com o segredo do cron, ainda sem configuração.

Sessão administrativa expirou no navegador usado nesta sessão. Horário existente ainda não foi alterado no banco. Não declarar rotina horária em produção até confirmar deploy e salvar a regra.

Documentação: https://vercel.com/docs/cron-jobs/usage-and-pricing
