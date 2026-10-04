import { APP_VERSION } from "@/lib/version";

import { integrationStatus } from "@/lib/integration-status";
export const dynamic = "force-dynamic";

export default function ProductsPage(){
  const {shopee} = integrationStatus();
  return <main className="panel">
    <span className="badge">{APP_VERSION}</span>
    <h1>Fontes de produtos</h1>
    <p className="muted">Confira o modo de importação de cada marketplace. Credenciais cadastradas e consulta aceita pela API são verificações diferentes.</p>

    <section className="sourceGrid">
      <article className="sourceCard">
        <div><span className="channelTag">Mercado Livre</span><span className="manualPill">Importação por lista</span></div>
        <h2>Lista de afiliados → Garimpo</h2>
        <p>Importe a lista de afiliados ou cadastre uma oferta manualmente. A descoberta automática de anúncios de terceiros está indisponível nesta aplicação; conectar a conta não libera esse recurso.</p>
        <a className="mini publish" href="/garimpo-inteligente">Abrir Garimpo</a>
      </article>

      <article className="sourceCard">
        <div><span className="channelTag">Shopee</span><span className={shopee.configured?"readyPill":"waitPill"}>{shopee.configured?"Credenciais configuradas":"Credenciais pendentes"}</span></div>
        <h2>Affiliate Open API</h2>
        <p>{shopee.note}</p>
        <a className="mini secondaryMini" href="/settings">Ver integração</a>
      </article>

      <article className="sourceCard activeSource">
        <div><span className="channelTag">Fluxo atual</span><span className="readyPill">Operacional</span></div>
        <h2>Garimpo Inteligente</h2>
        <p>Consulte ofertas da Shopee ou importe listas do Mercado Livre, avalie o potencial e transforme candidatos aprovados em ofertas.</p>
        <a className="mini publish" href="/garimpo-inteligente">Abrir Garimpo</a>
      </article>
    </section>

    <section className="noticeBox">
      <b>Status das fontes:</b> a configuração vem do servidor a cada acesso. A resposta de uma consulta confirma o acesso à API; a presença de credenciais não confirma uma importação.
    </section>
  </main>
}
