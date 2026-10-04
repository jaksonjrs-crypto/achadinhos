"use client";
import {useEffect,useState} from 'react';
import {PUBLICATION_TIMES,validatePublicationTimes} from '@/lib/autopilot-schedule';
type Policy={enabled:boolean;min_score:number;max_per_day:number;start_hour:number;end_hour:number;cooldown_days:number;telegram_auto_publish:boolean;instagram_auto_publish:boolean;facebook_auto_publish:boolean;scheduled_publish:boolean;publication_times:string[]};
export default function AutopilotControls(){
  const [policy,setPolicy]=useState<Policy|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[running,setRunning]=useState(false);
  const [cronConfigured,setCronConfigured]=useState(false),[telegramConfigured,setTelegramConfigured]=useState(false);
  const [instagramConfigured,setInstagramConfigured]=useState(false),[facebookConfigured,setFacebookConfigured]=useState(false);
  useEffect(()=>{fetch('/api/autopilot/policy',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d.ok){setPolicy({...d.policy,publication_times:d.policy.publication_times||[...PUBLICATION_TIMES]});setCronConfigured(Boolean(d.cronConfigured));setInstagramConfigured(Boolean(d.instagramConfigured));setFacebookConfigured(Boolean(d.facebookConfigured));setTelegramConfigured(Boolean(d.telegramConfigured))}else setMessage(d.error||'Falha ao carregar regras')}).catch(()=>setMessage('Falha ao carregar regras'))},[]);
  async function save(){if(!policy)return;setBusy(true);setMessage('');try{validatePublicationTimes(policy.publication_times,policy.start_hour,policy.end_hour);const r=await fetch('/api/autopilot/policy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(policy)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Falha');setPolicy(d.policy);setMessage('Regras salvas. A rotina horária depende do agendamento ativo em produção e respeita o horário permitido.')}catch(e:any){setMessage(e?.message||'Falha ao salvar')}finally{setBusy(false)}}
  async function runNow(){
    setRunning(true);setMessage('Executando a rotina com as regras salvas…');
    try{
      const r=await fetch('/api/autopilot/run',{method:'POST'});
      const d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||'Falha na execução');
      if(!d.ran){setMessage(d.reason||'Nenhuma execução realizada.');return}
      const discovery=d.discovery?.skipped?'A próxima busca na Shopee respeitará o intervalo de uma hora.':d.discovery?.ok?`Shopee: ${d.discovery.imported} novos candidatos.`:(d.discovery?.reason||'Consulta Shopee indisponível.');
      setMessage(`${discovery} Vitrine: ${d.published} publicadas. Telegram: ${d.telegramSent} enviadas, ${d.telegramFailed} falhas. Instagram: ${d.instagramSent||0} enviadas, ${d.instagramFailed||0} falhas. Facebook: ${d.facebookSent||0} enviadas, ${d.facebookFailed||0} falhas. Pendentes: ${d.pending}. Falhas de ofertas: ${d.failed}.${d.reason?` ${d.reason}.`:''}`);
    }catch{setMessage('Não foi possível confirmar a execução. Confira a fila de Divulgação antes de tentar novamente.')}finally{setRunning(false)}
  }
  if(!policy)return <section className="integrationBox"><h2>Regras do Autopiloto</h2><p role="status">{message||'Carregando regras…'}</p></section>;
  return <section className="integrationBox"><h2>Regras do Autopiloto</h2>
    <p className="muted">A rotina busca na Shopee no máximo uma vez por hora dentro do horário permitido, quando o agendamento horário estiver ativo em produção. O limite diário controla publicações; novas buscas continuam após esse limite.</p>
    {!telegramConfigured&&<p className="qualityAlert">Para enviar ao Telegram automaticamente, configure o bot e o canal na Vercel.</p>}
    {!cronConfigured&&<p className="qualityAlert">A execução programada precisa da variável CRON_SECRET na Vercel. As regras podem ser salvas, mas a rotina não executará até a configuração.</p>}
    <div className="policyGrid">
      <label className="policyToggle"><input type="checkbox" checked={policy.enabled} onChange={e=>setPolicy({...policy,enabled:e.target.checked})}/> Ativar Autopiloto</label>
      <label className="policyToggle"><input type="checkbox" checked={policy.telegram_auto_publish} disabled={!telegramConfigured} onChange={e=>setPolicy({...policy,telegram_auto_publish:e.target.checked})}/> Enviar novas ofertas ao Telegram automaticamente</label>
      <label className="policyToggle"><input type="checkbox" checked={Boolean(policy.scheduled_publish)} onChange={e=>setPolicy({...policy,scheduled_publish:e.target.checked,instagram_auto_publish:e.target.checked&&policy.instagram_auto_publish,facebook_auto_publish:e.target.checked&&policy.facebook_auto_publish})}/> Usar horários de envio personalizados</label>
      <label className="policyToggle"><input type="checkbox" checked={Boolean(policy.instagram_auto_publish)} disabled={!instagramConfigured||!policy.scheduled_publish} onChange={e=>setPolicy({...policy,instagram_auto_publish:e.target.checked})}/> Enviar ofertas ao Instagram automaticamente</label>
      <label className="policyToggle"><input type="checkbox" checked={Boolean(policy.facebook_auto_publish)} disabled={!facebookConfigured||!policy.scheduled_publish} onChange={e=>setPolicy({...policy,facebook_auto_publish:e.target.checked})}/> Enviar ofertas ao Facebook automaticamente</label>
      {!facebookConfigured&&<p>Para ativar o Facebook, configure FACEBOOK_PAGE_ID e FACEBOOK_PAGE_ACCESS_TOKEN na Vercel e confira a conexão em Divulgação.</p>}
      <label>Score mínimo<input type="number" min="0" max="100" value={policy.min_score} onChange={e=>setPolicy({...policy,min_score:Number(e.target.value)})}/></label>
      <label>Máximo de novas ofertas por dia<input type="number" min="1" max="20" value={policy.max_per_day} onChange={e=>setPolicy({...policy,max_per_day:Number(e.target.value)})}/></label>
      <label>Início (hora de Brasília)<input type="number" min="0" max="23" value={policy.start_hour} onChange={e=>setPolicy({...policy,start_hour:Number(e.target.value)})}/></label>
      <label>Fim (hora de Brasília)<input type="number" min="1" max="24" value={policy.end_hour} onChange={e=>setPolicy({...policy,end_hour:Number(e.target.value)})}/></label>
      <label>Evitar repetição por dias<input type="number" min="1" max="90" value={policy.cooldown_days} onChange={e=>setPolicy({...policy,cooldown_days:Number(e.target.value)})}/></label>
    </div>
    {policy.scheduled_publish&&<fieldset className="integrationBox"><legend>Programação dos envios</legend>
      <label>Envios por dia em cada canal<input type="number" min="1" max="20" value={policy.publication_times.length} onChange={e=>{const count=Number(e.target.value);if(!Number.isInteger(count)||count<1||count>20)return;const times=policy.publication_times.slice(0,count);while(times.length<count)times.push('');setPolicy({...policy,publication_times:times})}}/></label>
      <button type="button" className="mini" onClick={()=>setPolicy({...policy,publication_times:[...PUBLICATION_TIMES]})}>Restaurar horários padrão</button>
      <div className="policyGrid">{policy.publication_times.map((time,index)=><label key={index}>Horário do envio {index+1}<input type="time" required value={time} onChange={e=>setPolicy({...policy,publication_times:policy.publication_times.map((t,i)=>i===index?e.target.value:t)})}/></label>)}</div>
      <p className="muted">Horário de Brasília. Um envio por horário em cada canal habilitado. Preencha todos os horários dentro da janela permitida e salve as regras.</p>
    </fieldset>}
    <p className="muted">Cada canal recebe no máximo {policy.publication_times.length} ofertas por dia nos horários escolhidos. O limite de novas ofertas controla apenas a entrada na Vitrine. A rotina confirma o preço na Shopee antes de enviar. Instagram e Facebook publicam imagens; no Facebook, a mensagem inclui o link da oferta. A programação é verificada a cada 15 minutos; o agendador pode atrasar. Horários perdidos não são enviados em lote.</p>
    <p className="muted">Com o envio ao Telegram desligado, as novas ofertas entram na fila de Divulgação para revisão. Ao ativá-lo, somente novas ofertas aprovadas pela rotina serão enviadas, respeitando o limite de ofertas do dia.</p>
    <button className="mini publish" disabled={busy||running} onClick={save}>{busy?'Salvando…':'Salvar regras'}</button><button className="mini" disabled={busy||running} onClick={runNow}>{running?'Executando…':'Executar agora'}</button><p className="muted">Executar agora usa as regras já salvas, incluindo horário, limite diário e envio ao Telegram.</p>{message&&<p role="status">{message}</p>}
  </section>
}
