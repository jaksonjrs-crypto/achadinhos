import {countClick,clickChannel} from '@/lib/click-policy';
import {NextRequest,NextResponse,after} from 'next/server';
import {db} from '@/lib/db';
import {validateCampaignDestination} from '@/lib/campaign-links';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  try{
    const sql=db();const rows=await sql`SELECT destination FROM campaign_links WHERE slug='rosa' LIMIT 1`;
    if(!rows[0])return new NextResponse('Campanha indisponível',{status:404});
    if(countClick(req.headers.get('user-agent'),req.nextUrl.searchParams.get('teste')))after(async()=>{
      try{
        const ids=await sql`SELECT o.id FROM offers o JOIN campaign_links c ON o.external_id=c.external_id WHERE c.slug='rosa' AND o.marketplace='Shopee' AND o.status='published' ORDER BY o.id LIMIT 1`;
        if(!ids[0])return;
        const id=Number(ids[0].id),channel=clickChannel(req.nextUrl.searchParams.get('channel')||req.nextUrl.searchParams.get('src')||req.cookies.get('vitrine_channel')?.value);
        const agent=req.headers.get('user-agent')?.slice(0,500)||null,ref=req.headers.get('referer')?.slice(0,1000)||null;
        try{await sql`INSERT INTO offer_clicks(offer_id,channel,user_agent,referrer,created_at) VALUES(${id},${channel},${agent},${ref},NOW())`}
        catch{await sql`INSERT INTO offer_clicks(offer_id,source,user_agent) VALUES(${id},${channel},${agent})`}
      }catch{console.error('[click-tracking] Falha ao registrar clique ROSA')}
    });
    const response=NextResponse.redirect(validateCampaignDestination(String(rows[0].destination)),302);
    response.headers.set('Cache-Control','no-store, max-age=0');return response;
  }catch{return new NextResponse('Campanha temporariamente indisponível',{status:503,headers:{'Cache-Control':'no-store'}});}
}
