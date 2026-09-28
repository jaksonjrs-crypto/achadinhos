# v3.0.0 — Pinterest API oficial

## Incluído
- OAuth Authorization Code com `state` em cookie HttpOnly.
- Tokens Pinterest criptografados com a `TOKEN_ENCRYPTION_KEY` já existente.
- Renovação automática por refresh token.
- Listagem de pastas (boards).
- Publicação manual confirmada de Pin a partir de oferta publicada.
- Link do Pin aponta para `/o/<id>?c=p`, preservando o rastreamento Pinterest.
- Filtro de segurança reaplicado antes da publicação.
- Central de Integrações mostra status Pinterest.

## Novas variáveis Vercel
- `PINTEREST_APP_ID`
- `PINTEREST_APP_SECRET`
- `PINTEREST_REDIRECT_URI`

Defina `PINTEREST_REDIRECT_URI` exatamente igual ao Redirect URI cadastrado no Pinterest, apontando para:
`https://SEU-DOMINIO/api/auth/pinterest/callback`

Não envie segredos pelo chat.

## Banco
Sem SQL novo: reutiliza `marketplace_connections`.
