# Vitrine dos Achados v0.7.3

Correção do menu global.

Diagnóstico da v0.7.2:
- `MainNav` foi importado no layout, mas o layout antigo continuou renderizando somente
  "Garimpo Afiliados" e "Configurações".
- Por isso os menus locais removidos desapareceram sem serem substituídos.

Correção:
- `MainNav` agora é realmente renderizado no `app/layout.tsx`.
- Cabeçalho global contém a marca e todos os 9 links.
- Menu aparece em todas as rotas.
- CSS reforçado para desktop e celular.

Nenhum SQL novo.
Nenhuma variável de ambiente nova.
