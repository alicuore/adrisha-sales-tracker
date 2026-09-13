import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import vm from 'node:vm';
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
 for(const m of data.months.slice(0,8)){const actual=V2.totals(m,data.rules),expected=baseline.months[m.period];for(const key of ['sessionCount','gmvCents','approvedPayrollSeconds','commissionCents','basicSalaryCents','dailyGmvCents'])assert.deepEqual(actual[key],expected[key],m.period+' '+key);}
});
test('September has 17 sessions, 12 days, latest payroll, zero-GMV streams and integer daily sums',()=>{
 const m=data.months[8],t=V2.totals(m,data.rules);
 assert.equal(t.sessionCount,17);assert.equal(t.liveDays,12);assert.equal(t.gmvCents,6966418);assert.equal(t.approvedPayrollSeconds,159060);assert.equal(t.commissionCents,480000);assert.equal(t.basicSalaryCents,73639);
 assert.equal(t.dailyGmvCents['2026-09-01'],1010649);assert.equal(t.dailyGmvCents['2026-09-11'],239953);
 assert.equal(m.sessions.filter(s=>s.gmvCents===0&&s.durationSeconds>0).length,2);
 assert.equal(t.hoursProgress,159060/432000*100);
 assert.equal(V2.totals({...m,approvedPayrollSeconds:432000},data.rules).hoursProgress,100);
});
test('adapter preserves separate sessions, exact cents, payroll and split schedules',()=>{
 for(const m of data.months){const st=V2.adaptMonth(m);assert.equal(st.hours,m.approvedPayrollSeconds/3600);const actual=st.entries.filter(e=>!e.attendance);assert.equal(actual.length,m.sessions.length);actual.forEach((e,i)=>{assert.equal(e.id,m.sessions[i].id);assert.equal(e.gmvCents,m.sessions[i].gmvCents);assert.equal(e.dur,m.sessions[i].durationSeconds/3600);});}
 const m=data.months[8];const split=m.schedule.find(s=>s.slots.length>1);assert(split);assert.deepEqual(data.schedules.find(s=>s.month===9).data[split.date].slots,split.slots);
});
test('actual zero-GMV sessions override leave/off; attendance never becomes a session',()=>{
 const m=structuredClone(data.months[8]);const date='2026-09-11';
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
 for(const m of data.months){const [y,n]=m.period.split('-').map(Number);element('yearSelect').value=y;element('monthSelect').value=n;vm.runInContext('render()',context);const t=V2.totals(m,data.rules);const money=c=>'RM'+(c/100).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});assert.equal(element('totalSalesCard').textContent,money(t.gmvCents));assert.equal(element('commissionCard').textContent,money(t.commissionCents));assert.equal(element('basicCard').textContent,money(t.basicSalaryCents));assert.equal(element('totalSessionsCard').textContent,t.sessionCount+' sessions');assert.equal(parseFloat(element('hoursBarFill').style.width),t.hoursProgress);
 for(const [date,cents] of Object.entries(t.dailyGmvCents))assert(element('logBody').innerHTML.includes(money(cents)),date);
 vm.runInContext("setView('session')",context);assert.equal((element('logBody').innerHTML.match(/class="amount-cell"/g)||[]).length,t.sessionCount);vm.runInContext("setView('day')",context);
 }
 vm.runInContext('renderCompare();renderOverview();renderSchedulePage()',context);assert(element('cmpStatsA').innerHTML.includes('RM69,664.18'));assert(element('overviewBody').innerHTML.includes('RM312,536.91'));
});
test('page exposes a clear error and never renders stale totals on load failure',async()=>{const {element}=await page(async()=>({ok:false,status:503}));assert.match(element('dataStatus').textContent,/Unable to load published dashboard data/);assert.equal(element('totalSalesCard').textContent,'');});
