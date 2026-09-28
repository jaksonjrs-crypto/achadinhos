# Vitrine dos Achados / Garimpo Afiliados v0.4

## O que entrou
- Marca pública Vitrine dos Achados em `/ofertas`.
- Central interna em `/central` para cadastrar ofertas manualmente.
- Redirecionamento rastreável `/go/[id]` para links afiliados.
- Base pronta para Shopee, Mercado Livre e Amazon entrarem como conectores depois.
- Mantém os recursos da v0.3.2.

## Migração PostgreSQL (execute UM comando por vez no Neon)

```sql
CREATE TABLE IF NOT EXISTS offers (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(14,2) NOT NULL,
  original_price NUMERIC(14,2),
  affiliate_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','expired')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

```sql
CREATE TABLE IF NOT EXISTS offer_clicks (
  id BIGSERIAL PRIMARY KEY,
  offer_id BIGINT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'vitrine',
  user_agent TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

```sql
CREATE INDEX IF NOT EXISTS idx_offers_status_created ON offers(status, created_at DESC);
```

```sql
CREATE INDEX IF NOT EXISTS idx_offer_clicks_offer_time ON offer_clicks(offer_id, clicked_at DESC);
```

## Depois
Faça deploy na Vercel com as mesmas variáveis de ambiente da v0.3.2. Não compartilhe valores secretos.
Teste `/central`, cadastre uma oferta de teste como rascunho, depois uma publicada, e abra `/ofertas`.
