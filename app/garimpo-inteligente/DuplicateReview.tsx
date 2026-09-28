"use client";
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
export default function DuplicateReview(){
  const [count,setCount]=useState<number|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);const router=useRouter();
  async function inspect(){try{const r=await fetch('/api/candidates/deduplicate',{cache:'no-store'});const d=await r.json();if(d.ok)setCount(d.count);else setMessage(d.error||'Falha ao verificar duplicados')}catch{setMessage('Falha ao verificar duplicados')}}
  useEffect(()=>{inspect()},[]);
  async function consolidate(){setBusy(true);setMessage('');try{const r=await fetch('/api/candidates/deduplicate',{method:'POST'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Falha');setMessage(`${d.consolidated} duplicado(s) retirado(s) da fila. Os registros foram preservados como rejeitados.`);setCount(0);router.refresh()}catch(e:any){setMessage(e?.message||'Falha')}finally{setBusy(false)}}
  return <div className="duplicateReview"><span>{count==null?'Verificando duplicados…':count?`${count} duplicado(s) exato(s) na fila`:'Sem duplicados exatos na fila'}</span>{Boolean(count)&&<button className="mini secondaryMini" disabled={busy} onClick={consolidate}>{busy?'Consolidando…':'Consolidar duplicados'}</button>}{message&&<small role="status">{message}</small>}</div>
}
