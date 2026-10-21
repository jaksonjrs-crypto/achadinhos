'use client';
import {useEffect,useState} from 'react';
export default function MiningProfiles(){
 const [profiles,setProfiles]=useState<any[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch('/api/mining-profiles',{cache:'no-store'});if(!r.ok)throw Error('Falha ao carregar perfis');setProfiles((await r.json()).profiles);}
 useEffect(()=>{load().catch(e=>setMessage(e.message))},[]);
 async function save(e:React.FormEvent<HTMLFormElement>,id:string){e.preventDefault();setBusy(true);const form=new FormData(e.currentTarget);try{const r=await fetch('/api/mining-profiles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(form),id,active:form.get('active')==='on'})});const d=await r.json();if(!r.ok)throw Error(d.error);await load();setMessage('Perfil salvo. Buscas manuais entram somente em revisão.')}catch(e:any){setMessage(e.message)}finally{setBusy(false)}}
 return <section className="integrationBox miningProfiles"><h2>Perfis de garimpo</h2><p>O PRINCIPAL e as campanhas ativas dentro das datas trabalham juntos. Livre é exclusivo de busca manual. Categorias vazias permitem qualquer categoria; palavras são separadas por vírgula. Datas usam horário de Brasília.</p><p role="status">{message}</p>{[...profiles,{id:'',name:'',keywords:[],forbidden:[],categories:[],min_score:0}].map(p=><details key={p.id}><summary>{p.id==='principal'?'PRINCIPAL · ':''}{p.name||'+ Novo perfil'} {p.active?'· ativo':''}</summary><form onSubmit={e=>save(e,p.id)}>
 <label>Nome<input name="name" defaultValue={p.name} required maxLength={100}/></label>
 <label>Palavras-chave<textarea name="keywords" defaultValue={p.keywords.join(', ')}/></label>
 <label>Palavras proibidas<textarea name="forbidden" defaultValue={p.forbidden.join(', ')}/></label>
 <label>Categorias permitidas<input name="categories" defaultValue={p.categories.join(', ')}/></label>
 <label>Preço mínimo<input name="min_price" type="number" min="0" step="0.01" defaultValue={p.min_price??''}/></label>
 <label>Preço máximo<input name="max_price" type="number" min="0" step="0.01" defaultValue={p.max_price??''}/></label>
 <label>Score mínimo<input name="min_score" type="number" min="0" max="100" defaultValue={p.min_score}/></label>
 <label>Início<input type="date" name="starts_on" defaultValue={p.starts_on||''}/></label><label>Fim<input type="date" name="ends_on" defaultValue={p.ends_on||''}/></label>
 <label><input type="checkbox" name="active" defaultChecked={p.active} disabled={p.id==='livre'}/> Ativo</label><button disabled={busy}>Salvar perfil</button>
 </form></details>)}</section>;
}
