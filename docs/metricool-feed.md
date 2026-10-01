# Distribuição por Metricool — 01/10/2026

Feeds públicos: `/ofertas/feed?channel=pinterest`, `facebook` e `instagram`.
Somente ofertas públicas com preço e imagem HTTPS. Identidade estável por oferta/canal, sem credenciais, links afiliados internos ou dados da fila. Página individual com Open Graph e rastreamento por canal. Shopee/Telegram continuam independentes.

## Cadência e seleção
Fuso da marca: America/Sao_Paulo. Instagram quarta 12h; Pinterest quinta 10h45; Facebook sexta 12h. Repetição circular desligada; três listas ativadas. Plano observado: 20 posts/mês.

Cada feed oferece no máximo 1 item por semana: a oferta elegível mais recente criada na semana anterior até as 08h de Brasília do dia de publicação. Seleção congelada nesse corte, sem incorporar todas as novas ofertas diárias. Se não houver oferta elegível, feed fica vazio. A mesma oferta/canal conserva GUID mesmo com mudança de preço e não deve ser publicada novamente.

Primeira atualização Metricool importou o estoque antigo apesar da opção inicial desmarcada. Itens restantes foram desativados individualmente; painel confirmou 0 itens ativos nas três filas e listas ligadas. Não repetir essa importação.

## Evidência
Em 01/10, Pinterest 10h45, Facebook 10h46 e Instagram 10h47 receberam status PUBLISHED do provedor. Pinterest usou oferta #9 da primeira importação; Facebook/Instagram usaram oferta #33 com imagem original. Pin público inspecionado sem autenticação. Redirecionamentos para a vitrine/Shopee verificados. Relatório completo em `docs/autopiloto-horario.md`.

Ainda observar o próximo ciclo com oferta nova entrando pelo feed e sendo publicada em cada autolista. Conexão ou leitura RSS isolada não comprova esse ciclo completo. API própria Pinterest continua Trial pendente; Metricool publicou independentemente dessa aprovação.

## Limitações
- RSS não marca tarefas da fila local como Concluído; reconciliar entregas e não reenviar manualmente posts já publicados.
- Expirar no feed não remove posts já importados. Em falhas prolongadas, revisar conteúdo e preço antes de retomar.
- Instagram não oferece link clicável na legenda; melhorar caminho de compra pelo perfil/SmartLink.
- TikTok/WhatsApp/Mercado Livre não foram validados como automáticos.
- Cliques, pedidos, comissões e primeira venda permanecem a confirmar.
