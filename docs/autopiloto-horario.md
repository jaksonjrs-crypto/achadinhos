# Autopiloto horário — 01/10/2026

Solicitação: iniciar às 8h de Brasília e consultar a Shopee a cada hora.

## Publicado
- PR #6 integrado: e064b64383eee1f45d8a0b415e3704768f5335a1.
- Deployment de produção dpl_Fo8ThRaPvnWLi5s1w7wTJmBU9XVC confirmado READY, com domínio www.minhavitrinedeachados.com.br.
- Workflow GitHub Actions na branch main: buscas das 8h05 às 20h05 de Brasília. GitHub pode atrasar execuções; não garante horário exato.
- Regra de produção conferida: ativado, Telegram automático, score 80, máximo 3 novas ofertas/dia, início 8h, fim 21h exclusivo, prevenção de repetição por 7 dias.
- Consulta Shopee continua após atingir o limite, sem novas publicações naquele dia.
- Cron diário do Autopiloto removido da Vercel. Atualização diária de catálogo preservada.

## Credenciais
O usuário informou que salvou a nova credencial na Vercel como CRON_SECRET de Production e no GitHub como AUTOPILOT_CRON_SECRET. Os valores não foram lidos, copiados ou registrados pelo assistente. O deploy de produção ocorreu depois dessa confirmação. A igualdade e autenticação entre serviços ainda dependem de uma execução real pelo GitHub.

## Teste real concluído pelo painel
Executar agora, na versão nova: Shopee importou 1 candidato; vitrine publicou 1 oferta; Telegram enviou 1 mensagem; 0 falhas de envio e 0 falhas de ofertas. Oferta #33: Percarbonato 100% Puro Tira Manchas Roupas Brancas e Coloridas. Fila confirmou Telegram de 01/10 como Concluído; os cinco outros canais dessa oferta estão Pronto. Isso verifica a rotina e envio Telegram, não autenticação do agendador GitHub.

## Agendamento ainda aguardando confirmação
GitHub exibiu o workflow Autopiloto Shopee por hora e 0 execuções. Navegador sem sessão autenticada impede workflow_dispatch por UI. Uma tentativa de acrescentar gatilho push para teste imediato foi rejeitada pela revisão automática por poder disparar publicações em produção; nenhuma alteração desse gatilho foi aplicada. Usou-se o botão existente do painel para o teste seguro, sem mudar permissões ou gerar novos gatilhos.

Confirmar a primeira execução do schedule, resultado HTTP autenticado, contadores e estado da fila antes de declarar a rotina horária validada. Não repetir envios com resposta inconclusiva.

## Evidências para operação definitiva
- Execução agendada Shopee → vitrine → Telegram com sucesso e limites respeitados.
- Ausência de erros e ofertas repetidas nas execuções seguintes.
- Cliques por canal e pedido/comissão no painel Shopee do afiliado 18321581244.
- Primeira venda ainda não confirmada; demais redes precisam de validação. Não declarar todas automatizadas.

## Validação de código
Typecheck e build passaram. Testes simulados confirmaram início às 8h, bloqueio antes das 8h e às 21h, busca após o limite sem novos envios e bloqueio de execuções simultâneas. YAML e sintaxe Python validados. Workflow sem checkout, sem permissões de escrita e sem execução em PRs; credencial somente no cabeçalho para o endpoint de produção, sem redirecionamentos, impressão de segredo ou retries.

Documentação:
https://vercel.com/docs/cron-jobs/usage-and-pricing
https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
