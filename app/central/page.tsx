import BatchPublishButton from "./BatchPublishButton";
import SyncCatalogButton from "./SyncCatalogButton";
import { APP_VERSION } from "@/lib/version";
import { listAllOffers } from "@/lib/offers";
export const dynamic="force-dynamic";

const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const statusLabel:Record<string,string>={draft:"Rascunho",published:"Publicada",expired:"Expirada"};
const shortName=(v:string)=>{const clean=String(v||"").replace(/\s+/g," ").trim(); const words=clean.split(" "); return words.length>8?`${words.slice(0,8).join(" ")}…`:clean};

export default async function Central({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  let offers:any[]=[];try{offers=await listAllOffers()}catch{}
  const all=offers;
  const q=String(params.q||"").trim().toLowerCase();
  const status=String(params.status||"all");
  const marketplace=String(params.marketplace||"all");
  const sort=String(params.sort||"newest");
  if(q)offers=offers.filter(o=>String(o.title).toLowerCase().includes(q)||String(o.category||"").toLowerCase().includes(q));
  if(status!=="all")offers=offers.filter(o=>o.status===status);
  if(marketplace!=="all")offers=offers.filter(o=>o.marketplace===marketplace);
  offers=[...offers].sort((a,b)=>sort==="price_asc"?Number(a.price)-Number(b.price):sort==="price_desc"?Number(b.price)-Number(a.price):new Date(b.created_at).getTime()-new Date(a.created_at).getTime());

  const drafts=all.filter(o=>o.status==="draft").length;
  const published=all.filter(o=>o.status==="published").length;
  const review=all.filter(o=>!(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)).length;
  const marketplaces=Array.from(new Set(all.map(o=>String(o.marketplace)).filter(Boolean))).sort();

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span><h1>Central de Ofertas 2.0</h1>
    <p className="muted">Cadastre, revise, encontre e publique ofertas sem perder o controle do catálogo.</p>

    <section className="centralSummary">
      <div><b>{all.length}</b><span>Total</span></div><div><b>{drafts}</b><span>Rascunhos</span></div>
      <div><b>{published}</b><span>Publicadas</span></div><div><b>{review}</b><span>Precisam de revisão</span></div>
    </section>

    <form className="centralFilters" method="get">
      <input name="q" defaultValue={params.q||""} placeholder="Buscar produto ou categoria"/>
      <select name="status" defaultValue={status}><option value="all">Todos os status</option><option value="draft">Rascunhos</option><option value="published">Publicadas</option><option value="expired">Expiradas</option></select>
      <select name="marketplace" defaultValue={marketplace}><option value="all">Todos os marketplaces</option>{marketplaces.map(m=><option key={m} value={m}>{m}</option>)}</select>
      <select name="sort" defaultValue={sort}><option value="newest">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option></select>
      <button type="submit">Filtrar</button><a className="mini" href="/central">Limpar</a>
    </form>

    <details className="newOfferBox"><summary>+ Cadastrar oferta manual</summary>
      <form className="offerForm" action="/api/offers" method="post"><input name="title" required placeholder="Nome do produto"/><select name="category"><option>Casa</option><option>Cozinha</option><option>Pet</option><option>Organização</option></select><select name="marketplace"><option>Shopee</option><option>Mercado Livre</option><option>Amazon</option><option>Outro</option></select><input name="price" required type="number" min="0" step="0.01" placeholder="Preço atual"/><input name="original_price" type="number" min="0" step="0.01" placeholder="Preço anterior (opcional)"/><input name="image_url" type="url" placeholder="URL da imagem (opcional)"/><input name="affiliate_url" required type="url" placeholder="Link de afiliado"/><select name="status"><option value="draft">Rascunho</option><option value="published">Publicar agora</option></select><button type="submit">Salvar oferta</button></form>
    </details>

    <div className="centralActionBar"><SyncCatalogButton/><BatchPublishButton /></div>
    <div className="contentWorkflowActions"><a className="button" href="/divulgacao">Abrir fila de divulgação</a></div>
    <div className="noticeBox"><b>Autopiloto:</b> ofertas completas são publicadas automaticamente. Esta Central fica para catálogo, correções e exceções.</div>
    <div className="sectionTitle centralTitle"><div><span className="eyebrow">CATÁLOGO INTERNO</span><h2>Ofertas</h2></div><span>{offers.length} resultado{offers.length===1?"":"s"}</span></div>

    {offers.length===0?<div className="empty">Nenhuma oferta encontrada com esses filtros.</div>:<div className="tableWrap"><table className="adminTable"><thead><tr><th>Produto</th><th>Canal</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead><tbody>{offers.map(o=>{const discount=o.original_price&&o.original_price>o.price?Math.round((1-o.price/o.original_price)*100):0;return <tr key={o.id}><td><div className="adminProductCell">{o.image_url?<img src={o.image_url} alt="" loading="lazy"/>:<span className="adminProductPlaceholder">VA</span>}<div><strong title={o.title}>{shortName(o.title)}</strong><small>{o.category}{discount>0?` · ${discount}% OFF`:""}</small></div></div></td><td>{o.marketplace}</td><td>{o.original_price&&o.original_price>o.price?<small><del>{money(o.original_price)}</del></small>:null}{money(o.price)}</td><td><span className={`status status-${o.status}`}>{statusLabel[o.status]||o.status}</span>{o.featured&&<span className="featured">Destaque</span>}<small className="syncLabel">{o.sync_status==="ok"?"✓ preço verificado":o.external_id?"monitoramento ativo":"precisa vincular"}</small></td><td><div className="offerReadiness">
      <span className={(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)?"readyBadge":"pendingBadge"}>{(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)?"Pronta para publicar":"Revisão necessária"}</span>
      {!(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)&&<small>{!o.image_url?"Falta imagem. ":""}{!(Number(o.price)>0)?"Falta preço. ":""}{!o.affiliate_url?"Falta link. ":""}</small>}
    </div><details className="offerEdit"><summary>Corrigir oferta</summary><form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="edit"/><label>Produto<input name="title" defaultValue={o.title} required/></label><label>Categoria<input name="category" defaultValue={o.category}/></label><label>Marketplace<input name="marketplace" defaultValue={o.marketplace}/></label><label>Preço<input name="price" defaultValue={o.price} required/></label><label>Preço anterior<input name="original_price" defaultValue={o.original_price??""}/></label><label>URL da imagem<input name="image_url" defaultValue={o.image_url??""}/></label><label>Link de afiliado<input name="affiliate_url" defaultValue={o.affiliate_url} required/></label><button className="mini publish" type="submit">Salvar correção</button></form></details><div className="rowActions">{o.status!=="published"&&<form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="publish"/><button className="mini publish" type="submit">Publicar</button></form>}{o.status==="published"&&<form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="expire"/><button className="mini" type="submit">Expirar</button></form>}<form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value={o.featured?"unfeature":"feature"}/><button className="mini secondaryMini" type="submit">{o.featured?"Remover destaque":"Destacar"}</button></form>{o.status==="published"&&<><a className="mini" href={`/conteudo?oferta=${o.id}`}>Divulgar</a><a className="mini secondaryMini" href={`/criativos?oferta=${o.id}`}>Criativo</a><a className="mini" href={`/go/${o.id}?channel=vitrine`} target="_blank" rel="noopener noreferrer">Testar link</a></>}</div></td></tr>})}</tbody></table></div>}
  </main>
}
