const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('lib/facebook.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function load(mode){
 const mod={exports:{}},calls=[];
 const request=async(url,init)=>{
  calls.push({url,init});
  assert.equal(init.headers.Authorization,'Bearer test-page-token');
  assert.ok(!url.includes('test-page-token'));
  if(mode==='timeout'&&init.method==='POST')throw Error('timeout');
  const data=url.includes('/me?')?{id:mode==='wrong-page'?'999':'123',name:'Vitrine'}:mode==='denied'?{error:{code:200,message:'test-page-token'}}:mode==='missing-id'?{}:{id:'photo',post_id:'123_456'};
  return {ok:mode!=='denied'||url.includes('/me?'),json:async()=>data};
 };
 vm.runInNewContext(code,{exports:mod.exports,module:mod,process:{env:mode==='missing'?{}:{FACEBOOK_PAGE_ACCESS_TOKEN:'test-page-token',FACEBOOK_PAGE_ID:'123'}},fetch:request,URL,URLSearchParams,AbortSignal,Boolean,String,Error});
 return {api:mod.exports,calls};
}
(async()=>{
 for(const mode of ['normal','wrong-page','denied','missing-id','timeout','missing']){
  const {api,calls}=load(mode);
  const result=api.publishFacebookPhoto({imageUrl:'https://example.com/photo.jpg',message:'Oferta https://www.minhavitrinedeachados.com.br/go/10?channel=facebook'});
  if(mode==='normal'){assert.equal((await result).postId,'123_456');assert.equal(calls.length,2);assert.equal(calls[1].init.body.get('published'),'true');assert.match(calls[1].init.body.get('message'),/channel=facebook/);}
  else{await assert.rejects(result);assert.ok(calls.filter(c=>c.init.method==='POST').length<=1,'no automatic retries');if(['wrong-page','missing'].includes(mode))assert.equal(calls.filter(c=>c.init.method==='POST').length,0);}
 }
 const {api,calls}=load('normal');await assert.rejects(api.publishFacebookPhoto({imageUrl:'http://example.com/a.jpg',message:'test'}));assert.equal(calls.length,0);
 console.log('PASS: page identity, image/link payload, missing credentials, API denial, uncertain send without retries and HTTPS requirement');
})().catch(error=>{console.error(error);process.exitCode=1;});
