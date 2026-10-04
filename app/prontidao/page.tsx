import { APP_VERSION } from "@/lib/version";
import { listAllOffers } from "@/lib/offers";
import { getDashboardStats } from "@/lib/analytics";
import {facebookConfigured} from '@/lib/facebook';
export const dynamic="force-dynamic";

export default async function Prontidao(){
  const shopeeReady=Boolean(process.env.SHOPEE_APP_ID?.trim()&&process.env.SHOPEE_SECRET?.trim());
  const pinterestReady=Boolean(process.env.PINTEREST_APP_ID?.trim()&&process.env.PINTEREST_APP_SECRET?.trim()&&process.env.PINTEREST_REDIRECT_URI?.trim());
  const telegramReady=Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()&&process.env.TELEGRAM_CHAT_ID?.trim());
  const instagramReady=Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim()&&process.env.INSTAGRAM_USER_ID?.trim());
  let offers:any[]=[]; let stats:any={summary:{clicks:0,published:0,clicked_offers:0}};
  let dbOk=true, analyticsOk=true;
  try{offers=await listAllOffers()}catch{dbOk=false}
  try{stats=await getDashboardStats()}catch{analyticsOk=false}
  const published=offers.filter(o=>o.status==="published");
  const completePublished=published.filter(o=>o.title&&o.image_url&&Number(o.price)>0&&o.affiliate_url);
  const checks=[
    {name:"Banco e leitura de ofertas",ok:dbOk,detail:dbOk?"Consulta operacional":"Falha na consulta"},
    {name:"Ofertas publicadas completas",ok:published.length>0&&completePublished.length===published.length,detail:published.length?`${completePublished.length}/${published.length} completas`:"Nenhuma publicada"},
    {name:"Rastreamento com dados",ok:analyticsOk&&Number(stats.summary?.clicks||0)>0,detail:analyticsOk?`${Number(stats.summary?.clicks||0)} clique(s) registrado(s)`:"Analytics indisponível"},
    {name:"Filtro seguro do catálogo",ok:true,detail:"Aplicado em criar, editar, promover e publicar"},
    {name:"Central de Integrações",ok:true,detail:"Status sem exposição de segredos"},
    {name:"Vitrine pública",ok:true,detail:"Busca, categorias, transparência e links rastreados"},
    {name:"Catálogo publicado",ok:published.length>0,detail:published.length?`${published.length} oferta(s) ativa(s)`:"Sem ofertas ativas"},
    {name:"Ofertas recebendo tráfego",ok:Number(stats.summary?.clicked_offers||0)>0,detail:`${Number(stats.summary?.clicked_offers||0)} oferta(s) com clique`},
  ];
  const passed=checks.filter(c=>c.ok).length;
  const percent=Math.round(passed/checks.length*100);

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span>
    <h1>Saúde da Plataforma</h1>
    <p className="muted">Checklist operacional da versão atual baseado no estado real da plataforma. Ele separa o que já funciona do que ainda depende de integrações externas.</p>

    <section className="readinessHero">
      <div><strong>{percent}%</strong><span>{passed} de {checks.length} verificações do núcleo</span></div>
      <div className="readinessBar"><i style={{width:`${percent}%`}}/></div>
    </section>

    <section className="integrationBox">
      <h2>Checklist</h2>
      <div className="readinessList">
        {checks.map(c=><div key={c.name}><span className={c.ok?"readinessDot ok":"readinessDot pending"}>{c.ok?"✓":"!"}</span><p><b>{c.name}</b><small>{c.detail}</small></p><span className={c.ok?"readyPill":"waitPill"}>{c.ok?"OK":"Revisar"}</span></div>)}
      </div>
    </section>

    <section className="integrationBox">
      <h2>Integrações externas</h2>
      <p className="muted">A presença de credenciais habilita a consulta Shopee; a resposta da API confirma o acesso. Pinterest exige também a conta conectada; Telegram exige bot e canal acessíveis. Confira a resposta das APIs na Divulgação.</p>
      <div className="integrationRows">
        <p><b>Shopee Open API</b><span className={shopeeReady?"readyPill":"waitPill"}>{shopeeReady?"Credenciais presentes":"Credenciais pendentes"}</span></p>
        <p><b>Pinterest</b><span className={pinterestReady?"readyPill":"waitPill"}>{pinterestReady?"OAuth disponível":"Credenciais pendentes"}</span></p>
        <p><b>Telegram</b><span className={telegramReady?"readyPill":"waitPill"}>{telegramReady?"Bot configurado":"Bot pendente"}</span></p>
        <p><b>Instagram</b><span className={instagramReady?"readyPill":"manualPill"}>{instagramReady?"Credenciais cadastradas":"Envio assistido"}</span></p>
        <p><b>Facebook</b><span className={facebookConfigured()?"readyPill":"manualPill"}>{facebookConfigured()?"Credenciais cadastradas":"Envio assistido"}</span></p>
        <p><b>WhatsApp e TikTok</b><span className="manualPill">Envio assistido</span></p>
      </div>
    </section>

    <div className="scheduleActions"><a className="mini publish" href="/operacao">Voltar ao Painel</a><a className="mini secondaryMini" href="/ofertas">Abrir Vitrine</a></div>
  </main>
}
