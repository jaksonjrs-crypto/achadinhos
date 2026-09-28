import { APP_VERSION } from "@/lib/version";
import { listPublishedOffers } from "@/lib/offers";
import AutomationBoard from "./AutomationBoard";
export const dynamic="force-dynamic";

const channels=[
  {name:"Instagram",key:"instagram",time:"12:15",mode:"Copiar legenda + criativo"},
  {name:"WhatsApp",key:"whatsapp",time:"13:00",mode:"Copiar mensagem + link"},
  {name:"Telegram",key:"telegram",time:"18:30",mode:"Copiar mensagem + link"},
  {name:"Pinterest",key:"pinterest",time:"20:00",mode:"Copiar texto + criativo"},
];

const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export default async function Automacao(){
  let offers:any[]=[]; try{offers=await listPublishedOffers()}catch{}
  const top=offers.slice(0,6);
  return <main className="panel">
    
    <span className="badge">{APP_VERSION}</span>
    <h1>Central de Divulgação 3.0</h1>
    <p className="muted">Organize e envie a divulgação das ofertas com links rastreados. O WhatsApp pode ser aberto diretamente com a mensagem pronta; os demais canais continuam no fluxo assistido até suas APIs serem conectadas e autorizadas.</p>

    <section className="automationSummary">
      <div><strong>{top.length}</strong><span>ofertas na fila</span></div>
      <div><strong>{top.length*channels.length}</strong><span>ações planejadas</span></div>
      <div><strong>4</strong><span>canais preparados</span></div>
    </section>

    <section className="integrationBox">
      <h2>Status das integrações</h2>
      <div className="integrationRows">
        <p><b>Vitrine dos Achados</b><span className="readyPill">Ativa</span></p>
        <p><b>Links rastreados</b><span className="readyPill">Ativos</span></p>
        <p><b>Shopee Open API</b><span className="waitPill">Aguardando credenciais</span></p>
        <p><b>WhatsApp</b><span className="readyPill">Envio assistido ativo</span></p>
        <p><b>Outras redes sociais</b><span className="manualPill">Publicação assistida</span></p>
      </div>
    </section>

    <h2>Fila operacional de divulgação</h2>
    {top.length===0?<div className="empty">Publique uma oferta na Central de Ofertas para criar a agenda.</div>:
      <AutomationBoard offers={top.map((o:any)=>({id:o.id,title:o.title,priceLabel:money(o.price),imageUrl:o.image_url,marketplace:o.marketplace}))}/>}
    
    <section className="integrationBox">
      <h2>Checklist para ativar automações</h2>
      <div className="integrationRows">
        <p><b>Oferta publicada na Vitrine</b><span className="readyPill">Pronto</span></p>
        <p><b>Redirecionamento para a Shopee</b><span className="readyPill">Validado</span></p>
        <p><b>Rastreamento por canal</b><span className="readyPill">Pronto</span></p>
        <p><b>Textos de divulgação</b><span className="readyPill">Pronto</span></p>
        <p><b>Criativos Feed e Story</b><span className="readyPill">Pronto</span></p>
        <p><b>Importação automática Shopee</b><span className="waitPill">Aguardando API</span></p>
        <p><b>Publicação automática em redes</b><span className="manualPill">Conectar depois</span></p>
      </div>
    </section>
<div className="noticeBox"><b>Importante:</b> esta versão prepara a operação sem inventar integrações. Quando a API da Shopee for liberada, o conector poderá substituir o cadastro manual. Publicação automática em Instagram/WhatsApp/Telegram/Pinterest só será ativada quando houver autorização e API compatível para cada canal.</div>
  </main>
}