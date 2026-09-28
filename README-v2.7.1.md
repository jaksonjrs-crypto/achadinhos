# v2.7.1 — Correção de cópia de links
- Na parte inferior da Central de Conteúdo, separa claramente `Copiar link` de `Copiar texto`.
- `Copiar link` copia somente a URL rastreada `/o/<id>?c=<canal>`, evitando que navegador trate o texto promocional inteiro como pesquisa do Google.
- `Copiar texto` mantém legenda/informações completas do produto.
- Adiciona fallback de clipboard para navegadores sem Clipboard API disponível.
- Sem SQL novo e sem novas variáveis de ambiente.
