"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function BatchPublishButton(){
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const router=useRouter();
 async function run(){
  if(!confirm("Publicar até 20 rascunhos Shopee que estejam completos e aprovados pelos filtros de segurança?"))return;
  setBusy(true);setMsg("Validando lote…");
  try{
   const r=await fetch("/api/offers/batch-publish",{method:"POST"}),j=await r.json();
   if(!r.ok||!j.ok)throw new Error(j.error||"Falha");
   setMsg(`${j.published} publicadas · ${j.incomplete} incompletas · ${j.blocked} bloqueadas`);
   router.refresh();
  }catch(e:any){setMsg(e.message||"Falha ao publicar lote")}
  finally{setBusy(false)}
 }
 return <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",margin:"12px 0"}}>
  <button onClick={run} disabled={busy} style={{padding:"10px 14px",borderRadius:10,fontWeight:800}}>
   {busy?"Publicando…":"Publicar lote Shopee pronto"}
  </button>
  {msg&&<small>{msg}</small>}
 </div>
}
