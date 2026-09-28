"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";

const primary = [
  ["Painel", "/operacao"],
  ["Produtos", "/garimpo-inteligente"],
  ["Ofertas", "/central"],
  ["Divulgação", "/automacao"],
  ["Resultados", "/resultados"],
  ["Configurações", "/settings"],
  ["Vitrine", "/ofertas"],
];
const secondary = [
  ["Início", "/admin"], ["Saúde", "/prontidao"], ["Fontes", "/products"],
  ["Conteúdo", "/conteudo"], ["Criativos", "/criativos"],
];
export default function MainNav(){
 const path=usePathname(); const [open,setOpen]=useState(false); const [moreOpen,setMoreOpen]=useState(false); const moreRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  setMoreOpen(false);
 },[path]);
 useEffect(()=>{
  const closeMore=(event:PointerEvent)=>{ if(moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false); };
  const closeEscape=(event:KeyboardEvent)=>{ if(event.key==="Escape") setMoreOpen(false); };
  document.addEventListener("pointerdown",closeMore,true);
  document.addEventListener("keydown",closeEscape);
  return ()=>{document.removeEventListener("pointerdown",closeMore,true);document.removeEventListener("keydown",closeEscape)};
 },[]);
 const item=([label,href]:string[]) => <Link key={href} className={path===href?"active":""} href={href} onClick={()=>{setOpen(false);setMoreOpen(false)}}>{label}</Link>;
 return <>
  <button className="mobileMenuButton" type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?"Fechar":"Menu"}</button>
  <nav className={`mainNav ${open?"open":""}`} aria-label="Menu principal">
    <div className="primaryNav">{primary.map(item)}</div>
    <div ref={moreRef} className={`moreNav ${moreOpen?"open":""}`}><button type="button" className="moreNavTrigger" aria-expanded={moreOpen} onClick={()=>setMoreOpen(v=>!v)}>Mais</button>{moreOpen&&<div className="moreNavMenu">{secondary.map(item)}</div>}</div>
  </nav>
 </>;
}
