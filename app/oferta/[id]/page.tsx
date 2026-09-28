import type { Metadata } from "next";
import { db } from "@/lib/db";
import AutoRedirect from "./AutoRedirect";
export const dynamic="force-dynamic";

async function offer(id:number){
  if(!Number.isInteger(id)||id<1)return null;
  const sql=db();
  const rows=await sql`SELECT id,title,image_url,price,marketplace FROM offers WHERE id=${id} AND status='published' LIMIT 1`;
  return rows[0]||null;
}
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
  const {id}=await params; let o:any=null; try{o=await offer(Number(id))}catch{}
  if(!o)return {title:"Oferta | Vitrine dos Achados"};
  const description=`${o.title} por ${money(Number(o.price))}. Confira na Vitrine dos Achados.`;
  return {
    title:`${o.title} | Vitrine dos Achados`,description,
    openGraph:{title:o.title,description,type:"website",images:o.image_url?[{url:String(o.image_url),alt:o.title}]:[]},
    twitter:{card:"summary_large_image",title:o.title,description,images:o.image_url?[String(o.image_url)]:[]}
  };
}
export default async function OfertaShare({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params; const q=await searchParams; const n=Number(id);
  let o:any=null; try{o=await offer(n)}catch{}
  if(!o)return <main className="panel"><h1>Oferta indisponível</h1></main>;
  const allowed=new Set(["vitrine","instagram","facebook","whatsapp","telegram","pinterest","tiktok"]);
  const channel=allowed.has(String(q.channel))?String(q.channel):"vitrine";
  return <main className="panel"><h1>{o.title}</h1><strong>{money(Number(o.price))}</strong><AutoRedirect id={n} channel={channel}/><noscript><a href={`/go/${n}?channel=${channel}`}>Abrir oferta</a></noscript></main>;
}
