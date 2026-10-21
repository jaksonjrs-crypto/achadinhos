import {db} from './db';
export const DEFAULT_HIGHLIGHT_TITLE='Selecionados para você';
export function highlightTitle(value:unknown){return String(value??'').trim()||DEFAULT_HIGHLIGHT_TITLE;}
export async function ensureVitrineConfig(){
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS vitrine_config (
    id INTEGER PRIMARY KEY CHECK (id=1),
    titulo_destaque VARCHAR(100) NOT NULL DEFAULT 'Selecionados para você',
    exibir_titulo_destaque BOOLEAN NOT NULL DEFAULT TRUE,
    destaque_ativo BOOLEAN NOT NULL DEFAULT FALSE)`;
  // Preserve highlights already selected before campaign settings were introduced.
  await sql`INSERT INTO vitrine_config(id,destaque_ativo) VALUES(1,
    EXISTS(SELECT 1 FROM offers WHERE status='published' AND (to_jsonb(offers)->>'home_until')::timestamptz>NOW())) ON CONFLICT(id) DO NOTHING`;
  return sql;
}
export async function getVitrineConfig(){
  const sql=await ensureVitrineConfig();
  const rows=await sql`SELECT titulo_destaque,exibir_titulo_destaque,destaque_ativo FROM vitrine_config WHERE id=1`;
  const r=rows[0];
  return {titulo:highlightTitle(r.titulo_destaque),exibir_titulo:Boolean(r.exibir_titulo_destaque),destaque_ativo:Boolean(r.destaque_ativo)};
}
