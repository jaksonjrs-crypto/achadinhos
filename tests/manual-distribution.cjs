const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const ts=require(root+'/node_modules/typescript');
function load(file,mocks={}){const out={exports:{}};const code=ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(code,{exports:out.exports,module:out,require:n=>n in mocks?mocks[n]:require(root+'/node_modules/'+n),process:{env:{TELEGRAM_BOT_TOKEN:'test-token',TELEGRAM_CHAT_ID:'test-chat'}},URL,URLSearchParams,Intl,Date,Number,String,Math,console});return out.exports;}
const safety=load('lib/product-safety.ts');
async function main(){
 let added=false,inserts=0;
 const valid={id:41,title:'Calça Wide Leg',category:'Moda',image_url:'https://example.com/image.jpg',affiliate_url:'https://mercadolivre.com.br/loja/teste',price:52};
 const sql=async(strings,...v)=>{const q=strings.join('?');if(q.includes('SELECT id,title,category'))return added?[]:[valid,{...valid,id:42,title:'Arma'},{...valid,id:43,image_url:'javascript:x'}];if(q.includes('INSERT INTO publication_tasks')){added=true;inserts++;return Array.from({length:6},(_,id)=>({id}));}return []};
 const queue=load('lib/publication-queue.ts',{'./db':{db:()=>sql},'./product-safety':safety});
 assert.deepEqual(JSON.parse(JSON.stringify(await queue.queueManualOffers())),{queued:1,queuedTasks:6});
 assert.equal((await queue.queueManualOffers()).queued,0);assert.equal(inserts,1);
 for(const mode of ['normal','budget','disabled','expired','accepted-db-failure']){
  let sends=0,publishedUpdates=0,failedUpdates=0,selectionLimit;
  const runSql=async(strings,...v)=>{const q=strings.join('?');
   if(q.includes('SELECT enabled,min_score'))return [{enabled:true,min_score:80,max_per_day:3,start_hour:8,end_hour:21,cooldown_days:7,telegram_auto_publish:mode!=='disabled'}];
   if(q.includes('lease_until=NOW()'))return [{id:1}];
   if(q.includes('COUNT(*)::int AS total FROM offers'))return [{total:3}];
   if(q.includes('COUNT(*)::int AS total FROM publication_tasks'))return [{total:mode==='budget'?3:0}];
   if(q.includes('SELECT t.id,t.offer_id')){selectionLimit=v.at(-1);return selectionLimit?[{id:61,offer_id:41}]:[];}
   if(q.includes("SET status='publishing'"))return [{id:61}];
   if(q.includes('SELECT title,category'))return [{...valid,status:mode==='expired'?'expired':'published'}];
   if(q.includes("SET status='published'")){publishedUpdates++;if(mode==='accepted-db-failure')throw Error('simulated record failure');}
   if(q.includes("SET status='failed'"))failedUpdates++;
   return [];
  };
  const auto=load('lib/autopilot-policy.ts',{'./db':{db:()=>runSql},'node:crypto':{randomUUID:()=> 'test-lease'},'./product-safety':safety,'./shopee-import':{importShopeeCandidates:()=>{throw Error('unexpected')}},'./telegram-publisher':{sendTelegramOffer:async()=>{sends++;return 'message-id'}},'./publication-queue':{brazilDate:queue.brazilDate,ensurePublicationQueue:async()=>runSql,queueManualOffers:async()=>({queued:1,queuedTasks:6})},'./autopilot':{autopilotCandidate:()=>{throw Error('no candidate expected')}}});
  const r=await auto.runAutopilot(new Date('2026-10-02T15:00:00Z'));
  assert.equal(r.remaining,0);assert.equal(r.queued,1);
  assert.equal(sends,['normal','accepted-db-failure'].includes(mode)?1:0,mode);
  if(mode==='normal'){assert.equal(r.telegramSent,1);assert.equal(publishedUpdates,1);assert.equal(selectionLimit,3);}
  if(mode==='budget')assert.equal(selectionLimit,0);
  if(mode==='expired')assert.equal(failedUpdates,1);
  if(mode==='accepted-db-failure')assert.equal(failedUpdates,0,'accepted send must not become retryable');
 }
 const catalog=load('lib/offers.ts',{'./db':{db:()=>async()=>[{...valid,marketplace:'Mercado Livre'},{...valid,id:42,title:'Camisa',marketplace:'Mercado Livre'},{...valid,id:43,marketplace:'Mercado Livre'}]}});
 assert.equal((await catalog.listPublishedOffers()).length,2,'distinct manual products may share storefront; same-title duplicate hidden');
 const feed=load('lib/offers-feed.ts');
 for(const channel of ['facebook','instagram','pinterest']){const xml=feed.buildOffersFeed([{...valid,status:'published',marketplace:'Mercado Livre',created_at:'2026-09-29T12:00:00Z'}],channel,new Date('2026-10-02T15:00:00Z'));assert.match(xml,/Calça Wide Leg/);assert.equal((xml.match(/<item>/g)||[]).length,1);}
 const ReactDOM=require(root+'/node_modules/react-dom/server');
 const page=load('app/ofertas/page.tsx',{'@/lib/version':{APP_VERSION:'test'},'@/lib/offers':{listPublishedOffers:async()=>[{...valid,marketplace:'Mercado Livre'},{...valid,id:44,title:'Caneca Shopee',marketplace:'Shopee',category:'Shopee'}]}});
 const html=ReactDOM.renderToStaticMarkup(await page.default({searchParams:Promise.resolve({marketplace:'Mercado Livre'})}));
 assert.match(html,/aria-current="page"[^>]*>Mercado Livre/);assert.match(html,/Calça Wide Leg/);assert.doesNotMatch(html,/Caneca Shopee/);assert.match(html,/name="marketplace" value="Mercado Livre"/);
 console.log('PASS: manual queue, idempotence, invalid records, Telegram pending without candidates, daily limit, disabled automation, expired offer, accepted-send recording failure, ML feeds, marketplace menu/filter.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
