import {db} from './db';
import {BOT_PATTERN} from './click-policy';
export function words(text:string){return [...new Set(text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>=3&&!['para','com','sem','das','dos','uma','por','kit','pecas','novo','nova'].includes(w)))];}
export function clickBonus(title:string,topTitles:string[]){
 const tokens=words(title);let overlap=0;
 for(const top of topTitles){const known=new Set(words(top));overlap=Math.max(overlap,tokens.filter(t=>known.has(t)).length);}
 const bonus=Math.min(15,overlap*4);
 return {bonus,reason:bonus?`+${bonus} parecido com ofertas mais clicadas`:''};
}
export async function topClickedTitles(){
 const sql=db();
 const rows=await sql`SELECT o.title,COUNT(*) FROM offer_clicks c JOIN offers o ON o.id=c.offer_id
 WHERE COALESCE(c.user_agent,'') !~* ${BOT_PATTERN}
 AND COALESCE(to_jsonb(c)->>'created_at',to_jsonb(c)->>'clicked_at')::timestamptz>=NOW()-INTERVAL '30 days'
 GROUP BY o.id,o.title ORDER BY COUNT(*) DESC,o.id LIMIT 10`;
 return rows.map(r=>String(r.title));
}
