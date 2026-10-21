import {NextResponse} from 'next/server';
import {getVitrineHome} from '@/lib/vitrine-home';
export const dynamic='force-dynamic';
export async function GET(){
  try{return NextResponse.json(await getVitrineHome(),{headers:{'Cache-Control':'no-store'}})}
  catch{return NextResponse.json({error:'Vitrine temporariamente indisponível.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
