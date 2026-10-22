const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ts=require('typescript');
function load(file,mocks={}){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>mocks[n],Buffer,URL,console});return m.exports;}
const safety=load('lib/product-safety.ts'),score=load('lib/score.ts');
const parser=load('lib/ml-list-parser.ts',{'./product-safety':safety,'./score':score});
const fixture=fs.readFileSync(path.join(__dirname,'fixtures/ml-list-sanitized.html'),'utf8');
const p=parser.parseMlListHtml(fixture);
assert.equal(p.loadedItems,2);assert.equal(p.totalItems,3);assert.equal(p.products.length,2);
assert.equal(p.products[0].price,52);assert.equal(p.products[0].originalPrice,119.99);
assert.equal(p.products[1].externalId,'MLB4217058289','catalog id must resolve to listing wid');
assert.equal(p.products[1].price,1299,'Pix price is conditional, not the standard price');
assert.match(p.products[1].priceCondition,/1?169,00/);
assert.equal(p.affiliateUrl,'https://meli.la/exampleList');
assert.ok(p.products.every(x=>x.productUrl===p.affiliateUrl));
assert.match(p.products[0].imageUrl,/^https:\/\/http2\.mlstatic\.com\/D_Q_NP_2X_633736-/);
assert.throws(()=>parser.parseMlListHtml('<script>throw new Error("executed")</script>'),/dados da lista/);
assert.throws(()=>parser.parseMlListHtml(fixture,'https://example.com/list'),/Compartilhar lista/);
assert.throws(()=>parser.validateMlListUrl('https://meli.la:444/example'),/inválido/);
assert.throws(()=>parser.parseMlListHtml('x'.repeat(parser.ML_LIST_MAX_BYTES+1)),/até 2 MB/);
assert.equal(safety.productSafetyCheck('Vestido Feminino Vinho Único').allowed,true);
assert.equal(safety.productSafetyCheck('Garrafa de vinho tinto 750 ml').allowed,false);
assert.equal(safety.productSafetyCheck('Camisa com garrafa de vinho').allowed,false);
const state=JSON.parse(fixture.match(/_n\.ctx\.r=(.*);window.fixture/)[1]);
state.appProps.pageProps.polycards.push(state.appProps.pageProps.polycards[0]);
assert.equal(parser.parseMlListHtml(`<script>_n.ctx.r=${JSON.stringify(state)}</script>`).products.length,2);
state.appProps.pageProps.polycards[0].components.find(c=>c.type==='title').title.text='Arma';
assert.equal(parser.parseMlListHtml(`<script>_n.ctx.r=${JSON.stringify(state)}</script>`).products.length,1);
if(process.argv[2]){
 const actual=parser.parseMlListHtml(fs.readFileSync(process.argv[2],'utf8'));
 assert.equal(actual.loadedItems,16);assert.equal(actual.totalItems,18);assert.equal(actual.products.length,16);
 assert.equal(actual.products.find(x=>x.externalId==='MLB4217058289').price,1299);
 console.log('Uploaded file verified: 16 products, 18 total; image URLs, listing IDs and conditional Pix prices parsed.');
}
console.log('PASS: JSON-only parsing, partial-list warning, catalog/listing identity, prices, affiliate destination, pictures, invalid input, size cap, duplicates and blocked products.');

function priceRefresh(){const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/ml-price-refresh.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:out,Number,Math,Date,String});return out;}
function loadRules(){const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/mining-profile-rules.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:out});return out;}
async function verifyRoute(){
  const known=[{external_id:null,title:'Calça Wide Leg Feminina Calça Duna Pantalona Social Trabalho',source:'offer'}];
  const inserted=[],updates=[];
  const sql=async(strings,...v)=>{
    const q=strings.join('?');
    if(q.includes('UNION ALL SELECT'))return known;
    if(q.includes('WITH old AS')){const id=v[0],o=known.find(k=>k.source==='offer'&&k.external_id===id);if(!o)return [];const old=o.price;o.price=v[2];updates.push(id);return [{id:7,title:o.title,old_price:old}];}
    if(q.includes('UPDATE product_candidates'))return [];
    if(q.includes('INSERT INTO product_candidates')){
      const id=v[8];
      if(inserted.includes(id))return [];
      inserted.push(id);known.push({external_id:id,title:v[0],source:'candidate'});return [{id:1}];
    }
    throw Error('Unexpected database operation');
  };
  const file=new File([fixture],'list.html',{type:'text/html'});
  // Adapt VM globals for the multipart route without a database or live API.
  const m={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,'app/api/mercadolivre/import-list/route.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{module:m,exports:m.exports,File,console,require:n=>({'next/server':{NextResponse:{json:(data,opts={})=>({data,status:opts.status||200})}},'@/lib/mining-profiles':{miningProfile:async()=>({id:'principal',keywords:['liquidificador'],forbidden:[],categories:[],min_price:20,max_price:150,min_score:0})},'@/lib/mining-profile-rules':loadRules(),'@/lib/click-learning':{topClickedTitles:async()=>[],clickBonus:()=>({bonus:0,reason:''})},'@/lib/db':{db:()=>sql},'@/lib/ml-list-parser':parser,'@/lib/ml-price-refresh':priceRefresh()}[n])});
  function request(action,ids=[]){const f=new FormData();f.set('file',file);f.set('action',action);for(const id of ids)f.append('selected',id);return {formData:async()=>f};}
  const preview=await m.exports.POST(request('preview'));
  assert.equal(preview.status,200);assert.equal(preview.data.products[0].profileEligible,false,'out-of-profile garment unchecked by preview');assert.equal(inserted.length,0,'preview does not import');
  assert.equal(preview.data.products[0].possibleDuplicate,true,'manual base title triggers review');
  const first=await m.exports.POST(request('import',p.products.map(x=>x.externalId)));
  assert.equal(first.data.imported,2,'distinct products can share list URL');
  const repeat=await m.exports.POST(request('import',p.products.map(x=>x.externalId)));
  assert.equal(repeat.data.imported,0);assert.equal(repeat.data.duplicates,2);
  const invalid=await m.exports.POST(request('import',['MLB999']));assert.equal(invalid.status,400);
  assert.equal(repeat.data.priceUpdated,0,'candidates are not offers');
  // Oferta publicada com preço antigo: reimportar a lista renova o preço.
  const target=p.products[0];known.push({external_id:target.externalId,title:target.title,source:'offer',price:target.price+20});
  const pv=await m.exports.POST(request('preview'));const row=pv.data.products.find(x=>x.externalId===target.externalId);
  assert.equal(row.currentPrice,target.price+20,'preview shows stored price');assert.equal(updates.length,0,'preview never writes prices');
  const refresh=await m.exports.POST(request('refresh'));
  assert.equal(refresh.status,200);assert.equal(refresh.data.priceUpdated,1);assert.equal(refresh.data.priceChanges[0].newPrice,target.price);assert.deepEqual(updates,[target.externalId]);
  const bad=await m.exports.POST(request('apagar'));assert.equal(bad.status,400);
  console.log('PASS: upload preview without writes, possible manual duplicate, selected batch import, shared list URL, repeat import, invalid selection and price refresh on re-import.');
}
verifyRoute().catch(e=>{console.error(e);process.exitCode=1});
