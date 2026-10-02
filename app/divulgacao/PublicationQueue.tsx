"use client";
import {useCallback,useEffect,useState} from "react";

type Offer={id:number;title:string;marketplace:string;price:number};
type Task={id:number;offer_id:number;channel:string;status:string;cycle_date:string;scheduled_at:string|null;title:string;price:number;marketplace:string;last_error:string|null;attempts:number};
const channels=[["pinterest","Pinterest"],["instagram","Instagram"],["facebook","Facebook"],["telegram","Telegram"],["whatsapp","WhatsApp"],["tiktok","TikTok"]] as const;
const labels:Record<string,string>=Object.fromEntries(channels);
const states:Record<string,string>={ready:"Pronto",scheduled:"Agendado",publishing:"Enviando",published:"Concluído",failed:"Falhou",skipped:"Ignorado"};

export default function PublicationQueue({offers}:{offers:Offer[]}){
  const [tasks,setTasks]=useState<Task[]>([]),[offerId,setOfferId]=useState(String(offers[0]?.id||""));
  const [channel,setChannel]=useState("pinterest"),[when,setWhen]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [origin,setOrigin]=useState("");
  const [connections,setConnections]=useState<Record<string,{connected?:boolean;configured?:boolean}>>({});
  const [boards,setBoards]=useState<{id:string;name:string}[]>([]),[boardId,setBoardId]=useState("");
  const [diagnostic,setDiagnostic]=useState("");
  const reload=useCallback(async()=>{const r=await fetch("/api/publication-tasks",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Falha ao carregar fila");setTasks(d.tasks||[])},[]);
  useEffect(()=>{
    setOrigin(location.origin);reload().catch(e=>setMessage(e.message));
    fetch("/api/channels/status",{cache:"no-store"}).then(r=>r.json()).then(async s=>{
      setConnections(s);
      if(s.pinterest?.connected){const r=await fetch("/api/pinterest/boards");const d=await r.json();if(d.ok){setBoards(d.items||[]);setBoardId(String(d.items?.[0]?.id||""))}}
    }).catch(()=>{});
  },[reload]);
  async function action(body:Record<string,unknown>){
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/publication-tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Falha ao atualizar fila");await reload();setMessage(body.action==="enqueue"?"Item incluído na fila.":body.action==="reopen"?"Item devolvido à fila. Nenhuma publicação foi enviada.":body.status==="published"?"Publicação manual registrada. Este botão não envia conteúdo à rede.":"Estado atualizado.")}
    catch(e:any){setMessage(e?.message||"Falha ao atualizar fila")}
    finally{setBusy(false)}
  }
  function markManual(t:Task){
    if(window.confirm(`Você já publicou esta oferta no ${labels[t.channel]||t.channel}? Este botão apenas registra a publicação feita por você; não envia conteúdo à rede.`)){
      void action({action:"mark",id:t.id,status:"published"});
    }
  }
  async function remove(t:Task){
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/publication-tasks",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:t.id})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Falha ao remover item");await reload();setMessage("Item removido da fila.")}
    catch(e:any){setMessage(e?.message||"Falha ao remover item")}
    finally{setBusy(false)}
  }
  async function copy(t:Task){try{await navigator.clipboard.writeText(`${location.origin}/go/${t.offer_id}?channel=${t.channel}`);setMessage("Link rastreado copiado.")}catch{setMessage("Não foi possível copiar o link.")}}
  async function checkChannels(){
    setDiagnostic("Verificando…");
    try{
      const r=await fetch('/api/channels/diagnostic',{cache:'no-store'});
      if(!r.ok)throw new Error('Falha na verificação.');
      const d=await r.json();
      const pinterest=d.pinterest?.ok?'API respondeu':d.pinterest?.configured?'Conexão pendente ou falhou':'não configurado';
      const telegram=d.telegram?.ok?`bot autorizado a publicar em ${d.telegram.chat||'canal configurado'}`:d.telegram?.error||'não configurado';
      setDiagnostic(`Pinterest: ${pinterest} · Telegram: ${telegram}`);
    }catch{setDiagnostic('Não foi possível verificar os canais.')}
  }
  async function publish(t:Task){
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/publication-tasks/publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:t.id,boardId:t.channel==="pinterest"?boardId:undefined})});const d=await r.json();await reload();if(!r.ok)throw new Error(d.error||"Falha na publicação");setMessage(`${labels[t.channel]}: publicação confirmada.`)}
    catch(e:any){setMessage(e?.message||"Falha na publicação")}finally{setBusy(false)}
  }
  const pending=tasks.filter(t=>!["published","skipped"].includes(t.status)).length;
  return <section className="integrationBox publicationQueue">
    <div className="sectionTitle"><div><span className="eyebrow">DIVULGAÇÃO</span><h2>Fila operacional</h2></div><span>{pending} pendentes</span></div>
    <p className="muted">Cadastros manuais publicados e completos também entram na fila, incluindo Mercado Livre. Atualizar o cadastro não repete o envio. Agendar organiza a fila; o envio automático só ocorre em canais conectados e habilitados para isso.</p>
    <div className="queueComposer">
      <label>Oferta<select value={offerId} onChange={e=>setOfferId(e.target.value)}>{offers.map(o=><option key={o.id} value={o.id}>{o.marketplace} · {o.title}</option>)}</select></label>
      <label>Canal<select value={channel} onChange={e=>setChannel(e.target.value)}>{channels.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
      <label>Agendar (opcional)<input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)}/></label>
      <button className="mini publish" disabled={busy||!offerId} onClick={()=>action({action:"enqueue",offerId:Number(offerId),channel,scheduledAt:when?new Date(when).toISOString():null})}>Adicionar à fila</button>
    </div>
    {connections.pinterest?.connected&&boards.length>0&&<label className="queueBoard">Pasta do Pinterest <select value={boardId} onChange={e=>setBoardId(e.target.value)}>{boards.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
    <p className="muted">Pinterest: {connections.pinterest?.connected?"conectado":"conexão pendente"} · Telegram: {connections.telegram?.configured?"bot configurado":"bot pendente"} · Instagram: {connections.instagram?.configured?"publicação automática":"envio assistido"}. Facebook, WhatsApp e TikTok continuam com publicação manual.</p>
    <button className="mini secondaryMini" type="button" onClick={checkChannels}>Verificar APIs</button>{diagnostic&&<p role="status" className="muted">{diagnostic}</p>}
    {message&&<p role="status" className="noticeBox">{message}</p>}
    {tasks.length===0?<div className="empty">A fila está vazia. Escolha uma oferta e um canal para começar.</div>:
    <div className="queueList">{tasks.map(t=><article className="queueItem" key={t.id}>
      <div><b>{t.title}</b><small>{t.marketplace} · {labels[t.channel]||t.channel} · {String(t.cycle_date).slice(0,10)}{t.scheduled_at?` · ${new Date(t.scheduled_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}`:""}</small>{t.last_error&&<small className="queueError">{t.last_error}</small>}</div>
      <span className="channelTag">{states[t.status]||t.status}</span>
      <div className="rowActions">
        <a className="mini" href={`/conteudo?oferta=${t.offer_id}&canal=${t.channel}`}>Preparar</a>
        <button className="mini secondaryMini" disabled={busy} onClick={()=>copy(t)}>Copiar link</button>
        {((t.channel==="pinterest"&&connections.pinterest?.connected&&boardId)||(t.channel==="telegram"&&connections.telegram?.configured)||(t.channel==="instagram"&&connections.instagram?.configured))&&["ready","scheduled"].includes(t.status)&&<button className="mini publish" disabled={busy} onClick={()=>publish(t)}>Publicar pela API</button>}
        {t.channel==="whatsapp"&&<a className="mini" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${t.title}\nConfira: ${origin}/go/${t.offer_id}?channel=whatsapp`)}`}>Abrir WhatsApp</a>}
        {!["telegram","pinterest"].includes(t.channel)&&t.status!=="published"&&<button className="mini publish" disabled={busy} onClick={()=>markManual(t)}>Já publiquei manualmente</button>}
        {["instagram","facebook","whatsapp","tiktok"].includes(t.channel)&&t.status==="published"&&t.attempts===0&&<button className="mini secondaryMini" disabled={busy} onClick={()=>action({action:"reopen",id:t.id})}>Voltar à fila</button>}
        {t.status!=="skipped"&&t.status!=="published"&&<button className="mini secondaryMini" disabled={busy} onClick={()=>action({action:"mark",id:t.id,status:"skipped"})}>Ignorar</button>}
        {["skipped","failed"].includes(t.status)&&<button className="mini secondaryMini" disabled={busy} onClick={()=>action({action:"mark",id:t.id,status:"ready"})}>Reabrir</button>}
        {t.attempts===0&&["ready","scheduled","skipped"].includes(t.status)&&<button className="mini secondaryMini" disabled={busy} onClick={()=>remove(t)}>Remover</button>}
      </div>
    </article>)}</div>}
  </section>
}
