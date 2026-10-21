'use client';
import {useState} from 'react';
export default function SyncCommissionsButton(){
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState('');
  async function run(){
    setBusy(true);setMsg('Consultando a Shopee…');
    try{const r=await fetch('/api/commissions/sync',{method:'POST'});const d=await r.json().catch(()=>({}));
      if(d.ok){setMsg(`Atualizado: ${d.items} ite${d.items===1?'m':'ns'} no relatório.`);setTimeout(()=>location.reload(),900)}
      else setMsg(`Não foi possível atualizar: ${d.message||'erro desconhecido'}`)}
    catch{setMsg('Falha de conexão. Tente de novo em instantes.')}
    finally{setBusy(false)}
  }
  return <div className="syncCommissions"><button type="button" onClick={run} disabled={busy}>{busy?'Atualizando…':'Atualizar vendas agora'}</button>{msg&&<small role="status">{msg}</small>}</div>;
}
