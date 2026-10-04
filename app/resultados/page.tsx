import { APP_VERSION } from "@/lib/version";
import { getDashboardStats } from "@/lib/analytics";
export const dynamic="force-dynamic";
export const revalidate=0;

const channelLabel=(v:string)=>({instagram:"Instagram",whatsapp:"WhatsApp",telegram:"Telegram",pinterest:"Pinterest",vitrine:"Vitrine"}[v]||v);
const dayLabel=(v:any)=>new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"UTC"}).format(new Date(v));
const shortName=(v:string)=>{const clean=String(v||"").replace(/\s+/g," ").trim(); const words=clean.split(" "); return words.length>7?`${words.slice(0,7).join(" ")}…`:clean};

export default async function Resultados(){
  let data:any={summary:{total:0,published:0,drafts:0,expired:0,clicks:0,clicked_offers:0},channels:[],top:[],recent:[],periods:{last7:0,prev7:0,last30:0}};
  try{data=await getDashboardStats()}catch{}
  const s=data.summary;
  const maxChannel=Math.max(1,...data.channels.map((c:any)=>Number(c.clicks)));
  const maxRecent=Math.max(1,...data.recent.map((r:any)=>Number(r.clicks)));
  const avg=s.published>0?(Number(s.clicks)/Number(s.published)).toFixed(1):"0";
  const topChannel=data.channels[0];
  const last7=Number(data.periods?.last7||0), prev7=Number(data.periods?.prev7||0), last30=Number(data.periods?.last30||0);
  const trend=prev7===0?(last7>0?null:0):Math.round((last7-prev7)/prev7*100);

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span>
    <h1>Resultados</h1>
    <p className="muted">Veja quais ofertas e canais realmente estão atraindo cliques. A contagem de cliques é feita pela própria Vitrine e não depende da API da Shopee; vendas e comissões dependem dos dados disponibilizados pelos marketplaces.</p>

    <section className="metricGrid analyticsMetrics">
      <div><b>{s.clicks}</b><span>Cliques rastreados</span></div>
      <div><b>{s.published}</b><span>Ofertas publicadas</span></div>
      <div><b>{avg}</b><span>Cliques por oferta publicada</span></div>
      <div><b>{s.clicked_offers||0}</b><span>Ofertas que receberam clique</span></div>
    </section>

    <section className="analyticsInsight">
      <div><span>Canal com mais cliques</span><strong>{topChannel?channelLabel(topChannel.channel):"Sem dados"}</strong><small>{topChannel?`${topChannel.clicks} clique${Number(topChannel.clicks)===1?"":"s"}`:"Divulgue links rastreados para começar."}</small></div>
      <div><span>Últimos 30 dias</span><strong>{last30} clique{last30===1?"":"s"}</strong><small>Tráfego rastreado no período móvel.</small></div>
      <div><span>7 dias vs. 7 anteriores</span><strong>{trend===null?"Novo tráfego":`${trend>0?"+":""}${trend}%`}</strong><small>{last7} agora · {prev7} no período anterior. Variação de cliques, não de vendas.</small></div>
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
      {data.top.length?<div className="tableScroll"><table className="adminTable"><thead><tr><th>Produto</th><th>Marketplace</th><th>Total</th><th>Instagram</th><th>WhatsApp</th><th>Telegram</th><th>Pinterest</th><th>Vitrine</th></tr></thead><tbody>
        {data.top.map((o:any)=><tr key={o.id}><td><div className="analyticsProduct">{o.image_url?<img src={o.image_url} alt="" loading="lazy"/>:<span className="analyticsProductPlaceholder">VA</span>}<span title={o.title}>{shortName(o.title)}</span></div></td><td>{o.marketplace}</td><td><strong>{o.clicks}</strong></td><td>{o.instagram}</td><td>{o.whatsapp}</td><td>{o.telegram}</td><td>{o.pinterest}</td><td>{o.vitrine}</td></tr>)}
      </tbody></table></div>:<p className="muted">Nenhuma oferta cadastrada.</p>}
      <p className="analyticsNote">Os cliques indicam interesse no link. Não representam, por si só, compras ou comissões confirmadas.</p>
    </section>
  </main>
}
