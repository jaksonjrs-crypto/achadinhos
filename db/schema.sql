CREATE TABLE IF NOT EXISTS marketplace_connections (
  id BIGSERIAL PRIMARY KEY,
  marketplace TEXT NOT NULL,
  external_user_id TEXT NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  token_type TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (marketplace, external_user_id)
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  marketplace TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  permalink TEXT,
  thumbnail TEXT,
  price NUMERIC(14,2),
  original_price NUMERIC(14,2),
  currency_id TEXT,
  seller_id TEXT,
  category_id TEXT,
  available_quantity INTEGER,
  sold_quantity INTEGER,
  free_shipping BOOLEAN,
  opportunity_score INTEGER,
  score_reason JSONB,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (marketplace, external_id)
);

CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(14,2) NOT NULL,
  original_price NUMERIC(14,2),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_score ON products(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_product_time ON price_history(product_id, captured_at DESC);
