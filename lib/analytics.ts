import { db } from "./db";

async function modernStats(sql:any){
  const [summary,channels,top,recent,periods] = await Promise.all([
    sql`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status='published')::int AS published,
      COUNT(*) FILTER (WHERE status='draft')::int AS drafts,
      COUNT(*) FILTER (WHERE status='expired')::int AS expired,
      (SELECT COUNT(*)::int FROM offer_clicks) AS clicks,
      (SELECT COUNT(DISTINCT offer_id)::int FROM offer_clicks) AS clicked_offers
      FROM offers`,
    sql`SELECT channel,COUNT(*)::int AS clicks FROM offer_clicks GROUP BY channel ORDER BY clicks DESC`,
    sql`SELECT o.id,o.title,o.image_url,o.marketplace,o.status,COUNT(c.id)::int AS clicks,
      COUNT(*) FILTER (WHERE c.channel='instagram')::int AS instagram,
      COUNT(*) FILTER (WHERE c.channel='whatsapp')::int AS whatsapp,
      COUNT(*) FILTER (WHERE c.channel='telegram')::int AS telegram,
      COUNT(*) FILTER (WHERE c.channel='pinterest')::int AS pinterest,
      COUNT(*) FILTER (WHERE c.channel='vitrine')::int AS vitrine
      FROM offers o LEFT JOIN offer_clicks c ON c.offer_id=o.id
      GROUP BY o.id,o.title,o.image_url,o.marketplace,o.status,o.created_at
      ORDER BY clicks DESC,o.created_at DESC LIMIT 10`,
    sql`SELECT DATE(created_at) AS day,COUNT(*)::int AS clicks FROM offer_clicks
      WHERE created_at>=NOW()-INTERVAL '6 days' GROUP BY DATE(created_at) ORDER BY day ASC`,
    sql`SELECT
      COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '7 days')::int AS last7,
      COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '14 days' AND created_at<NOW()-INTERVAL '7 days')::int AS prev7,
      COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '30 days')::int AS last30 FROM offer_clicks`
  ]);
  return {summary:summary[0],channels,top,recent,periods:periods[0]};
}

async function legacyStats(sql:any){
  const [summary,channels,top,recent,periods] = await Promise.all([
    sql`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status='published')::int AS published,
      COUNT(*) FILTER (WHERE status='draft')::int AS drafts,
      COUNT(*) FILTER (WHERE status='expired')::int AS expired,
      (SELECT COUNT(*)::int FROM offer_clicks) AS clicks,
      (SELECT COUNT(DISTINCT offer_id)::int FROM offer_clicks) AS clicked_offers
      FROM offers`,
    sql`SELECT source AS channel,COUNT(*)::int AS clicks FROM offer_clicks GROUP BY source ORDER BY clicks DESC`,
    sql`SELECT o.id,o.title,o.image_url,o.marketplace,o.status,COUNT(c.id)::int AS clicks,
      COUNT(*) FILTER (WHERE c.source='instagram')::int AS instagram,
      COUNT(*) FILTER (WHERE c.source='whatsapp')::int AS whatsapp,
      COUNT(*) FILTER (WHERE c.source='telegram')::int AS telegram,
      COUNT(*) FILTER (WHERE c.source='pinterest')::int AS pinterest,
      COUNT(*) FILTER (WHERE c.source='vitrine')::int AS vitrine
      FROM offers o LEFT JOIN offer_clicks c ON c.offer_id=o.id
      GROUP BY o.id,o.title,o.image_url,o.marketplace,o.status,o.created_at
      ORDER BY clicks DESC,o.created_at DESC LIMIT 10`,
    sql`SELECT DATE(clicked_at) AS day,COUNT(*)::int AS clicks FROM offer_clicks
      WHERE clicked_at>=NOW()-INTERVAL '6 days' GROUP BY DATE(clicked_at) ORDER BY day ASC`,
    sql`SELECT
      COUNT(*) FILTER (WHERE clicked_at>=NOW()-INTERVAL '7 days')::int AS last7,
      COUNT(*) FILTER (WHERE clicked_at>=NOW()-INTERVAL '14 days' AND clicked_at<NOW()-INTERVAL '7 days')::int AS prev7,
      COUNT(*) FILTER (WHERE clicked_at>=NOW()-INTERVAL '30 days')::int AS last30 FROM offer_clicks`
  ]);
  return {summary:summary[0],channels,top,recent,periods:periods[0]};
}

export async function getDashboardStats(){
  const sql=db();
  try{return await modernStats(sql)}
  catch(modernError){
    try{return await legacyStats(sql)}
    catch(legacyError){
      console.error("[analytics] Falha nos schemas moderno e legado",{modernError,legacyError});
      throw legacyError;
    }
  }
}
