const assert=require('node:assert/strict');
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const offers=Array.from({length:25},(_,i)=>({id:i+1,title:`Produto ${i+1}`,price:10,marketplace:'Shopee',status:'published',created_at:'2026-10-01'}));
let highlights=[offers[0]];let failHighlights=false;
const output={};
const source=ts.transpileModule(fs.readFileSync('app/ofertas/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
vm.runInNewContext(source,{exports:output,require:(id)=>id==='@/lib/offers'?{listPublishedOffers:async()=>offers,listHomeHighlights:async()=>{if(failHighlights)throw Error();return highlights;}}:id==='@/lib/version'?{APP_VERSION:'test'}:require(id),URLSearchParams,Intl,Date});
(async()=>{
const render=async(params={})=>renderToStaticMarkup(await output.default({searchParams:Promise.resolve(params)}));
let html=await render();assert.match(html,/Destaques da Vitrine/);assert.match(html,/1–12 de 25 ofertas/);assert.match(html,/Página 1 de 3/);assert.match(html,/Produto 12/);
html=await render({pagina:'3'});assert.match(html,/25–25 de 25 ofertas/);assert.match(html,/Produto 25/);
highlights=[];html=await render();assert.doesNotMatch(html,/Destaques da Vitrine/);assert.match(html,/1–12 de 25 ofertas/);
failHighlights=true;html=await render();assert.match(html,/Produto 12/);assert.doesNotMatch(html,/Vitrine temporariamente indisponível/);
console.log('PASS: highlights additive, complete pagination, no highlights and independent query failure');
})();
