import { APP_VERSION } from "@/lib/version";
import { getDashboardStats } from "@/lib/analytics";
import { commissionStats } from "@/lib/shopee-commissions";
import SyncCommissionsButton from "./SyncCommissionsButton";
export const dynamic="force-dynamic";
export const revalidate=0;

const channelLabel=(v:string)=>({facebook:"Facebook",instagram:"Instagram",whatsapp:"WhatsApp",telegram:"Telegram",pinterest:"Pinterest",vitrine:"Vitrine"}[v]||v);
const dayLabel=(v:any)=>new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"UTC"}).format(new Date(v));
const shortName=(v:string)=>{const clean=String(v||"").replace(/\s+/g," ").trim(); const words=clean.split(" "); return words.length>7?`${words.slice(0,7).join(" ")}…`:clean};

export default async function Resultados(){
  let data:any={summary:{total:0,published:0,drafts:0,expired:0,clicks:0,clicked_offers:0},channels:[],top:[],recent:[],periods:{last7:0,prev7:0,last30:0},apps:[]};
  try{data=await getDashboardStats()}catch{}
  let sales:any=null;try{sales=await commissionStats(30)}catch{}
  const brl=(v:any)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v||0));
  const when=(v:any)=>v?new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"}).format(new Date(v)):"";
  const statusLabel=(v:string)=>({COMPLETED:"Concluído",PENDING:"Pendente",UNPAID:"Aguardando pagamento",CANCELLED:"Cancelado"}[v]||v);
  const salesChannel=(v:string)=>v==="sem_canal"?"Sem canal identificado":channelLabel(v);
  const s=data.summary;
  const maxChannel=Math.max(1,...data.channels.map((c:any)=>Number(c.clicks)));
  const maxRecent=Math.max(1,...data.recent.map((r:any)=>Number(r.clicks)));
  const avg=s.published>0?(Number(s.clicks)/Number(s.published)).toFixed(1):"0";
  const topChannel=data.channels[0];
  const last7=Number(data.periods?.last7||0), prev7=Number(data.periods?.prev7||0), last30=Number(data.periods?.last30||0);
  const apps:any[]=data.apps||[];
  const appsTotal=apps.reduce((t:number,a:any)=>t+Number(a.clicks||0),0);
  const appsLast30=apps.reduce((t:number,a:any)=>t+Number(a.last30||0),0);
  const trend=prev7===0?(last7>0?null:0):Math.round((last7-prev7)/prev7*100);

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span>
    <h1>Resultados</h1>
    <p className="muted">Veja quais ofertas e canais realmente estão atraindo cliques. A contagem de cliques é feita pela própria Vitrine e não depende da API da Shopee; vendas e comissões dependem dos dados disponibilizados pelos marketplaces.</p>

    <section className="analyticsCard salesCard">
      <div className="salesHead"><div><h2>Vendas e comissões Shopee · 30 dias</h2>
        <p className="muted">Dados do relatório oficial de afiliados da Shopee, atualizados automaticamente a cada 3 horas. Comissão pendente vira concluída quando o pedido é entregue; cancelamentos não são pagos.</p></div>
        <SyncCommissionsButton/></div>
      {!sales?<p className="muted">O relatório ainda não foi carregado. Use “Atualizar vendas agora”.</p>:<>
      <div className="metricGrid">
        <div><b>{sales.summary.orders||0}</b><span>Pedidos</span><small>{sales.summary.items||0} ite{Number(sales.summary.items)===1?"m":"ns"} · {brl(sales.summary.sales)} em vendas</small></div>
        <div><b>{brl(Number(sales.summary.pending||0)+Number(sales.summary.completed||0))}</b><span>Comissão estimada</span><small>{brl(sales.summary.completed)} concluída · {brl(sales.summary.pending)} pendente</small></div>
        <div><b>{sales.summary.conversion==null?"–":`${(sales.summary.conversion*100).toFixed(1)}%`}</b><span>Conversão</span><small>pedidos ÷ {sales.summary.clicks} cliques reais</small></div>
        <div><b>{sales.summary.cancelled_orders||0}</b><span>Pedidos cancelados</span><small>{brl(sales.summary.cancelled)} que não serão pagos</small></div>
      </div>
      <div className="analyticsGrid analyticsGrid2">
        <div><h3>Comissão por canal</h3>{sales.byChannel.length?sales.byChannel.map((c:any)=><div className="barRow" key={c.channel}><span>{salesChannel(c.channel)}</span><strong>{brl(c.commission)} · {c.orders} pedido{c.orders===1?"":"s"}</strong></div>):<p className="muted">Sem vendas no período.</p>}</div>
        <div><h3>Produtos que mais renderam</h3>{sales.byOffer.length?sales.byOffer.map((o:any)=><div className="barRow" key={o.item_id}><span title={o.title}>{shortName(o.title)}{!o.offer_id&&<small> (fora da Vitrine)</small>}</span><strong>{brl(o.commission)} · {o.qty} un.</strong></div>):<p className="muted">Sem vendas no período.</p>}</div>
      </div>
      {sales.recent.length>0&&<details className="salesRecent"><summary>Últimas vendas</summary><div className="tableWrap"><table className="adminTable"><thead><tr><th>Data</th><th>Produto</th><th>Canal</th><th>Status</th><th>Comissão</th></tr></thead><tbody>
        {sales.recent.map((r:any,i:number)=><tr key={i}><td>{when(r.purchase_time)}</td><td>{shortName(r.title)}</td><td>{r.channel?channelLabel(r.channel):"–"}</td><td>{statusLabel(r.order_status)}</td><td>{brl(r.commission)}</td></tr>)}
      </tbody></table></div></details>}
      <p className="muted salesSync">{sales.last?`Última atualização: ${when(sales.last.finished_at)} · ${sales.last.ok?"ok":"falhou: "+sales.last.message}`:"Ainda não sincronizado."}</p>
      </>}
    </section>

    <section className="metricGrid analyticsMetrics">
      <div><b>{s.clicks}</b><span>Cliques rastreados</span><small>Cliques de robôs excluídos: {Number(s.excluded_bots||0)}</small></div>
      <div><b>{s.published}</b><span>Ofertas publicadas</span></div>
      <div><b>{avg}</b><span>Cliques por oferta publicada</span></div>
      <div><b>{s.clicked_offers||0}</b><span>Ofertas que receberam clique</span></div>
    </section>

    <section className="analyticsInsight">
      <div><span>Canal com mais cliques</span><strong>{topChannel?channelLabel(topChannel.channel):"Sem dados"}</strong><small>{topChannel?`${topChannel.clicks} clique${Number(topChannel.clicks)===1?"":"s"}`:"Divulgue links rastreados para começar."}</small></div>
      <div><span>Últimos 30 dias</span><strong>{last30} clique{last30===1?"":"s"}</strong><small>Tráfego rastreado no período móvel.</small></div>
      <div><span>7 dias vs. 7 anteriores</span><strong>{trend===null?"Novo tráfego":`${trend>0?"+":""}${trend}%`}</strong><small>{last7} agora · {prev7} no período anterior. Variação de cliques, não de vendas.</small></div>
    </section>

    <section className="analyticsCard appClicks">
      <h2>Pessoas vindas dos apps Facebook e Instagram</h2>
      <p className="muted">Conta só cliques feitos dentro dos aplicativos do Facebook e do Instagram, que é como clica quem viu o post ou o Story. Exclui robôs, testes e os aparelhos do administrador.</p>
      <div className="metricGrid"><div><b>{appsTotal}</b><span>Cliques pelos apps (total)</span><small>{appsLast30} nos últimos 30 dias</small></div>
      {apps.map((a:any)=><div key={a.channel}><b>{a.clicks}</b><span>Atribuídos a {channelLabel(a.channel)}</span><small>{a.last30} nos últimos 30 dias</small></div>)}</div>
    </section>

    <div className="analyticsGrid analyticsGrid2">
      <section className="analyticsCard">
        <h2>Cliques por canal</h2>
        {data.channels.length?data.channels.map((c:any)=><div className="channelPerformance" key={c.channel}>
          <div><span>{channelLabel(c.channel)}</span><strong>{c.clicks}</strong></div>
          <div className="analyticsBar"><i style={{width:`${Math.max(4,Math.round(Number(c.clicks)/maxChannel*100))}%`}}/></div>
        </div>):<p className="muted">Os canais aparecerão aqui conforme receberem cliques.</p>}
      </section>

      <section className="analyticsCard">
        <h2>Últimos 7 dias</h2>
        {data.recent.length?<div className="recentChart">{data.recent.map((r:any)=><div key={String(r.day)}><span>{r.clicks}</span><i style={{height:`${Math.max(8,Math.round(Number(r.clicks)/maxRecent*100))}%`}}/><small>{dayLabel(r.day)}</small></div>)}</div>:<p className="muted">Ainda não há cliques recentes para montar o histórico.</p>}
      </section>
    </div>

    <section className="analyticsCard topOffers2">
      <h2>Ofertas mais clicadas</h2>
      {data.top.length?<div className="tableScroll"><table className="adminTable"><thead><tr><th>Produto</th><th>Marketplace</th><th>Total</th><th>Facebook</th><th>Instagram</th><th>WhatsApp</th><th>Telegram</th><th>Pinterest</th><th>Vitrine</th></tr></thead><tbody>
        {data.top.map((o:any)=><tr key={o.id}><td><div className="analyticsProduct">{o.image_url?<img src={o.image_url} alt="" loading="lazy"/>:<span className="analyticsProductPlaceholder">VA</span>}<span title={o.title}>{shortName(o.title)}</span></div></td><td>{o.marketplace}</td><td><strong>{o.clicks}</strong></td><td>{o.facebook??0}</td><td>{o.instagram}</td><td>{o.whatsapp}</td><td>{o.telegram}</td><td>{o.pinterest}</td><td>{o.vitrine}</td></tr>)}
      </tbody></table></div>:<p className="muted">Nenhuma oferta cadastrada.</p>}
      <p className="analyticsNote">Os cliques indicam interesse no link. Não representam, por si só, compras ou comissões confirmadas.</p>
    </section>
  </main>
}
