'use client';
import {useState} from 'react';
export default function ManychatOffer({id,channel}:{id:number;channel:'instagram'|'facebook'}){
  const [result,setResult]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function prepare(){setBusy(true);setError('');setResult(null);
    try{const r=await fetch(`/api/manychat/offer?id=${id}&channel=${channel}`,{method:'POST'});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Falha ao preparar.');setResult(j)}
    catch(e:any){setError(e.message)}finally{setBusy(false)}
  }
  return <section className="noticeBox"><b>Resposta no Manychat · {channel==='facebook'?'Facebook':'Instagram'}</b>
    <p>Use o link salvo e prepare a resposta para o produto. A palavra-chave e o botão precisam estar vinculados no Manychat. Threads não está incluído.</p>
    <button type="button" onClick={prepare} disabled={busy}>{busy?'Preparando…':'Preparar resposta Manychat'}</button>
    {error&&<p role="alert">{error}</p>}{result&&<div role="status"><p>{result.note}</p>
      <p>Palavra-chave sugerida: <b>{result.keyword}</b></p><p>Campo do botão: <code>{result.fieldName}</code></p>
      <label>Link atualizado do botão<input readOnly value={result.link} onFocus={e=>e.target.select()}/></label>
      <label>Resposta<textarea readOnly value={result.message} onFocus={e=>e.target.select()}/></label>
      <p>Use o mesmo link nas respostas existentes: ele acompanha as futuras correções desta oferta.</p>
    </div>}
  </section>;
}
