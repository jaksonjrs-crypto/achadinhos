"use client";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/version";

export default function SettingsPage() {
  const [ml,setMl]=useState<any>(null);
  const [integrations,setIntegrations]=useState<any>(null);
  const [pinterest,setPinterest]=useState<any>(null);
  useEffect(()=>{
    fetch("/api/connection").then(r=>r.json()).then(setMl).catch(()=>setMl({connected:false}));
    fetch("/api/integrations/status").then(r=>r.json()).then(setIntegrations).catch(()=>setIntegrations(null));
    fetch("/api/pinterest/status").then(r=>r.json()).then(setPinterest).catch(()=>setPinterest({connected:false}));
  },[]);

  const pill=(ok:boolean)=><span className={ok?"readyPill":"waitPill"}>{ok?"Configurado":"Pendente"}</span>;

  return <main className="panel">
    <span className="badge">{APP_VERSION}</span>
    <h1>Central de Integrações</h1>
    <p className="muted">Confira a prontidão técnica sem exibir senhas, tokens ou chaves secretas no navegador.</p>
    <div className="settingsQuick"><a href="/prontidao">Ver saúde completa da plataforma →</a></div>

    <section className="integrationBox">
      <h2>Infraestrutura</h2>
      <div className="integrationRows">
        <p><b>Banco de dados</b>{pill(Boolean(integrations?.database?.configured))}</p>
        <p><b>Criptografia de tokens</b>{pill(Boolean(integrations?.encryption?.configured))}</p>
      </div>
    </section>

    <section className="integrationBox">
      <span className="channelTag">Shopee</span>
      <h2>Affiliate Open API</h2>
      <div className="integrationRows">
        <p><b>Identificador do aplicativo</b>{pill(Boolean(integrations?.shopee?.appConfigured))}</p>
        <p><b>Segredo/chave do aplicativo</b>{pill(Boolean(integrations?.shopee?.secretConfigured))}</p>
        <p><b>Conector ao vivo</b>{pill(Boolean(integrations?.shopee?.liveConnector))}</p>
      </div>
      <p className="muted">{integrations?.shopee?.note||"Verificando configuração do servidor..."}</p>
      <div className="noticeBox"><b>Segurança:</b> quando a Shopee liberar as credenciais, cadastre-as somente nas variáveis de ambiente da Vercel. Não cole segredos em formulários do site nem nesta conversa.</div>
    </section>

    <section className="integrationBox">
      <span className="channelTag">Mercado Livre</span>
      <h2>{ml?.connected?"Conta conectada":"Conexão disponível"}</h2>
      {ml?.connected
        ? <><p>Conta autorizada e tokens protegidos no banco.</p><p><small>Última atualização: {String(ml.updated_at||"")}</small></p></>
        : <><p>O fluxo OAuth está preparado para autorização.</p><a className="button" href="/api/auth/mercadolivre/login">Conectar Mercado Livre</a></>}
      <p className="muted">A conexão OAuth não significa que a busca de produtos esteja liberada; esse recurso continua pendente enquanto o endpoint retornar bloqueio.</p>
    </section>


    <section className="integrationBox">
      <span className="channelTag">Pinterest</span>
      <h2>{pinterest?.connected?"Conta Business conectada":"API oficial"}</h2>
      <div className="integrationRows">
        <p><b>Credenciais do aplicativo</b>{pill(Boolean(pinterest?.envConfigured))}</p>
        <p><b>OAuth da conta</b>{pill(Boolean(pinterest?.connected))}</p>
      </div>
      {pinterest?.envConfigured&&!pinterest?.connected&&<a className="button" href="/api/auth/pinterest/login">Conectar Pinterest</a>}
      {pinterest?.connected&&<a className="button" href="/divulgacao">Abrir publicação Pinterest</a>}
      <p className="muted">Tokens ficam protegidos no servidor e não são exibidos no navegador.</p>
    </section>

    <section className="integrationBox">
      <h2>Próximas ativações</h2>
      <div className="integrationRows">
        <p><b>Importação Shopee → Garimpo</b>{pill(Boolean(integrations?.shopee?.liveConnector))}</p>
        <p><b>Filtro seguro de catálogo</b><span className="readyPill">Pronto</span></p>
        <p><b>Publicação em redes sociais</b><span className="manualPill">Manual por enquanto</span></p>
      </div>
    </section>
  </main>;
}
