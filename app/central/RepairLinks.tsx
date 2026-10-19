'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function RepairLinks(){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [details,setDetails]=useState<any[]>([]);const router=useRouter();
  async function run(dryRun:boolean){
    setBusy(true);setDetails([]);setMessage(dryRun?'Conferindo links…':'Convertendo links pela API Shopee…');
    let afterId=0,updated=0,failed=0,unlinked=0,selected=0;
    try{for(;;){
      const r=await fetch('/api/offers/repair-links',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({afterId,dryRun})});
      const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Falha ao processar lote.');
      updated+=j.updated;failed+=j.failed;unlinked+=j.unlinked;selected+=j.selected;
      setDetails(d=>[...d,...j.details]);setMessage(dryRun?`${selected} links selecionados para revisão.`:`${updated} atualizados · ${unlinked} sem vínculo · ${failed} falhas`);
      if(j.done)break;
      if(j.nextCursor<=afterId)throw Error('Cursor não avançou. Interrompido para evitar repetição.');
      afterId=j.nextCursor;
    }router.refresh();}catch(e:any){setMessage(`${e.message} Resultados dos lotes concluídos foram preservados.`)}finally{setBusy(false)}
  }
  return <details className="newOfferBox"><summary>Revisar links Shopee</summary>
    <p>Confere os prefixos indicados no chamado de 19/10. Um prefixo sozinho não determina comissão. A conversão preserva a oferta e registra o link anterior; links já convertidos não são repetidos.</p>
    <div className="contentWorkflowActions"><button type="button" disabled={busy} onClick={()=>run(true)}>Conferir sem alterar</button><button type="button" disabled={busy} onClick={()=>run(false)}>Converter links selecionados</button><a href="/api/offers/link-history">Ver histórico</a></div>
    <p role="status">{message}</p>{details.length>0&&<ul>{details.map(d=><li key={d.id}>{d.title}: {d.message}</li>)}</ul>}
  </details>;
}
