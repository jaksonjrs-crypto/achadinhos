const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),zlib=require('node:zlib'),ts=require('typescript');
function load(file,mocks={},env={}){
  const out={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{module:out,exports:out.exports,require:n=>n in mocks?mocks[n]:n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts'),mocks,env):require(n),process:{env},URL,URLSearchParams,Buffer,AbortSignal,fetch:async()=>{throw Error('Unexpected live request')},console});
  return out.exports;
}
const links=load('lib/shopee-links.ts');
assert.equal(links.needsLinkReview('https://s.shopee.com.br/6VOlABC'),true);
assert.equal(links.needsLinkReview('https://evil.test/6VOlABC'),false);
for(const u of ['https://shopee.com.br.evil.test/product/1/2','http://shopee.com.br/product/1/2','https://user:secret@shopee.com.br/product/1/2','https://shopee.com.br:8080/product/1/2'])assert.equal(links.isShopeeUrl(u),false);
assert.equal(links.canonicalProductUrl({itemId:'456',shopId:'123'}),'https://shopee.com.br/product/123/456');
assert.equal(links.productIdentity('https://shopee.com.br/title-i.123.456').itemId,'456');
assert.throws(()=>links.canonicalProductUrl({itemId:'999',productLink:'https://shopee.com.br/title-i.123.456'}));
assert.equal(links.numericItemId('i.123.456'),false);
const filters=load('lib/offer-filters.ts');
const offers=[{id:1,title:'Café Rosa',category:'Casa',marketplace:'Shopee',status:'published',price:12.3,created_at:'2026-10-19',affiliate_url:'https://s.shopee.com.br/6VOlABC',external_id:'1234567890123456789'},{id:2,title:'Café Azul',category:'Casa',marketplace:'Amazon',status:'draft',price:5,created_at:'2026-10-18'}];
assert.equal(filters.filterOffers(offers,{q:'café',category:'Casa',marketplace:'Shopee',status:'published'}).length,1);
assert.equal(filters.filterOffers(offers,{category:'Pet'}).length,0);
assert.equal(filters.filterOffers(offers,{sort:'price_asc'})[0].id,2);
const ex=load('lib/offer-export.ts');
const rows=ex.exportRows([offers[0]],'https://example.test');
assert.equal(rows[0].length,12);assert.equal(rows[0][6],'1234567890123456789');
const csv=ex.csvExport([['=HYPERLINK("https://evil.test")','\t+1','Olá, "mundo"',12.3]]);
assert(csv.startsWith('\uFEFF'));assert(csv.includes('"\'=HYPERLINK'));assert(csv.includes('"\'\t+1"'));assert(csv.includes('Olá, ""mundo""'));
function unzip(buffer){const files={};let pos=0;while(buffer.readUInt32LE(pos)===0x04034b50){const size=buffer.readUInt32LE(pos+18),namesize=buffer.readUInt16LE(pos+26),extra=buffer.readUInt16LE(pos+28),start=pos+30+namesize+extra;const name=buffer.subarray(pos+30,pos+30+namesize).toString();files[name]=zlib.inflateRawSync(buffer.subarray(start,start+size)).toString();pos=start+size}return files}
const xlsx=ex.xlsxExport(rows),files=unzip(xlsx),sheet=files['xl/worksheets/sheet1.xml'];
assert(sheet.includes('r="F2" s="2"'));assert(sheet.includes('1234567890123456789'));assert(!sheet.includes('<f>'));assert(sheet.includes('Café Rosa'));
assert(unzip(ex.xlsxExport(rows,new Set([offers[0].affiliate_url])))['xl/worksheets/sheet1.xml'].includes('r="F2" s="0"'));
assert(unzip(ex.xlsxExport([]))['xl/worksheets/sheet1.xml'].includes('A1:L1'));

async function conversionTests(){
  let generated=0,writes=0;
  const sql=async()=>{writes++;return []};
  const registry=load('lib/affiliate-registry.ts',{'./db':{db:()=>sql},'./shopee-affiliate':{fetchShopeeProducts:async()=>({nodes:[{itemId:'456',shopId:'123'}]}),generateShopeeLink:async()=>{generated++;return 'https://s.shopee.com.br/9VALID'}}});
  await assert.rejects(registry.convertShopeeOffer('',offers[0].affiliate_url));
  await assert.rejects(registry.convertShopeeOffer('456','https://evil.test/product'));
  await assert.rejects(registry.convertShopeeOffer('456','https://shopee.com.br/product/123/999'));
  assert.equal(generated,0);assert.equal(writes,0);
  const result=await registry.convertShopeeOffer('456','https://s.shopee.com.br/6VOlABC');
  assert.equal(result.link,'https://s.shopee.com.br/9VALID','a non-A code from authenticated API is valid');assert.equal(generated,1);assert(writes>0);
  const missing=load('lib/affiliate-registry.ts',{'./db':{db:()=>{throw Error('No write permitted')}},'./shopee-affiliate':{fetchShopeeProducts:async()=>({nodes:[]}),generateShopeeLink:async()=>{throw Error('Must not generate')}}});
  await assert.rejects(missing.convertShopeeOffer('456',offers[0].affiliate_url),/não encontrado/);
}
async function repairTests(){
  for(const mode of ['dry','success','unlinked','failure','concurrent','verified']){
    const queries=[];let conversions=0;
    const sql=async(strings,...values)=>{const q=strings.join('?');queries.push(q);
      if(q.includes('SELECT o.id'))return [{id:11,title:'Rosa',affiliate_url:offers[0].affiliate_url,external_id:mode==='unlinked'?null:'456',verified_url:mode==='verified'?offers[0].affiliate_url:null}];
      if(q.includes('WITH changed'))return mode==='concurrent'?[]:[{offer_id:11}];return [];};
    const repair=load('lib/affiliate-repair.ts',{'./affiliate-registry':{ensureAffiliateRegistry:async()=>sql,convertShopeeOffer:async()=>{conversions++;if(mode==='failure')throw Error('API down');return {link:'https://s.shopee.com.br/New'}}},'./catalog-sync':{resolveShopeeItemId:async()=>null,shopeeItemId:()=>null}});
    const r=await repair.repairAffiliateBatch(0,mode==='dry');
    if(mode==='success')assert.equal(r.updated,1);
    if(mode==='unlinked')assert.equal(r.unlinked,1);
    if(['failure','concurrent'].includes(mode))assert.equal(r.failed,1);
    if(['dry','verified','unlinked'].includes(mode)){assert.equal(conversions,0);assert(!queries.some(q=>q.includes('UPDATE offers')))}
    assert.equal(r.nextCursor,11);assert.equal(r.done,true);
  }
}
async function manychatTests(){
  let validated=0;
  const mc=load('lib/manychat.ts',{'./db':{db:()=>async()=>[{title:'Café Rosa!',status:'published'}]},'./affiliate-registry':{ensureOfferAffiliate:async()=>{validated++;return {title:'Café Rosa!',status:'published'}}}});
  const data=await mc.prepareManychat(11,'instagram','https://example.test',true);
  assert.equal(validated,1);assert.equal(data.fieldSynced,false);assert.equal(data.setupRequired,true);assert.equal(data.keyword,'CAFE ROSA');
  assert(data.link.includes('/go/11?channel=instagram&utm_source=instagram&utm_medium=manychat'));
  await assert.rejects(mc.prepareManychat(11,'threads','https://example.test',true));
}
(async()=>{await conversionTests();await repairTests();await manychatTests();console.log('PASS: identity, conversion failure, numeric IDs, resumable repair, concurrent edit protection, filters, XLSX structure/red styling, CSV injection protection, and honest Manychat setup state');})().catch(e=>{console.error(e);process.exitCode=1});
