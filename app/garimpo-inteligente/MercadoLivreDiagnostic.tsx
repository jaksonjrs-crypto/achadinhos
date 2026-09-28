"use client";
import {useState} from "react";

type Result=Record<string,any>;
export default function MercadoLivreDiagnostic(){
  const [item,setItem]=useState(""); const [seller,setSeller]=useState(""); const [catalog,setCatalog]=useState("casa cozinha organização");
  const [busy,setBusy]=useState(""); const [result,setResult]=useState<Result|null>(null);
  async function run(mode:string,value:string,key:string){
    setBusy(mode);setResult(null);
    try{
      const q=new URLSearchParams({mode,[key]:value});
      const r=await fetch(`/api/mercadolivre/diagnostic?${q}`,{cache:"no-store"});
      const j=await r.json();setResult(j);
    }catch(e:any){setResult({ok:false,error:e?.message||"Falha no teste"})}finally{setBusy("")}
  }
  return <details className="adminDisclosure mlDiagnostic"><summary>Diagnóstico Mercado Livre</summary>
    <div className="integrationBox">
      <p className="muted">Diagnóstico técnico. O OAuth está ativo; catálogo respondeu, enquanto item e busca por vendedor de terceiros retornaram 403 nos testes desta aplicação. Estes testes não alteram tokens, produtos ou ofertas.</p>
      <div className="mlDiagGrid">
        <label><b>Catálogo → Buy Box</b><span>Busca produtos de catálogo e verifica se existe publicação vencedora.</span><input value={catalog} onChange={e=>setCatalog(e.target.value)} placeholder="Ex.: air fryer"/><button className="mini publish" disabled={!!busy} onClick={()=>run("catalog",catalog,"q")}>{busy==="catalog"?"Testando…":"Testar catálogo"}</button></label>
        <label><b>Item conhecido</b><span>Cole um código MLB ou URL de um anúncio real do Mercado Livre.</span><input value={item} onChange={e=>setItem(e.target.value)} placeholder="MLB1234567890 ou URL"/><button className="mini publish" disabled={!!busy||!item.trim()} onClick={()=>run("item",item,"value")}>{busy==="item"?"Testando…":"Testar item"}</button></label>
        <label><b>Vendedor conhecido</b><span>Informe seller_id numérico ou nickname para testar anúncios ativos.</span><input value={seller} onChange={e=>setSeller(e.target.value)} placeholder="seller_id ou nickname"/><button className="mini publish" disabled={!!busy||!seller.trim()} onClick={()=>run("seller",seller,"seller")}>{busy==="seller"?"Testando…":"Testar vendedor"}</button></label>
      </div>
      {result&&<div className={`mlDiagResult ${result.ok?"ok":"warn"}`}><b>{result.ok?"Teste respondeu com sucesso":"Teste não liberado / falhou"}</b><pre>{JSON.stringify(result,null,2)}</pre></div>}
    </div>
  </details>
}
