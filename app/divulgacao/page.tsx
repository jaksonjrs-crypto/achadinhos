import { APP_VERSION } from "@/lib/version";
import { listPublishedOffers } from "@/lib/offers";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export default async function Divulgacao(){
  let offers:any[]=[];try{offers=await listPublishedOffers()}catch{}
  return <main className="panel">
    <div className="adminPageHead"><div><span className="badge">{APP_VERSION}</span><h1>Fila de Divulgação</h1><p className="muted">O Autopiloto deixa cada oferta pronta; escolha um canal apenas quando quiser revisar ou publicar.</p></div></div>
    <div className="noticeBox"><b>Estratégia:</b> bio/perfil → <code>/ofertas</code>. Post de produto → link individual rastreado por canal.</div>
    {offers.length===0?<div className="empty">Nenhuma oferta publicada disponível para divulgação.</div>:
    <section className="disclosureCards" aria-label="Ofertas prontas para divulgação">
      {offers.map(o=><article className="disclosureCard" key={o.id}>
        <div className="disclosureProduct"><div><small>{o.marketplace} · {o.category}</small><h2>{o.title}</h2></div><strong>{money(o.price)}</strong></div>
        <div className="disclosureActions">
          <a className="mini publish" href={`/conteudo?oferta=${o.id}&canal=pinterest`}>Pinterest</a>
          <a className="mini" href={`/conteudo?oferta=${o.id}&canal=instagram`}>Instagram</a>
          <a className="mini" href={`/conteudo?oferta=${o.id}&canal=whatsapp`}>WhatsApp</a>
          <a className="mini" href={`/conteudo?oferta=${o.id}&canal=telegram`}>Telegram</a>
          <a className="mini secondaryMini" href={`/criativos?oferta=${o.id}`}>Criativo</a>
        </div>
      </article>)}
    </section>}
  </main>
}
