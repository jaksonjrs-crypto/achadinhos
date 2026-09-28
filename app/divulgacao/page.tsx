import { APP_VERSION } from "@/lib/version";
import { listPublishedOffers } from "@/lib/offers";
import { productDisplayTitle } from "@/lib/product-title";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export default async function Divulgacao(){
  let offers:any[]=[];try{offers=await listPublishedOffers()}catch{}
  return <main className="panel">
    <div className="adminPageHead"><div><span className="badge">{APP_VERSION}</span><h1>Divulgação</h1><p className="muted">Um único ponto para preparar texto, criativo e publicação assistida das ofertas.</p></div><div className="headActions"><a className="mini publish" href="/automacao">Abrir fila operacional</a></div></div>
    <section className="flowSteps"><div><b>1</b><span>Escolha a oferta</span></div><div><b>2</b><span>Prepare texto ou criativo</span></div><div><b>3</b><span>Publique no canal</span></div><div><b>4</b><span>Acompanhe em Resultados</span></div></section>
    <div className="noticeBox"><b>Estratégia:</b> bio/perfil → <code>/ofertas</code>. Post de produto → link individual rastreado por canal.</div>
    {offers.length===0?<div className="empty">Nenhuma oferta publicada disponível para divulgação.</div>:
    <section className="disclosureCards" aria-label="Ofertas prontas para divulgação">
      {offers.map(o=><article className="disclosureCard" key={o.id}>
        <div className="disclosureProduct"><div><small>{o.marketplace} · {o.category}</small><h2>{productDisplayTitle(o.title)}</h2></div><strong>{money(o.price)}</strong></div>
        <div className="disclosureActions">
          <a className="mini publish" href={`/conteudo?oferta=${o.id}&canal=pinterest`}>Pinterest</a>
          <a className="mini" href={`/conteudo?oferta=${o.id}&canal=instagram`}>Instagram</a>
          <a className="mini" href={`/conteudo?oferta=${o.id}&canal=whatsapp`}>WhatsApp</a>
          <a className="mini" href={`/conteudo?oferta=${o.id}&canal=telegram`}>Telegram</a>
          <a className="mini secondaryMini" href={`/criativos?oferta=${o.id}`}>Criativo</a><a className="mini secondaryMini" href="/resultados">Resultados</a>
        </div>
      </article>)}
    </section>}
  </main>
}
