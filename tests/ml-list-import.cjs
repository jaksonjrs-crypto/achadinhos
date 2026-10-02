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

async function verifyRoute(){
  const known=[{external_id:null,title:'Calça Wide Leg Feminina Calça Duna Pantalona Social Trabalho',source:'offer'}];
  const inserted=[];
  const sql=async(strings,...v)=>{
    const q=strings.join('?');
    if(q.includes('UNION ALL SELECT'))return known;
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
  vm.runInNewContext(code,{module:m,exports:m.exports,File,console,require:n=>({'next/server':{NextResponse:{json:(data,opts={})=>({data,status:opts.status||200})}},'@/lib/db':{db:()=>sql},'@/lib/ml-list-parser':parser}[n])});
  function request(action,ids=[]){const f=new FormData();f.set('file',file);f.set('action',action);for(const id of ids)f.append('selected',id);return {formData:async()=>f};}
  const preview=await m.exports.POST(request('preview'));
  assert.equal(preview.status,200);assert.equal(inserted.length,0,'preview does not import');
  assert.equal(preview.data.products[0].possibleDuplicate,true,'manual base title triggers review');
  const first=await m.exports.POST(request('import',p.products.map(x=>x.externalId)));
  assert.equal(first.data.imported,2,'distinct products can share list URL');
  const repeat=await m.exports.POST(request('import',p.products.map(x=>x.externalId)));
  assert.equal(repeat.data.imported,0);assert.equal(repeat.data.duplicates,2);
  const invalid=await m.exports.POST(request('import',['MLB999']));assert.equal(invalid.status,400);
  console.log('PASS: upload preview without writes, possible manual duplicate, selected batch import, shared list URL, repeat import and invalid selection.');
}
verifyRoute().catch(e=>{console.error(e);process.exitCode=1});
