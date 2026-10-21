const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'..');const ts=require('typescript');
function load(file,mocks={}){const f=path.join(root,file);const m=new Module(f);m.filename=f;m.paths=Module._nodeModulePaths(root);const r=m.require.bind(m);m.require=id=>id in mocks?mocks[id]:r(id);
 m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);return m.exports;}
const links=load('lib/shopee-links.ts');
const api=load('lib/shopee-affiliate.ts',{'./shopee-links':links});
const c=load('lib/shopee-commissions.ts',{'./db':{db:()=>{throw Error('no db')}},'./shopee-affiliate':api,'./click-policy':{BOT_PATTERN:'bot',CHANNELS:['vitrine','instagram','stories','facebook','whatsapp','telegram','pinterest','tiktok']}});
// sub-IDs por canal
assert.deepEqual(c.channelSubIds('instagram',65),['VGinstagram','O65']);
assert.deepEqual(c.channelSubIds('desconhecido',7),['VGvitrine','O7']);
const q=api.shortLinkPayload('https://shopee.com.br/product/1/2',['VGinstagram','O65']).query;
assert.match(q,/subIds: \["VGinstagram", "O65"\]/);
assert.throws(()=>api.shortLinkPayload('https://shopee.com.br/product/1/2',['VG_x']));
// leitura do utmContent
assert.deepEqual(c.parseUtm('VGinstagram-O65---'),{channel:'instagram',offerId:65});
assert.deepEqual(c.parseUtm('VITRINEGARIMPO2026----'),{channel:null,offerId:null});
assert.deepEqual(c.parseUtm(''),{channel:null,offerId:null});
assert.deepEqual(c.parseUtm('VGtelegram'),{channel:'telegram',offerId:null});
assert.deepEqual(c.parseUtm('VGstories-O12'),{channel:'stories',offerId:12});
// relatório
const p=api.conversionPayload(100,200,50,'abc=');assert.match(p.query,/conversionReport\(purchaseTimeStart:100,purchaseTimeEnd:200,limit:50,scrollId:"abc="\)/);
assert.throws(()=>api.conversionPayload(1,2,10,'x"){evil}'));
const rows=c.flattenConversions([{purchaseTime:1761000000,clickTime:1760999900,conversionId:9,totalCommission:'5.5',utmContent:'VGinstagram-O65',
  orders:[{orderId:'A1',orderStatus:'PENDING',items:[{itemId:22,itemName:'Fritadeira',itemPrice:'310.00',qty:1,itemTotalCommission:'12.40'},{itemId:23,itemName:'Forma',itemPrice:'14.9',qty:2,itemTotalCommission:'1,10'}]}]},
  {purchaseTime:null,orders:[]}]);
assert.equal(rows.length,2);assert.equal(rows[0].commission,12.4);assert.equal(rows[1].commission,1.1);assert.equal(rows[1].qty,2);
assert.equal(rows[0].purchase_time,new Date(1761000000*1000).toISOString());assert.equal(rows[0].order_status,'PENDING');assert.equal(rows[0].item_id,'22');
console.log('release-360: ok');
