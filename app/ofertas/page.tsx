import { APP_VERSION } from "@/lib/version";
import Image from "next/image";
import { listPublishedOffers } from "@/lib/offers";
import type { Metadata } from "next";

export const dynamic="force-dynamic";
export const metadata:Metadata={
  title:"Vitrine dos Achados | Ofertas para casa, cozinha, pet e organização",
  description:"Seleção de achados e ofertas para casa, cozinha, pet e organização. Links de afiliado podem gerar comissão sem custo adicional para você.",
  robots:{index:true,follow:true}
};

const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export default async function OfertasPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const selected=String(params.categoria||"").trim();
  const busca=String(params.busca||"").trim();
  const buscaNorm=busca.toLocaleLowerCase("pt-BR");
  let offers:any[]=[]; let unavailable=false;
  try{offers=await listPublishedOffers()}catch{unavailable=true}
  const categories=Array.from(new Set(offers.map((o:any)=>String(o.category||"").trim()).filter(Boolean))).sort();
  let visible=selected?offers.filter((o:any)=>String(o.category||"")===selected):offers;
  if(buscaNorm) visible=visible.filter((o:any)=>`${o.title} ${o.category} ${o.marketplace}`.toLocaleLowerCase("pt-BR").includes(buscaNorm));

  return <main className="store">
    <header className="storeHeader">
      <Image src="/brand/logo-horizontal.png" alt="Vitrine dos Achados" width={720} height={330} priority className="brandLogo"/>
      <a className="pill" href="#ofertas">Ofertas do dia</a>
    </header>

    <section className="hero marketplaceHero">
      <span className="eyebrow">ACHADOS QUE VALEM A PENA</span>
      <h1>Encontre boas ofertas em um só lugar.</h1>
      <p>Seleção de produtos para casa, cozinha, pet e organização.</p>
      <form className="storeSearch" action="/ofertas" method="get">
          {selected&&<input type="hidden" name="categoria" value={selected}/>}
          <input name="busca" defaultValue={busca} placeholder="Buscar um achado..." aria-label="Buscar ofertas"/>
          <button type="submit">Buscar</button>
          {busca&&<a href={selected?`/ofertas?categoria=${encodeURIComponent(selected)}#ofertas`:"/ofertas#ofertas"}>Limpar</a>}
        </form>
        <div className="cats">
        <a className={!selected?"activeCat":""} href={busca?`/ofertas?busca=${encodeURIComponent(busca)}#ofertas`:"/ofertas#ofertas"}>Todos</a>
        {categories.map((c:any)=><a className={selected===c?"activeCat":""} key={c} href={`/ofertas?categoria=${encodeURIComponent(c)}${busca?`&busca=${encodeURIComponent(busca)}`:""}#ofertas`}>{c}</a>)}
      </div>
    </section>

    <section id="ofertas">
      <div className="sectionTitle">
        <div><span className="eyebrow">VITRINE</span><h2>{busca?`Resultados para “${busca}”`:selected?selected:"Achados de hoje"}</h2></div>
        <span>{visible.length} oferta{visible.length===1?"":"s"}</span>
      </div>
      <p className="affiliateNotice">Transparência: os botões “Ver oferta” podem usar links de afiliado. Podemos receber comissão pela compra, sem custo adicional para você.</p>

      {unavailable?<div className="empty"><b>Vitrine temporariamente indisponível.</b><br/>Tente novamente mais tarde.</div>:
       visible.length===0?<div className="empty"><b>{busca?"Nenhum achado encontrado.":selected?"Nenhuma oferta nesta categoria agora.":"A primeira seleção está chegando."}</b><br/>{busca?"Tente outro termo ou limpe a busca.":selected?"Escolha outra categoria para continuar.":"As ofertas aprovadas aparecerão aqui automaticamente."}</div>:
       <div className="offerGrid">{visible.map((o:any)=>{
         const discount=o.original_price&&o.original_price>o.price?Math.round((1-o.price/o.original_price)*100):0;
         return <article className="offerCard" key={o.id}>
           {o.image_url?<img src={o.image_url} alt={o.title} loading="lazy"/>:<div className="placeholder">Vitrine<br/>dos Achados</div>}
           <div className="offerBody">
             <div className="meta"><span>{o.marketplace}</span>{discount>0&&<b className="discountBadge">-{discount}%</b>}</div>
             <h3>{o.title}</h3>
             {o.original_price&&o.original_price>o.price&&<del>{money(o.original_price)}</del>}
             <strong>{money(o.price)}</strong>
             {o.last_synced_at&&<small className="priceVerified">Preço verificado recentemente</small>}
             <a className="cta" href={`/go/${o.id}?channel=vitrine`} target="_blank" rel="sponsored nofollow noopener" aria-label={`Ver oferta de ${o.title}`}>Ver oferta</a>
           </div>
         </article>
       })}</div>}
    </section>
    <footer>Vitrine dos Achados · Achados que valem a pena. <span>Preços e disponibilidade podem mudar no marketplace.</span> <a href="/politica-de-privacidade">Política de Privacidade</a></footer>
    <div className="publicVersion">{APP_VERSION}</div>
  </main>
}
