CREATE TABLE IF NOT EXISTS product_candidates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  marketplace TEXT NOT NULL DEFAULT 'Shopee',
  product_url TEXT,
  price NUMERIC(12,2),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review','approved','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
