const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(file,mocks={},env={}){const out={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{module:out,exports:out.exports,require:n=>mocks[n]||require(n),process:{env},Intl,Date,Number,String,Math,console});return out.exports;}
const schedule=load('lib/autopilot-schedule.ts');
const at=time=>new Date(`2026-10-04T${time}:00-03:00`);
for(const [time,expected] of [['08:59',null],['09:00','09:00'],['10:29','09:00'],['10:30',null],['13:05','13:00'],['16:05','16:00'],['19:05','19:00'],['20:29','19:00'],['20:30','20:30'],['20:59','20:30'],['21:00',null],['00:01',null]])assert.equal(schedule.duePublicationSlot(at(time),8,21),expected,time);
assert.equal(schedule.duePublicationSlot(at('09:05'),10,21),null);
assert.equal(schedule.duePublicationSlot(at('14:17'),8,21,['09:15','14:10','19:45']),'14:10');
assert.equal(schedule.duePublicationSlot(at('13:05'),8,21,['09:15','14:10','19:45']),null);
assert.equal(schedule.duePublicationSlot(at('20:45'),8,21,['19:45','09:15','14:10']),'19:45');
assert.deepEqual(Array.from(schedule.validatePublicationTimes(['19:45','09:15','14:10'],8,21)),['09:15','14:10','19:45']);
for(const invalid of [[],['09:00','09:00'],['24:00'],['9:00'],[''],['07:59'],['21:00'],Array(21).fill('09:00')])assert.throws(()=>schedule.validatePublicationTimes(invalid,8,21));
async function check(mode,channel="instagram",times){
 let reserved=false,taskStatus='ready',sends=0,refreshes=0,failed=0;
 const sql=async(strings,...values)=>{const q=strings.join('?');
  if(q.includes('COUNT(*)'))return [{total:mode==='budget'?(times?.length||5):0}];
  if(q.includes('SELECT slot'))return reserved?[{slot:'13:00'}]:[];
  if(q.includes('SELECT t.id'))return mode==='empty'?[]:[{id:1,offer_id:10}];
  if(q.includes('INSERT INTO autopilot_publication_slots')){if(reserved)return [];reserved=true;return [{slot:'13:00'}];}
  if(q.includes("SET status='publishing'")){if(taskStatus!=='ready')return [];taskStatus='publishing';return [{id:1}];}
  if(q.includes('SELECT title,category'))return [{title:'Dinossauro',category:'Brinquedos',price:17,image_url:'https://example.com/a.jpg',status:mode==='expired'?'expired':'published'}];
  if(q.includes("SET status='published'")){if(mode==='recording')throw Error('db');taskStatus='published';}
  if(q.includes("SET status='failed'")){failed++;taskStatus='failed';}
  return [];
 };
 const pub=load('lib/scheduled-publications.ts',{'./publication-queue':{ensurePublicationQueue:async()=>sql,brazilDate:()=> '2026-10-04'},'./autopilot-schedule':schedule,'./product-safety':{productSafetyCheck:()=>({allowed:true})},'./catalog-sync':{syncCatalog:async(_n,_deps,id)=>{assert.equal(id,10);refreshes++;return {checked:1,failed:mode==='price'?1:0,unlinked:0};}},'./facebook':{facebookConfigured:()=>true,publishFacebookPhoto:async input=>{assert.match(input.message,/channel=facebook/);sends++;if(mode==='uncertain')throw Error('timeout');return {postId:'page_post'};}},'./instagram':{publishInstagramImage:async()=>{sends++;if(mode==='uncertain')throw Error('timeout');return {mediaId:'123'};}},'./telegram-publisher':{sendTelegramOffer:async()=>{throw Error('Telegram disabled');}}},{INSTAGRAM_ACCESS_TOKEN:'test',INSTAGRAM_USER_ID:'test'});
 const policy={start_hour:8,end_hour:21,max_per_day:times?1:5,publication_times:times,cooldown_days:7,instagram_auto_publish:channel==="instagram",facebook_auto_publish:channel==="facebook",telegram_auto_publish:false};
 const first=await pub.publishScheduledOffers(policy,at('13:05'));
 await pub.publishScheduledOffers(policy,at('13:20'));
 if(['normal','recording'].includes(mode)){assert.equal(sends,1);assert.equal(first[channel+"Sent"],1);assert.equal(failed,0);}
 if(['price','expired'].includes(mode)){assert.equal(sends,0);assert.equal(failed,1);}
 if(mode==='uncertain'){assert.equal(sends,1);assert.equal(failed,1);assert.equal(first[channel+"Failed"],1);}
 if(['budget','empty'].includes(mode)){assert.equal(sends,0);assert.equal(refreshes,0);}
 if(mode==='recording')assert.equal(taskStatus,'publishing');
}
async function checkDiscoveryCadence(){
 let lastDiscovery=null,discoveries=0;
 const sql=async(strings,...v)=>{const q=strings.join('?');
  if(q.includes('SELECT enabled,min_score'))return [{enabled:true,min_score:80,max_per_day:5,start_hour:8,end_hour:21,cooldown_days:7,telegram_auto_publish:false,scheduled_publish:false}];
  if(q.includes('lease_until=NOW()'))return [{id:1}];
  if(q.includes('COUNT(*)'))return [{total:5}];
  if(q.includes('SET last_discovery_at=')){if(lastDiscovery&&lastDiscovery>v[1])return [];lastDiscovery=v[0];return [{id:1}];}
  return [];
 };
 const auto=load('lib/autopilot-policy.ts',{'./db':{db:()=>sql},'./autopilot-schedule':schedule,'./shopee-import':{importShopeeCandidates:async()=>{discoveries++;return {ok:true,imported:0};}},'./product-safety':{},'./telegram-publisher':{},'./publication-queue':{brazilDate:()=> '2026-10-04',ensurePublicationQueue:async()=>sql,queueManualOffers:async()=>({queued:0,queuedTasks:0})},'./autopilot':{}},{SHOPEE_APP_ID:'test',SHOPEE_SECRET:'test'});
 assert.equal((await auto.runAutopilot(at('13:07'))).discovery.ok,true);
 assert.equal((await auto.runAutopilot(at('13:22'))).discovery.skipped,true);
 await auto.runAutopilot(at('13:52'));assert.equal(discoveries,1);
 await auto.runAutopilot(at('14:07'));assert.equal(discoveries,2);
}
(async()=>{await checkDiscoveryCadence();for(const m of ['normal','budget','empty','price','expired','uncertain','recording']){await check(m);await check(m,'facebook');await check(m,'instagram',['09:00','13:00','19:00']);}console.log('PASS: Brasília slots, missed slots, daily budget, empty queue, current price, expired offer, duplicate invocation, uncertain send, accepted send recording failure');})().catch(e=>{console.error(e);process.exitCode=1;});
