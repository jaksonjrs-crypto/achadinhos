-- Applied idempotently by the authenticated policy endpoint or the cron.
CREATE TABLE IF NOT EXISTS autopilot_policy (
  id INTEGER PRIMARY KEY CHECK (id=1),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  min_score INTEGER NOT NULL DEFAULT 80 CHECK (min_score BETWEEN 0 AND 100),
  max_per_day INTEGER NOT NULL DEFAULT 3 CHECK (max_per_day BETWEEN 1 AND 20),
  start_hour INTEGER NOT NULL DEFAULT 9 CHECK (start_hour BETWEEN 0 AND 23),
  end_hour INTEGER NOT NULL DEFAULT 21 CHECK (end_hour BETWEEN 1 AND 24),
  cooldown_days INTEGER NOT NULL DEFAULT 7 CHECK (cooldown_days BETWEEN 1 AND 90),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO autopilot_policy(id) VALUES(1) ON CONFLICT DO NOTHING;
