'use client';
import {useEffect,useState} from 'react';
// v3.6.1 — Botão "Instalar o app" da Vitrine. Aparece só quando o navegador permite
// instalar (Android/Chrome/Edge); no iPhone mostra a dica de "Adicionar à Tela de Início".
export default function InstallApp(){
  const [prompt,setPrompt]=useState<any>(null),[ios,setIos]=useState(false),[hidden,setHidden]=useState(true);
  useEffect(()=>{
    const standalone=window.matchMedia?.('(display-mode: standalone)').matches||(navigator as any).standalone;
    if(standalone)return;
    const onPrompt=(e:any)=>{e.preventDefault();setPrompt(e);setHidden(false)};
    window.addEventListener('beforeinstallprompt',onPrompt);
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!/crios|fxios/i.test(navigator.userAgent)){setIos(true);setHidden(false)}
    return ()=>window.removeEventListener('beforeinstallprompt',onPrompt);
  },[]);
  if(hidden)return null;
  if(ios&&!prompt)return <p className="installApp"><b>📲 Tenha a Vitrine no seu iPhone:</b> toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>;
  return <p className="installApp"><button type="button" onClick={async()=>{try{await prompt.prompt();await prompt.userChoice}finally{setPrompt(null);setHidden(true)}}}>📲 Instalar o app da Vitrine</button></p>;
}
