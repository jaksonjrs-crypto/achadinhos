const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const {NextRequest,NextResponse}=require('next/server');
function load(file,mocks={}){const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,require:n=>mocks[n]||require(n),URL,console,Date,Number,String,Math,Set,process:{env:{}}});return out;}
const policy=load('lib/click-policy.ts'),rules=load('lib/mining-profile-rules.ts');
const principal={id:'principal',name:'Casa',keywords:['liquidificador portátil','airfryer'],forbidden:['whey','celular','barba'],categories:[],min_price:20,max_price:150,min_score:0,active:true,starts_on:null,ends_on:null,manual_only:false};
const learning=load('lib/click-learning.ts',{'./db':{},'./click-policy':policy});
const mobile='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
async function routes(){
 for(const file of ['app/go/[id]/route.ts','app/go/rosa/route.ts']){
  let inserts=[],pending=[];
  const sql=async(s,...v)=>{const q=s.join('?');if(q.includes('INSERT INTO offer_clicks'))inserts.push({q,v});if(q.includes('SELECT destination'))return [{destination:'https://s.shopee.com.br/AKbTjSJMYj'}];if(q.includes('SELECT o.id'))return [{id:118}];return [{affiliate_url:'https://s.shopee.com.br/AKbTjSJMYj'}];};
  const route=load(file,{'next/server':{NextResponse,after:fn=>pending.push(fn)},'@/lib/db':{db:()=>sql},'@/lib/click-policy':policy,'@/lib/campaign-links':{validateCampaignDestination:x=>x}});
  for(const [agent,test,expected] of [['facebookexternalhit/1.1','',0],['FACEBOT','',0],['Crawler','',0],['Spider','',0],['Preview','',0],['HeadlessChrome','',0],['someBOT','',0],[mobile,'&teste=1',0],[mobile,'',1]]){
   inserts=[];pending=[];
   const r=await route.GET(new NextRequest('https://example.com/go/111?channel=instagram'+test,{headers:{'user-agent':agent}}),{params:Promise.resolve({id:'111'})});
   assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://s.shopee.com.br/AKbTjSJMYj');
   await Promise.all(pending.map(f=>f()));assert.equal(inserts.length,expected,agent+test);
   if(expected)assert.ok(inserts[0].v.includes('instagram'));
  }
  inserts=[];pending=[];
  await route.GET(new NextRequest('https://example.com/go/111',{headers:{'user-agent':mobile,cookie:'vitrine_channel=telegram'}}),{params:Promise.resolve({id:'111'})});
  await Promise.all(pending.map(f=>f()));assert.ok(inserts[0].v.includes('telegram'));
 }
}
async function profilesAndLearning(){
 const item={title:'Mini Liquidificador Portátil',price:29.95,score:75};
 assert.ok(rules.profileMatch(principal,item));
 for(const price of [19.99,150.01])assert.equal(rules.profileMatch(principal,{...item,price}),false);
 for(const price of [20,150])assert.ok(rules.profileMatch(principal,{...item,price}));
 assert.equal(rules.profileMatch(principal,{...item,title:'Liquidificador Portátil para WHEY'}),false);
 assert.equal(rules.profileMatch({...principal,categories:['Cozinha']},{...item,category:'Beleza'}),false);
 const natal={...principal,id:'natal',keywords:['natal'],min_price:null,max_price:null,starts_on:'2026-12-01',ends_on:'2026-12-24'};
 assert.ok(rules.profileActive(principal,'2026-12-15'));assert.ok(rules.profileActive(natal,'2026-12-15'));assert.equal(rules.profileActive(natal,'2026-12-25'),false);
 assert.equal(rules.profileActive({...natal,active:false},'2026-12-15'),false);
 assert.equal(rules.profileActive({...principal,id:'livre',manual_only:true},'2026-12-15'),false);
 assert.ok(rules.profileMatch({...principal,id:'livre'},{title:'Enfeite',price:2,score:0}));
 assert.equal(learning.clickBonus(item.title,['Mini Liquidificador Portátil 380ml']).bonus,12);
 assert.match(learning.clickBonus(item.title,['Mini Liquidificador Portátil 380ml']).reason,/\+12 parecido/);
 assert.equal(learning.clickBonus('Mini Liquidificador Portátil 380ml USB',['Mini Liquidificador Portátil 380ml USB']).bonus,15);
 assert.equal(learning.clickBonus('Mop',['Mini Liquidificador']).bonus,0);
 let query,values;
 const learn=load('lib/click-learning.ts',{'./db':{db:()=>async(s,...v)=>{query=s.join('?');values=v;return [{title:item.title}]}},'./click-policy':policy});
 await learn.topClickedTitles();assert.match(query,/30 days/);assert.match(query,/LIMIT 10/);assert.match(query,/!~\*/);assert.ok(values.includes(policy.BOT_PATTERN));
}
async function discovery(){
 for(const manual of [false,true]){
  const p=manual?{...principal,id:'natal',keywords:['natal'],min_price:null,max_price:null}:principal;
  let inserted=[],fetched='';
  const sql=async(s,...v)=>{if(s.join('').includes('INSERT INTO product_candidates')){inserted.push(v);return [{id:1}]}return []};
  const nodes=(manual?['Enfeite Natal']:['Mini Liquidificador Portátil','Airfryer whey','Airfryer cara']).map((productName,i)=>({productName,price:i===2?200:30,itemId:i+1,offerLink:'https://s.shopee.com.br/test',imageUrl:'https://example.com/image',ratingStar:5,sales:100,priceDiscountRate:50,commissionRate:.15}));
  const mod=load('lib/shopee-import.ts',{'./mining-profiles':{miningProfile:async()=>p},'./mining-profile-rules':rules,'./click-learning':{...learning,topClickedTitles:async()=>['Mini Liquidificador Portátil']},'./db':{db:()=>sql},'./shopee-affiliate':{fetchShopeeProducts:async(a,b,k)=>{fetched=k;return {nodes}},generateShopeeLink:async()=> 'https://s.shopee.com.br/test'},'./product-safety':{productSafetyCheck:()=>({allowed:true})},'./shopee-links':{canonicalProductUrl:()=> 'https://shopee.com.br/product/1/1'},'./affiliate-registry':{registerAffiliateLink:async()=>{}}});
  const result=await mod.importShopeeCandidates({autoApprove:!manual,profileId:p.id});
  assert.equal(result.imported,1);assert.equal(inserted.length,1);assert.ok(inserted[0].includes(p.id));assert.ok(inserted[0].includes(manual?'review':'approved'));assert.equal(inserted[0].at(-1),manual);
  if(manual)assert.equal(fetched,'natal');
 }
}
async function analytics(){
 for(const legacy of [false,true]){
  const queries=[];const sql=async(s,...v)=>{const q=s.join('?');if(legacy&&(q.includes('c.channel')||q.includes('SELECT channel')||q.includes('DATE(created_at)')))throw Error('legacy schema');queries.push(q);assert.ok(v.includes(policy.BOT_PATTERN));return [{}]};
  await load('lib/analytics.ts',{'./db':{db:()=>sql},'./click-policy':policy}).getDashboardStats();
  for(const q of queries)assert.match(q,/!~\*/);assert.ok(queries.some(q=>q.includes('excluded_bots')));
 }
}
(async()=>{await routes();await profilesAndLearning();await discovery();await analytics();console.log('PASS: both redirects; all bots/test excluded; mobile inserts + channel; profile price/forbidden/category/dates; manual Natal review only; real-click bonus +12/cap15; modern+legacy analytics filters');})().catch(e=>{console.error(e);process.exitCode=1});
