import {NextRequest,NextResponse} from 'next/server';
import {runAutopilot} from '@/lib/autopilot-policy';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({ok:false,error:'Não autorizado'},{status:401});
  try{return NextResponse.json(await runAutopilot())}
  catch(e:any){console.error('Autopilot cron:',e?.message||e);return NextResponse.json({ok:false,error:'Falha no Autopiloto.'},{status:500})}
}
