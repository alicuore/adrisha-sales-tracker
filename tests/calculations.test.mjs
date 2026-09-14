import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(repoRoot, relativePath), 'utf8'));
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

function calculateMonth(sessions, approvedPayrollSeconds, rules) {
  const gmvCents = sessions.reduce((sum, session) => sum + session.gmvCents, 0);
  return {
    sessionCount: sessions.length,
    gmvCents,
    dailyGmvCents: groupDailyGmv(sessions),
    commissionCents: calculateCommissionCents(gmvCents, rules),
    basicSalaryCents: calculateBasicSalaryCents(approvedPayrollSeconds, rules.hourlyRate)
  };
}

function actualAttendanceStatus(date, sessions, plannedStatus) {
  return sessions.some(session => session.date === date) ? 'working' : plannedStatus;
}

test('commission tiers and open-ended RM10,000 extension match the approved rules', async () => {
  const rules = await readJson('data/config/business-rules.json');
  const cases = [
    [0, 0],
    [1_499_999, 0],
    [1_500_000, 10_000],
    [1_999_999, 10_000],
    [2_000_000, 20_000],
    [2_500_000, 50_000],
    [3_500_000, 160_000],
    [5_000_000, 400_000],
    [7_000_000, 560_000],
    [9_000_000, 720_000],
    [10_000_000, 800_000],
    [10_999_999, 800_000],
    [11_000_000, 880_000],
    [11_999_999, 880_000],
    [12_000_000, 960_000],
    [31_253_691, 2_480_000]
  ];

  for (const [gmvCents, expected] of cases) {
    assert.equal(calculateCommissionCents(gmvCents, rules), expected, `GMV cents ${gmvCents}`);
  }
});

test('multiple sessions on one date group into one daily GMV without losing sessions', () => {
  const sessions = [
    { date: '2026-09-01', gmvCents: 264_835 },
    { date: '2026-09-01', gmvCents: 745_814 },
    { date: '2026-09-02', gmvCents: 828_888 }
  ];

  assert.equal(sessions.length, 3);
  assert.deepEqual(groupDailyGmv(sessions), {
    '2026-09-01': 1_010_649,
    '2026-09-02': 828_888
  });
});

test('synthetic month calculations preserve daily grouping, zero-GMV sessions and approved payroll', async () => {
  const rules = await readJson('data/config/business-rules.json');
  const sessions = [
    {date:'2026-09-01',gmvCents:3_000_000,durationSeconds:3600},
    {date:'2026-09-01',gmvCents:0,durationSeconds:1800},
    {date:'2026-09-02',gmvCents:3_500_000,durationSeconds:3600}
  ];
  const result = calculateMonth(sessions, 7200, rules);
  assert.equal(result.sessionCount, 3);
  assert.equal(result.gmvCents, 6_500_000);
  assert.deepEqual(result.dailyGmvCents, {'2026-09-01':3_000_000,'2026-09-02':3_500_000});
  assert.equal(result.commissionCents, 480_000);
  assert.equal(result.basicSalaryCents, 3333);
});

test('approved payroll hours remain independent from summed session durations', async () => {
  const [rules, june] = await Promise.all([
    readJson('data/config/business-rules.json'),
    readJson('data/2026/06-june.json')
  ]);
  const sessionSeconds = june.sessions.reduce((sum, session) => sum + session.durationSeconds, 0);

  assert.equal(june.approvedPayrollSeconds, 401_621);
  assert.equal(sessionSeconds, 390_050);
  assert.notEqual(june.approvedPayrollSeconds, sessionSeconds);
  assert.equal(calculateBasicSalaryCents(june.approvedPayrollSeconds, rules.hourlyRate), 185_936);
  assert.equal(rules.monthlyHoursTargetSeconds, 432_000);
});

test('an actual session overrides planned leave or off attendance', () => {
  const sessions = [{ date: '2026-08-10', gmvCents: 567_088 }];

  assert.equal(actualAttendanceStatus('2026-08-10', sessions, 'leave'), 'working');
  assert.equal(actualAttendanceStatus('2026-08-10', sessions, 'off'), 'working');
  assert.equal(actualAttendanceStatus('2026-08-24', sessions, 'leave'), 'leave');
});
