import {db} from './db';
import type {MiningProfile} from './mining-profile-rules';
export async function ensureMiningProfiles(){
 const sql=db();
 await sql`CREATE TABLE IF NOT EXISTS mining_profiles(id TEXT PRIMARY KEY,name VARCHAR(100) NOT NULL,keywords TEXT[] NOT NULL DEFAULT '{}',forbidden TEXT[] NOT NULL DEFAULT '{}',categories TEXT[] NOT NULL DEFAULT '{}',min_price NUMERIC,max_price NUMERIC,min_score INTEGER NOT NULL DEFAULT 0 CHECK(min_score BETWEEN 0 AND 100),active BOOLEAN NOT NULL DEFAULT FALSE,starts_on DATE,ends_on DATE,manual_only BOOLEAN NOT NULL DEFAULT FALSE)`;
 await sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS perfil TEXT`;
 await sql`ALTER TABLE product_candidates ADD COLUMN IF NOT EXISTS perfil TEXT,ADD COLUMN IF NOT EXISTS click_bonus INTEGER NOT NULL DEFAULT 0,ADD COLUMN IF NOT EXISTS click_reason TEXT,ADD COLUMN IF NOT EXISTS manual_discovery BOOLEAN NOT NULL DEFAULT FALSE`;
 const keywords='airfryer,fritadeira,liquidificador portátil,mixer,processador,organizador,pote hermético,marmita,utensílio cozinha,limpeza,mop,escova elétrica limpeza,lixeira,tapete banheiro,cesto roupa,bacia,escorredor'.split(',');
 const forbidden='adulto,sutiã,mamilo,barba,capilar,whey,creatina,suplemento,fitness,ferramenta,soquete,catraca,pedal,embreagem,skate,patinete,smartwatch,celular,calça,short,vestido'.split(',');
 await sql`INSERT INTO mining_profiles(id,name,keywords,forbidden,min_price,max_price,active) VALUES('principal','Casa e Cozinha Prática',${keywords},${forbidden},20,150,true) ON CONFLICT DO NOTHING`;
 await sql`INSERT INTO mining_profiles(id,name,keywords,starts_on,ends_on,manual_only) VALUES
 ('black-friday','Black Friday','{}','2026-11-01','2026-11-30',false),
 ('natal','Natal',ARRAY['natal','natalino','natalina','pinheiro','pisca pisca'],'2026-12-01','2026-12-24',false),
 ('livre','Livre','{}',NULL,NULL,true) ON CONFLICT DO NOTHING`;
 return sql;
}
export async function miningProfiles():Promise<MiningProfile[]>{const sql=await ensureMiningProfiles();return await sql`SELECT *,starts_on::text,ends_on::text FROM mining_profiles ORDER BY (id='principal') DESC,name` as MiningProfile[];}
export async function miningProfile(id='principal'){const p=(await miningProfiles()).find(p=>p.id===id);if(!p)throw new Error('Perfil inválido');return p;}
