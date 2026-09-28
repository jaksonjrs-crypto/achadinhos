# Vitrine dos Achados v0.9.3

Correções de manutenção da fila:
- `Corrigir produto` em cada candidato salvo.
- Permite editar nome, preço, link, URL da imagem e observações.
- `Excluir da fila` remove candidatos antigos, rejeitados ou cadastrados incorretamente.
- Aprovar/Rejeitar continuam apenas mudando o status; não apagam o registro.
- `Criar oferta` continua removendo o candidato da fila após conversão bem-sucedida.
- Nenhum SQL novo.
- Nenhuma variável de ambiente nova.

Para o candidato antigo sem imagem:
1. Abra Corrigir produto.
2. Adicione a URL da imagem e salve.
3. Aprove e use Criar oferta se ainda precisar gerar a oferta; ou use Excluir da fila se a oferta já existe.
