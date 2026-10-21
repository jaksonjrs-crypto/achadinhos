import {NextResponse} from 'next/server';
import {syncShopeeCommissions} from '@/lib/shopee-commissions';
export const dynamic='force-dynamic';
export const maxDuration=60;
// Protegido pelo middleware (sessão de administrador).
export async function POST(){
  try{const r=await syncShopeeCommissions({days:30});return NextResponse.json(r,{status:r.ok?200:502})}
  catch(e:any){return NextResponse.json({ok:false,message:String(e?.message||'Falha')},{status:500})}
}
