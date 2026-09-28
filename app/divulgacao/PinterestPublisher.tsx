"use client";
import { useEffect,useState } from "react";
type Offer={id:number;title:string};
export default function PinterestPublisher({offers}:{offers:Offer[]}){
  const [status,setStatus]=useState<any>(null),[boards,setBoards]=useState<any[]>([]);
  const [board,setBoard]=useState(""),[offer,setOffer]=useState(String(offers[0]?.id||""));
  const [msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{
    fetch("/api/pinterest/status").then(r=>r.json()).then(async s=>{
      setStatus(s);
      if(s.connected){
        const b=await fetch("/api/pinterest/boards").then(r=>r.json());
        if(b.ok){setBoards(b.items||[]);setBoard(String(b.items?.[0]?.id||""))}
        else setMsg(b.error||"Não foi possível listar as pastas.");
      }
    }).catch(()=>setStatus({connected:false}));
  },[]);
  async function publish(){
    if(!offer||!board)return;
    if(!confirm("Publicar esta oferta no Pinterest agora?"))return;
    setBusy(true);setMsg("");
    try{
      const r=await fetch("/api/pinterest/publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({offerId:Number(offer),boardId:board})});
      const d=await r.json(); setMsg(d.ok?`Pin publicado com sucesso${d.pin?.id?` · ID ${d.pin.id}`:""}.`:d.error||"Falha na publicação.");
    }catch{setMsg("Falha de comunicação com o Pinterest.");}
    finally{setBusy(false);}
  }
  if(!status)return <section className="integrationBox"><b>Pinterest</b><p>Verificando conexão…</p></section>;
  if(!status.envConfigured)return <section className="integrationBox"><span className="channelTag">Pinterest API</span><h2>Configuração necessária</h2><p>Cadastre as 3 variáveis do Pinterest na Vercel e depois conecte a conta.</p></section>;
  if(!status.connected)return <section className="integrationBox"><span className="channelTag">Pinterest API</span><h2>Conectar conta Business</h2><p>Autorize o Garimpo Afiliados a listar suas pastas e criar Pins.</p><a className="button" href="/api/auth/pinterest/login">Conectar Pinterest</a></section>;
  return <section className="integrationBox">
    <span className="channelTag">Pinterest API</span><h2>Publicação oficial</h2>
    <p className="muted">Escolha a oferta e a pasta. O Pin usará o link rastreado do canal Pinterest.</p>
    <div className="pinterestControls">
      <select value={offer} onChange={e=>setOffer(e.target.value)}>{offers.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</select>
      <select value={board} onChange={e=>setBoard(e.target.value)}>{boards.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      <button onClick={publish} disabled={busy||!offer||!board}>{busy?"Publicando…":"Publicar no Pinterest"}</button>
    </div>
    {msg&&<p className="noticeBox">{msg}</p>}
  </section>;
}
