# v3.5.0 — links Shopee, exportação e preparação Manychat

Atende ao chamado de 19/10/2026 e às 12 colunas do modelo de exportação.

## Links Shopee

- Usa `generateShortLink` na Affiliate Open API GraphQL já autenticada pelo projeto, a partir do item/loja confirmados em `productOfferV2`. Não usa o endpoint REST sugerido no PDF, que não corresponde ao conector existente.
- A letra inicial do encurtador não é prova de afiliação. `offerLink` já vinha da Affiliate Open API. Os prefixos do chamado são apenas seleção para revisão, nunca prova de comissão perdida. Comissão extra/16% depende da oferta e não é prometida por esta conversão.
- Importação, cadastro/edição Shopee e divulgação social passam a validar/converter o link. O ID numérico é obrigatório no cadastro manual Shopee. Nenhum ID de exemplo da planilha é aplicado.
- Na Central, **Revisar links Shopee → Conferir sem alterar** simula a seleção. **Converter links selecionados** processa lotes de 3, preserva IDs, registra links anteriores e não repete os já verificados. Inclui ofertas de todos os status. Sem vínculo ou falha mantém o link anterior.
- Tabelas aditivas `affiliate_link_registry` e `affiliate_link_audit` são criadas sob a conexão existente; nenhuma credencial nova. O histórico autenticado está em `/api/offers/link-history`.
- Reexecução ignora links já registrados; compare-and-swap evita sobrepor edição simultânea. Restaurar o código não desfaz dados: para rollback de um link, conferir o registro e restaurar `old_url` apenas se a oferta ainda possui o respectivo `new_url`.

## Exportação

- Excel OOXML `.xlsx` e CSV UTF-8 para importar no Google Sheets. Não cria planilha remota nem altera permissões Google.
- Mesmos filtros/busca/ordenação da Central; categoria ganhou filtro próprio. Removido o limite silencioso de 200 ofertas na consulta administrativa.
- 12 colunas do modelo, valores numéricos de preço, IDs como texto, cabeçalho congelado e autofiltro. Vermelho: prefixos do chamado sem conversão registrada. CSV não possui cores; conteúdo iniciado por fórmula é neutralizado.

## Manychat

- Conteúdo Instagram/Facebook: botão **Preparar resposta Manychat** valida a oferta e fornece resposta, sugestão de palavra-chave e URL estável `/go/{id}?channel=...&utm_source=...&utm_medium=manychat`.
- O redirecionamento consulta o link atual da oferta. Substituir links antigos nos botões uma vez permite acompanhar futuras correções sem editar cada fluxo novamente.
- Opcional: `MANYCHAT_API_TOKEN` no servidor. Usa operações oficiais `getBotFields`, `createBotField` e `setBotFieldByName` para o campo `VITRINE_{id}_{CANAL}_LINK`. Se o campo existe, atualiza; caso contrário, cria. Nunca envia mensagem a contatos durante a preparação.
- Publicação pela API em Instagram/Facebook valida a oferta e prepara/sincroniza esse campo antes do envio, exibindo o estado retornado.
- **Limitação explícita:** criação de gatilhos, associação ao post e alteração de botões de fluxos existentes não são oferecidas por esta API pública. A palavra-chave é sugestão, não um gatilho criado. Vincular/conferir o gatilho e o botão no Manychat continua pendente. Threads não está incluído.

## Validação

`npm run typecheck`, `npm run build`, `npm run test:affiliate-export` e testes existentes pertinentes. Testes de conversão usam dependências simuladas: não comprovam comissão real nem a disponibilidade da mutation na conta. Confirmar no painel autenticado: simulação, conversão e download com filtro. Login e configuração Manychat são necessários para o teste real.

Fontes oficiais consultadas: https://help.shopee.com.br/portal/10/article/128461-Passo-a-Passo-para-Gerar-Seus-Links-de-Afiliado-ou-ID-de-produto ; https://help.manychat.com/hc/pt-br/articles/14959510331420-Como-gerar-um-token-para-a-API-da-Manychat-e-onde-obter-par%C3%A2metros ; https://manychat.github.io/manychat-api-php/class-ManyChat.Structure.Fb.Page.html
