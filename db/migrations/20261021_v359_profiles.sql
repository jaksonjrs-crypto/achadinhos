-- Idempotent schema and seed, also applied by ensureMiningProfiles() on first authenticated use.
-- Existing offers keep perfil NULL. No clicks or existing profiles are deleted/overwritten.
BEGIN;
CREATE TABLE IF NOT EXISTS mining_profiles(id TEXT PRIMARY KEY,name VARCHAR(100) NOT NULL,keywords TEXT[] NOT NULL DEFAULT '{}',forbidden TEXT[] NOT NULL DEFAULT '{}',categories TEXT[] NOT NULL DEFAULT '{}',min_price NUMERIC,max_price NUMERIC,min_score INTEGER NOT NULL DEFAULT 0 CHECK(min_score BETWEEN 0 AND 100),active BOOLEAN NOT NULL DEFAULT FALSE,starts_on DATE,ends_on DATE,manual_only BOOLEAN NOT NULL DEFAULT FALSE);

ALTER TABLE offers ADD COLUMN IF NOT EXISTS perfil TEXT;

ALTER TABLE product_candidates ADD COLUMN IF NOT EXISTS perfil TEXT,ADD COLUMN IF NOT EXISTS click_bonus INTEGER NOT NULL DEFAULT 0,ADD COLUMN IF NOT EXISTS click_reason TEXT,ADD COLUMN IF NOT EXISTS manual_discovery BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO mining_profiles(id,name,keywords,forbidden,min_price,max_price,active) VALUES('principal','Casa e Cozinha Prática',ARRAY['airfryer','fritadeira','liquidificador portátil','mixer','processador','organizador','pote hermético','marmita','utensílio cozinha','limpeza','mop','escova elétrica limpeza','lixeira','tapete banheiro','cesto roupa','bacia','escorredor'],ARRAY['adulto','sutiã','mamilo','barba','capilar','whey','creatina','suplemento','fitness','ferramenta','soquete','catraca','pedal','embreagem','skate','patinete','smartwatch','celular','calça','short','vestido'],20,150,true) ON CONFLICT DO NOTHING;

INSERT INTO mining_profiles(id,name,keywords,starts_on,ends_on,manual_only) VALUES
 ('black-friday','Black Friday','{}','2026-11-01','2026-11-30',false),
 ('natal','Natal',ARRAY['natal','natalino','natalina','pinheiro','pisca pisca'],'2026-12-01','2026-12-24',false),
 ('livre','Livre','{}',NULL,NULL,true) ON CONFLICT DO NOTHING;
COMMIT;
