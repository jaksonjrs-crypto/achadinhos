export type MiningProfile={id:string;name:string;keywords:string[];forbidden:string[];categories:string[];min_price:number|null;max_price:number|null;min_score:number;active:boolean;starts_on:string|null;ends_on:string|null;manual_only:boolean};
export function normalize(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function contains(text:string,phrase:string){return (` ${normalize(text)} `).includes(` ${normalize(phrase)} `);}
export function profileMatch(p:MiningProfile,item:{title:string;category?:string;price:number;score:number}){
 if(p.id==='livre')return true;
 if(p.forbidden.some(w=>contains(item.title,w)))return false;
 if(p.keywords.length&&!p.keywords.some(w=>contains(item.title,w)))return false;
 if(p.categories.length&&!p.categories.some(c=>normalize(c)===normalize(item.category||'')))return false;
 return Number.isFinite(item.price)&&(p.min_price===null||item.price>=Number(p.min_price))&&(p.max_price===null||item.price<=Number(p.max_price))&&item.score>=p.min_score;
}
export function profileActive(p:MiningProfile,date:string){return p.active&&!p.manual_only&&(!p.starts_on||date>=p.starts_on)&&(!p.ends_on||date<=p.ends_on);}
