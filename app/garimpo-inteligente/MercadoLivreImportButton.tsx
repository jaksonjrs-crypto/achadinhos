'use client';
import {useState} from 'react';
import type {MlListPreview,MlListProduct} from '@/lib/ml-list-parser';
type Product=MlListProduct&{existing:boolean;possibleDuplicate:boolean};
type Preview=Omit<MlListPreview,'products'>&{products:Product[]};
const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);

export default function MercadoLivreImportButton(){
  const [open,setOpen]=useState(false),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<Preview|null>(null);
  const [selected,setSelected]=useState<string[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[finished,setFinished]=useState(false);
  async function submit(action:'preview'|'import'){
    if(!file)return;
    setBusy(true);setMessage('');
    try{
      const form=new FormData();form.set('file',file);form.set('action',action);
      if(action==='import')for(const id of selected)form.append('selected',id);
      const r=await fetch('/api/mercadolivre/import-list',{method:'POST',body:form});
      const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Falha ao importar a lista.');
      if(action==='preview'){setPreview(d);setSelected(d.products.filter((p:Product)=>!p.existing&&!p.possibleDuplicate).map((p:Product)=>p.externalId));setFinished(false)}
      else{setMessage(`${d.imported} produto(s) importado(s) para revisão · ${d.duplicates} já cadastrado(s).`);setFinished(true)}
    }catch(e:any){setMessage(e?.message||'Não foi possível importar a lista.')}
    finally{setBusy(false)}
  }
  return <div className="importToolbar mlImportToolbar">
    <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open}>Importar lista ML</button>
    {open&&<section className="integrationBox mlListImport" aria-label="Importar lista do Mercado Livre">
      <h2>Lista do Mercado Livre</h2>
      <p className="muted">Selecione os produtos na sua lista do ML. Abra a lista no computador, salve com Ctrl+S como “Página da Web, somente HTML” e carregue o arquivo aqui.</p>
      <label>Arquivo da lista <input type="file" accept=".html,.htm,text/html" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setPreview(null);setSelected([]);setMessage('');setFinished(false)}}/></label>
      <button type="button" className="mini publish" disabled={!file||busy} onClick={()=>submit('preview')}>{busy?'Processando…':'Ler produtos'}</button>
      {message&&<p role="status" className="noticeBox">{message}</p>}
      {preview&&!finished&&<>
        <p><b>{preview.listName}</b> · {preview.products.length} produtos disponíveis no arquivo.</p>
        {preview.loadedItems<preview.totalItems&&<p role="alert" className="noticeBox">Arquivo parcial: {preview.loadedItems} de {preview.totalItems} produtos. Salve as demais páginas da lista e importe seus arquivos também.</p>}
        {preview.skipped>0&&<p className="muted">{preview.skipped} item(ns) incompleto(s), repetido(s) ou indisponível(is) para importação.</p>}
        <p className="muted">Os preços são os do arquivo salvo. O botão de compra abrirá sua lista de afiliado. Você pode trocar o link de cada produto em Detalhes / corrigir antes de aprovar.</p>
        <label><input type="checkbox" checked={preview.products.some(p=>!p.existing&&!p.possibleDuplicate)&&preview.products.filter(p=>!p.existing&&!p.possibleDuplicate).every(p=>selected.includes(p.externalId))} onChange={e=>setSelected(e.target.checked?preview.products.filter(p=>!p.existing&&!p.possibleDuplicate).map(p=>p.externalId):[])}/> Selecionar todos os novos</label>
        <div className="mlListProducts">{preview.products.map(p=><label className="mlListProduct" key={p.externalId}>
          <input type="checkbox" disabled={p.existing||busy} checked={selected.includes(p.externalId)} onChange={e=>setSelected(ids=>e.target.checked?[...ids,p.externalId]:ids.filter(id=>id!==p.externalId))}/>
          <img src={p.imageUrl} alt="" loading="lazy"/><span><b>{p.title}</b><small>{money(p.price)}{p.priceCondition?` · ${p.priceCondition}`:''}{p.existing?' · Já cadastrado':p.possibleDuplicate?' · Possível duplicidade: confira o cadastro existente':''}</small></span>
        </label>)}</div>
        <button type="button" className="mini publish" disabled={busy||!selected.length} onClick={()=>submit('import')}>Importar {selected.length} selecionado(s)</button>
        <p className="muted">Entram em revisão. A publicação ocorre depois da sua aprovação no Garimpo.</p>
      </>}
      {finished&&<a className="mini publish" href="/garimpo-inteligente?marketplace=Mercado%20Livre">Ver produtos no Garimpo</a>}
    </section>}
  </div>
}
