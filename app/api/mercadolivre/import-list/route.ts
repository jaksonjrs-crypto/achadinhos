import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {ML_LIST_MAX_BYTES,parseMlListHtml} from '@/lib/ml-list-parser';
export const dynamic='force-dynamic';

export async function POST(req:NextRequest){
  try{
    const form=await req.formData(),file=form.get('file'),action=String(form.get('action')||'preview');
    if(!(file instanceof File)||!file.size||file.size>ML_LIST_MAX_BYTES)return NextResponse.json({ok:false,error:'Selecione um arquivo HTML de até 2 MB.'},{status:400});
    if(!['preview','import'].includes(action))return NextResponse.json({ok:false,error:'Ação inválida.'},{status:400});
    const preview=parseMlListHtml(await file.text(),String(form.get('affiliateUrl')||'')||undefined);
    const sql=db();
    const known=await sql`SELECT external_id,title,'offer' AS source FROM offers
      WHERE LOWER(TRIM(marketplace)) IN ('mercado livre','mercadolivre')
      UNION ALL SELECT external_id,title,'candidate' AS source FROM product_candidates
      WHERE LOWER(TRIM(marketplace)) IN ('mercado livre','mercadolivre') AND status IN ('review','approved')`;
    const normalize=(s:string)=>s.toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
    const products=preview.products.map(p=>{
      const title=normalize(p.title);
      const existing=known.some((k:any)=>k.external_id===p.externalId||normalize(String(k.title||''))===title);
      const possibleDuplicate=!existing&&known.some((k:any)=>!k.external_id&&normalize(String(k.title||'')).length>=30&&title.startsWith(normalize(String(k.title||''))+' '));
      return {...p,existing,possibleDuplicate};
    });
    if(action==='preview')return NextResponse.json({ok:true,...preview,products});
    const selected=new Set(form.getAll('selected').map(String));
    if(!selected.size)return NextResponse.json({ok:false,error:'Selecione ao menos um produto.'},{status:400});
    if([...selected].some(id=>!products.some(p=>p.externalId===id)))return NextResponse.json({ok:false,error:'Seleção inválida para este arquivo.'},{status:400});
    let imported=0,duplicates=0;
    for(const p of products.filter(p=>selected.has(p.externalId))){
      // Do not match by list URL: different products share this affiliate list.
      const rows=await sql`INSERT INTO product_candidates(title,category,marketplace,product_url,image_url,price,original_price,score,status,notes,external_id)
        SELECT ${p.title},${p.category},'Mercado Livre',${p.productUrl},${p.imageUrl},${p.price},${p.originalPrice},${p.score},'review',${p.notes},${p.externalId}
        WHERE NOT EXISTS(SELECT 1 FROM offers WHERE LOWER(TRIM(marketplace)) IN ('mercado livre','mercadolivre')
          AND (external_id=${p.externalId} OR LOWER(TRIM(title))=LOWER(TRIM(${p.title}))))
        AND NOT EXISTS(SELECT 1 FROM product_candidates WHERE LOWER(TRIM(marketplace)) IN ('mercado livre','mercadolivre')
          AND (external_id=${p.externalId} OR LOWER(TRIM(title))=LOWER(TRIM(${p.title}))))
        ON CONFLICT DO NOTHING RETURNING id`;
      if(rows.length)imported++;else duplicates++;
    }
    return NextResponse.json({ok:true,imported,duplicates,totalItems:preview.totalItems,loadedItems:preview.loadedItems});
  }catch(e:any){
    if(e?.code){console.error('ML list import database failure',e.code);return NextResponse.json({ok:false,error:'Não foi possível salvar os produtos. Confira o Garimpo antes de repetir a importação.'},{status:500})}
    return NextResponse.json({ok:false,error:String(e?.message||'Não foi possível ler a lista.').slice(0,300)},{status:400});
  }
}
