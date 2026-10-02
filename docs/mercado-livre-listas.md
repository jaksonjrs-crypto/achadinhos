# Importação de lista Mercado Livre por HTML

A lista pública retornou HTTP 403 nas consultas automatizadas. A importação usa o arquivo HTML salvo pelo dono no navegador, sem tentar contornar o bloqueio ou depender de cookies da conta.

## Operação

1. Escolher os produtos na lista de afiliado do Mercado Livre.
2. Salvar cada página da lista com Ctrl+S, como HTML.
3. No Garimpo Inteligente, abrir **Importar lista ML**, carregar o arquivo e usar **Ler produtos**.
4. Conferir o total carregado e os avisos de duplicidade; selecionar e importar.
5. Revisar os produtos e aprovar para criar a oferta, publicar na Vitrine e preparar a fila de Divulgação.

A rotina lê nomes, preços, imagens e IDs da estrutura JSON da página. Os itens entram em revisão, sem publicação durante a importação. O arquivo não informa vendas; avaliações não são tratadas como vendas. A categoria é sugerida e pode ser corrigida.

## Links e preços

- O destino padrão é o link original de **Compartilhar lista**, preservado sem alterações. Os links individuais de produto extraídos da página não foram confirmados como links de afiliado; por isso não os usamos como substitutos automáticos.
- Para compra direta por produto, gerar seu link de afiliado individual e substituí-lo em **Detalhes / corrigir** antes de aprovar.
- O preço é o retrato do arquivo salvo, não uma consulta atual à API. Valores de Pix ficam nas observações; quando há valor padrão, ele é usado no cadastro. Cupons e descontos com saldo não são aplicados automaticamente.
- O total da lista pode ser maior que a página salva. O sistema mostra essa diferença. Importar outra página ou repetir o arquivo não duplica IDs já cadastrados.
- Uma oferta manual com título base parecido aparece como possível duplicidade, desmarcada inicialmente. Conferir ou vincular o ID no cadastro existente evita criar outra variação inadvertidamente.

## Dados e validação

Só o JSON de renderização da lista é analisado; nenhum script do arquivo é executado. Não se armazenam HTML, endereço do usuário, dados da sessão ou contexto da conta. Aceitam-se arquivos de até 2 MB e até 200 cards, com destino HTTPS da lista ML/meli.la e imagens no domínio público ML.

Validação: o arquivo fornecido em 02/10/2026 contém 16 cards de uma lista com 18 itens. Os 16 foram lidos, inclusive o vestido na cor vinho. Testes usam uma amostra com identidade de lista fictícia e atributos públicos de produtos; verificam preços condicionais, IDs de anúncios versus catálogo, duplicidade, seleção, limites e leitura sem executar scripts.

A importação no banco depende de uma sessão administrativa. A leitura do arquivo foi verificada; uma importação/postagem real deve ser conferida no Garimpo e no canal correspondente. Telegram respeita a política de envio; Metricool mantém sua cadência semanal. WhatsApp e TikTok permanecem assistidos.
