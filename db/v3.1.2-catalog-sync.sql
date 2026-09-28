-- v3.1.2 — catálogo persistente, deduplicação e sincronização
ALTER TABLE product_candidates ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE product_candidates ADD COLUMN IF NOT EXISTS sold_quantity INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_marketplace_external
  ON product_candidates(marketplace, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE offers ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS opportunity_score INTEGER;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'unlinked';
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_marketplace_external
  ON offers(marketplace, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offers_sync_status ON offers(sync_status, last_synced_at);
