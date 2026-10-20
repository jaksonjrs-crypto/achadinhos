import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {validateCampaignDestination} from '@/lib/campaign-links';
export async function POST(req:NextRequest){
  if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
  try{
    const form=await req.formData();const slug=String(form.get('slug')||'');
    if(slug!=='rosa')throw Error('Campanha inválida.');
    const link=validateCampaignDestination(String(form.get('destination')||''));
    const previous=String(form.get('previous')||'');const sql=db();
    const rows=await sql`WITH changed AS (UPDATE campaign_links SET destination=${link},updated_at=NOW() WHERE slug=${slug} AND destination=${previous} RETURNING slug)
      INSERT INTO campaign_link_audit(slug,old_url,new_url) SELECT slug,${previous},${link} FROM changed RETURNING slug`;
    if(!rows.length)return NextResponse.json({error:'O link mudou em outra sessão. Recarregue a Central antes de salvar.'},{status:409});
    return NextResponse.redirect(new URL('/central?saved=Link+da+campanha+ROSA+salvo.#campaign-links',req.url),303);
  }catch(e:any){return NextResponse.json({error:'Não foi possível salvar. Confira o link curto https://s.shopee.com.br/… e tente novamente.'},{status:400});}
}
