import {APP_VERSION} from '@/lib/version';
import AutopilotControls from './AutopilotControls';
export const dynamic='force-dynamic';
export default function Automacao(){return <main className="panel">
  <div className="adminPageHead"><div><span className="badge">{APP_VERSION}</span><h1>Autopiloto</h1><p className="muted">Regras para publicar candidatos aprovados na Vitrine, com limites e prevenção de repetição.</p></div><a className="mini publish" href="/divulgacao">Abrir fila de Divulgação</a></div>
  <AutopilotControls/>
  <div className="noticeBox">Os envios às redes sociais são controlados separadamente na fila de Divulgação. O Autopiloto de ofertas não envia mensagens nem publica posts nas redes.</div>
</main>}
