import {NextRequest,NextResponse} from 'next/server';
import {ensureMiningProfiles,miningProfiles} from '@/lib/mining-profiles';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({profiles:await miningProfiles()},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida'},{status:403});
 try{
 const b=await req.json();const existing=(await miningProfiles()).find(p=>p.id===b.id);
 const id=existing?.id||crypto.randomUUID(),name=String(b.name||'').trim();
 const list=(x:unknown)=>String(x||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean).slice(0,100);
 const price=(x:unknown)=>x===''||x==null?null:Number(x);
 const min=price(b.min_price),max=price(b.max_price),score=Number(b.min_score);
 const start=b.starts_on||null,end=b.ends_on||null;
 if(!name||name.length>100||![min,max].every(x=>x===null||Number.isFinite(x)&&x>=0)||min!==null&&max!==null&&min>max||!Number.isInteger(score)||score<0||score>100||[start,end].some(d=>d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||Number.isNaN(Date.parse(d))))||start&&end&&start>end)throw Error('Confira nome, preços, score e datas.');
 const sql=await ensureMiningProfiles();
 await sql`INSERT INTO mining_profiles(id,name,keywords,forbidden,categories,min_price,max_price,min_score,active,starts_on,ends_on,manual_only)
 VALUES(${id},${name},${list(b.keywords)},${list(b.forbidden)},${list(b.categories)},${min},${max},${score},${id==='livre'?false:Boolean(b.active)},${start},${end},${id==='livre'})
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,keywords=EXCLUDED.keywords,forbidden=EXCLUDED.forbidden,categories=EXCLUDED.categories,min_price=EXCLUDED.min_price,max_price=EXCLUDED.max_price,min_score=EXCLUDED.min_score,active=EXCLUDED.active,starts_on=EXCLUDED.starts_on,ends_on=EXCLUDED.ends_on`;
 return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Falha ao salvar perfil'},{status:400});}
}
