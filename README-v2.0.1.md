# Vitrine dos Achados v2.0.1 — Correção WhatsApp

Correção de produção sobre a v2.0.0.

## Corrigido
- Na Central de Conteúdo, ao selecionar WhatsApp/Instagram/Telegram/Pinterest, o seletor de “Link personalizado” acompanha o mesmo canal. Assim, os dois botões de copiar usam o mesmo destino/canal.
- A rota curta `/o/[id]` não trata mais um navegador real do WhatsApp como crawler de prévia.
- Crawlers de prévia continuam recebendo Open Graph.
- Navegadores reais recebem redirecionamento 302 imediato para o rastreador `/go`.
- Respostas variáveis por User-Agent agora usam `Vary: User-Agent` e `Cache-Control: no-store`, reduzindo risco de cache cruzado.

## Teste
1. Na Central de Conteúdo, selecione WhatsApp.
2. Copie “Link personalizado”.
3. Copie o texto pelo botão “Copiar” do bloco WhatsApp.
4. Confirme que ambos usam `/o/<id>?c=w`.
5. Envie pelo WhatsApp e toque no link.
6. Confirme abertura da oferta no marketplace e registro do clique em Resultados.

Sem SQL novo e sem novas variáveis de ambiente.
