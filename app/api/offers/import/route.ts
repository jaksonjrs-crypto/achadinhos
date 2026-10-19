import {NextRequest,NextResponse,after} from 'next/server';
import {parseImport,importOffers,ImportRow} from '@/lib/offer-import';
import {queueManualOffers} from '@/lib/publication-queue';
export const maxDuration=300;
export async function POST(req:NextRequest){
  if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
  if(Number(req.headers.get('content-length')||0)>3*1024*1024)return NextResponse.json({error:'Arquivo muito grande.'},{status:413});
  try{
    if(req.headers.get('content-type')?.includes('multipart/form-data')){
      const form=await req.formData(),file=form.get('file');if(!(file instanceof File))throw Error('Selecione um arquivo.');
      const rows=await parseImport(Buffer.from(await file.arrayBuffer()),file.name);
      // Duplicates across batches are rejected during preview, before any write.
      const seen=new Set<string>();for(const r of rows){if(r.marketplace.toLowerCase()==='shopee'&&r.itemId){if(seen.has(r.itemId))throw Error(`ID duplicado no arquivo: ${r.itemId}`);seen.add(r.itemId);}}
      const result=await importOffers(rows,true);return NextResponse.json({ok:true,rows,...result});
    }
    const body=await req.json();const rows:ImportRow[]=body.rows;if(!Array.isArray(rows)||!rows.length||rows.length>10)throw Error('Envie de 1 a 10 linhas por lote.');
    const result=await importOffers(rows,false);
    if(result.created)after(async()=>{try{await queueManualOffers()}catch{console.error('Importação salva; inclusão na fila pendente.');}});
    return NextResponse.json({ok:true,...result});
  }catch(e:any){return NextResponse.json({error:e.message||'Falha na importação.'},{status:400});}
}
