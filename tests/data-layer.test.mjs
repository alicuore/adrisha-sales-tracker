import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import '../js/data-layer.js';
const {V2}=globalThis;
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const fetchFile=async p=>({ok:true,json:()=>json(p)});
const data=await V2.load(fetchFile);
const baseline=await json('tests/historical-baseline.json');

test('HTTP loads manifest, rules and all nine months; requests bypass stale caches',async()=>{
 const requests=[];
 const server=createServer(async(req,res)=>{try{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(await json(req.url.slice(1))));}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const loaded=await V2.load((p,o)=>{requests.push([p,o.cache]);return fetch(`http://127.0.0.1:${server.address().port}/${p}`,o);});assert.equal(loaded.months.length,9);assert.equal(requests.length,11);assert(requests.every(r=>r[1]==='no-store'));}finally{await new Promise(resolve=>server.close(resolve));}
});
test('January-August match independent frozen totals including daily GMV and salary',()=>{
 for(const period of baseline.frozenPeriods){const m=data.months.find(item=>item.period===period);assert(m,period);const actual=V2.totals(m,data.rules),expected=baseline.months[m.period];for(const key of ['sessionCount','gmvCents','approvedPayrollSeconds','commissionCents','basicSalaryCents','dailyGmvCents'])assert.deepEqual(actual[key],expected[key],m.period+' '+key);}
});
function expectedTotals(m) {
 const daily={};for(const session of m.sessions)daily[session.date]=(daily[session.date]||0)+session.gmvCents;
 const cents=m.sessions.reduce((sum,session)=>sum+session.gmvCents,0);
 const rules=data.rules, tier=rules.commission.tiers.find(t=>cents>=t.minGmvCents&&cents<=t.maxGmvCents),e=rules.commission.extension;
 const commission=tier?tier.commissionCents:e.baseCommissionCents+Math.floor((cents-e.baseGmvCents)/e.gmvStepCents)*e.commissionStepCents;
 const decimals=rules.hourlyRate.split('.')[1]?.length||0;
 const salary=Math.round(m.approvedPayrollSeconds*Number(rules.hourlyRate.replace('.',''))*100/(3600*10**decimals));
 return {sessionCount:m.sessions.length,liveDays:Object.keys(daily).length,gmvCents:cents,dailyGmvCents:daily,approvedPayrollSeconds:m.approvedPayrollSeconds,commissionCents:commission,basicSalaryCents:salary,hoursProgress:Math.min(m.approvedPayrollSeconds/rules.monthlyHoursTargetSeconds*100,100)};
}
const money=c=>'RM'+(c/100).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
test('live-month totals reconcile with current JSON and configured rules',()=>{
 for(const m of data.months.filter(m=>!baseline.frozenPeriods.includes(m.period))){
  assert.equal(m.status,'open');assert.deepEqual(V2.totals(m,data.rules),expectedTotals(m));
 }
 const synthetic={sessions:[],approvedPayrollSeconds:data.rules.monthlyHoursTargetSeconds};
 assert.equal(V2.totals(synthetic,data.rules).hoursProgress,100);
});

test('adapter preserves separate sessions, exact cents, payroll and split schedules',()=>{
 for(const m of data.months){const st=V2.adaptMonth(m);assert.equal(st.hours,m.approvedPayrollSeconds/3600);const actual=st.entries.filter(e=>!e.attendance);assert.equal(actual.length,m.sessions.length);actual.forEach((e,i)=>{assert.equal(e.id,m.sessions[i].id);assert.equal(e.gmvCents,m.sessions[i].gmvCents);assert.equal(e.dur,m.sessions[i].durationSeconds/3600);});}
 const m=data.months[8];const split=m.schedule.find(s=>s.slots.length>1);assert(split);assert.deepEqual(data.schedules.find(s=>s.month===9).data[split.date].slots,split.slots);
});
test('actual zero-GMV sessions override leave/off; attendance never becomes a session',()=>{
 const date='2026-09-11';const m={approvedPayrollSeconds:0,sessions:[1,2,3].map(n=>({id:date+'-s0'+n,date,gmvCents:0,durationSeconds:600,notes:'Synthetic livestream'})),attendance:[]};
 for(const status of ['leave','off']){m.attendance=[{date,status,notes:'planned '+status}];const st=V2.adaptMonth(m);assert.equal(st.entries.filter(e=>e.date===date).length,3);assert(st.entries.filter(e=>e.date===date).every(e=>!e.attendance));}
});
test('all commission boundaries and extension use loaded rules',()=>{
 for(const t of data.rules.commission.tiers){assert.equal(V2.commissionCents(t.minGmvCents,data.rules),t.commissionCents);assert.equal(V2.commissionCents(t.maxGmvCents,data.rules),t.commissionCents);}
 assert.equal(V2.commissionCents(11000000,data.rules),880000);assert.equal(V2.commissionCents(31253691,data.rules),2480000);
});
test('missing/malformed JSON, duplicate periods/sessions, fractional cents and invalid schedules fail closed',async()=>{
 await assert.rejects(V2.load(async()=>({ok:false,status:404})),/Cannot load/);
 await assert.rejects(V2.load(async()=>({ok:true,json:()=>{throw Error();}})),/Invalid JSON/);
 for(const mutate of [m=>m.months.push(m.months[0]),m=>m.defaultPeriod='2099-01'])await assert.rejects(V2.load(async p=>{const value=await json(p);if(p.endsWith('manifest.json'))mutate(value);return{ok:true,json:async()=>value};}));
 for(const mutate of [m=>m.sessions.push(m.sessions[0]),m=>m.sessions[0].gmvCents=0.5,m=>m.approvedPayrollSeconds=-1,m=>m.schedule[0].slots[0].startTime='25:00']){const m=structuredClone(data.months[8]);mutate(m);assert.throws(()=>V2.validateMonth(m,data.manifest.months[8],data.rules));}
});
test('legacy business keys are removed; unrelated preferences survive; inaccessible storage is harmless',()=>{
 const values=new Map([['eskayvie_2026_9','{"hours":99999}'],['eskayvie_schedule','stale'],['theme','dark']]);const storage={get length(){return values.size;},key:i=>[...values.keys()][i],removeItem:k=>values.delete(k)};
 V2.clearLegacyStorage(storage);assert.deepEqual([...values],[['theme','dark']]);assert.doesNotThrow(()=>V2.clearLegacyStorage({get length(){throw Error('blocked');}}));
});

// Run the actual page script with a minimal DOM and chart stub, so calculations
// in monthly/daily/session/comparison/overview rendering are tested too.
async function page(fetcher=fetchFile){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},appendChild(o){if(o.selected)this.value=String(o.value);},setAttribute(){}});return elements.get(id);};
 const context=vm.createContext({console,fetch:fetcher,localStorage:{get length(){return 1;},key:()=> 'eskayvie_2026_9',removeItem(){},getItem(){throw Error('Business storage read forbidden');}},document:{getElementById:element,createElement:()=>({}),querySelectorAll:()=>[],body:{classList:{add(){},remove(){}}}},Chart:class{destroy(){}}});
 vm.runInContext(await readFile(new URL('../js/data-layer.js',import.meta.url),'utf8'),context);
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 await vm.runInContext(script,context);return{context,element,html};
}
test('actual dashboard renders January-September and comparison/overview from JSON despite poisoned legacy storage',async()=>{
 const {context,element,html}=await page();assert.doesNotMatch(html,/PRELOADED|localStorage|function (addEntry|saveEdit|deleteEntry|addHours|resetHours)/);
 for(const m of data.months){const [y,n]=m.period.split('-').map(Number);element('yearSelect').value=y;element('monthSelect').value=n;vm.runInContext('render()',context);const t=expectedTotals(m);const money=c=>'RM'+(c/100).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});assert.equal(element('totalSalesCard').textContent,money(t.gmvCents));assert.equal(element('commissionCard').textContent,money(t.commissionCents));assert.equal(element('basicCard').textContent,money(t.basicSalaryCents));assert.equal(element('totalSessionsCard').textContent,t.sessionCount+' sessions');assert.equal(parseFloat(element('hoursBarFill').style.width),t.hoursProgress);
 for(const [date,cents] of Object.entries(t.dailyGmvCents))assert(element('logBody').innerHTML.includes(money(cents)),date);
 vm.runInContext("setView('session')",context);assert.equal((element('logBody').innerHTML.match(/class="amount-cell"/g)||[]).length,t.sessionCount);vm.runInContext("setView('day')",context);
 }
 vm.runInContext('renderCompare();renderOverview();renderSchedulePage()',context);const period=String(element('cmpYearA').value)+'-'+String(element('cmpMonthA').value).padStart(2,'0');assert(element('cmpStatsA').innerHTML.includes(money(expectedTotals(data.months.find(m=>m.period===period)).gmvCents)));assert(element('overviewBody').innerHTML.includes('RM312,536.91'));
});
test('page exposes a clear error and never renders stale totals on load failure',async()=>{const {element}=await page(async()=>({ok:false,status:503}));assert.match(element('dataStatus').textContent,/Unable to load published dashboard data/);assert.equal(element('totalSalesCard').textContent,'');});

// Execute the real validator against in-memory JSON substitutions. No fixture or
// production file is written, including when testing invalid historical changes.
async function validateVariant(period, mutate) {
 const root=fileURLToPath(new URL('../',import.meta.url));
 const descriptor=data.manifest.months.find(m=>m.period===period);
 const value=structuredClone(data.months.find(m=>m.period===period));mutate(value);
 let source=await readFile(new URL('./validate-data.mjs',import.meta.url),'utf8');
 source=source.replace("import { readFile }", "import { readFile as originalReadFile }")
  .replace("import '../js/data-layer.js';",'import '+JSON.stringify(new URL('../js/data-layer.js',import.meta.url).href)+';')
  .replace(/const repoRoot = .*?;/,'const repoRoot = '+JSON.stringify(root)+';');
 source+='\nasync function readFile(path,encoding){if(String(path).replaceAll(String.fromCharCode(92),"/").endsWith('+JSON.stringify('/data/'+descriptor.path)+'))return '+JSON.stringify(JSON.stringify(value))+';return originalReadFile(path,encoding); }';
 return spawnSync(process.execPath,['--input-type=module'],{input:source,encoding:'utf8',cwd:root});
}
test('normal validator accepts legitimate live corrections and added sessions without fixture edits',async()=>{
 for(const mutate of [m=>{m.sessions[0].gmvCents+=9500;},m=>{
  const original=m.sessions[0];const n=Math.max(...m.sessions.filter(s=>s.date===original.date).map(s=>s.sessionNumber))+1;
  m.sessions.push({...original,id:original.date+'-s'+String(n).padStart(2,'0'),legacyId:'synthetic-new',sessionNumber:n,gmvCents:0,durationSeconds:600});
  m.approvedPayrollSeconds+=600;
 }]){const result=await validateVariant('2026-09',mutate);assert.equal(result.status,0,result.stdout+result.stderr);}
});
test('normal validator rejects malformed live data, duplicate IDs, attendance and schedule violations',async()=>{
 for(const mutate of [m=>m.sessions.push({...m.sessions[0]}),m=>{m.sessions[0].gmvCents=0.5;},m=>{m.sessions[0].durationSeconds=0.1;},m=>{m.approvedPayrollSeconds=-1;},m=>{m.sessions[0].date='2026-09-99';},m=>{m.attendance=[{date:m.sessions[0].date,status:'leave',notes:'invalid conflict'}];},m=>{m.schedule[0].slots[0].startTime='25:00';},m=>{m.schedule[0].label='Changed planned schedule';}]){
  const result=await validateVariant('2026-09',mutate);assert.notEqual(result.status,0);
 }
});
test('every frozen historical period still rejects a sales change',async()=>{
 for(const period of baseline.frozenPeriods){const result=await validateVariant(period,m=>{m.sessions[0].gmvCents+=1;});assert.notEqual(result.status,0,period);assert.match(result.stderr,/frozen .* mismatch/);}
});
