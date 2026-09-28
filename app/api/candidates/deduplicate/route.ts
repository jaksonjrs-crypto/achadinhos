import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
export const dynamic='force-dynamic';

export async function GET(){
  try{
    const sql=db();
    const rows=await sql`WITH ranked AS (
      SELECT id,title,marketplace,price,
        ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(marketplace)),LOWER(TRIM(title)),price
          ORDER BY CASE WHEN status='approved' THEN 0 ELSE 1 END,
            sold_quantity DESC NULLS LAST,score DESC,updated_at DESC,id DESC) AS position
      FROM product_candidates WHERE status IN ('review','approved')
    ) SELECT id,title,marketplace,price FROM ranked WHERE position>1 ORDER BY title LIMIT 50`;
    return NextResponse.json({ok:true,count:rows.length,duplicates:rows.map((r:any)=>({id:Number(r.id),title:r.title,marketplace:r.marketplace,price:r.price==null?null:Number(r.price)}))});
  }catch{return NextResponse.json({ok:false,error:'Não foi possível verificar duplicados.'},{status:500})}
}
export async function POST(){
  try{
    const sql=db();
    const rows=await sql`WITH ranked AS (
      SELECT id,ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(marketplace)),LOWER(TRIM(title)),price
        ORDER BY CASE WHEN status='approved' THEN 0 ELSE 1 END,
          sold_quantity DESC NULLS LAST,score DESC,updated_at DESC,id DESC) AS position
      FROM product_candidates WHERE status IN ('review','approved')
    ) UPDATE product_candidates c SET status='rejected',
      notes=CONCAT_WS(' | ',NULLIF(c.notes,''),'Duplicado consolidado; registro preservado para revisão'),updated_at=NOW()
      FROM ranked r WHERE c.id=r.id AND r.position>1 RETURNING c.id`;
    return NextResponse.json({ok:true,consolidated:rows.length});
  }catch(e:any){console.error('Deduplicate candidates:',e?.message||e);return NextResponse.json({ok:false,error:'Não foi possível consolidar duplicados.'},{status:500})}
}
