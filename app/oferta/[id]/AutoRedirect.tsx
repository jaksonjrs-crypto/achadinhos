"use client";
import { useEffect } from "react";
export default function AutoRedirect({id,channel}:{id:number;channel:string}){
  useEffect(()=>{window.location.replace(`/go/${id}?channel=${encodeURIComponent(channel)}`)},[]);
  return <p className="muted">Abrindo a oferta no marketplace…</p>;
}
