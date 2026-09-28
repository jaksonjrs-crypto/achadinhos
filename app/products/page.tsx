import { APP_VERSION } from "@/lib/version";

export default function ProductsPage(){
  return <main className="panel">
    <span className="badge">{APP_VERSION}</span>
    <h1>Fontes de produtos</h1>
    <p className="muted">A descoberta automática por marketplace será ativada somente quando cada conector estiver oficialmente disponível e validado.</p>

    <section className="sourceGrid">
      <article className="sourceCard">
        <div><span className="channelTag">Mercado Livre</span><span className="readyPill">Conector integrado</span></div>
        <h2>Garimpo conectado ao fluxo</h2>
        <p>Quando a API autoriza a busca, os produtos entram diretamente na fila do Garimpo Inteligente, com score e deduplicação antes da aprovação.</p>
        <a className="mini publish" href="/garimpo-inteligente">Abrir Garimpo</a>
      </article>

      <article className="sourceCard">
        <div><span className="channelTag">Shopee</span><span className="waitPill">Aguardando API</span></div>
        <h2>Affiliate Open API</h2>
        <p>O projeto está preparado para receber o conector quando houver credenciais e documentação oficial verificável.</p>
        <a className="mini secondaryMini" href="/settings">Ver integração</a>
      </article>

      <article className="sourceCard activeSource">
        <div><span className="channelTag">Fluxo atual</span><span className="readyPill">Operacional</span></div>
        <h2>Garimpo Inteligente</h2>
        <p>Cadastre produtos encontrados manualmente, avalie o potencial, corrija os dados e transforme candidatos aprovados em ofertas.</p>
        <a className="mini publish" href="/garimpo-inteligente">Abrir Garimpo</a>
      </article>
    </section>

    <section className="noticeBox">
      <b>Princípio da v1.1:</b> nenhuma busca externa aparece como disponível antes de funcionar de verdade. Assim que um conector oficial for liberado, esta área passa a concentrar a importação automática para a fila de candidatos.
    </section>
  </main>
}
