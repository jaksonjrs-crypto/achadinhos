"use client";
import { useMemo, useState } from "react";

type Channel="instagram"|"whatsapp"|"telegram"|"pinterest"|"vitrine";
type Props={id:number;title:string;priceLabel:string;marketplace:string;initialChannel?:Channel};
const channels=["instagram","whatsapp","telegram","pinterest","vitrine"] as const;

export default function ContentTools({id,title,priceLabel,marketplace,initialChannel="instagram"}:Props){
  const [channel,setChannel]=useState<Channel>(initialChannel);
  const [copied,setCopied]=useState("");
  const [style,setStyle]=useState<"direto"|"beneficio"|"urgencia">("direto");
  const origin=typeof window!=="undefined"?window.location.origin:"";
  const channelCode:Record<Channel,string>={instagram:"i",whatsapp:"w",telegram:"t",pinterest:"p",vitrine:"v"};
  const linkFor=(target:Channel)=>`${origin}/o/${id}?c=${channelCode[target]}`;
  const customTrackedUrl=linkFor(channel);
  const shortTitle=title.length>62?`${title.slice(0,61).trim()}…`:title;

  const texts=useMemo(()=>{
    const intro={
      direto:`🏠 Achado da Vitrine: ${title}`,
      beneficio:`✨ Um achado que pode facilitar sua rotina: ${title}`,
      urgencia:`🔥 Vale conferir enquanto a oferta estiver disponível: ${title}`
    }[style];
    return {
      instagram:`${intro}\n💰 ${priceLabel}\n🔗 ${linkFor("instagram")}\n\n*Promoção sujeita a alteração a qualquer momento.\n\n#VitrineDosAchados #Achadinhos #Ofertas`,
      whatsapp:`${style==="urgencia"?"🔥 Oferta para conferir!":style==="beneficio"?"✨ Achado útil do dia!":"🔥 Achado de hoje!"}\n${shortTitle}\n💰 ${priceLabel}\n🔗 ${linkFor("whatsapp")}\n\n*Promoção sujeita a alteração a qualquer momento.`,
      telegram:`${style==="urgencia"?"🔥 OFERTA PARA CONFERIR":"🔥 ACHADO DO DIA"}\n${shortTitle}\n➡️ por ${priceLabel}\n🛒 ${marketplace}\n🔗 ${linkFor("telegram")}\n\n*Promoção sujeita a alteração a qualquer momento.`,
      pinterest:`${shortTitle}\n➡️ por ${priceLabel}\n🔗 ${linkFor("pinterest")}\n\n*Promoção sujeita a alteração a qualquer momento.`,
      roteiro:`Mostre a foto ou vídeo do produto → ${style==="beneficio"?"destaque o problema que ele pode ajudar a resolver → ":""}exiba o nome do produto → destaque o preço atual (${priceLabel}) → use apenas benefícios que você confirmou no anúncio → finalize com “Confira na Vitrine dos Achados”.`
    };
  },[id,title,priceLabel,marketplace,origin,style]);

  async function copy(label:string,value:string){
    try{
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else{
        const el=document.createElement("textarea");el.value=value;el.style.position="fixed";el.style.opacity="0";
        document.body.appendChild(el);el.focus();el.select();document.execCommand("copy");el.remove();
      }
      setCopied(label);setTimeout(()=>setCopied(""),1600);
    }catch{
      setCopied("");alert("Não foi possível copiar automaticamente. Selecione o conteúdo e copie manualmente.");
    }
  }
  const [contentType,setContentType]=useState<"instagram"|"whatsapp"|"telegram"|"pinterest"|"roteiro">(
    initialChannel==="vitrine"?"instagram":initialChannel
  );
  const contentLabels={instagram:"Instagram / Threads",whatsapp:"WhatsApp",telegram:"Telegram",pinterest:"Pinterest",roteiro:"Roteiro curto sem rosto"} as const;
  const selectedText=texts[contentType];

  return <>
    <div className="channelPicker">
      <label>Link personalizado</label>
      <select value={channel} onChange={e=>setChannel(e.target.value as Channel)}>
        {channels.map(c=><option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
      </select>
      <button type="button" onClick={()=>copy("link",customTrackedUrl)}>{copied==="link"?"Copiado!":"Copiar link personalizado"}</button>
    </div>

    <div className="contentStylePicker">
      <span>Estilo do texto</span>
      <button type="button" className={style==="direto"?"active":""} onClick={()=>setStyle("direto")}>Direto</button>
      <button type="button" className={style==="beneficio"?"active":""} onClick={()=>setStyle("beneficio")}>Benefício</button>
      <button type="button" className={style==="urgencia"?"active":""} onClick={()=>setStyle("urgencia")}>Oferta</button>
    </div>
    <div className="contentCompact">
      <div className="contentTabs" role="tablist" aria-label="Conteúdo por canal">
        {(Object.keys(contentLabels) as Array<keyof typeof contentLabels>).map(key=>
          <button type="button" role="tab" aria-selected={contentType===key} className={contentType===key?"active":""} key={key} onClick={()=>{setContentType(key); if(key!=="roteiro") setChannel(key as Channel);}}>
            {contentLabels[key]}
          </button>
        )}
      </div>
      <div className="copyBox contentPreview">
        <div className="copyHead"><b>{contentLabels[contentType]}</b><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {contentType!=="roteiro"&&<button type="button" className="copyBtn" onClick={()=>copy("url-"+contentType,linkFor(contentType as Channel))}>{copied==="url-"+contentType?"Link copiado!":"Copiar link"}</button>}
          <button type="button" className="copyBtn" onClick={()=>copy(contentType,selectedText)}>{copied===contentType?"Texto copiado!":"Copiar texto"}</button>
        </div></div>
        <div className="contentScroll"><p>{selectedText}</p></div>
      </div>
    </div>
  </>;
}
