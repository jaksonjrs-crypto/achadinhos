# v3.4.1 — consolidação de duplicados antigos

- A área Garimpo identifica candidatos ativos com mesmo marketplace, título exato e preço.
- O operador pode consolidar os duplicados existentes. Mantém o candidato aprovado ou, entre pendentes, o que tem melhor informação de vendas e score.
- Os registros excedentes recebem status `rejected` e uma nota de auditoria; nenhuma linha é apagada. Isso permite revisão posterior.
- A importação Shopee da v3.4.0 continua protegida por `ON CONFLICT DO NOTHING` para IDs externos.
