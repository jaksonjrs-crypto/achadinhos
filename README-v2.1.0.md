# v2.1.0 — Base da integração Shopee
Cliente server-side da Affiliate Open API, consulta productOfferV2 e mantém AppID/Secret somente no backend.
O endpoint interno `/api/shopee/products` aplica o filtro de segurança antes de devolver produtos.
Esta etapa valida a autenticação real antes de conectarmos a importação automática à fila de candidatos.
Sem SQL novo.
