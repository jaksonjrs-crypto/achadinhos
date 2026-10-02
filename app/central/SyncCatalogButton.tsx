"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function SyncCatalogButton(){
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  const [details,setDetails]=useState<{id:number;title:string;status:string;message:string}[]>([]);
  const router=useRouter();
  async function run(){
    setBusy(true);setMsg("Atualizando…");setDetails([]);
    try{
      const r=await fetch("/api/catalog/sync",{method:"POST"});const j=await r.json();
      if(!r.ok||!j.ok)throw new Error(j.error||"Falha");
      setMsg(`${j.checked} verificados · ${j.updated} alterados · ${j.unchanged} sem alteração · ${j.unlinked||0} sem vínculo · ${j.failed} falhas`);
      setDetails(j.details||[]);router.refresh();
    }catch(e:any){setMsg(e.message||"Falha ao atualizar")}finally{setBusy(false)}
  }
  return <div><div className="syncCatalog"><button className="mini publish" onClick={run} disabled={busy}>{busy?"Atualizando…":"↻ Atualizar preços agora"}</button>{msg&&<small role="status">{msg}</small>}</div>{details.length>0&&<details><summary>Ver resultado por produto</summary><ul>{details.map(d=><li key={d.id}><b>{d.title}</b>: {d.message}</li>)}</ul></details>}</div>;
}
