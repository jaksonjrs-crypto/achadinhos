import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {validateCampaignDestination} from '@/lib/campaign-links';
export const dynamic='force-dynamic';
export async function GET(){
  try{
    const sql=db();const rows=await sql`SELECT destination FROM campaign_links WHERE slug='rosa' LIMIT 1`;
    if(!rows[0])return new NextResponse('Campanha indisponível',{status:404});
    const response=NextResponse.redirect(validateCampaignDestination(String(rows[0].destination)),302);
    response.headers.set('Cache-Control','no-store, max-age=0');return response;
  }catch{return new NextResponse('Campanha temporariamente indisponível',{status:503,headers:{'Cache-Control':'no-store'}});}
}
