const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),zlib=require('node:zlib'),ts=require('typescript');
function load(file,mocks={},env={}){
  const out={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{module:out,exports:out.exports,require:n=>n in mocks?mocks[n]:n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts'),mocks,env):require(n),process:{env},URL,URLSearchParams,Buffer,AbortSignal,fetch:async()=>{throw Error('Unexpected live request')},console});
  return out.exports;
}
const imp=load('lib/offer-import.ts',{'./affiliate-registry':{ensureAffiliateRegistry:async()=>async()=>[]}});
(async()=>{
 const one=await imp.parseImport(fs.readFileSync('../Anexo_1.xlsx'),'correcao.xlsx');
 const full=await imp.parseImport(fs.readFileSync('../Anexo_2.xlsx'),'completo.xlsx');
 assert.equal(one.length,1);assert.equal(full.length,112);assert.equal(one[0].link,'https://s.shopee.com.br/4B0qWdj8nM');assert.equal(one[0].itemId,'18698147487');
 assert.equal(one[0].subId,'VITRINE_ESCOVA_9EM1_16PORCENTO');imp.validateNewOffer(one[0]);
 assert.equal((await imp.importOffers(one,true)).created,1);
 let transactions=0;const sql=async()=>[{id:111,external_id:'18698147487',affiliate_url:'https://s.shopee.com.br/2gC2dn9U0e',affiliate_sub_id:null}];sql.transaction=async queries=>{transactions++;assert.equal(queries.length,2);return [[],[{offer_id:111}]];};
 const update=load('lib/offer-import.ts',{'./affiliate-registry':{ensureAffiliateRegistry:async()=>sql}});
 assert.equal((await update.importOffers(one,false)).updated,1);assert.equal(transactions,1);
 const again=load('lib/offer-import.ts',{'./affiliate-registry':{ensureAffiliateRegistry:async()=>async()=>[{id:111,external_id:one[0].itemId,affiliate_url:one[0].link,affiliate_sub_id:one[0].subId}]}});
 assert.equal((await again.importOffers(one,false)).skipped,1);
 assert.equal(imp.csvRows('a,b\r\n"Olá, mundo","duas\nlinhas"')[1][1],'duas\nlinhas');
 assert.throws(()=>imp.csvRows('a,b\n"incompleto'));
 const ex=load('lib/offer-export.ts');const values=[one[0].title,one[0].category,one[0].marketplace,one[0].price,one[0].original,one[0].link,one[0].itemId,one[0].subId,one[0].image,'Publicada',one[0].created,one[0].testLink];
 const csv=ex.csvExport([values]);assert.equal((await imp.parseImport(Buffer.from(csv),'test.csv'))[0].itemId,one[0].itemId);
 const review=await imp.importOffers(full,true);console.log('PASS: XLSX single +112 rows, CSV multiline and export roundtrip, update/create/idempotence, preserved app link and Sub ID.',review.updated,review.created,review.failed,review.skipped);
 if(review.failed)console.log(review.details.filter(x=>x.status==='failed'));
})().catch(e=>{console.error(e);process.exitCode=1});
