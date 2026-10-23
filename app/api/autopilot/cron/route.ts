import {NextRequest,NextResponse,after} from 'next/server';
import {syncCommissionsIfStale} from '@/lib/shopee-commissions';
import {syncCatalog} from '@/lib/catalog-sync';
import {runAutopilot} from '@/lib/autopilot-policy';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(req:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({ok:false,error:'Não autorizado'},{status:401});
  // v3.6.0: aproveita a rotina para atualizar vendas/comissões da Shopee a cada 3 horas.
  after(async()=>{try{await syncCommissionsIfStale(3)}catch(e:any){console.error('Commission sync:',e?.message||e)}});
  // v3.6.9: confere 15 preços Shopee por hora (os mais antigos primeiro) — cada oferta é revista a cada ~6h,
  // além da rodada diária completa das 3h17. Mudanças de preço vão direto para a vitrine.
  after(async()=>{try{await syncCatalog(15)}catch(e:any){console.error('Hourly price sync:',e?.message||e)}});
  try{return NextResponse.json(await runAutopilot())}
  catch(e:any){console.error('Autopilot cron:',e?.message||e);return NextResponse.json({ok:false,error:'Falha no Autopiloto.'},{status:500})}
}
