import { APP_VERSION } from "@/lib/version";
import { listPublishedOffers } from "@/lib/offers";
import CreativeMaker from "./CreativeMaker";
import { productDisplayTitle } from "@/lib/product-title";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export default async function Criativos({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  let offers:any[]=[];try{offers=await listPublishedOffers()}catch{}
  const requested=Number(params.oferta||0);
  const selected=offers.find(o=>Number(o.id)===requested)||offers[0];

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span><h1>Gerador de Criativos 3.0</h1>
    <p className="muted">Escolha uma oferta e crie uma peça sem aparecer, usando a identidade da Vitrine dos Achados.</p>
    {offers.length===0?<div className="empty">Publique uma oferta para gerar um criativo.</div>:<>
      <form className="offerSelector" method="get">
        <label>Oferta do criativo<select name="oferta" defaultValue={String(selected.id)}>{offers.map(o=><option value={o.id} key={o.id}>{productDisplayTitle(o.title)}</option>)}</select></label>
        <button type="submit">Carregar</button>
      </form>
      <div className="creativeList focusedCreative">
        <CreativeMaker id={selected.id} title={productDisplayTitle(selected.title)} price={money(selected.price)} originalPrice={selected.original_price?money(selected.original_price):null} imageUrl={selected.image_url} marketplace={selected.marketplace}/>
      </div>
      <div className="contentWorkflowActions"><a className="mini secondaryMini" href={`/conteudo?oferta=${selected.id}`}>Voltar aos textos</a><a className="mini publish" href="/automacao">Abrir fila de divulgação</a></div>
    </>}
  </main>
}
