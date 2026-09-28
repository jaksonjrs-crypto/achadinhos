# Vitrine dos Achados v3.1.3

Correção incremental sobre a v3.1.2.

- Vitrine pública deduplica ofertas do mesmo produto sem apagar registros administrativos.
- Prioriza `product_id`, depois `marketplace + external_id`; legado sem vínculo usa marketplace + título normalizado.
- Central de Ofertas mais compacta: KPIs, filtros, ações, avisos e tabela ocupam menos espaço vertical.
- Nenhuma nova migração SQL é necessária em relação à v3.1.2.
