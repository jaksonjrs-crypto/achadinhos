# v2.2.0 — Shopee → Garimpo Inteligente
- Importação real via Affiliate Open API.
- Usa `offerLink` oficial como URL afiliada do candidato.
- Importa imagem, preço e preço anterior estimado pelo desconto.
- Calcula score inicial por desconto, comissão, avaliação e vendas.
- Bloqueia produtos pelo filtro de segurança existente.
- Evita duplicar candidatos pelo `offerLink`.
- Botão `Importar da Shopee` no Garimpo Inteligente.
- Sem SQL novo e sem novas variáveis de ambiente.
