'use client';
import {useState} from 'react';

export default function OfferImage({src,alt,eager=false}:{src?:string|null;alt:string;eager?:boolean}){
  const [failed,setFailed]=useState(!src);
  if(failed)return <div className="placeholder">Vitrine<br/>dos Achados</div>;
  return <img src={src!} alt={alt} loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'auto'} decoding="async" onError={()=>setFailed(true)}/>;
}
