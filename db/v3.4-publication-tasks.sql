-- The app applies this idempotently on the first authenticated queue request.
CREATE TABLE IF NOT EXISTS publication_tasks (
  id BIGSERIAL PRIMARY KEY,
  offer_id BIGINT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('pinterest','instagram','facebook','telegram','whatsapp','tiktok')),
  cycle_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','scheduled','publishing','published','failed','skipped')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_id TEXT,
  last_error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (offer_id,channel,cycle_date)
);
