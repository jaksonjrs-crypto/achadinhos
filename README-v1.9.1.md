# v1.9.1 — Homologação final
- Vitrine pública mais compacta: logo, cabeçalho, hero, textos, cards e espaçamentos reduzidos.
- Overrides visuais limitados à `.store`, sem alterar o painel administrativo.
- Resultados explicitam que cliques são rastreados pela própria Vitrine, sem depender da API Shopee.
- Resultados forçados sem revalidação.
- Redirecionamento `/go` usa `Cache-Control: no-store`.
- Falhas de INSERT de cliques agora aparecem nos logs do servidor sem impedir o cliente de chegar ao marketplace.
Sem SQL novo e sem novas variáveis de ambiente.
