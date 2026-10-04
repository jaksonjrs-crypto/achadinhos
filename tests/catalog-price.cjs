const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
const moduleObject={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/catalog-sync.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext(code,{module:moduleObject,exports:moduleObject.exports,require:name=>({'./db':{db:()=>{throw Error('Unexpected production database');}},'./shopee-affiliate':{fetchShopeeProducts:()=>{throw Error('Unexpected production API');}}}[name]),process:{env:{}},URL,Number,String,Math,AbortSignal,fetch});
async function check(mode){
  let transactionCount=0,savedPrice;
  const sql=async(strings,...values)=>{
    const query=strings.join('?');
    if(query.includes('SELECT o.id')){
      assert.equal(values[0],10,'price refresh must target the dispatched offer');
      assert.equal(values[1],10);
      return [{id:10,title:'Dinossauro',external_id:mode==='unlinked'?'invalid':'123',product_id:20,price:17,affiliate_url:'https://example.com/item'}];
    }
    if(query.includes('UPDATE offers SET external_id'))savedPrice=values[1];
    return [];
  };
  sql.transaction=async queries=>{transactionCount++;if(mode==='save-failure')throw Error('recording failure');await Promise.all(queries);};
  const fetchProducts=async(_limit,_page,_query,itemId)=>{
    assert.equal(itemId,'123');
    if(mode==='api-failure')throw Error('API unavailable');
    if(mode==='not-found')return {nodes:[{itemId:'999',price:5}]};
    return {nodes:[{itemId:'123',price:mode==='invalid'?0:mode==='unchanged'?17:19}]};
  };
  const result=await moduleObject.exports.syncCatalog(1,{db:()=>sql,fetchProducts},10);
  assert.equal(result.checked,1);
  if(mode==='updated'){assert.equal(result.updated,1);assert.equal(result.failed,0);assert.equal(savedPrice,19);}
  if(mode==='unchanged'){assert.equal(result.unchanged,1);assert.equal(result.failed,0);}
  if(mode==='unlinked'){assert.equal(result.unlinked,1);assert.equal(transactionCount,0);}
  if(['api-failure','not-found','invalid','save-failure'].includes(mode))assert.equal(result.failed,1,mode);
  if(['api-failure','not-found','invalid'].includes(mode))assert.equal(transactionCount,0);
}
(async()=>{for(const mode of ['updated','unchanged','unlinked','api-failure','not-found','invalid','save-failure'])await check(mode);console.log('PASS: targeted price refresh, updated/unchanged price, missing identity, API failure, wrong item, invalid price and database failure');})().catch(error=>{console.error(error);process.exitCode=1;});
