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

## Revisão das redes em 01/10
- Usuário confirmou que recebeu corretamente a oferta #33 no Telegram.
- Diagnóstico real Verificar APIs: Pinterest não configurado; Telegram autorizado a publicar no canal Vitrine dos Achados | Ofertas. Não há evidência de aprovação ou reprovação da API própria Pinterest.
- Portal Pinterest My apps redirecionou para account-setup sem sessão autenticada. Aprovação da aplicação não pôde ser consultada.
- Metricool getBrandSettings: marca 7152643 tem Facebook, Instagram minhavitrinedosachados, Pinterest jack_vitrine_dos_achados e TikTok Vitrine dos Achados conectados; isso não comprova publicação em todos os canais.
- getScheduledPosts retornou publicação de apresentação de 30/09 com Facebook PUBLISHED, detailedStatus Published e URL pública https://facebook.com/122099963373493651/posts/122100866265493651. Confirmação do provedor; publicação não foi inspecionada no Facebook nesta revisão.
- API própria Pinterest Trial cria Pins visíveis apenas ao criador; Standard é necessário para validar publicação pública pela aplicação.
- Caminho proposto para acelerar: validar Pins e imagens por Metricool; avaliar feed RSS das ofertas públicas para autolistas, com IDs estáveis, link rastreado por canal, imagens Open Graph corretas e repetição desligada. Feed não existe no código atual e autolista não foi configurada. Confirmar recursos/limites do plano, publicar teste e reconciliar fila antes de declarar operação automática.
- API HTTP Metricool requer Advanced/Custom; conector conversacional disponível em qualquer plano. Nenhuma compra ou assinatura solicitada.
- Compartilhamento direto da Shopee facilita ação manual; não foi identificado agendamento autônomo nesse botão. Parcerias Meta/Shopee com marcação de produto são outro recurso: Instagram exige elegibilidade, incluindo conta profissional pública e ao menos 1.000 seguidores conforme documentação consultada. Elegibilidade da conta não verificada.
- Próximos passos: confirmar acesso Pinterest ou validar via Metricool; testar publicação pública por canal; implementar alimentação automática e confirmar cliques. TikTok depende de criativo compatível; WhatsApp continua manual na plataforma.

Referências:
https://developers.pinterest.com/docs/key-concepts/access-tiers/
https://help.metricool.com/how-to-link-an-rss-feed-to-an-autolist-ank6m
https://help.metricool.com/mcp-vs-api-access-what-is-the-difference-5y3ib
https://help.shopee.com.br/portal/10/article/223917-Entenda-como-funciona-a-Parceria-com-Afiliados-do-Instagram?previousPage=secondary+category
