/* Shared by the browser and Node tests. No business data is read from storage. */
(function(root){
'use strict';
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const time=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validateRules(r){
 check(r?.schemaVersion===1&&typeof r.ruleSetId==='string'&&r.currency==='MYR','Invalid business rules');
 check(typeof r.hourlyRate==='string'&&/^\d+(\.\d+)?$/.test(r.hourlyRate)&&Number(r.hourlyRate)>0,'Invalid hourly rate');
 check(integer(r.monthlyHoursTargetSeconds)&&r.monthlyHoursTargetSeconds>0,'Invalid hours target');
 check(r.attendancePrecedence?.actualSessionOverridesPlannedAttendance===true,'Invalid attendance precedence');
 check(Array.isArray(r.commission?.tiers)&&r.commission.tiers.length>0,'Missing commission tiers');
 let next=0;
 for(const t of r.commission.tiers){check(integer(t.minGmvCents)&&integer(t.maxGmvCents)&&integer(t.commissionCents)&&t.minGmvCents===next&&t.maxGmvCents>=next,'Invalid commission tier');next=t.maxGmvCents+1;}
 const e=r.commission.extension;
 check(e&&Object.values(e).every(integer)&&e.gmvStepCents>0&&integer(e.baseGmvCents)&&integer(e.baseCommissionCents)&&integer(e.commissionStepCents),'Invalid commission extension');
}
function validateMonth(m,d,r){
 check(m?.schemaVersion===1&&m.period===d.period&&m.status===d.status&&m.ruleSetId===r.ruleSetId,'Month metadata mismatch: '+d.period);
 check(integer(m.approvedPayrollSeconds),'Invalid payroll seconds: '+d.period);
 check(Array.isArray(m.sessions)&&Array.isArray(m.attendance)&&Array.isArray(m.schedule),'Missing month collections: '+d.period);
 const ids=new Set(),keys=new Set();
 for(const s of m.sessions){
  check(date(s.date)&&s.date.startsWith(m.period+'-')&&integer(s.sessionNumber)&&s.sessionNumber>0,'Invalid session date/number');
  check(s.id===s.date+'-s'+String(s.sessionNumber).padStart(2,'0')&&!ids.has(s.id)&&!keys.has(s.date+'#'+s.sessionNumber),'Duplicate or invalid session ID');
  ids.add(s.id);keys.add(s.date+'#'+s.sessionNumber);
  check(integer(s.gmvCents)&&integer(s.durationSeconds),'Invalid session cents/seconds');
  check((s.startTime===null&&s.endTime===null)||(time(s.startTime)&&time(s.endTime)),'Invalid session times');
  check(typeof s.notes==='string'&&typeof s.legacyId==='string','Invalid session text');
 }
 const attendance=new Set();
 for(const a of m.attendance){check(date(a.date)&&a.date.startsWith(m.period+'-')&&!attendance.has(a.date)&&['leave','off','absent','working'].includes(a.status)&&typeof a.notes==='string','Invalid attendance');attendance.add(a.date);}
 const days=new Set();
 for(const s of m.schedule){
  check(date(s.date)&&s.date.startsWith(m.period+'-')&&!days.has(s.date)&&typeof s.label==='string'&&Array.isArray(s.slots)&&s.slots.length>0,'Invalid schedule');days.add(s.date);
  for(const slot of s.slots)check(time(slot.startTime)&&time(slot.endTime)&&[0,1].includes(slot.endDayOffset),'Invalid schedule slot');
 }
 check(Number.isSafeInteger(m.sessions.reduce((sum,s)=>sum+s.gmvCents,0)),'GMV exceeds safe integer range');
}
function commissionCents(cents,r){
 const tier=r.commission.tiers.find(t=>cents>=t.minGmvCents&&cents<=t.maxGmvCents);
 if(tier)return tier.commissionCents;
 const e=r.commission.extension;
 return e.baseCommissionCents+Math.floor((cents-e.baseGmvCents)/e.gmvStepCents)*e.commissionStepCents;
}
function salaryCents(seconds,r){const scale=10**(r.hourlyRate.split('.')[1]?.length||0);return Math.round(seconds*Number(r.hourlyRate.replace('.',''))*100/(3600*scale));}
function totals(m,r){
 const daily={};for(const s of m.sessions)daily[s.date]=(daily[s.date]||0)+s.gmvCents;
 const gmvCents=Object.values(daily).reduce((a,b)=>a+b,0);
 return {sessionCount:m.sessions.length,liveDays:Object.keys(daily).length,gmvCents,dailyGmvCents:daily,approvedPayrollSeconds:m.approvedPayrollSeconds,commissionCents:commissionCents(gmvCents,r),basicSalaryCents:salaryCents(m.approvedPayrollSeconds,r),hoursProgress:Math.min(m.approvedPayrollSeconds/r.monthlyHoursTargetSeconds*100,100)};
}
function adaptMonth(m){
 const actualDates=new Set(m.sessions.map(s=>s.date));
 const entries=m.sessions.map(s=>({...s,sales:s.gmvCents/100,dur:s.durationSeconds/3600,notes:escape(s.notes),attendance:false}));
 for(const a of m.attendance)if(!actualDates.has(a.date)&&a.status!=='working')entries.push({id:'attendance-'+a.date,date:a.date,sales:0,gmvCents:0,dur:0,notes:escape(a.notes||a.status),attendance:true,status:a.status});
 return {entries,hours:m.approvedPayrollSeconds/3600,approvedPayrollSeconds:m.approvedPayrollSeconds};
}
function clearLegacyStorage(storage){
 try {storage=storage||root.localStorage;for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(/^eskayvie_/.test(key))storage.removeItem(key);}}catch{/* Storage may be disabled. It is never a data source. */}
}
async function load(fetcher=root.fetch.bind(root)){
 async function json(path){const response=await fetcher(path,{cache:'no-store'});check(response.ok,'Cannot load '+path+' (HTTP '+response.status+')');try{return await response.json();}catch{throw new Error('Invalid JSON: '+path);}}
 const manifest=await json('data/manifest.json');
 check(manifest?.schemaVersion===1&&Array.isArray(manifest.months)&&manifest.months.length>0,'Invalid manifest');
 check(manifest.businessRules==='config/business-rules.json','Invalid business rules path');
 const periods=new Set();
 for(const d of manifest.months){check(/^\d{4}-(0[1-9]|1[0-2])$/.test(d.period)&&!periods.has(d.period)&&['open','completed'].includes(d.status)&&/^\d{4}\/[\w-]+\.json$/.test(d.path),'Invalid manifest month');periods.add(d.period);}
 check(periods.has(manifest.defaultPeriod),'Invalid default period');
 const rules=await json('data/'+manifest.businessRules);validateRules(rules);
 const months=await Promise.all(manifest.months.map(async d=>{const m=await json('data/'+d.path);validateMonth(m,d,rules);return m;}));
 const states={},schedules=[];
 for(const m of months){const [year,month]=m.period.split('-').map(Number);states[`eskayvie_${year}_${month}`]=adaptMonth(m);
  if(m.schedule.length)schedules.push({key:`${year}_${month}`,year,month,label:new Date(Date.UTC(year,month-1,1)).toLocaleString('en',{month:'long',timeZone:'UTC'})+' '+year,data:Object.fromEntries(m.schedule.map(s=>[s.date,{...s,label:escape(s.label),start:s.slots[0].startTime}]))});
 }
 return {manifest,rules,months,states,schedules};
}
root.V2={load,validateRules,validateMonth,adaptMonth,totals,commissionCents,salaryCents,clearLegacyStorage};
})(globalThis);
