import {db} from './db';
export function validateCampaignDestination(value:string){
  const link=value.trim();const u=new URL(link);
  if(u.protocol!=='https:'||u.hostname!=='s.shopee.com.br'||u.username||u.password||u.port||!/^\/[a-zA-Z0-9]+$/.test(u.pathname)||u.search||u.hash)throw Error('Use o link curto completo https://s.shopee.com.br/… gerado pela Shopee.');
  return link;
}
// Only initialized by the authenticated Central, never by a public click.
export async function campaignLinks(){
  const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS campaign_links(slug TEXT PRIMARY KEY,title TEXT NOT NULL,destination TEXT NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS campaign_link_audit(id BIGSERIAL PRIMARY KEY,slug TEXT NOT NULL,old_url TEXT NOT NULL,new_url TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`INSERT INTO campaign_links(slug,title,destination) VALUES('rosa','ROSA — liquidificador 380 ml','https://s.shopee.com.br/AKbTjSJMYj') ON CONFLICT(slug) DO NOTHING`;
  return sql`SELECT slug,title,destination FROM campaign_links ORDER BY slug`;
}
