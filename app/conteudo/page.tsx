import { APP_VERSION } from "@/lib/version";
import { listPublishedOffers } from "@/lib/offers";
import ContentTools from "./ContentTools";
import { productDisplayTitle } from "@/lib/product-title";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export default async function Conteudo({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  let offers:any[]=[];try{offers=await listPublishedOffers()}catch{}
  const requested=Number(params.oferta||0);
  const selected=offers.find(o=>Number(o.id)===requested)||offers[0];
  const allowedChannels=["instagram","whatsapp","telegram","pinterest","vitrine"] as const;
  const requestedChannel=allowedChannels.includes(params.canal as any)?params.canal as typeof allowedChannels[number]:"instagram";

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span><h1>Central de Conteúdo 3.0</h1>
    <p className="muted">Escolha uma oferta e prepare textos e links rastreados por canal sem precisar percorrer o catálogo inteiro.</p>
    <div className="noticeBox">
      <b>Estratégia de links:</b> use <code>/ofertas</code> na bio/perfil das redes sociais. Em posts de produto, use o link rastreado individual gerado abaixo; ele registra o canal e segue para a Shopee.
    </div>
    {offers.length===0?<div className="empty">Publique uma oferta para gerar os textos de divulgação.</div>:<>
      <form className="offerSelector" method="get">
        <label>Oferta para divulgar<select name="oferta" defaultValue={String(selected.id)}>{offers.map(o=><option value={o.id} key={o.id}>{productDisplayTitle(o.title)}</option>)}</select></label>
        <button type="submit">Carregar</button>
      </form>
      <article className="contentCard focusedContent">
        <div><span className="channelTag">{selected.marketplace}</span><h2>{productDisplayTitle(selected.title)}</h2><strong className="contentPrice">{money(selected.price)}</strong></div>
        <ContentTools id={selected.id} title={productDisplayTitle(selected.title)} priceLabel={money(selected.price)} marketplace={selected.marketplace} initialChannel={requestedChannel}/>
        <div className="contentWorkflowActions"><a className="button" href={`/criativos?oferta=${selected.id}`}>Criar peça desta oferta</a><a className="mini secondaryMini" href="/divulgacao">Abrir fila de divulgação</a><a className="mini" href="/ofertas">Abrir Vitrine</a></div>
      </article>
    </>}
  </main>
}
