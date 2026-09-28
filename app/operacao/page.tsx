import { APP_VERSION } from "@/lib/version";
import { listAllOffers } from "@/lib/offers";
import { getDashboardStats } from "@/lib/analytics";
export const dynamic="force-dynamic";

export default async function Operacao(){
  let offers:any[]=[]; let data:any={summary:{clicks:0,published:0,drafts:0,clicked_offers:0},channels:[],top:[]};
  try{offers=await listAllOffers()}catch{}
  try{data=await getDashboardStats()}catch{}
  const s=data.summary||{};
  const drafts=offers.filter(o=>o.status==="draft");
  const incomplete=drafts.filter(o=>!(o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url));
  const ready=drafts.filter(o=>o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url);
  const published=offers.filter(o=>o.status==="published");
  const featured=published.filter(o=>o.featured);
  const top=data.top?.[0];
  const last7=Number(data.periods?.last7||0);
  const prev7=Number(data.periods?.prev7||0);
  const trend=prev7===0?(last7>0?null:0):Math.round((last7-prev7)/prev7*100);
  let candidatePending=0; try{const {listCandidates}=await import("@/lib/candidates");candidatePending=(await listCandidates()).filter((c:any)=>c.status==="approved"&&!(c.title&&c.image_url&&Number(c.price)>0&&c.product_url)).length}catch{}
  const exceptions=incomplete.length+candidatePending;
  const today=new Date(); today.setHours(0,0,0,0);
  const publishedToday=published.filter((o:any)=>new Date(o.updated_at||o.created_at).getTime()>=today.getTime()).length;
  const recentOffers=[...published].sort((a:any,b:any)=>new Date(b.updated_at||b.created_at).getTime()-new Date(a.updated_at||a.created_at).getTime()).slice(0,4);
  const externalPending=2; // Shopee live + publicação social automática continuam aguardando integração oficial.
  const next=exceptions?{title:"Resolver pendências",text:`${exceptions} item(ns) precisam da sua intervenção. O restante do fluxo segue no Autopiloto.`,href:candidatePending?"/garimpo-inteligente":"/central",action:"Ver pendências"}:
    ready.length?{title:"Publicar ofertas prontas",text:`${ready.length} rascunho(s) passaram pelo controle de qualidade.`,href:"/central",action:"Abrir Central"}:
    published.length?{title:"Divulgar ofertas",text:`${published.length} oferta(s) estão publicadas e podem entrar na rodada de divulgação.`,href:"/automacao",action:"Abrir Automação"}:
    {title:"Criar primeira oferta",text:"Comece pelo Garimpo Inteligente e transforme um candidato aprovado em oferta.",href:"/garimpo-inteligente",action:"Abrir Garimpo"};

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span>
    <h1>Painel Operacional 2.0</h1>
    <div className="releasePill">v1.5 • operação diária</div>
    <a className="readinessLink" href="/prontidao">Ver checklist de prontidão →</a>
    <p className="muted">Autopiloto ativo: o sistema prepara e publica ofertas completas; você atua apenas nas exceções.</p>
    <section className={`autopilotStatus ${exceptions?"hasExceptions":"allClear"}`}><div><span>AUTOPILOTO</span><h2>{exceptions?`${exceptions} pendência${exceptions===1?"":"s"}`:"Tudo em ordem"}</h2><p>{exceptions?"Há itens que precisam de uma decisão ou dado seu.":"Nenhuma intervenção necessária agora. Ofertas completas seguem automaticamente para Vitrine, Conteúdo, Criativos e Divulgação."}</p></div><a className="mini publish" href={exceptions?(candidatePending?"/garimpo-inteligente":"/central"):"/resultados"}>{exceptions?"Abrir pendências":"Acompanhar resultados"}</a></section>

    <section className="mobileSupervisor">
      <div className="supervisorHead"><div><span>RESUMO DO AUTOPILOTO</span><h2>{exceptions?"Sua atenção é necessária":"Você não precisa fazer nada agora"}</h2></div><b className={exceptions?"supervisorWarn":"supervisorOk"}>{exceptions?`${exceptions} pendência${exceptions===1?"":"s"}`:"Tudo certo"}</b></div>
      <div className="supervisorStats"><div><b>{publishedToday}</b><span>publicadas hoje</span></div><div><b>{published.length}</b><span>na Vitrine</span></div><div><b>{last7}</b><span>cliques em 7 dias</span></div><div><b>{externalPending}</b><span>integrações pendentes</span></div></div>
      <div className="activityFeed"><strong>Atividade recente</strong>{recentOffers.length?recentOffers.map((o:any)=><p key={o.id}><span>✓</span><b>{o.title}</b><small>publicada e pronta para divulgação</small></p>):<p><small>Nenhuma publicação recente.</small></p>}</div>
    </section>

    <section className="operationKpis">
      <a href="/garimpo-inteligente"><strong>{exceptions}</strong><span>pendências para você</span></a>
      <a href="/central"><strong>{drafts.length}</strong><span>rascunhos na Central</span></a>
      <a href="/ofertas"><strong>{published.length}</strong><span>ofertas publicadas</span></a>
      <a href="/resultados"><strong>{Number(s.clicks||0)}</strong><span>cliques rastreados</span></a>
    </section>

    <section className="nextActionCard">
      <div><span>Próxima ação sugerida</span><h2>{next.title}</h2><p>{next.text}</p></div>
      <a className="button" href={next.href}>{next.action}</a>
    </section>

    <section className="dailyFlow">
      <a href="/garimpo-inteligente"><span>1</span><b>Garimpar</b><small>Avaliar candidatos</small></a>
      <a href="/central"><span>2</span><b>Revisar</b><small>Completar e publicar</small></a>
      <a href="/conteudo"><span>3</span><b>Preparar</b><small>Textos de divulgação</small></a>
      <a href="/criativos"><span>4</span><b>Criar</b><small>Feed e Story</small></a>
      <a href="/automacao"><span>5</span><b>Divulgar</b><small>Fila por canal</small></a>
      <a href="/resultados"><span>6</span><b>Medir</b><small>Cliques e tendências</small></a>
    </section>

    <div className="operationColumns">
      <section className="analyticsCard">
        <h2>Saúde da operação</h2>
        <div className="healthRows">
          <p><b>Rascunhos completos</b><span className={ready.length?"readyPill":"manualPill"}>{ready.length}</span></p>
          <p><b>Precisam de revisão</b><span className={incomplete.length?"waitPill":"readyPill"}>{incomplete.length}</span></p>
          <p><b>Publicadas</b><span className="readyPill">{published.length}</span></p>
          <p><b>Em destaque</b><span className="manualPill">{featured.length}</span></p>
        </div>
      </section>
      <section className="analyticsCard">
        <h2>Resposta do público</h2>
        <div className="healthRows">
          <p><b>Ofertas com clique</b><span>{Number(s.clicked_offers||0)}</span></p>
          <p><b>Total de cliques</b><span>{Number(s.clicks||0)}</span></p>
          <p><b>Últimos 7 dias</b><span>{last7}</span></p>
          <p><b>7 dias vs. anteriores</b><span>{trend===null?"Novo tráfego":`${trend>0?"+":""}${trend}%`}</span></p>
          <p><b>Mais clicada</b><span>{top?`${top.clicks} clique${Number(top.clicks)===1?"":"s"}`:"Sem dados"}</span></p>
        </div>
        {top&&<small className="muted operationTopTitle">{top.title}</small>}
      </section>
    </div>

    <section className="integrationBox">
      <div className="integrationHead"><h2>Integrações</h2><a href="/settings">Abrir Central de Integrações →</a></div>
      <div className="integrationRows">
        <p><b>Banco + Vitrine + rastreamento</b><span className="readyPill">Operacionais</span></p>
        <p><b>Conteúdo + Criativos + Agenda</b><span className="readyPill">Operacionais</span></p>
        <p><b>Shopee Open API</b><span className="waitPill">Aguardando acesso</span></p>
        <p><b>Publicação externa automática</b><span className="manualPill">Ainda manual</span></p>
      </div>
    </section>
  </main>
}
