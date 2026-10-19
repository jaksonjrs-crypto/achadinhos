'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
type Result={updated:number;created:number;failed:number;skipped:number;details:{row:number;status:string;message:string}[];rows?:unknown[]};
export default function ImportOffers({format}:{format:'xlsx'|'csv'}){
  const input=useRef<HTMLInputElement>(null),router=useRouter();
  const [busy,setBusy]=useState(false),[result,setResult]=useState<Result|null>(null),[error,setError]=useState(''),[done,setDone]=useState(false);
  async function preview(file:File){setBusy(true);setError('');setResult(null);setDone(false);
    try{const f=new FormData();f.set('file',file);const r=await fetch('/api/offers/import',{method:'POST',body:f}),j=await r.json();if(!r.ok)throw Error(j.error);setResult(j);}catch(e:any){setError(e.message);}finally{setBusy(false);if(input.current)input.current.value='';}}
  async function apply(){if(!result?.rows)return;setBusy(true);setError('');const rows=result.rows;let total:Result={updated:0,created:0,failed:0,skipped:0,details:[]};
    try{for(let i=0;i<rows.length;i+=10){const r=await fetch('/api/offers/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:rows.slice(i,i+10)})}),j=await r.json();if(!r.ok)throw Error(j.error);total={updated:total.updated+j.updated,created:total.created+j.created,failed:total.failed+j.failed,skipped:total.skipped+j.skipped,details:[...total.details,...j.details]};setResult({...total});}setDone(true);}catch(e:any){setError(`${e.message} Lotes concluídos foram preservados; reimporte o arquivo para continuar.`);}finally{setBusy(false);router.refresh();}}
  return <div><button type="button" disabled={busy} onClick={()=>input.current?.click()}>{format==='xlsx'?'Importar Excel (.xlsx)':'Importar Google Sheets (CSV)'}</button><input ref={input} type="file" accept={format==='xlsx'?'.xlsx':'.csv'} hidden onChange={e=>{const f=e.target.files?.[0];if(f)void preview(f);}}/>
    {busy&&<p role="status">Processando importação…</p>}{error&&<p role="alert">{error}</p>}{result&&<section className="noticeBox" aria-label="Resumo da importação"><b>{done?'Importação concluída':result.rows?'Prévia da importação':'Importação em andamento'}</b><p role="status">{result.updated} atualizados · {result.created} criados · {result.failed} falhas · {result.skipped} sem alteração/ignorados</p><p>Ofertas existentes: altera somente Link Afiliado e Sub ID. Sub ID vazio preserva o atual. Links importados ficam com verificação pendente. Outros marketplaces e linhas sem ID Shopee são preservados.</p>{result.rows&&<button type="button" disabled={busy||result.failed>0||result.updated+result.created===0} onClick={apply}>Confirmar importação</button>}<details><summary>Ver resultado por linha</summary><ul>{result.details.map((d,i)=><li key={i}>Linha {d.row}: {d.message}</li>)}</ul></details></section>}
  </div>;
}
