import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {mlFetch,SITE_ID} from "@/lib/ml";
import {opportunityScore} from "@/lib/score";
import {productSafetyCheck} from "@/lib/product-safety";

export const dynamic="force-dynamic";

type AnyRow=Record<string,any>;
function optionalNum(v:any){
  if(v===null||v===undefined||v==="") return null;
  const n=Number(v); return Number.isFinite(n)?n:null;
}
function firstPicture(p:any){
  return String(p?.pictures?.[0]?.secure_url||p?.pictures?.[0]?.url||p?.thumbnail||"").trim()||null;
}
async function json(res:Response){return res.json().catch(()=>({}));}

// /products/search is the official catalog search. It is distinct from the
// restricted general listing search (/sites/MLB/search?q=...). We then resolve
// each catalog product's current buy-box winner and enrich those item ids in
// one /items/bulk call (the endpoint replacing /items?ids= in 2026).
async function discoverCatalog(keyword:string,limit:number,offset:number){
  const qs=new URLSearchParams({status:"active",site_id:SITE_ID,q:keyword,limit:String(limit),offset:String(offset)});
  const res=await mlFetch(`/products/search?${qs.toString()}`);
  const data=await json(res);
  if(!res.ok) return {ok:false as const,res,data};
  return {ok:true as const,data};
}

async function catalogDetails(ids:string[]){
  const out:AnyRow[]=[];
  // Keep concurrency modest; this route is user-triggered and normally <=20.
  for(let i=0;i<ids.length;i+=5){
    const chunk=ids.slice(i,i+5);
    const rows=await Promise.all(chunk.map(async id=>{
      const r=await mlFetch(`/products/${encodeURIComponent(id)}`);
      if(!r.ok) return null;
      return json(r);
    }));
    out.push(...rows.filter(Boolean) as AnyRow[]);
  }
  return out;
}

async function bulkItems(ids:string[]){
  if(!ids.length) return new Map<string,AnyRow>();
  const map=new Map<string,AnyRow>();
  for(let i=0;i<ids.length;i+=20){
    const chunk=ids.slice(i,i+20);
    const attrs=["body.id","body.title","body.price","body.original_price","body.permalink","body.thumbnail","body.pictures","body.currency_id","body.category_id","body.available_quantity","body.sold_quantity","body.shipping","body.seller_id","body.catalog_product_id"].join(",");
    const r=await mlFetch(`/items/bulk?ids=${encodeURIComponent(chunk.join(","))}&attributes=${encodeURIComponent(attrs)}`);
    const data=await json(r);
    if(!r.ok) continue;
    for(const row of (Array.isArray(data)?data:[])){
      if(Number(row?.status_code||row?.code)===200 && row?.body?.id) map.set(String(row.body.id),row.body);
    }
  }
  return map;
}

export async function POST(req:Request){
  try{
    const u=new URL(req.url);
    const keyword=String(u.searchParams.get("keyword")||"").trim();
    const category=String(u.searchParams.get("category")||"Outros").trim()||"Outros";
    const limit=Math.min(20,Math.max(1,Number(u.searchParams.get("limit")||20)));
    const offset=Math.max(0,Number(u.searchParams.get("offset")||0));
    const minScore=Math.min(100,Math.max(0,Number(u.searchParams.get("minScore")||45)));
    if(keyword.length<2) return NextResponse.json({ok:false,error:"Informe um tema para o garimpo."},{status:400});

    const found=await discoverCatalog(keyword,limit,offset);
    if(!found.ok){
      console.error("[ML_CATALOG_SEARCH]",{status:found.res.status,error:found.data?.error,message:found.data?.message});
      const message=found.res.status===401||found.res.status===403
        ? "O Mercado Livre recusou também a busca do catálogo para esta aplicação. Verifique as permissões da aplicação no painel de desenvolvedores."
        : (found.data?.message||"A API do Mercado Livre recusou a busca no catálogo.");
      return NextResponse.json({ok:false,error:message,upstreamStatus:found.res.status,source:"catalog"},{status:found.res.status});
    }

    const searchResults=Array.isArray(found.data?.results)?found.data.results:[];
    const ids=searchResults.map((p:any)=>String(p?.id||"")).filter(Boolean);
    const details=await catalogDetails(ids);
    const detailById=new Map(details.map((p:any)=>[String(p.id),p]));
    const winnerIds=details.map((p:any)=>String(p?.buy_box_winner?.item_id||"")).filter(Boolean);
    const items=await bulkItems([...new Set(winnerIds)]);

    const sql=db();
    let imported=0,updated=0,skippedUnsafe=0,skippedPublished=0,skippedQuality=0,skippedNoWinner=0;
    for(const base of searchResults){
      const catalogId=String(base?.id||"").trim();
      const detail=detailById.get(catalogId)||base;
      // /items/bulk enriches the winner, but it is not required: the catalog
      // product itself already exposes the current buy-box winner.
      const winner=detail?.buy_box_winner||base?.buy_box_winner||null;
      const winnerId=String(winner?.item_id||"").trim();
      if(!winnerId){skippedNoWinner++;continue}
      const enriched=items.get(winnerId)||null;
      const item={...(winner||{}),...(enriched||{}),id:winnerId};

      const externalId=winnerId;
      const title=String(enriched?.title||detail?.name||base?.name||"").trim();
      const productUrl=String(enriched?.permalink||detail?.permalink||base?.permalink||"").trim();
      if(!externalId||!title||!productUrl) continue;
      if(!productSafetyCheck(title,category,"Descoberto pelo catálogo oficial do Mercado Livre").allowed){skippedUnsafe++;continue}

      const alreadyOffer=await sql`SELECT id FROM offers WHERE LOWER(REPLACE(marketplace,' ',''))='mercadolivre' AND external_id=${externalId} LIMIT 1`;
      if(alreadyOffer.length){skippedPublished++;continue}

      const scoring=opportunityScore({
        price:optionalNum(item.price), original_price:optionalNum(item.original_price),
        sold_quantity:optionalNum(item.sold_quantity), available_quantity:optionalNum(item.available_quantity),
        free_shipping:!!item?.shipping?.free_shipping
      });
      if(scoring.score<minScore){skippedQuality++;continue}
      const sold=optionalNum(item.sold_quantity);
      const price=optionalNum(item.price);
      const originalPrice=optionalNum(item.original_price);
      const image=firstPicture(item)||firstPicture(detail)||firstPicture(base);
      const notes=[
        "Descoberto pelo catálogo oficial do Mercado Livre",
        `Produto catálogo: ${catalogId}`,
        `Item buy-box: ${externalId}`,
        enriched?"Item enriquecido via /items/bulk":"Oferta obtida do buy_box_winner",
        sold==null?"Vendas não informadas":`Vendas informadas: ${sold}`,
        item?.shipping?.free_shipping?"Frete grátis":"",
        scoring.reasons?.length?`Score: ${scoring.reasons.join(", ")}`:""
      ].filter(Boolean).join(" | ");

      const existing=await sql`SELECT id FROM product_candidates WHERE LOWER(REPLACE(marketplace,' ',''))='mercadolivre' AND external_id=${externalId} LIMIT 1`;
      if(existing.length){
        await sql`UPDATE product_candidates SET title=${title},category=${category},marketplace='Mercado Livre',product_url=${productUrl},image_url=${image},price=${price},original_price=${originalPrice},score=${scoring.score},notes=${notes},sold_quantity=${sold},updated_at=NOW() WHERE id=${(existing[0] as any).id}`;
        updated++;
      }else{
        await sql`INSERT INTO product_candidates(title,category,marketplace,product_url,image_url,price,original_price,score,status,notes,external_id,sold_quantity)
          VALUES(${title},${category},'Mercado Livre',${productUrl},${image},${price},${originalPrice},${scoring.score},'review',${notes},${externalId},${sold})`;
        imported++;
      }
    }
    return NextResponse.json({ok:true,source:"catalog-buybox-fallback",imported,updated,skippedUnsafe,skippedPublished,skippedQuality,skippedNoWinner,received:searchResults.length,total:found.data?.paging?.total??null,nextOffset:offset+limit,minScore});
  }catch(e:any){
    console.error("Mercado Livre import:",e?.message||e);
    return NextResponse.json({ok:false,error:e?.message||"Não foi possível importar produtos do Mercado Livre."},{status:502});
  }
}
