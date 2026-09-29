import {NextRequest,NextResponse} from 'next/server';
import {runAutopilot} from '@/lib/autopilot-policy';
import {ADMIN_COOKIE,verifyAdminSession} from '@/lib/admin-auth';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(req:NextRequest){
  if(!await verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value))return NextResponse.json({ok:false,error:'Não autorizado'},{status:401});
  if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({ok:false,error:'Origem não autorizada'},{status:403});
  try{return NextResponse.json(await runAutopilot(),{headers:{'Cache-Control':'no-store'}})}
  catch{console.error('Manual Autopilot execution failed');return NextResponse.json({ok:false,error:'Não foi possível confirmar a execução. Confira a fila antes de tentar novamente.'},{status:500})}
}
