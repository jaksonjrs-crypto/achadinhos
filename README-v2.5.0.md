# v2.5.0 — Pipeline Shopee → Central
- Adiciona ação humana em lote para transformar candidatos Shopee já aprovados e score 80+ em ofertas.
- Ofertas são criadas apenas como `draft`; não há publicação automática.
- Reaplica filtro de segurança, exige preço/link e evita duplicatas.
- Candidatos convertidos são removidos da fila, seguindo o comportamento individual já existente.
- Sem SQL novo e sem novas variáveis de ambiente.
