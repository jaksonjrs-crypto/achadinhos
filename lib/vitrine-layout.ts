// Regras puras de apresentação da Vitrine (v3.5.11). Sem acesso a banco,
// para poderem ser testadas e reutilizadas pela página pública.

type Item={title?:string|null;category?:string|null;price?:number;original_price?:number|null};

const norm=(v:unknown)=>String(v??'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g,'');

// Ícones das categorias reais do catálogo. Categorias novas aparecem com ✨.
const ICONS:Record<string,string>={casa:'🏠',cozinha:'🍳',infantil:'🧸',moda:'👗',saude:'💪',beleza:'💄',eletronicos:'🔌',pet:'🐾',organizacao:'📦',ferramentas:'🔧',esporte:'⚽',outros:'✨'};
export function categoryIcon(name:string){return ICONS[norm(name)]||'✨';}

// "Infantil" é uma categoria virtual: o catálogo guarda brinquedos como Casa/Outros,
// mas eles são os itens mais clicados, então ganham atalho próprio.
export const KIDS_CATEGORY='Infantil';
const KIDS=/\b(infantil|crianca|criancas|kids|bebe|brinquedo|brinquedos|patins|boneca|bonecas|carrinho de controle|controle remoto|blocos? de (montar|construcao)|bloco de construcao|lego|squishy|bolhas? de sabao|dinossauro|pelucia|super-?heroi|desenhos animados|fantasia|massinha|slime|quebra-?cabeca)\b/;
export function isKids(o:Item){return norm(o.category)==='infantil'||KIDS.test(norm(o.title));}

// Campanhas sazonais que ligam e desligam sozinhas pela data (horário de Brasília).
export type Season={key:string;label:string;match:(o:Item)=>boolean};
const CHRISTMAS=/\b(natal|natalin[oa]s?|arvore|pisca-?pisca|papai noel|presente|presentes|enfeite|guirlanda|ceia|panetone)\b/;
const discount=(o:Item)=>o.original_price&&o.price&&o.original_price>o.price?(1-o.price/o.original_price)*100:0;
export function activeSeasons(now=new Date()):Season[]{
  const br=new Date(now.getTime()-3*3600_000);const m=br.getUTCMonth()+1,d=br.getUTCDate();
  const list:Season[]=[];
  if(m===11)list.push({key:'black-friday',label:'🖤 Black Friday',match:o=>discount(o)>=40});
  if(m===11||(m===12&&d<=25))list.push({key:'natal',label:'🎄 Presentes de Natal',match:o=>CHRISTMAS.test(norm(o.title))||isKids(o)});
  return list;
}

export const SORTS=[
  {key:'relevancia',label:'Recomendados'},
  {key:'menor-preco',label:'Menor preço'},
  {key:'maior-desconto',label:'Maior desconto'},
  {key:'recentes',label:'Novidades'},
] as const;

export const PAGE_STEP=12;
export const MAX_SHOWN=240;
// Quantos itens mostrar: "qtd" (Ver mais) ou o antigo "pagina" convertido em lista acumulada.
export function shownCount(params:{qtd?:string;pagina?:string},total:number){
  const q=Number(params.qtd),p=Number(params.pagina);
  let n=Number.isSafeInteger(q)&&q>0?q:Number.isSafeInteger(p)&&p>0?p*PAGE_STEP:PAGE_STEP;
  n=Math.ceil(n/PAGE_STEP)*PAGE_STEP;
  return Math.max(0,Math.min(total,n,MAX_SHOWN));
}
