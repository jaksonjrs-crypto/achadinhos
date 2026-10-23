"use client";
// v3.6.12: monta a mensagem pronta do WhatsApp (nome, preço e link rastreado c=w) e copia.
import {useState} from "react";
const brl=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function whatsAppText(o:{id:number;title:string;price:number;original_price?:number|null;marketplace?:string|null},origin="https://minhavitrinedeachados.com.br"){
  const price=Number(o.price),orig=Number(o.original_price||0);
  const store=/mercado/i.test(String(o.marketplace||""))?"Mercado Livre":"Shopee";
  return ["🔥 ACHADO DO DIA",String(o.title).trim(),
    orig>price?`De ${brl(orig)} por ${brl(price)}`:`Por ${brl(price)}`,
    `👉 Link: ${origin}/o/${o.id}?c=w`,
    `Frete e garantia ${store} • link de afiliado`].join("\n");
}
export default function CopyWhatsApp(props:{id:number;title:string;price:number;original_price?:number|null;marketplace?:string|null}){
  const [ok,setOk]=useState(false);
  async function copy(){
    const text=whatsAppText(props);
    try{await navigator.clipboard.writeText(text)}catch{window.prompt("Copie a mensagem:",text);return}
    setOk(true);setTimeout(()=>setOk(false),2000);
  }
  return <button type="button" className="mini" onClick={copy} title="Copia a mensagem pronta para colar no WhatsApp">{ok?"✓ Copiado":"📋 WhatsApp"}</button>;
}
