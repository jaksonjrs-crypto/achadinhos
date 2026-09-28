# v2.8.0 — Pipeline de Divulgação
- Adiciona `/divulgacao` com fila das ofertas publicadas.
- Cada oferta segue diretamente para Conteúdo ou Criativos.
- Mantém `/ofertas` como hub para bio/perfil e `/o/<id>?c=...` para posts rastreados.
- Corrige o atalho “Abrir fila de divulgação” da Central de Conteúdo.
- Adiciona acesso à fila a partir da Central de Ofertas.
- Publicação em redes continua assistida, com revisão humana antes do envio.
- Sem SQL novo e sem novas variáveis de ambiente.
