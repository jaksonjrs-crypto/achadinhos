"use client";
import {useEffect,useState} from 'react';
type Policy={enabled:boolean;min_score:number;max_per_day:number;start_hour:number;end_hour:number;cooldown_days:number;telegram_auto_publish:boolean};
export default function AutopilotControls(){
  const [policy,setPolicy]=useState<Policy|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[running,setRunning]=useState(false);
  const [cronConfigured,setCronConfigured]=useState(false),[telegramConfigured,setTelegramConfigured]=useState(false);
  useEffect(()=>{fetch('/api/autopilot/policy',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d.ok){setPolicy(d.policy);setCronConfigured(Boolean(d.cronConfigured));setTelegramConfigured(Boolean(d.telegramConfigured))}else setMessage(d.error||'Falha ao carregar regras')}).catch(()=>setMessage('Falha ao carregar regras'))},[]);
  async function save(){if(!policy)return;setBusy(true);setMessage('');try{const r=await fetch('/api/autopilot/policy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(policy)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Falha');setPolicy(d.policy);setMessage('Regras salvas. O agendamento diário é por volta de 12h (Brasília), dentro do horário permitido.')}catch(e:any){setMessage(e?.message||'Falha ao salvar')}finally{setBusy(false)}}
  async function runNow(){
    setRunning(true);setMessage('Executando a rotina com as regras salvas…');
    try{
      const r=await fetch('/api/autopilot/run',{method:'POST'});
      const d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||'Falha na execução');
      if(!d.ran){setMessage(d.reason||'Nenhuma execução realizada.');return}
      const discovery=d.discovery?.ok?`Shopee: ${d.discovery.imported} novos candidatos.`:(d.discovery?.reason||'Consulta Shopee indisponível.');
      setMessage(`${discovery} Vitrine: ${d.published} publicadas. Telegram: ${d.telegramSent} enviadas, ${d.telegramFailed} falhas. Pendentes: ${d.pending}. Falhas de ofertas: ${d.failed}.`);
    }catch{setMessage('Não foi possível confirmar a execução. Confira a fila de Divulgação antes de tentar novamente.')}finally{setRunning(false)}
  }
  if(!policy)return <section className="integrationBox"><h2>Regras do Autopiloto</h2><p role="status">{message||'Carregando regras…'}</p></section>;
  return <section className="integrationBox"><h2>Regras do Autopiloto</h2>
    <p className="muted">A rotina consulta a Shopee e avalia candidatos aprovados, completos e seguros. A execução depende da opção abaixo.</p>
    {!telegramConfigured&&<p className="qualityAlert">Para enviar ao Telegram automaticamente, configure o bot e o canal na Vercel.</p>}
    {!cronConfigured&&<p className="qualityAlert">A execução programada precisa da variável CRON_SECRET na Vercel. As regras podem ser salvas, mas a rotina não executará até a configuração.</p>}
    <div className="policyGrid">
      <label className="policyToggle"><input type="checkbox" checked={policy.enabled} onChange={e=>setPolicy({...policy,enabled:e.target.checked})}/> Ativar execução diária</label>
      <label className="policyToggle"><input type="checkbox" checked={policy.telegram_auto_publish} disabled={!telegramConfigured} onChange={e=>setPolicy({...policy,telegram_auto_publish:e.target.checked})}/> Enviar novas ofertas ao Telegram automaticamente</label>
      <label>Score mínimo<input type="number" min="0" max="100" value={policy.min_score} onChange={e=>setPolicy({...policy,min_score:Number(e.target.value)})}/></label>
      <label>Máximo de novas ofertas por dia<input type="number" min="1" max="20" value={policy.max_per_day} onChange={e=>setPolicy({...policy,max_per_day:Number(e.target.value)})}/></label>
      <label>Início (hora de Brasília)<input type="number" min="0" max="23" value={policy.start_hour} onChange={e=>setPolicy({...policy,start_hour:Number(e.target.value)})}/></label>
      <label>Fim (hora de Brasília)<input type="number" min="1" max="24" value={policy.end_hour} onChange={e=>setPolicy({...policy,end_hour:Number(e.target.value)})}/></label>
      <label>Evitar repetição por dias<input type="number" min="1" max="90" value={policy.cooldown_days} onChange={e=>setPolicy({...policy,cooldown_days:Number(e.target.value)})}/></label>
    </div>
    <p className="muted">Com o envio ao Telegram desligado, as novas ofertas entram na fila de Divulgação para revisão. Ao ativá-lo, somente novas ofertas aprovadas pela rotina diária serão enviadas, respeitando o limite de ofertas do dia.</p>
    <button className="mini publish" disabled={busy||running} onClick={save}>{busy?'Salvando…':'Salvar regras'}</button><button className="mini" disabled={busy||running} onClick={runNow}>{running?'Executando…':'Executar agora'}</button><p className="muted">Executar agora usa as regras já salvas, incluindo horário, limite diário e envio ao Telegram.</p>{message&&<p role="status">{message}</p>}
  </section>
}
