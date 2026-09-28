"use client";
import { useMemo, useState } from "react";

const fields = [
  ["discount","Desconto","Quanto maior e mais real o desconto, melhor."],
  ["utility","Utilidade","O produto resolve um problema claro?"],
  ["visual","Apelo visual","É fácil demonstrar em imagem ou vídeo?"],
  ["content","Potencial de conteúdo","Gera headline e benefício claros?"],
  ["impulse","Compra por impulso","Preço/proposta favorecem decisão rápida?"],
  ["confidence","Confiança da oferta","Informações, preço e destino parecem consistentes?"],
] as const;

export default function CandidateEvaluator(){
  const [title,setTitle]=useState("");
  const [url,setUrl]=useState("");
  const [price,setPrice]=useState("");
  const [originalPrice,setOriginalPrice]=useState("");
  const [category,setCategory]=useState("Casa");
  const [imageUrl,setImageUrl]=useState("");
  const [notes,setNotes]=useState("");
  const [values,setValues]=useState<Record<string,number>>(
    Object.fromEntries(fields.map(([k])=>[k,3]))
  );
  const numericPrice=Number(price.replace(",","."));
  const numericOriginal=Number(originalPrice.replace(",","."));
  const discountPct=useMemo(()=>numericPrice>0&&numericOriginal>numericPrice?Math.round((1-numericPrice/numericOriginal)*100):0,[numericPrice,numericOriginal]);
  const completeness=[title.trim(),category.trim(),numericPrice>0,url.trim(),imageUrl.trim()].filter(Boolean).length;
  const score=useMemo(()=>{
    const manual=Math.round(Object.values(values).reduce((a,b)=>a+b,0)/(fields.length*5)*100);
    const discountBonus=Math.min(discountPct,40)/4;
    const completenessPenalty=(5-completeness)*4;
    return Math.max(0,Math.min(100,Math.round(manual*.9+discountBonus-completenessPenalty)));
  },[values,discountPct,completeness]);
  const level=score>=80?"Forte candidato":score>=60?"Candidato promissor":score>=40?"Revisar antes de publicar":"Baixa prioridade";

  function reset(){setTitle("");setUrl("");setPrice("");setOriginalPrice("");setCategory("Casa");setImageUrl("");setNotes("");setValues(Object.fromEntries(fields.map(([k])=>[k,3])))}

  return <section className="evaluator">
    <div className="evaluatorHead">
      <div><h2>Avaliador de candidato</h2><p className="muted">Use enquanto a importação automática da Shopee ainda não está disponível.</p></div>
      <div className="scoreBox"><strong>{score}</strong><span>/100</span><small>{level}</small>{discountPct>0&&<em>{discountPct}% OFF</em>}</div>
    </div>

    <div className="candidateFields">
      <label>Produto<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nome do produto"/></label>
      <label>Preço atual<input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Ex.: 59,90"/></label>
      <label>Preço anterior<input value={originalPrice} onChange={e=>setOriginalPrice(e.target.value)} placeholder="Ex.: 79,90"/></label>
      <label>Categoria<input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Ex.: Casa"/></label>
      <label className="full">Link do produto<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Cole o link para referência"/></label><label className="full">URL da imagem<input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="Cole o endereço da imagem principal do produto"/></label>
    </div>

    <div className="garimpoInsights">
      <div><b>{discountPct>0?`${discountPct}%`:"—"}</b><span>desconto calculado</span></div>
      <div><b>{completeness}/5</b><span>dados essenciais</span></div>
      <div><b>{imageUrl.trim()?"OK":"Falta"}</b><span>imagem</span></div>
      <div><b>{url.trim()?"OK":"Falta"}</b><span>link do produto</span></div>
    </div>
    {completeness<5&&<div className="qualityAlert">Complete nome, categoria, preço, link e imagem antes de priorizar este candidato.</div>}

    <div className="ratingGrid">
      {fields.map(([key,label,help])=><div className="ratingCard" key={key}>
        <div><b>{label}</b><small>{help}</small></div>
        <div className="ratingButtons">
          {[1,2,3,4,5].map(n=><button type="button" key={n} className={values[key]===n?"active":""} onClick={()=>setValues(v=>({...v,[key]:n}))}>{n}</button>)}
        </div>
      </div>)}
    </div>

    <label className="candidateNotes">Observações<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex.: bom apelo para cozinha, demonstrar uso em vídeo curto."/></label>
    <div className="evaluationResult">
      <div><span>Resultado</span><strong>{level}</strong><small>{score>=60?"Pode ser salvo para revisão e aprovação.":"Vale comparar com outros produtos antes de cadastrar."}</small></div>
      <div className="scheduleActions">
        <form action="/api/candidates" method="post">
          <input type="hidden" name="title" value={title}/><input type="hidden" name="product_url" value={url}/>
          <input type="hidden" name="price" value={price}/><input type="hidden" name="original_price" value={originalPrice}/><input type="hidden" name="category" value={category}/><input type="hidden" name="image_url" value={imageUrl}/><input type="hidden" name="score" value={score}/>
          <input type="hidden" name="notes" value={notes}/><input type="hidden" name="marketplace" value="Shopee"/>
          <button className="mini publish" type="submit" disabled={!title.trim()}>Salvar candidato</button>
        </form>
        <button className="mini secondaryMini" type="button" onClick={reset}>Limpar avaliação</button>
      </div>
    </div>
    <p className="scoreNote">A pontuação é uma triagem operacional, não uma garantia de vendas. Resultados reais continuam sendo medidos pelos cliques e conversões disponíveis.</p>
  </section>
}