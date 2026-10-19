import {NextResponse} from 'next/server';
import {ensureAffiliateRegistry} from '@/lib/affiliate-registry';
export const dynamic='force-dynamic';
export async function GET(){
  try{const sql=await ensureAffiliateRegistry();const rows=await sql`SELECT offer_id,old_url,new_url,external_id,status,message,created_at FROM affiliate_link_audit ORDER BY id DESC LIMIT 500`;
    return NextResponse.json({rows},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Histórico indisponível.'},{status:500})}
}
