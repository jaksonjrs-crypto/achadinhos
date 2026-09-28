"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

const themes=[
  ["Casa","casa cozinha organização limpeza"],
  ["Eletrônicos","eletrônicos acessórios celular"],
  ["Infantil","brinquedos infantil"],
  ["Beleza","beleza cuidados pessoais"]
] as const;

export default function ShopeeImportButton(){
  const [theme,setTheme]=useState("Casa");
  const [page,setPage]=useState(1);
  const [state,setState]=useState("");
  const [busy,setBusy]=useState(false);
  const [approving,setApproving]=useState(false);
  const [preparing,setPreparing]=useState(false);
  const router=useRouter();
  async function run(next=false){
    const selected=themes.find(x=>x[0]===theme) || themes[0];
    const target=next?page+1:1;
    setBusy(true);setState("Garimpando ofertas da Shopee…");
    try{
      const q=new URLSearchParams({limit:"20",page:String(target),keyword:selected[1],category:selected[0],minScore:"65"});
      const r=await fetch(`/api/shopee/import?${q}`,{method:"POST"});
      const j=await r.json();
      if(!r.ok||!j.ok) throw new Error(j.error||"Falha");
      setPage(target);
      setState(`${j.imported} importados · ${j.skippedQuality} abaixo do corte · ${j.skippedDuplicate} duplicados · ${j.skippedUnsafe} bloqueados`);
      router.refresh();
    }catch(e:any){setState(e.message||"Falha ao importar")}
    finally{setBusy(false)}
  }

  async function approveTop(){
    setApproving(true);setState("Revisando candidatos com score 80+…");
    try{
      const r=await fetch("/api/candidates/batch-approve",{method:"POST"});
      const j=await r.json();
      if(!r.ok||!j.ok) throw new Error(j.error||"Falha");
      setState(`${j.approved} candidatos 80+ aprovados · ${j.blocked} bloqueados pela segurança`);
      router.refresh();
    }catch(e:any){setState(e.message||"Falha ao aprovar lote")}
    finally{setApproving(false)}
  }


  async function prepareTop(){
    setPreparing(true);setState("Preparando aprovados 80+ na Central…");
    try{
      const r=await fetch("/api/candidates/batch-promote",{method:"POST"});
      const j=await r.json();
      if(!r.ok||!j.ok) throw new Error(j.error||"Falha");
      setState(`${j.created} ofertas em rascunho criadas · ${j.updated} sincronizadas · ${j.blocked} bloqueadas`);
      router.refresh();
    }catch(e:any){setState(e.message||"Falha ao preparar lote")}
    finally{setPreparing(false)}
  }

  return <div className="importToolbar">
    <select aria-label="Tema do garimpo" value={theme} onChange={e=>{setTheme(e.target.value);setPage(1)}}>{themes.map(([label])=><option key={label}>{label}</option>)}</select>
    <button onClick={()=>run(false)} disabled={busy}>{busy?"Garimpando…":"Garimpar Shopee"}</button>
    <button className="secondaryMini" onClick={()=>run(true)} disabled={busy}>Próxima</button>
    <details className="importMore"><summary>Mais</summary><div><button onClick={approveTop} disabled={busy||approving}>{approving?"Aprovando…":"Aprovar 80+"}</button><button onClick={prepareTop} disabled={busy||approving||preparing}>{preparing?"Preparando…":"Preparar 80+"}</button></div></details>
    {state&&<span className="importState">{state}</span>}
  </div>
}
