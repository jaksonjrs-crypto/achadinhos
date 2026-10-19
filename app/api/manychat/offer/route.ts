import {NextRequest,NextResponse} from 'next/server';
import {prepareManychat} from '@/lib/manychat';
export const dynamic='force-dynamic';
export const maxDuration=120;
async function respond(req:NextRequest,sync:boolean){
  if(sync&&req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
  const id=Number(req.nextUrl.searchParams.get('id')),channel=req.nextUrl.searchParams.get('channel')||'instagram';
  if(!Number.isSafeInteger(id)||id<1||!['instagram','facebook'].includes(channel))return NextResponse.json({error:'Oferta/canal inválido.'},{status:400});
  try{return NextResponse.json({ok:true,...await prepareManychat(id,channel,req.nextUrl.origin,sync)},{headers:{'Cache-Control':'no-store'}})}
  catch(e:any){return NextResponse.json({ok:false,error:e.message||'Não foi possível preparar Manychat.'},{status:400})}
}
export const GET=(req:NextRequest)=>respond(req,false);
export const POST=(req:NextRequest)=>respond(req,true);
