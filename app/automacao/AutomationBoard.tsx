"use client";
import { useMemo, useState } from "react";

type Offer={id:number;title:string;priceLabel:string;imageUrl:string|null;marketplace:string};
const channels=[
  {name:"Instagram",key:"instagram",time:"12:15",mode:"Legenda + criativo"},
  {name:"WhatsApp",key:"whatsapp",time:"13:00",mode:"Mensagem + link"},
  {name:"Telegram",key:"telegram",time:"18:30",mode:"Mensagem + link"},
  {name:"Pinterest",key:"pinterest",time:"20:00",mode:"Texto + criativo"},
] as const;

export default function AutomationBoard({offers}:{offers:Offer[]}){
  const [done,setDone]=useState<Record<string,boolean>>({});
  const [copied,setCopied]=useState("");
  const tasks=useMemo(()=>offers.flatMap(o=>channels.map(c=>({o,c,id:`${o.id}-${c.key}`}))),[offers]);
  const completed=tasks.filter(t=>done[t.id]).length;
  const progress=tasks.length?Math.round(completed/tasks.length*100):0;

  async function copyLink(offerId:number,channel:string,id:string){
    const url=`${window.location.origin}/go/${offerId}?channel=${encodeURIComponent(channel)}`;
    await navigator.clipboard.writeText(url);setCopied(id);setTimeout(()=>setCopied(""),1300);
  }
  function shareWhatsApp(o:Offer){
    const url=`${window.location.origin}/o/${o.id}?c=w`;
    const text=`🔥 Achado de hoje!\n🔗 Confira a promoção:\n${url}\n\n*Promoção sujeita a alteração a qualquer momento.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer");
  }

  return <section>
    <div className="operationProgress">
      <div><span>Progresso da rodada manual</span><strong>{completed}/{tasks.length}</strong></div>
      <div className="operationBar"><i style={{width:`${progress}%`}}/></div>
      <small>As marcações valem nesta sessão do navegador e ajudam a controlar o que já foi divulgado.</small>
    </div>

    <div className="scheduleGrid">{offers.map(o=><article className="scheduleCard" key={o.id}>
      <div className="scheduleProduct">
        {o.imageUrl?<img src={o.imageUrl} alt=""/>:<div className="schedulePlaceholder">Vitrine</div>}
        <div><span className="channelTag">{o.marketplace}</span><h3>{o.title}</h3><strong>{o.priceLabel}</strong></div>
      </div>
      <div className="scheduleChannels">
        {channels.map(c=>{const id=`${o.id}-${c.key}`;return <div className={`scheduleRow operationRow ${done[id]?"done":""}`} key={c.key}>
          <div><b>{c.time}</b><span>{c.name}</span><small>{c.mode}</small></div>
          <div className="operationActions">
            {c.key==="whatsapp"&&<button type="button" className="whatsappShare" onClick={()=>shareWhatsApp(o)}>Enviar no WhatsApp</button>}
            <button type="button" onClick={()=>copyLink(o.id,c.key,id)}>{copied===id?"Copiado!":"Copiar link"}</button>
            <button type="button" className="doneBtn" onClick={()=>setDone(v=>({...v,[id]:!v[id]}))}>{done[id]?"Concluído ✓":"Marcar concluído"}</button>
          </div>
        </div>})}
      </div>
      <div className="scheduleActions"><a className="mini publish" href={`/conteudo?oferta=${o.id}`}>Abrir textos</a><a className="mini secondaryMini" href={`/criativos?oferta=${o.id}`}>Abrir criativos</a></div>
    </article>)}</div>
  </section>
}
