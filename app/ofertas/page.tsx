import {cookies} from 'next/headers';
import {clickChannel,CHANNELS} from '@/lib/click-policy';
import OfferImage from '../components/OfferImage';
import { APP_VERSION } from "@/lib/version";
import {getVitrineHome} from "@/lib/vitrine-home";
import {categoryIcon,isKids,KIDS_CATEGORY,activeSeasons,SORTS,PAGE_STEP,shownCount} from "@/lib/vitrine-layout";
import type { Metadata } from "next";

export const dynamic="force-dynamic";
export const viewport={themeColor:"#087b7c"};
export const metadata:Metadata={
  title:"Vitrine dos Achados | Ofertas para casa, cozinha, pet e organização",
  description:"Seleção de achados e ofertas para casa, cozinha, pet e organização. Links de afiliado podem gerar comissão sem custo adicional para você.",
  robots:{index:true,follow:true},
  // v3.6.1: a Vitrine instala como app próprio ("Vitrine dos Achados"), separado do painel Garimpo.
  manifest:"/vitrine.webmanifest",
  applicationName:"Vitrine dos Achados",
  appleWebApp:{capable:true,title:"Vitrine",statusBarStyle:"default"},
  icons:{icon:"/brand/icon-192.png",apple:"/brand/apple-touch-icon.png"}
};

const discountPercent=(o:any)=>o.original_price>o.price&&o.original_price>0?Math.round((1-o.price/o.original_price)*100):0;
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

function OfferCard({offer:o,channel,eager=false,anchor,rank}:{offer:any;channel:string;eager?:boolean;anchor?:string;rank?:number}){
  const discount=o.original_price&&o.original_price>o.price?Math.round((1-o.price/o.original_price)*100):0;
  return <article className="offerCard" id={anchor}>
    {rank&&<span className="rankBadge" aria-label={`${rank}º mais clicado`}>#{rank}</span>}
    <OfferImage src={o.image_url} alt={o.title} eager={eager}/>
    <div className="offerBody">
      <div className="meta"><span>{o.marketplace}</span>{discount>0&&<b className="discountBadge">-{discount}%</b>}</div>
      <h3>{o.title}</h3>
      {o.original_price&&o.original_price>o.price&&<del>{money(o.original_price)}</del>}
      <strong>{money(o.price)}</strong>
      <a className="cta" href={`/go/${o.id}?channel=${channel}`} target="_blank" rel="sponsored nofollow noopener" aria-label={`Ver oferta de ${o.title}`}>Ver oferta</a>
    </div>
  </article>
}

function Shelf({title,label,offers,channel,ranked=false,id}:{title?:string;label:string;offers:any[];channel:string;ranked?:boolean;id:string}){
  return <section aria-label={label} className={`homeShelf ${id}`}>
    {title&&<div className="shelfTitle"><h2>{title}</h2>{offers.length>2&&<span aria-hidden="true">deslize →</span>}</div>}
    <div className="shelfTrack">{offers.map((o,i)=><OfferCard key={o.id} offer={o} channel={channel} eager={i<3} rank={ranked?i+1:undefined}/>)}</div>
  </section>
}

export default async function OfertasPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const channel=clickChannel(CHANNELS.includes(params.channel as any)?params.channel:(await cookies()).get('vitrine_channel')?.value);
  const selected=String(params.categoria||"").trim();
  const marketplace=String(params.marketplace||"").trim();
  const marketplaces=["Shopee","Mercado Livre"];
  const busca=String(params.busca||"").trim();
  const order=SORTS.some(o=>o.key===params.ordem)?params.ordem!:"relevancia";
  const homeView=!selected&&!marketplace&&!busca;
  const link=(over:Record<string,string|undefined>,hash="#ofertas")=>{
    const base:Record<string,string|undefined>={categoria:selected||undefined,marketplace:marketplace||undefined,busca:busca||undefined,ordem:order!=="relevancia"?order:undefined,...over};
    const query=new URLSearchParams();
    for(const [k,v] of Object.entries(base))if(v)query.set(k,v);
    return `/ofertas${query.size?`?${query.toString()}`:""}${hash}`;
  };
  const buscaNorm=busca.toLocaleLowerCase("pt-BR");
  let data:Awaited<ReturnType<typeof getVitrineHome>>={todas:[],destaques:[],maisClicados:[],config:{titulo:'Selecionados para você',exibir_titulo:true,destaque_ativo:false}};
  let unavailable=false;
  try{data=await getVitrineHome()}catch{unavailable=true}
  const offers=data.todas,highlights=data.destaques,config=data.config,topClicked=(data as any).maisClicados||[];
  const seasons=activeSeasons().filter(s=>offers.some(s.match));
  const season=seasons.find(s=>s.key===selected);
  const realCats=Array.from(new Set(offers.map(o=>String(o.category||"").trim()).filter(c=>Boolean(c)&&!marketplaces.some(m=>m.toLocaleLowerCase("pt-BR")===c.toLocaleLowerCase("pt-BR"))))).filter(c=>c!==KIDS_CATEGORY);
  const hasKids=offers.some(isKids);
  const catOrder=(c:string)=>c==="Outros"?1:0;
  const categories=[...(hasKids?[KIDS_CATEGORY]:[]),...realCats.sort((a,b)=>catOrder(a)-catOrder(b)||a.localeCompare(b,"pt-BR"))];
  let visible=season?offers.filter(season.match):selected===KIDS_CATEGORY?offers.filter(isKids):selected?offers.filter(o=>String(o.category||"")===selected):offers;
  if(marketplace)visible=visible.filter((o:any)=>String(o.marketplace||"").trim().toLocaleLowerCase("pt-BR")===marketplace.toLocaleLowerCase("pt-BR"));
  if(buscaNorm) visible=visible.filter((o:any)=>`${o.title} ${o.category} ${o.marketplace}`.toLocaleLowerCase("pt-BR").includes(buscaNorm));

  if(order==="menor-preco")visible=[...visible].sort((a,b)=>a.price-b.price);
  if(order==="maior-desconto")visible=[...visible].sort((a,b)=>discountPercent(b)-discountPercent(a));
  if(order==="recentes")visible=[...visible].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
  const shown=shownCount(params,visible.length);
  const shownOffers=visible.slice(0,shown);
  const remaining=visible.length-shown;
  const title=busca?`Resultados para “${busca}”`:season?season.label:marketplace?marketplace:selected?`${categoryIcon(selected)} ${selected}`:"Todas as ofertas";

  return <main className="store">
    <section className="hero marketplaceHero">
      <span className="eyebrow">ACHADOS QUE VALEM A PENA</span>
      <h1>Achados com preço baixo, escolhidos a dedo 🔥</h1>
      <p>Ofertas da Shopee e do Mercado Livre para casa, cozinha e família, atualizadas todos os dias.</p>
      <form className="storeSearch" action="/ofertas" method="get">
          <input name="busca" defaultValue={busca} placeholder="Buscar um achado..." aria-label="Buscar ofertas"/>
          <button type="submit">Buscar</button>
          {busca&&<a href="/ofertas#ofertas">Limpar</a>}
        </form>
        <nav className="cats" aria-label="Categorias">
        <a href="/ofertas" className={homeView?"activeCat":""} aria-current={homeView?"page":undefined}>⭐ Tudo</a>
        {seasons.map(s=><a className={`seasonCat${selected===s.key?" activeCat":""}`} key={s.key} href={`/ofertas?categoria=${s.key}#ofertas`}>{s.label}</a>)}
        {categories.map(c=><a className={selected===c?"activeCat":""} aria-current={selected===c?"page":undefined} key={c} href={`/ofertas?categoria=${encodeURIComponent(c)}#ofertas`}>{categoryIcon(c)} {c}</a>)}
      </nav>
    </section>

    {homeView&&highlights.length>0&&<div className="homeHighlights"><Shelf id="shelfHighlights" label="Produtos em destaque" title={config.exibir_titulo?config.titulo:undefined} offers={highlights} channel={channel}/></div>}
    {homeView&&topClicked.length>=3&&<Shelf id="shelfTop" label="Mais clicados da semana" title="🔥 Mais clicados da semana" offers={topClicked} channel={channel} ranked/>}
    <section id="ofertas">
      <div className="sectionTitle">
        <div><span className="eyebrow">VITRINE</span><h2>{title}</h2></div>
        <span>{visible.length} oferta{visible.length===1?"":"s"}</span>
      </div>
      <nav className="sortChips" aria-label="Ordenar ofertas">
        {SORTS.map(s=><a key={s.key} className={order===s.key?"activeSort":""} aria-current={order===s.key?"true":undefined} href={link({ordem:s.key==="relevancia"?undefined:s.key})}>{s.label}</a>)}
      </nav>

      {unavailable?<div className="empty"><b>Vitrine temporariamente indisponível.</b><br/>Tente novamente mais tarde.</div>:
       visible.length===0?<div className="empty"><b>{busca?"Nenhum achado encontrado.":selected||marketplace?"Nenhuma oferta nesta seleção agora.":"A primeira seleção está chegando."}</b><br/>{busca?"Tente outro termo ou limpe a busca.":selected||marketplace?"Escolha outra opção do menu para continuar.":"As ofertas aprovadas aparecerão aqui automaticamente."}</div>:
       <div className="offerGrid">{shownOffers.map((o,i)=><OfferCard key={o.id} offer={o} channel={channel} anchor={`item-${i+1}`}/>)}</div>}
      {visible.length>0&&<div className="loadMore">
        <p role="status">Mostrando {shown} de {visible.length} ofertas</p>
        {remaining>0&&<a className="loadMoreBtn" href={link({qtd:String(shown+PAGE_STEP)},`#item-${shown+1}`)} rel="next">Ver mais achados ({remaining})</a>}
      </div>}
      <p className="affiliateNotice">Transparência: os botões “Ver oferta” podem usar links de afiliado. Podemos receber comissão pela compra, sem custo adicional para você. Os preços são conferidos com frequência, mas podem mudar no marketplace.</p>
    </section>
    <footer>Vitrine dos Achados · Achados que valem a pena. <a href="/politica-de-privacidade">Política de Privacidade</a></footer>
    <div className="publicVersion">{APP_VERSION}</div>
  </main>
}
