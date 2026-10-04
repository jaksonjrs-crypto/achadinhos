# Facebook no Autopiloto

O Facebook usa a Pages API para publicar uma foto com o preço e o link rastreado da Vitrine. A integração tem verificação da identidade da página, envio sem repetição automática após falha ambígua, confirmação do preço Shopee, limite diário por canal, intervalo de repetição e reserva única por dia/horário/canal.

## Conexão

Configure em produção na Vercel `FACEBOOK_PAGE_ID` e `FACEBOOK_PAGE_ACCESS_TOKEN` (token da página, não do perfil). Use as permissões `pages_manage_posts` e `pages_read_engagement`. A conexão do Instagram via Instagram Login não substitui a conexão da página.

Depois do deploy com essas variáveis, abra Divulgação e use Verificar APIs. O teste confirma a identidade da página; a autorização de escrita é confirmada na primeira publicação aceita pela Meta. Ative Enviar ofertas ao Facebook automaticamente em Autopiloto e salve as regras. O padrão é desligado até a conexão ser configurada.

## Horários

09h, 13h, 16h, 19h e 20h30 em America/Sao_Paulo. Cada canal recebe até uma oferta por horário, respeitando o limite diário salvo. O GitHub Actions pode atrasar ou perder execuções; horário configurado não comprova envio. Os logs exibem facebookSent e facebookFailed. A fila registra o ID externo após o envio.

O feed RSS semanal do Metricool continua separado. Revise sua autolista antes de usá-la em paralelo para evitar publicação da mesma oferta por dois serviços.

## Validação

`npm run test:facebook`, `npm run test:autopilot-schedule`, `npm run test:manual-distribution`, `npm run test:catalog-price`, `npm run typecheck` e `npm run build`.

Os testes usam APIs e banco simulados: passar nos testes não confirma a autorização nem uma publicação real na página.
