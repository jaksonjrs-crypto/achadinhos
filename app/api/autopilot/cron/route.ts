import {NextRequest,NextResponse,after} from 'next/server';
import {syncCommissionsIfStale} from '@/lib/shopee-commissions';
import {runAutopilot} from '@/lib/autopilot-policy';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(req:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({ok:false,error:'Não autorizado'},{status:401});
  // v3.6.0: aproveita a rotina para atualizar vendas/comissões da Shopee a cada 3 horas.
  after(async()=>{try{await syncCommissionsIfStale(3)}catch(e:any){console.error('Commission sync:',e?.message||e)}});
  try{return NextResponse.json(await runAutopilot())}
  catch(e:any){console.error('Autopilot cron:',e?.message||e);return NextResponse.json({ok:false,error:'Falha no Autopiloto.'},{status:500})}
}
