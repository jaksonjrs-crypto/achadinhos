import {NextRequest,NextResponse} from 'next/server';
import {listAllOffers} from '@/lib/offers';
import {filterOffers} from '@/lib/offer-filters';
import {ensureAffiliateRegistry} from '@/lib/affiliate-registry';
import {exportRows,csvExport,xlsxExport} from '@/lib/offer-export';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  const format=req.nextUrl.searchParams.get('format')||'xlsx';
  if(!['xlsx','csv'].includes(format))return NextResponse.json({error:'Formato inválido.'},{status:400});
  try{
    const offers=filterOffers(await listAllOffers(),Object.fromEntries(req.nextUrl.searchParams));
    const sql=await ensureAffiliateRegistry();const registry=await sql`SELECT affiliate_url,external_id,sub_id FROM affiliate_link_registry`;
    const byUrl=new Map(registry.map((r:any)=>[r.affiliate_url,r]));
    const rows=exportRows(offers.map(o=>({...o,sub_id:o.affiliate_sub_id??byUrl.get(o.affiliate_url)?.sub_id??''})),req.nextUrl.origin);
    const verified=new Set<string>(registry.map((r:any)=>String(r.affiliate_url)));
    const body=format==='csv'?csvExport(rows):new Uint8Array(xlsxExport(rows,verified));
    return new NextResponse(body,{headers:{'Content-Type':format==='csv'?'text/csv; charset=utf-8':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="Vitrine_Ofertas_${new Date().toISOString().slice(0,10)}.${format}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch{return NextResponse.json({error:'Não foi possível exportar as ofertas. Tente novamente.'},{status:500})}
}
