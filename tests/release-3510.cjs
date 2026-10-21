const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,mocks={}){const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,require:n=>mocks[n]||require(n),URL,console,Date,Number,String,Math,Set,process:{env:{}}});return out;}
const policy=load('lib/click-policy.ts');
const mobile='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
assert.equal(policy.ADMIN_DEVICE_COOKIE,'vda_admin_device');
assert.equal(policy.countClick(mobile,null,undefined),true,'clique normal conta');
assert.equal(policy.countClick(mobile,null,'1'),false,'aparelho do administrador não conta');
assert.equal(policy.countClick(mobile,'1',undefined),false,'teste=1 não conta');
assert.equal(policy.countClick('facebookexternalhit/1.1',null,undefined),false,'robô não conta');
assert.ok(new RegExp(policy.APP_PATTERN,'i').test(mobile+' [FBAN/FBIOS;FBAV/480.0]'),'app Facebook reconhecido');
assert.ok(new RegExp(policy.APP_PATTERN,'i').test(mobile+' Instagram 350.0'),'app Instagram reconhecido');
console.log('release-3510: ok');
