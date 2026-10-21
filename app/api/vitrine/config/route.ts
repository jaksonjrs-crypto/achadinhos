import {NextRequest,NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {ensureVitrineConfig,highlightTitle} from '@/lib/vitrine-config';
export async function POST(req:NextRequest){
  if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
  const form=await req.formData();
  const titulo=highlightTitle(form.get('titulo'));
  if(Array.from(titulo).length>100)return NextResponse.json({error:'O título deve ter até 100 caracteres.'},{status:400});
  const sql=await ensureVitrineConfig();
  await sql`UPDATE vitrine_config SET titulo_destaque=${titulo},exibir_titulo_destaque=${form.get('exibir_titulo')==='on'},destaque_ativo=${form.get('destaque_ativo')==='on'} WHERE id=1`;
  revalidatePath('/ofertas');revalidatePath('/');
  return NextResponse.redirect(new URL('/central?config_saved=1',req.url),303);
}
