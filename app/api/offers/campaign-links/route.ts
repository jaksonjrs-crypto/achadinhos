import {NextRequest,NextResponse} from 'next/server';
import {ensureAffiliateRegistry} from '@/lib/affiliate-registry';
import {validateCampaignDestination} from '@/lib/campaign-links';
import {validateManualLink} from '@/lib/manual-affiliate';
import {productSafetyCheck} from '@/lib/product-safety';
export async function POST(req:NextRequest){
  if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
  try{
    const form=await req.formData();const slug=String(form.get('slug')||'');
    if(slug!=='rosa')throw Error('Campanha inválida.');
    const link=validateCampaignDestination(String(form.get('destination')||''));
    const previous=String(form.get('previous')||'');const revision=String(form.get('revision')||'');
    const name=String(form.get('full_name')||'').trim(),code=String(form.get('product_code')||'').trim();
    const image=String(form.get('image_url')||'').trim(),itemId=String(form.get('external_id')||'').trim();
    const priceRaw=String(form.get('price')||'').trim(),originalRaw=String(form.get('original_price')||'').trim();
    const complete=Boolean(name||code||image||itemId||priceRaw||originalRaw);
    const price=priceRaw?Number(priceRaw):null,original=originalRaw?Number(originalRaw):null;
    if(complete){
      if(!name||name.length>300||!code||code.length>80||!image||!price||!Number.isFinite(price)||price<=0||original!==null&&(!Number.isFinite(original)||original<0))throw Error('Dados incompletos.');
      const u=new URL(image);if(u.protocol!=='https:'||u.username||u.password)throw Error('Imagem inválida.');
      validateManualLink(itemId,link,'');
      if(!productSafetyCheck(name,'Cozinha').allowed)throw Error('Produto não permitido.');
    }
    const sql=await ensureAffiliateRegistry();
    // The campaign update gates every write, including duplicate creation and stale form submissions.
    const rows=await sql`WITH changed AS (
      UPDATE campaign_links SET destination=${link},full_name=${name||null},product_code=${code||null},image_url=${image||null},price=${price},original_price=${original},external_id=${itemId||null},updated_at=NOW()
      WHERE slug=${slug} AND destination=${previous} AND updated_at::text=${revision}
        AND (NOT ${complete} OR (SELECT COUNT(*) FROM offers WHERE marketplace='Shopee' AND external_id=${itemId})<=1)
      RETURNING slug
    ), audited AS (
      INSERT INTO campaign_link_audit(slug,old_url,new_url) SELECT slug,${previous},${link} FROM changed RETURNING slug
    ), updated_offer AS (
      UPDATE offers SET title=${name},image_url=${image},price=${price},original_price=${original},affiliate_url=${link},affiliate_status='pending',affiliate_note='Cadastro manual da campanha ROSA; comissão não confirmada.',updated_at=NOW()
      WHERE ${complete} AND marketplace='Shopee' AND external_id=${itemId} AND EXISTS(SELECT 1 FROM changed) RETURNING id
    ), inserted_offer AS (
      INSERT INTO offers(title,category,marketplace,image_url,price,original_price,affiliate_url,status,external_id,affiliate_status,affiliate_note)
      SELECT ${name},'Cozinha','Shopee',${image},${price},${original},${link},'draft',${itemId},'pending','Cadastro manual da campanha ROSA; comissão não confirmada.'
      WHERE ${complete} AND EXISTS(SELECT 1 FROM changed) AND NOT EXISTS(SELECT 1 FROM offers WHERE marketplace='Shopee' AND external_id=${itemId}) RETURNING id
    ) SELECT slug FROM changed`;
    if(!rows.length)return NextResponse.json({error:'O cadastro mudou em outra sessão ou há ofertas duplicadas para este ID. Recarregue a Central e confira antes de salvar.'},{status:409});
    const message=complete?'Cadastro e link ROSA salvos. Oferta pronta para publicação; comissão pendente.':'Link da campanha ROSA salvo.';
    return NextResponse.redirect(new URL('/central?saved='+encodeURIComponent(message)+'#campaign-links',req.url),303);
  }catch{return NextResponse.json({error:'Não foi possível salvar. Confira o link Shopee e preencha nome, código, imagem, ID numérico e preço para cadastrar a oferta.'},{status:400});}
}
