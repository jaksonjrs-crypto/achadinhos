export type OfferFilters=Record<string,string|undefined>;
export function filterOffers<T extends {perfil?:string|null;title:string;category:string;marketplace:string;status:string;price:number;created_at:string}>(all:T[],params:OfferFilters){
  const q=String(params.q||'').trim().toLowerCase();
  return all.filter(o=>(!q||`${o.title} ${o.category||''}`.toLowerCase().includes(q))&&
    (!params.perfil||params.perfil==='all'||(params.perfil==='empty'?!o.perfil:o.perfil===params.perfil))&&
    (!params.category||params.category==='all'||o.category===params.category)&&
    (!params.status||params.status==='all'||o.status===params.status)&&
    (!params.marketplace||params.marketplace==='all'||o.marketplace===params.marketplace))
    .sort((a,b)=>params.sort==='price_asc'?Number(a.price)-Number(b.price):params.sort==='price_desc'?Number(b.price)-Number(a.price):new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
}
