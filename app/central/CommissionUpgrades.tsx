"use client";
// v3.6.8 — Compara a comissão das ofertas com anúncios equivalentes e permite trocar com um clique.
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
type S={offer_id:number;offer_title:string;current_rate:number|null;current_price:number;rate:number;price:number;sales:number;rating:number;shop:string;title:string;gain:number;image_url:string};
const pct=(v:any)=>v==null?"?":`${(Number(v)*100).toFixed(0)}%`;
const money=(v:any)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
export default function CommissionUpgrades(){
  const [items,setItems]=useState<S[]>([]),[busy,setBusy]=useState(""),[msg,setMsg]=useState("");
  const router=useRouter();
  async function load(){try{const r=await fetch("/api/offers/commission-upgrades");const j=await r.json();if(j.ok)setItems(j.suggestions||[])}catch{}}
  useEffect(()=>{load()},[]);
  async function post(body:any,label:string){
    setBusy(label);setMsg("");
    try{const r=await fetch("/api/offers/commission-upgrades",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const j=await r.json();
      if(!r.ok||!j.ok)throw new Error(j.error||"Falha");
      if(body.action==="scan")setMsg(`${j.checked} ofertas comparadas · ${j.found} com comissão melhor disponível${j.failed?` · ${j.failed} falhas`:""}`);
      if(body.action==="apply")setMsg("Oferta trocada para o anúncio de maior comissão. Links e automações continuam iguais.");
      await load();router.refresh();
    }catch(e:any){setMsg(e.message||"Falha")}finally{setBusy("")}
  }
  return <div className="commissionUpgrades">
    <div className="syncCatalog"><button className="mini" disabled={!!busy} onClick={()=>post({action:"scan"},"scan")}>{busy==="scan"?"Comparando…":"💰 Comparar comissões"}</button>{msg&&<small role="status">{msg}</small>}</div>
    {items.length>0&&<details open><summary>{items.length} oferta(s) podem render mais por venda</summary><ul className="upgradeList">{items.map(s=><li key={s.offer_id}>
      {s.image_url?<img src={s.image_url} alt="" loading="lazy"/>:null}
      <span><b>{s.offer_title}</b><small>Hoje {pct(s.current_rate)} de {money(s.current_price)} → <b>{pct(s.rate)}</b> de {money(s.price)} na loja {s.shop} ({Number(s.sales)} vendas, {Number(s.rating).toFixed(1)}★) · <b>+{money(s.gain)}</b> por venda</small></span>
      <button className="mini publish" disabled={!!busy} onClick={()=>post({action:"apply",offerId:s.offer_id},"apply"+s.offer_id)}>{busy==="apply"+s.offer_id?"Trocando…":"Trocar"}</button>
      <button className="mini" disabled={!!busy} onClick={()=>post({action:"dismiss",offerId:s.offer_id},"d"+s.offer_id)}>Manter</button>
    </li>)}</ul></details>}
  </div>;
}
