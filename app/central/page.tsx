import {miningProfiles} from '@/lib/mining-profiles';
import {priceSyncLabel} from "@/lib/ml-price-refresh";
import {getVitrineConfig} from '@/lib/vitrine-config';
import {HOME_DAYS,activeHomeOffer} from '@/lib/home-selection';
import {campaignLinks} from '@/lib/campaign-links';
import ImportOffers from './ImportOffers';
import RepairLinks from './RepairLinks';
import {filterOffers} from '@/lib/offer-filters';
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
  const profiles=await miningProfiles();
  let offers:any[]=[];try{offers=await listAllOffers()}catch{}
  const all=offers;
  let vitrineConfig=null;try{vitrineConfig=await getVitrineConfig()}catch{}
  let campaigns:any[]=[];try{campaigns=await campaignLinks()}catch{}
  const q=String(params.q||"").trim().toLowerCase();
  const status=String(params.status||"all");
  const marketplace=String(params.marketplace||"all");
  const sort=String(params.sort||"newest");
  offers=filterOffers(offers,params);
  const exportParams=new URLSearchParams(Object.entries(params).filter((entry):entry is [string,string]=>typeof entry[1]==='string'));
  exportParams.delete('format');
  const categories=Array.from(new Set(all.map(o=>String(o.category||'')).filter(Boolean))).sort();

  const drafts=all.filter(o=>o.status==="draft").length;
  const published=all.filter(o=>o.status==="published").length;
  const review=all.filter(o=>!(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)).length;
  const marketplaces=Array.from(new Set(all.map(o=>String(o.marketplace)).filter(Boolean))).sort();

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span><h1>Central de Ofertas</h1>
    <p className="muted">Cadastre, revise, encontre e publique ofertas sem perder o controle do catálogo.</p>

    <section className="centralSummary">
      <div><b>{all.length}</b><span>Total</span></div><div><b>{drafts}</b><span>Rascunhos</span></div>
      <div><b>{published}</b><span>Publicadas</span></div><div><b>{review}</b><span>Precisam de revisão</span></div>
    </section>

    <form className="centralFilters" method="get"><label>Perfil<select name="perfil" defaultValue={params.perfil||"all"}><option value="all">Todos os perfis</option><option value="empty">Sem perfil</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <input name="q" defaultValue={params.q||""} placeholder="Buscar produto ou categoria"/>
      <select name="status" defaultValue={status}><option value="all">Todos os status</option><option value="draft">Rascunhos</option><option value="published">Publicadas</option><option value="expired">Expiradas</option></select>
      <select name="marketplace" defaultValue={marketplace}><option value="all">Todos os marketplaces</option>{marketplaces.map(m=><option key={m} value={m}>{m}</option>)}</select>
      <select name="category" aria-label="Categoria" defaultValue={params.category||'all'}><option value="all">Todas as categorias</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select name="sort" defaultValue={sort}><option value="newest">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option></select>
      <button type="submit">Filtrar</button><a className="mini" href="/central">Limpar</a>
    </form>

    <details className="newOfferBox"><summary>+ Cadastrar oferta manual</summary>
      <form className="offerForm" action="/api/offers" method="post"><input name="title" required placeholder="Nome do produto"/><select name="category"><option>Casa</option><option>Cozinha</option><option>Pet</option><option>Organização</option></select><select name="marketplace"><option>Shopee</option><option>Mercado Livre</option><option>Amazon</option><option>Outro</option></select><input name="price" required type="number" min="0" step="0.01" placeholder="Preço atual"/><input name="original_price" type="number" min="0" step="0.01" placeholder="Preço anterior (opcional)"/><input name="image_url" type="url" placeholder="URL da imagem (opcional)"/><input name="affiliate_url" required type="url" placeholder="Link de afiliado ou produto Shopee"/><input name="external_id" placeholder="ID numérico do produto (obrigatório para Shopee)"/><select name="status"><option value="draft">Rascunho</option><option value="published">Publicar agora</option></select><input name="sub_id" placeholder="Sub ID (opcional)" maxLength={50}/><label><input type="checkbox" name="manual_link"/>Forçar salvamento sem validar API</label><button type="submit">Salvar oferta</button></form>
    </details>

    {params.saved&&<p role="status">{params.saved}</p>}
    <div className="contentWorkflowActions"><a className="button" href={`/api/offers/export?${exportParams}&format=xlsx`}>Exportar Excel (.xlsx)</a><ImportOffers format="xlsx"/><a className="button" href={`/api/offers/export?${exportParams}&format=csv`}>Exportar para Google Sheets (CSV)</a><ImportOffers format="csv"/></div>
    <p className="muted">Exportação respeita os filtros. Vermelho no Excel indica link citado no chamado ainda sem conversão confirmada. No Google Sheets, importe o CSV com separador vírgula.</p>
    <details className="newOfferBox" id="campaign-links"><summary>Links de campanhas — ROSA</summary>
      <p>Troque o destino aqui para atualizar o link usado no ManyChat. Ao preencher os dados completos, a oferta Shopee é criada como rascunho ou atualizada pelo ID do produto. Depois, publique o lote pronto.</p>
      {campaigns.length===0&&<p role="alert">Não foi possível carregar os links de campanhas. Recarregue a página.</p>}
      {campaigns.map(c=><form key={c.slug} className="offerForm" method="post" action="/api/offers/campaign-links">
        <h3>{c.title}</h3><input type="hidden" name="slug" value={c.slug}/><input type="hidden" name="previous" value={c.destination}/><input type="hidden" name="revision" value={c.revision}/>
        <p>Link permanente: <a href={`/go/${c.slug}?channel=instagram`} target="_blank" rel="noopener noreferrer">https://www.minhavitrinedeachados.com.br/go/{c.slug}?channel=instagram</a></p>
        <label>Link de destino ROSA<input type="url" name="destination" required defaultValue={c.destination}/></label>
        <label>Nome completo<input name="full_name" defaultValue={c.full_name||''} maxLength={300}/></label>
        <label>Código do cadastro<input name="product_code" defaultValue={c.product_code||''} maxLength={80}/></label>
        <label>ID do produto na Shopee<input name="external_id" inputMode="numeric" defaultValue={c.external_id||''}/></label>
        <label>Imagem principal<input type="url" name="image_url" defaultValue={c.image_url||''}/></label>
        <label>Preço atual (R$)<input type="number" name="price" min="0.01" step="0.01" defaultValue={c.price??''}/></label>
        <label>Preço anterior (R$)<input type="number" name="original_price" min="0" step="0.01" defaultValue={c.original_price??''}/></label>
        <small>Preencha todos os dados para cadastrar a oferta. Código do cadastro não substitui o ID numérico da Shopee.</small>
        <small>Edite o campo acima e clique em Salvar link ROSA. O endereço permanente usado no ManyChat continua igual; apenas o destino na Shopee muda.</small>
        <small>Link manual: a comissão não foi confirmada pela API. Esta campanha não entra nos cliques por oferta.</small>
        <button type="submit">Salvar link ROSA</button>
      </form>)}
    </details>
    {params.config_saved==='1'&&<p role="status">Configuração da Vitrine salva.</p>}
    <details className="newOfferBox campaignSettings"><summary>Configuração da Vitrine — campanha em destaque</summary>
      {vitrineConfig?<form action="/api/vitrine/config" method="post">
        <label>Título da seção em destaque<input name="titulo" maxLength={100} defaultValue={vitrineConfig.titulo} placeholder="Ex.: Black Friday, Destaques da Semana, Ofertas de Natal"/></label>
        <label><input type="checkbox" name="exibir_titulo" defaultChecked={vitrineConfig.exibir_titulo}/> Mostrar título na vitrine</label>
        <label><input type="checkbox" name="destaque_ativo" defaultChecked={vitrineConfig.destaque_ativo}/> Ativar seção de destaques</label>
        <p>Título vazio usa “Selecionados para você”. Sem produtos com destaque ativo, título e seção ficam ocultos. Todos os produtos ativos continuam no catálogo abaixo.</p>
        <button type="submit">Salvar configuração da Vitrine</button>
      </form>:<p>Configuração indisponível. Atualize a página para tentar novamente.</p>}
    </details>
    <details className="newOfferBox"><summary>Como destacar produtos na página inicial</summary><p>Em cada oferta publicada, abra “Destaque na inicial”, escolha 5, 10, 15, 20 ou 30 dias e salve. Ative a seção em Configuração da Vitrine. O prazo começa no salvamento; renovar reinicia a contagem. Os destaques aparecem em uma seção extra no topo. Abaixo, todos os produtos ativos continuam visíveis com paginação, mesmo sem destaques. Ao vencer ou retirar, o produto sai apenas da seção de destaques.</p></details>
    <RepairLinks/>
    <div className="centralActionBar"><SyncCatalogButton/><BatchPublishButton /></div>
    <div className="contentWorkflowActions"><a className="button" href="/divulgacao">Abrir fila de divulgação</a></div>
    <div className="noticeBox"><b>Autopiloto:</b> ofertas completas são publicadas automaticamente. Esta Central fica para catálogo, correções e exceções.</div>
    <div className="sectionTitle centralTitle"><div><span className="eyebrow">CATÁLOGO INTERNO</span><h2>Ofertas</h2></div><span>{offers.length} resultado{offers.length===1?"":"s"}</span></div>

    {offers.length===0?<div className="empty">Nenhuma oferta encontrada com esses filtros.</div>:<div className="tableWrap"><table className="adminTable"><thead><tr><th>Produto</th><th>Canal</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead><tbody>{offers.map(o=>{const discount=o.original_price&&o.original_price>o.price?Math.round((1-o.price/o.original_price)*100):0;return <tr key={o.id}><td><div className="adminProductCell">{o.image_url?<img src={o.image_url} alt="" loading="lazy"/>:<span className="adminProductPlaceholder">VA</span>}<div><strong title={o.title}>{shortName(o.title)}</strong><small>{o.category}{discount>0?` · ${discount}% OFF`:""}</small></div></div></td><td>{o.marketplace}</td><td>{o.original_price&&o.original_price>o.price?<small><del>{money(o.original_price)}</del></small>:null}{money(o.price)}</td><td><span className={`status status-${o.status}`}>{statusLabel[o.status]||o.status}</span>{o.featured&&<span className="featured">Destaque</span>}<small>{o.affiliate_status==="pending"?"Verificação pendente":o.affiliate_status==="verified"?"Link registrado pela API":""}</small><small className="syncLabel">{priceSyncLabel(o)}</small></td><td><div className="offerReadiness">
      <span className={(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)?"readyBadge":"pendingBadge"}>{(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)?"Pronta para publicar":"Revisão necessária"}</span>
      {!(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url)&&<small>{!o.image_url?"Falta imagem. ":""}{!(Number(o.price)>0)?"Falta preço. ":""}{!o.affiliate_url?"Falta link. ":""}</small>}
    </div><details className="offerEdit"><summary>Corrigir oferta</summary><form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="edit"/><label>Produto<input name="title" defaultValue={o.title} required/></label><label>Categoria<input name="category" defaultValue={o.category}/></label><label>Marketplace<input name="marketplace" defaultValue={o.marketplace}/></label><label>ID do produto na Shopee<input name="external_id" defaultValue={o.external_id??""} placeholder="ID numérico do anúncio"/></label><label>Preço<input name="price" defaultValue={o.price} required/></label><label>Preço anterior<input name="original_price" defaultValue={o.original_price??""}/></label><label>URL da imagem<input name="image_url" defaultValue={o.image_url??""}/></label><small>Para Shopee: informe o ID real do produto. Falhas da API não impedem salvar. Prefixo não comprova ausência de comissão.</small><label>Link de afiliado<input name="affiliate_url" defaultValue={o.affiliate_url} required/></label><label>Sub ID<input name="sub_id" defaultValue={o.affiliate_sub_id??""} maxLength={50}/></label><label><input type="checkbox" name="manual_link"/>Forçar salvamento sem validar API</label><small>Sub ID manual é um registro local; não modifica a atribuição de um link já gerado na Shopee.</small><button className="mini publish" type="submit">Salvar correção</button></form></details><details className="offerEdit homeSelection"><summary>Destaque na inicial{activeHomeOffer(o)?' · Ativo':''}</summary>
      <p>{activeHomeOffer(o)?`Até ${new Date(o.home_until).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília)`:o.home_until?'Sem destaque ativo (prazo encerrado ou retirada).':'Sem destaque na inicial.'}</p>
      {o.status==='published'?<><form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="home_set"/><label>Duração do destaque<select name="days" defaultValue="5">{HOME_DAYS.map(d=><option key={d} value={d}>{d} dias</option>)}</select></label><button type="submit">{activeHomeOffer(o)?'Renovar prazo':'Destacar na inicial'}</button></form>{activeHomeOffer(o)&&<form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="home_remove"/><button type="submit">Retirar destaque</button></form>}</>:<small>Publique a oferta para selecionar.</small>}
      </details><div className="rowActions">{o.status!=="published"&&<form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="publish"/><button className="mini publish" type="submit">Publicar</button></form>}{o.status==="published"&&<form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value="expire"/><button className="mini" type="submit">Expirar</button></form>}<form action={`/api/offers/${o.id}`} method="post"><input type="hidden" name="action" value={o.featured?"unfeature":"feature"}/><button className="mini secondaryMini" type="submit">{o.featured?"Remover destaque":"Destacar"}</button></form>{o.status==="published"&&<><a className="mini" href={`/conteudo?oferta=${o.id}`}>Divulgar</a><a className="mini secondaryMini" href={`/criativos?oferta=${o.id}`}>Criativo</a><a className="mini" href={`/go/${o.id}?channel=vitrine&teste=1`} target="_blank" rel="noopener noreferrer">Testar link</a></>}</div></td></tr>})}</tbody></table></div>}
  </main>
}
