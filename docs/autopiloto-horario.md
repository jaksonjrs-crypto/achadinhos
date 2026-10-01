# Piloto da Vitrine dos Achados — 01/10/2026

## Resultado
Rotina horária em produção. Telegram recebido pelo usuário. Facebook, Instagram e Pinterest tiveram publicações reais confirmadas pelo provedor via Metricool. Autolistas RSS semanais ativadas. Ainda falta observar o próximo ciclo com oferta nova entrando pelo feed e sendo publicada em cada rede. Primeira venda não confirmada.

## Shopee → vitrine → Telegram
- GitHub Actions busca às 08h05–20h05 de Brasília, a cada hora; GitHub pode atrasar execuções.
- Primeira execução schedule: 01/10 às 10h26, run 36868628784, job 110390352057, sucesso em 12 segundos.
- Resultado: ran=true, discovery_ok=true, imported=0, published=0, telegramSent=0, failed=0, telegramFailed=0, remaining=2.
- Sem oferta nova nessa execução: nenhuma mensagem Telegram adicional era esperada.
- Autenticação GitHub → Vercel validada; nenhum segredo registrado.
- Teste anterior pelo painel: oferta #33 Percarbonato, 1 importação, 1 publicação na vitrine, 1 envio Telegram, 0 falhas. Usuário confirmou recebimento.
- Política: habilitado, Telegram automático, score mínimo 80, até 3 ofertas/dia, janela 08h–21h, prevenção de repetição por 7 dias.
- Consulta continua após atingir limite; catálogo diário preservado.

## Metricool
Fuso America/Sao_Paulo. Plano observado: 20 publicações/mês. Nenhuma assinatura comprada.

| Rede | Cadência |
|---|---|
| Instagram | Quarta às 12h |
| Pinterest | Quinta às 10h45, quadro Vitrine dos Achados |
| Facebook | Sexta às 12h |

- Três autolistas ativadas, repetição desligada; Instagram com publicação automática ligada.
- Feed por canal: /ofertas/feed?channel=facebook, instagram ou pinterest.
- No máximo 1 oferta por semana/rede: a mais recente elegível publicada antes das 08h do dia da rede e dentro da semana anterior. Sem oferta elegível, não há item novo.
- Seleção congelada por semana evita fila crescente de promoções antigas; GUID estável por oferta/canal.
- Somente ofertas públicas, com preço válido e imagem HTTPS; sem credenciais ou URL privada de afiliado no XML.
- Texto inclui produto, preço, aviso de alteração e indicação de comissão. Imagem obtida do Open Graph da oferta.
- Primeira atualização do Metricool importou 23 ofertas antigas apesar da opção inicial desmarcada. Restantes desativadas individualmente: painel final mostrou as três listas ativadas e 0 itens ativos.
- Primeiro Pin publicado foi a oferta #9, carregador portátil, da primeira importação. Teste manual adicional do Pinterest desativado para evitar repetição.
- Cadência de 3 posts/semana deixa margem para testes no plano atual.
- Instagram: URL em legenda não é botão de compra. Melhorar acesso pelo perfil/SmartLink permanece pendente.

## Testes reais
- Pinterest, 10h45: PUBLISHED, oferta #9 com imagem e link.
  https://www.pinterest.es/pin/747316131961331273
  Página pública carregou sem autenticação e mostrou o Pin, imagem e botão f.mtr.cool. Encurtador verificado apontando para a vitrine.
- Facebook, 10h46: PUBLISHED, oferta #33 com imagem original e link rastreado.
  https://facebook.com/122099963373493651/posts/122101773843493651
  /go/33?channel=facebook abriu Shopee com HTTP 200 e identificador de afiliado esperado na URL final.
- Instagram, 10h47: PUBLISHED, oferta #33 com imagem original.
  https://www.instagram.com/p/Dd9DRkwCOXK/
  Confirmação do provedor; página Instagram não inspecionada nesta revisão.
- Teste real por canal não comprova todos os próximos ciclos automáticos.

## Código e produção
- PR #7 integrado: feed RSS e documentação.
- 6cb0f5f478dee6e3091e9d61d02243d8d51919eb: título e aviso na legenda.
- d63499711d6fcf6f093083f9e3018abfb75bc4e4: seleção semanal.
- Deployment dpl_DF77rrfaBsbbwwoXr5WwEREwLP7j READY em produção.
- Typecheck e build do feed inicial passaram. Testes da seleção semanal: corte às 08h, seleção estável entre atualizações, máximo de 1 item e ausência de reaproveitamento após janela.
- XML lido pelo Metricool e usado em Pin real.
- Revisão automática bloqueou tentativa Facebook sem imagem; nenhum post criado nessa tentativa. Teste completo com imagem posteriormente publicado.

## Pendências para operação definitiva
1. Observar próximo ciclo com oferta nova por RSS/autolista em cada rede; acompanhar erros, duplicidades e validade de preços.
2. Reconciliar fila local de divulgação com Metricool: RSS não marca tarefas locais como Concluído. Evitar reenvio manual de itens já publicados.
3. Medir cliques por canal e confirmar pedidos/comissões no painel Shopee. Primeira venda ainda não confirmada.
4. Melhorar caminho de compra no Instagram pelo perfil/SmartLink e iniciar engajamento.
5. TikTok e WhatsApp ainda precisam de fluxo e validação. Mercado Livre não está confirmado automático.
6. Aplicação própria Pinterest mostrada pelo usuário permanece Trial pendente; Metricool publicou independentemente disso.
7. Em falhas prolongadas, revisar a fila Metricool antes de retomar: o RSS limita a entrada, mas não remove posts já importados que envelheceram.

Execução:
https://github.com/jaksonjrs-crypto/achadinhos/actions/runs/36868628784
