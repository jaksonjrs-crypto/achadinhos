"use client";
import { useRef, useState } from "react";

type Props={id:number;title:string;price:string;originalPrice:string|null;imageUrl:string|null;marketplace:string};
type Format="feed"|"story";

export default function CreativeMaker(p:Props){
  const [format,setFormat]=useState<Format>("feed");
  const [headline,setHeadline]=useState("ACHADO DO DIA");
  const [note,setNote]=useState("Confira preço e disponibilidade");
  const [downloading,setDownloading]=useState(false);
  const [copied,setCopied]=useState(false);
  const preview=useRef<HTMLDivElement>(null);
  const isStory=format==="story";
  const discount=discountPct(p.originalPrice||"",p.price);
  const trackedLink=typeof window!=="undefined"?`${window.location.origin}/go/${p.id}?channel=instagram`:"";
  async function copyLink(){if(!trackedLink)return;await navigator.clipboard.writeText(trackedLink);setCopied(true);setTimeout(()=>setCopied(false),1400)}

  async function download(){
    setDownloading(true);
    try{
      const w=1080,h=isStory?1920:1350;
      const c=document.createElement("canvas");c.width=w;c.height=h;
      const x=c.getContext("2d")!;
      x.fillStyle="#fbfbf8";x.fillRect(0,0,w,h);

      const headerH=isStory?230:180;
      x.fillStyle="#087b7c";x.fillRect(0,0,w,headerH);
      x.fillStyle="#fff";x.font=isStory?"900 64px Arial":"900 60px Arial";x.fillText("Vitrine dos Achados",70,isStory?125:105);
      x.fillStyle="#ff6426";x.font=isStory?"900 48px Arial":"900 44px Arial";x.fillText(headline.toUpperCase().slice(0,28),70,isStory?205:158);

      // Feed and Story use independent vertical geometry.
      const imgTop=isStory?300:220;
      const imgH=isStory?760:500;
      x.fillStyle="#f1f3ef";x.fillRect(70,imgTop,w-140,imgH);
      let drew=false;
      if(p.imageUrl){
        try{
          const img=new Image();img.crossOrigin="anonymous";img.src=p.imageUrl;
          await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
          const scale=Math.min((w-160)/img.width,(imgH-20)/img.height);
          const iw=img.width*scale,ih=img.height*scale;
          x.drawImage(img,(w-iw)/2,imgTop+(imgH-ih)/2,iw,ih);drew=true;
        }catch{}
      }
      if(!drew){x.fillStyle="#087b7c";x.font="700 38px Arial";x.textAlign="center";x.fillText("Vitrine dos Achados",w/2,imgTop+imgH/2);x.textAlign="left";}

      if(isStory){
        const textTop=imgTop+imgH+70;
        x.fillStyle="#087b7c";x.font="800 28px Arial";x.fillText(p.marketplace.toUpperCase(),70,textTop);
        x.fillStyle="#252a34";x.font="800 46px Arial";
        const titleLines=wrap(x,p.title,70,textTop+70,w-140,55,3);
        let cursor=textTop+70+(titleLines*55)+24;
        if(p.originalPrice){
          x.fillStyle="#777";x.font="32px Arial";x.fillText(p.originalPrice,70,cursor);
          const pct=discountPct(p.originalPrice,p.price);
          if(pct){x.fillStyle="#ff6426";x.font="800 28px Arial";x.fillText(`-${pct}%`,300,cursor);}
          cursor+=72;
        }
        x.fillStyle="#087b7c";x.font="900 70px Arial";x.fillText(p.price,70,cursor);
      }else{
        // Reserved commercial zone for Feed 4:5: title and prices can never enter CTA.
        const textTop=760;
        x.fillStyle="#087b7c";x.font="800 26px Arial";x.fillText(p.marketplace.toUpperCase(),70,textTop);
        x.fillStyle="#252a34";x.font="800 40px Arial";
        wrap(x,p.title,70,textTop+55,w-140,47,2);
        const priceOldY=930, priceY=1000;
        if(p.originalPrice){
          x.fillStyle="#777";x.font="30px Arial";x.fillText(p.originalPrice,70,priceOldY);
          const pct=discountPct(p.originalPrice,p.price);
          if(pct){x.fillStyle="#ff6426";x.font="800 27px Arial";x.fillText(`-${pct}%`,300,priceOldY);}
        }
        x.fillStyle="#087b7c";x.font="900 66px Arial";x.fillText(p.price,70,priceY);
      }

      const buttonY=isStory?h-190:1080;
      x.fillStyle="#ff6426";roundRect(x,70,buttonY,w-140,100,50);x.fill();
      x.fillStyle="#fff";x.font="900 38px Arial";x.textAlign="center";x.fillText("VER OFERTA",w/2,buttonY+65);x.textAlign="left";
      x.fillStyle="#555";x.font=isStory?"28px Arial":"26px Arial";x.fillText(note.slice(0,52),70,isStory?h-45:1245);
      const a=document.createElement("a");a.download=`vitrine-achado-${p.id}-${format}.png`;a.href=c.toDataURL("image/png");a.click();
    }finally{setDownloading(false)}
  }
  return <section className="creativeMaker">
    <div className={`creativePreview ${isStory?"story":""}`} ref={preview}>
      <div className="creativeBrand">Vitrine dos Achados</div>
      <div className="creativeHeadline">{headline}</div>
      <div className="creativeImage">{p.imageUrl?<img src={p.imageUrl} alt=""/>:<span>Vitrine dos Achados</span>}</div>
      <small>{p.marketplace}</small><h2>{p.title}</h2>
      {p.originalPrice&&<div className="priceRow"><del>{p.originalPrice}</del>{discountPct(p.originalPrice,p.price)>0&&<span className="discountBadge">-{discountPct(p.originalPrice,p.price)}%</span>}</div>}<strong>{p.price}</strong>
      <div className="creativeCta">VER OFERTA</div><em>{note}</em>
    </div>
    <div className="creativeControls">
      <label>Formato<select value={format} onChange={e=>setFormat(e.target.value as Format)}><option value="feed">Feed 4:5</option><option value="story">Story 9:16</option></select></label>
      <label>Chamada<input value={headline} maxLength={28} onChange={e=>setHeadline(e.target.value)}/></label>
      <div className="creativePresets">
        <span>Chamadas rápidas</span>
        <button type="button" onClick={()=>setHeadline("ACHADO DO DIA")}>Achado do dia</button>
        <button type="button" onClick={()=>setHeadline(discount>0?`${discount}% OFF`:"OFERTA DO DIA")}>{discount>0?`${discount}% OFF`:"Oferta do dia"}</button>
        <button type="button" onClick={()=>setHeadline("VALE CONFERIR")}>Vale conferir</button>
      </div>
      <label>Rodapé<input value={note} maxLength={52} onChange={e=>setNote(e.target.value)}/></label>
      <div className="creativeActionRow">
        <button type="button" onClick={download} disabled={downloading}>{downloading?"Gerando...":"Baixar PNG"}</button>
        <button type="button" className="secondaryCreative" onClick={copyLink}>{copied?"Link copiado!":"Copiar link Instagram"}</button>
      </div>
      <p>O arquivo usa a imagem cadastrada quando o servidor da imagem permite. Se bloquear o carregamento, o PNG mantém o layout da marca sem a foto.</p>
    </div>
  </section>
}
function wrap(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,max:number,line:number,maxLines:number){
  const words=text.split(/\s+/);let current="",all:string[]=[];
  for(const word of words){const test=current?current+" "+word:word;if(ctx.measureText(test).width>max&&current){all.push(current);current=word}else current=test}
  if(current)all.push(current);
  const truncated=all.length>maxLines;const lines=all.slice(0,maxLines);
  if(truncated&&lines.length){let last=lines[lines.length-1];while(ctx.measureText(last+"…").width>max&&last.includes(" "))last=last.replace(/\s+\S+$/,"");lines[lines.length-1]=last+"…";}
  lines.forEach((l,i)=>ctx.fillText(l,x,y+i*line));return lines.length;
}
function moneyNumber(v:string){return Number(v.replace(/[^0-9,.-]/g,"").replace(/\./g,"").replace(",","."));}
function discountPct(oldPrice:string,currentPrice:string){const old=moneyNumber(oldPrice),cur=moneyNumber(currentPrice);if(!old||!cur||old<=cur)return 0;return Math.round((1-cur/old)*100);}
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}