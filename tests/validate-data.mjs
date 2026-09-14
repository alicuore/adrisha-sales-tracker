import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import '../js/data-layer.js';
const { V2 } = globalThis;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(repoRoot, relativePath), 'utf8'));
}

function check(condition, message) {
  if (!condition) errors.push(message);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function calculateCommissionCents(gmvCents, rules) {
  const tier = rules.commission.tiers.find(item =>
    gmvCents >= item.minGmvCents && gmvCents <= item.maxGmvCents
  );
  if (tier) return tier.commissionCents;

  const extension = rules.commission.extension;
  return extension.baseCommissionCents
    + Math.floor((gmvCents - extension.baseGmvCents) / extension.gmvStepCents)
      * extension.commissionStepCents;
}

function calculateBasicSalaryCents(approvedPayrollSeconds, hourlyRate) {
  const decimals = hourlyRate.split('.')[1]?.length || 0;
  const scaledRate = Number(hourlyRate.replace('.', ''));
  const scale = 10 ** decimals;
  return Math.round(approvedPayrollSeconds * scaledRate * 100 / (3600 * scale));
}

function groupDailyGmv(sessions) {
  return sessions.reduce((daily, session) => {
    daily[session.date] = (daily[session.date] || 0) + session.gmvCents;
    return daily;
  }, {});
}

function monthTotals(month, rules) {
  const gmvCents = month.sessions.reduce((sum, session) => sum + session.gmvCents, 0);
  return {
    sessionCount: month.sessions.length,
    gmvCents,
    approvedPayrollSeconds: month.approvedPayrollSeconds,
    commissionCents: calculateCommissionCents(gmvCents, rules),
    basicSalaryCents: calculateBasicSalaryCents(month.approvedPayrollSeconds, rules.hourlyRate),
    dailyGmvCents: groupDailyGmv(month.sessions)
  };
}

function sameObject(left, right) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key]);
}

function parsePlannedSlots(label) {
  const slots = [];
  const expression = /(\d{1,2})(?::(\d{2}))?(AM|PM)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?(AM|PM)/gi;
  let match;

  function to24(hourText, minuteText, meridiem) {
    let hour = Number(hourText) % 12;
    if (meridiem.toUpperCase() === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${minuteText || '00'}`;
  }

  while ((match = expression.exec(label))) {
    const startTime = to24(match[1], match[2], match[3]);
    const endTime = to24(match[4], match[5], match[6]);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    slots.push({
      startTime,
      endTime,
      endDayOffset: endHour * 60 + endMinute <= startHour * 60 + startMinute ? 1 : 0
    });
  }
  return slots;
}

function extractObjectConstant(html, name) {
  const match = html.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
  if (!match) throw new Error(`Unable to locate ${name} in index.html`);
  return vm.runInNewContext(`(${match[1]})`);
}

function extractEffectivePreloaded(html) {
  const start = html.indexOf('const PRELOADED =');
  const equals = html.indexOf('=', start) + 1;
  const end = html.indexOf('// ── JUNE 2026 SCHEDULE', equals);
  if (start < 0 || end < 0) throw new Error('Unable to locate effective PRELOADED data in index.html');
  return vm.runInNewContext(`(${html.slice(equals, end).trim().replace(/;\s*$/, '')})`);
}

function money(cents) {
  return `RM${(cents / 100).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function hours(seconds) {
  const wholeSeconds = Math.round(seconds);
  const hh = Math.floor(wholeSeconds / 3600);
  const mm = Math.floor((wholeSeconds % 3600) / 60);
  const ss = wholeSeconds % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

const [manifest, rules, baseline, html] = await Promise.all([
  readJson('data/manifest.json'),
  readJson('data/config/business-rules.json'),
  readJson('tests/historical-baseline.json'),
  readFile(resolve(repoRoot, 'tests/fixtures/legacy-phase1.js'), 'utf8')
]);

check(manifest.schemaVersion === 1, 'Manifest schemaVersion must be 1');
check(rules.schemaVersion === 1, 'Business-rules schemaVersion must be 1');
check(rules.hourlyRate === '16.6667', 'Hourly rate must be RM16.6667');
check(rules.monthlyHoursTargetSeconds === 432000, 'Monthly target must be 120 hours');
check(rules.attendancePrecedence?.actualSessionOverridesPlannedAttendance === true,
  'Actual-session attendance precedence must be enabled');

const periodSet = new Set();
const globalSessionIds = new Set();
const globalNaturalKeys = new Set();
const loadedMonths = new Map();
let sessionTotal = 0;
let dailyTotal = 0;
let scheduleDayTotal = 0;

for (const descriptor of manifest.months) {
  check(!periodSet.has(descriptor.period), `Duplicate period in manifest: ${descriptor.period}`);
  periodSet.add(descriptor.period);

  const month = await readJson(`data/${descriptor.path}`);
  loadedMonths.set(descriptor.period, month);
  check(month.schemaVersion === 1, `${descriptor.period}: schemaVersion must be 1`);
  check(month.period === descriptor.period, `${descriptor.period}: period does not match manifest`);
  check(month.status === descriptor.status, `${descriptor.period}: status does not match manifest`);
  check(month.ruleSetId === rules.ruleSetId, `${descriptor.period}: unknown ruleSetId`);
  check(Number.isSafeInteger(month.approvedPayrollSeconds) && month.approvedPayrollSeconds >= 0,
    `${descriptor.period}: invalid approvedPayrollSeconds`);

  for (const forbidden of ['gmvCents', 'sessionCount', 'commissionCents', 'dailyGmvCents', 'expectedTotals']) {
    check(!(forbidden in month), `${descriptor.period}: ${forbidden} must be calculated, not stored`);
  }

  const actualDates = new Set();
  const monthNaturalKeys = new Set();
  for (const session of month.sessions) {
    sessionTotal += 1;
    const label = `${descriptor.period}/${session.id}`;
    check(validDate(session.date), `${label}: invalid date`);
    check(session.date.startsWith(`${descriptor.period}-`), `${label}: date is outside its period`);
    check(Number.isSafeInteger(session.sessionNumber) && session.sessionNumber > 0,
      `${label}: invalid sessionNumber`);
    check(Number.isSafeInteger(session.gmvCents) && session.gmvCents >= 0,
      `${label}: invalid gmvCents`);
    check(Number.isSafeInteger(session.durationSeconds) && session.durationSeconds >= 0,
      `${label}: invalid durationSeconds`);
    check(typeof session.legacyId === 'string' && session.legacyId.length > 0,
      `${label}: missing legacyId`);
    check(!/leave/i.test(session.notes || ''), `${label}: leave pseudo-record found in sessions`);

    const expectedId = `${session.date}-s${String(session.sessionNumber).padStart(2, '0')}`;
    check(session.id === expectedId, `${label}: stable ID should be ${expectedId}`);
    check(!globalSessionIds.has(session.id), `${label}: duplicate global session ID`);
    globalSessionIds.add(session.id);

    const naturalKey = `${session.date}#${session.sessionNumber}`;
    check(!monthNaturalKeys.has(naturalKey), `${label}: duplicate date + session-number`);
    check(!globalNaturalKeys.has(naturalKey), `${label}: duplicate global natural key`);
    monthNaturalKeys.add(naturalKey);
    globalNaturalKeys.add(naturalKey);
    actualDates.add(session.date);

    check((session.startTime === null) === (session.endTime === null),
      `${label}: startTime and endTime must both be present or both be null`);
    if (session.startTime !== null) {
      check(validTime(session.startTime), `${label}: invalid startTime`);
      check(validTime(session.endTime), `${label}: invalid endTime`);
    }
  }

  const attendanceDates = new Set();
  for (const attendance of month.attendance) {
    const label = `${descriptor.period}/attendance/${attendance.date}`;
    check(validDate(attendance.date) && attendance.date.startsWith(`${descriptor.period}-`),
      `${label}: invalid date`);
    check(['leave', 'off', 'absent', 'working'].includes(attendance.status),
      `${label}: invalid status`);
    check(!attendanceDates.has(attendance.date), `${label}: duplicate attendance date`);
    attendanceDates.add(attendance.date);
    if (actualDates.has(attendance.date)) {
      check(attendance.status === 'working', `${label}: actual session must resolve attendance to working`);
    }
  }

  const scheduleDates = new Set();
  for (const day of month.schedule) {
    scheduleDayTotal += 1;
    const label = `${descriptor.period}/schedule/${day.date}`;
    check(validDate(day.date) && day.date.startsWith(`${descriptor.period}-`), `${label}: invalid date`);
    check(!scheduleDates.has(day.date), `${label}: duplicate schedule date`);
    scheduleDates.add(day.date);
    check(Array.isArray(day.slots) && day.slots.length > 0, `${label}: planned slots are required`);
    if (day.label.includes('&')) check(day.slots.length > 1, `${label}: split shift requires multiple slots`);
    for (const slot of day.slots) {
      check(validTime(slot.startTime), `${label}: invalid slot startTime`);
      check(validTime(slot.endTime), `${label}: invalid slot endTime`);
      check(slot.endDayOffset === 0 || slot.endDayOffset === 1, `${label}: invalid endDayOffset`);
    }
  }

  const totals = monthTotals(month, rules);
  dailyTotal += Object.keys(totals.dailyGmvCents).length;
  const frozen = baseline.months[descriptor.period];
  if (baseline.frozenPeriods.includes(descriptor.period)) {
    check(!!frozen, `${descriptor.period}: missing frozen baseline`);
    if (!frozen) continue;
    for (const field of ['sessionCount', 'gmvCents', 'approvedPayrollSeconds', 'commissionCents', 'basicSalaryCents']) {
      check(totals[field] === frozen[field], `${descriptor.period}: frozen ${field} mismatch`);
    }
    check(sameObject(totals.dailyGmvCents, frozen.dailyGmvCents),
      `${descriptor.period}: frozen daily GMV mismatch`);
  }
}

check(!baseline.frozenPeriods.includes('2026-09'), 'Open September must not have frozen expected totals');
check(baseline.frozenPeriods.every(period => manifest.months.some(item =>
  item.period === period && item.status === 'completed')),
  'Every frozen baseline period must be a completed manifest month');

const preloaded = extractEffectivePreloaded(html);
const scheduleSources = {
  5: extractObjectConstant(html, 'MAY_2026_SCHEDULE'),
  6: extractObjectConstant(html, 'JUNE_2026_SCHEDULE'),
  7: extractObjectConstant(html, 'JULY_2026_SCHEDULE'),
  8: extractObjectConstant(html, 'AUGUST_2026_SCHEDULE'),
  9: extractObjectConstant(html, 'SEPTEMBER_2026_SCHEDULE')
};

const reconciliation = [];
let reconciledDailyDays = 0;
let reconciledScheduleDays = 0;

for (let monthNumber = 1; monthNumber <= 9; monthNumber += 1) {
  const period = `2026-${String(monthNumber).padStart(2, '0')}`;
  if (!baseline.frozenPeriods.includes(period)) {
    const month = loadedMonths.get(period);
    const descriptor = manifest.months.find(item => item.period === period);
    check(descriptor?.status === 'open', period + ': non-frozen month must be open');
    try { V2.validateRules(rules); V2.validateMonth(month, descriptor, rules); }
    catch (error) { check(false, period + ': ' + error.message); }
    const expected = monthTotals(month, rules);
    const actual = V2.totals(month, rules);
    for (const field of ['sessionCount','gmvCents','approvedPayrollSeconds','commissionCents','basicSalaryCents']) {
      check(actual[field] === expected[field], period + ': live calculation mismatch: ' + field);
    }
    check(sameObject(actual.dailyGmvCents, expected.dailyGmvCents), period + ': live daily totals mismatch');
    const adapted = V2.adaptMonth(month).entries.filter(entry => !entry.attendance);
    check(adapted.length === month.sessions.length && adapted.every((entry, i) =>
      entry.id === month.sessions[i].id && entry.gmvCents === month.sessions[i].gmvCents
      && entry.dur === month.sessions[i].durationSeconds / 3600), period + ': live adapter mismatch');
    // Schedule protection is independent of live sales and attendance updates.
    const planned = scheduleSources[monthNumber] || {};
    check(Object.keys(planned).length === month.schedule.length && Object.entries(planned).every(([date, day]) => {
      const migrated = month.schedule.find(item => item.date === date);
      return migrated && migrated.label === day.label
        && JSON.stringify(migrated.slots) === JSON.stringify(parsePlannedSlots(day.label));
    }), period + ': schedule reconciliation failed');
    reconciledScheduleDays += Object.keys(planned).length;
    console.log('Live JSON reconciliation: ' + period + ', ' + expected.sessionCount + ' sessions, ' + Object.keys(expected.dailyGmvCents).length + ' daily totals, ' + money(expected.gmvCents) + ', payroll ' + hours(expected.approvedPayrollSeconds));
    continue;
  }
  const v1 = preloaded[`eskayvie_2026_${monthNumber}`];
  const v2 = loadedMonths.get(period);
  const v1Sessions = v1.entries.filter(entry => !/leave/i.test(entry.notes || ''));
  const v1Daily = {};
  const sequenceByDate = new Map();
  let sessionMatch = v1Sessions.length === v2.sessions.length;

  for (let index = 0; index < v1Sessions.length; index += 1) {
    const entry = v1Sessions[index];
    const sessionNumber = (sequenceByDate.get(entry.date) || 0) + 1;
    sequenceByDate.set(entry.date, sessionNumber);
    const migrated = v2.sessions[index];
    const gmvCents = Math.round(entry.sales * 100);
    v1Daily[entry.date] = (v1Daily[entry.date] || 0) + gmvCents;
    sessionMatch &&= migrated
      && migrated.id === `${entry.date}-s${String(sessionNumber).padStart(2, '0')}`
      && migrated.legacyId === entry.id
      && migrated.date === entry.date
      && migrated.sessionNumber === sessionNumber
      && migrated.startTime === (entry.startTime || null)
      && migrated.endTime === (entry.endTime || null)
      && migrated.durationSeconds === Math.round((entry.dur || 0) * 3600)
      && migrated.gmvCents === gmvCents
      && migrated.notes === (entry.notes || '');
  }

  const v1GmvCents = v1Sessions.reduce((sum, entry) => sum + Math.round(entry.sales * 100), 0);
  const v1ApprovedSeconds = Math.round(v1.hours * 3600);
  const v1CommissionCents = calculateCommissionCents(v1GmvCents, rules);
  const v2Totals = monthTotals(v2, rules);
  const dailyMatch = sameObject(v1Daily, v2Totals.dailyGmvCents);
  reconciledDailyDays += Object.keys(v1Daily).length;

  const sourceSchedule = scheduleSources[monthNumber] || {};
  let scheduleMatch = Object.keys(sourceSchedule).length === v2.schedule.length;
  for (const [date, planned] of Object.entries(sourceSchedule)) {
    const migrated = v2.schedule.find(day => day.date === date);
    const expectedSlots = parsePlannedSlots(planned.label);
    scheduleMatch &&= migrated
      && migrated.label === planned.label
      && JSON.stringify(migrated.slots) === JSON.stringify(expectedSlots);
  }
  reconciledScheduleDays += Object.keys(sourceSchedule).length;

  const attendanceSource = v1.entries.filter(entry => /leave/i.test(entry.notes || ''));
  const attendanceMatch = attendanceSource.length === v2.attendance.length
    && attendanceSource.every(entry => {
      const migrated = v2.attendance.find(item => item.legacyId === entry.id);
      const hasActual = v2.sessions.some(session => session.date === entry.date);
      return migrated
        && migrated.date === entry.date
        && migrated.notes === (entry.notes || '')
        && migrated.status === (hasActual ? 'working' : 'leave');
    });

  const status = sessionMatch
    && dailyMatch
    && scheduleMatch
    && attendanceMatch
    && v1GmvCents === v2Totals.gmvCents
    && v1ApprovedSeconds === v2Totals.approvedPayrollSeconds
    && v1CommissionCents === v2Totals.commissionCents
    ? 'PASS'
    : 'FAIL';

  check(status === 'PASS', `${period}: V1/V2 reconciliation failed`);
  reconciliation.push({
    period,
    sessionsV1: v1Sessions.length,
    sessionsV2: v2.sessions.length,
    gmvV1: v1GmvCents,
    gmvV2: v2Totals.gmvCents,
    hoursV1: v1ApprovedSeconds,
    hoursV2: v2Totals.approvedPayrollSeconds,
    commissionV1: v1CommissionCents,
    commissionV2: v2Totals.commissionCents,
    status
  });
}

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validation PASS: ${sessionTotal} globally unique sessions across ${loadedMonths.size} months.`);
  console.log(`Frozen baseline PASS: ${baseline.frozenPeriods.length} completed periods and ${baseline.frozenPeriods.reduce((sum, period) => sum + Object.keys(groupDailyGmv(loadedMonths.get(period).sessions)).length, 0)} historical daily totals.`);
  console.log(`Frozen daily V1/V2 reconciliation PASS: ${reconciledDailyDays} daily totals.`);
  console.log(`Schedule V1/V2 reconciliation PASS: ${reconciledScheduleDays} planned days, including split slots.`);
  console.log('');
  console.log('| Month | Sessions V1 | Sessions V2 | GMV V1 | GMV V2 | Approved Hours V1 | Approved Hours V2 | Commission V1 | Commission V2 | Status |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
  for (const row of reconciliation) {
    console.log(`| ${row.period} | ${row.sessionsV1} | ${row.sessionsV2} | ${money(row.gmvV1)} | ${money(row.gmvV2)} | ${hours(row.hoursV1)} | ${hours(row.hoursV2)} | ${money(row.commissionV1)} | ${money(row.commissionV2)} | ${row.status} |`);
  }
}
