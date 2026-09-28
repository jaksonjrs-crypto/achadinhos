# v3.1.0 — Marketplace + área administrativa protegida

- Vitrine pública redesenhada para maior densidade visual: 4 colunas no desktop, 3 em telas médias e 2 no celular.
- Hero, busca, categorias, cards, preços e CTAs compactados para aparência de marketplace.
- Menu Garimpo removido da experiência pública.
- `/` passa a encaminhar para `/ofertas`.
- Área administrativa disponível em `/admin` e rotas operacionais existentes.
- Login em `/admin/login` com sessão HTTP-only de 12 horas.
- Rotas administrativas e APIs internas protegidas por middleware.
- Callbacks OAuth, webhook do Mercado Livre, tracking e rotas públicas permanecem acessíveis.
- Botão "Sair" incluído no cabeçalho administrativo.

## Novas variáveis Vercel

`ADMIN_PASSWORD`: senha do administrador.

`ADMIN_SESSION_SECRET`: segredo aleatório longo (32+ bytes) usado para assinar a sessão. Não usar prefixo `NEXT_PUBLIC_`.

Não há alteração de banco/SQL nesta versão.
