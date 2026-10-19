import {NextRequest,NextResponse} from 'next/server';
import {repairAffiliateBatch} from '@/lib/affiliate-repair';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function POST(req:NextRequest){
  if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
  const body=await req.json().catch(()=>({}));
  const afterId=Number(body.afterId||0);
  if(!Number.isSafeInteger(afterId)||afterId<0)return NextResponse.json({error:'Cursor inválido.'},{status:400});
  try{return NextResponse.json({ok:true,...await repairAffiliateBatch(afterId,body.dryRun!==false)},{headers:{'Cache-Control':'no-store'}})}
  catch{return NextResponse.json({ok:false,error:'Não foi possível processar o lote. Histórico já salvo foi preservado.'},{status:500})}
}
