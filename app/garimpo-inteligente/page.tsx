import ShopeeImportButton from "./ShopeeImportButton";
import MercadoLivreImportButton from "./MercadoLivreImportButton";
import MercadoLivreDiagnostic from "./MercadoLivreDiagnostic";
import {APP_VERSION} from "@/lib/version";
import {listCandidates} from "@/lib/candidates";
import {listAllOffers} from "@/lib/offers";
import CandidateEvaluator from "./CandidateEvaluator";
import DuplicateReview from "./DuplicateReview";
export const dynamic="force-dynamic";

export default async function GarimpoInteligente({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const params=await searchParams;let candidates:any[]=[];let offers:any[]=[];try{candidates=await listCandidates()}catch{}try{offers=await listAllOffers()}catch{}
 const q=String(params.q||"").trim().toLowerCase(),status=String(params.status||"all"),market=String(params.marketplace||"all");
 if(q)candidates=candidates.filter(c=>String(c.title).toLowerCase().includes(q)||String(c.notes||"").toLowerCase().includes(q));
 if(status!=="all")candidates=candidates.filter(c=>c.status===status);if(market!=="all")candidates=candidates.filter(c=>c.marketplace===market);
 const review=candidates.filter(c=>c.status==="review").length,approved=candidates.filter(c=>c.status==="approved").length,strong=candidates.filter(c=>Number(c.score)>=80).length;
 const published=offers.filter(o=>o.status==="published");
 return <main className="panel compactAdmin">
  <div className="adminPageHead"><div><span className="badge">{APP_VERSION}</span><h1>Garimpo Inteligente</h1></div><div className="headActions"><div className="marketplaceImporters"><ShopeeImportButton/><MercadoLivreImportButton/></div><a className="mini secondaryMini" href="/central">Catálogo</a></div></div>
  <section className="compactKpis"><div><b>{candidates.length}</b><span>na fila</span></div><div><b>{review}</b><span>revisar</span></div><div><b>{approved}</b><span>aprovados</span></div><div><b>{strong}</b><span>score 80+</span></div><div><b>{published.length}</b><span>publicados</span></div></section>
  <DuplicateReview/>

  <MercadoLivreDiagnostic/>

  <section className="integrationBox workQueue"><div className="sectionTitle compactTitle"><div><span className="eyebrow">CAIXA DE ENTRADA</span><h2>Para analisar</h2></div><span>{candidates.length}</span></div>
   <form className="candidateFilters" method="get"><input name="q" defaultValue={params.q||""} placeholder="Buscar produto"/><select name="status" defaultValue={status}><option value="all">Pendentes + aprovados</option><option value="review">Em revisão</option><option value="approved">Aprovados</option></select><select name="marketplace" defaultValue={market}><option value="all">Todos marketplaces</option><option>Shopee</option><option>Mercado Livre</option><option>Amazon</option></select><button className="mini publish">Filtrar</button></form>
   {candidates.length===0?<div className="queueEmpty"><b>✓ Tudo em dia</b><span>Nenhum produto aguardando análise ou publicação.</span><small>É uma boa hora para garimpar novas oportunidades.</small></div>:<div className="candidateList">{candidates.map(c=><article className="candidateSaved" key={c.id}><div className="candidateInfo">{c.image_url&&<img className="candidateThumb" src={c.image_url} alt=""/>}<div><span className="channelTag">{c.marketplace}</span><h3>{c.title}</h3><small>Score {c.score}/100 · {c.price!=null?`R$ ${c.price.toFixed(2).replace(".",",")}`:"sem preço"}{c.original_price>c.price?` · ${Math.round((1-c.price/c.original_price)*100)}% OFF`:""} · {c.sold_quantity==null?"Vendas não informadas":`${c.sold_quantity} vendas`}</small></div></div><div className="candidateStatus"><span className={`status status-${c.status}`}>{c.status==="approved"?"Aprovado":"Em revisão"}</span><details className="candidateEdit"><summary>Detalhes / corrigir</summary><form action={`/api/candidates/${c.id}`} method="post"><input type="hidden" name="action" value="edit"/><label>Produto<input name="title" defaultValue={c.title}/></label><label>Categoria<input name="category" defaultValue={c.category||"Casa"}/></label><label>Preço<input name="price" defaultValue={c.price??""}/></label><label>Preço anterior<input name="original_price" defaultValue={c.original_price??""}/></label><label>Link<input name="product_url" defaultValue={c.product_url??""}/></label><label>Imagem<input name="image_url" defaultValue={c.image_url??""}/></label><label>Observações<textarea name="notes" defaultValue={c.notes??""}/></label><button className="mini publish">Salvar</button></form></details><div className="rowActions">{c.status!=="approved"&&<form action={`/api/candidates/${c.id}`} method="post"><input type="hidden" name="action" value="approve"/><button className="mini publish">Aprovar</button></form>}{c.status==="approved"&&<form action={`/api/candidates/${c.id}`} method="post"><input type="hidden" name="action" value="promote"/><button className="mini promoteMini">Criar oferta</button></form>}<form action={`/api/candidates/${c.id}`} method="post"><input type="hidden" name="action" value="reject"/><button className="mini secondaryMini">Rejeitar</button></form></div></div></article>)}</div>}
  </section>

  <details className="adminDisclosure"><summary>Produtos publicados ({published.length})</summary><div className="publishedMiniTable">{published.slice(0,50).map(o=><div key={o.id}><span>{o.title}</span><b>R$ {Number(o.price).toFixed(2).replace(".",",")}</b><small>{o.sync_status==="ok"?"Atualizado":o.external_id?"Monitorado":"Precisa vincular"}</small></div>)}</div><a className="mini" href="/central?status=published">Abrir catálogo completo</a></details>
  <details className="adminDisclosure"><summary>Adicionar / avaliar produto manualmente</summary><div id="avaliador"><CandidateEvaluator/></div></details>
  <details className="adminDisclosure"><summary>Como funciona o fluxo</summary><p className="muted">Importar → avaliar → aprovar. A partir da aprovação, o Autopiloto cria/atualiza a oferta, publica na Vitrine e a disponibiliza para Conteúdo, Criativos e Divulgação. Só itens incompletos ficam pendentes.</p></details>
 </main>
}
