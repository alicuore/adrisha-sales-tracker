import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(join(root, 'data/manifest.json'), 'utf8'));
const descriptor = manifest.months.find(item => item.period === manifest.defaultPeriod);
const monthPath = 'data/' + descriptor.path;
const sourceMonth = JSON.parse(await readFile(join(root, monthPath), 'utf8'));
// Corrections need an existing session even when production is freshly initialized.
if (!sourceMonth.sessions.length) sourceMonth.sessions.push({id:descriptor.period+'-01-s01',legacyId:'synthetic',date:descriptor.period+'-01',sessionNumber:1,startTime:'15:00',endTime:'16:00',durationSeconds:3600,gmvCents:100,notes:'Synthetic test session'});
const session = sourceMonth.sessions[0];
const total = sourceMonth.sessions.reduce((sum, item) => sum + item.gmvCents, 0);
const timing = { operation: 'correct_session_timing', sessionId: session.id,
  endTime: session.endTime === '14:53' ? '14:54' : '14:53', durationSeconds: 10800 };
const gmv = { operation: 'correct_gmv', sessionId: session.id, gmvCents: session.gmvCents + 100 };

async function run(changes, expectedMonthlyTotalCents = total, overrides = {}, initialMonth = sourceMonth) {
  const dir = await mkdtemp(join(tmpdir(), 'sales-publisher-'));
  try {
    await cp(join(root, 'data'), join(dir, 'data'), { recursive: true });
    await cp(join(root, 'scripts/publish-sales-update.mjs'), join(dir, 'scripts/publish-sales-update.mjs'), { recursive: true });
    await writeFile(join(dir, monthPath), JSON.stringify(initialMonth));
    const before = new Map(await Promise.all(['data/manifest.json', 'data/config/business-rules.json', ...manifest.months.map(d=>'data/'+d.path)].map(async p=>[p,await readFile(join(dir,p),'utf8')])));
    const payload = { period: descriptor.period, expectedMonthlyTotalCents,
      expectedApprovedPayrollSeconds: 123456, changes, ...overrides };
    const result = spawnSync(process.execPath, [join(dir, 'scripts/publish-sales-update.mjs')], {
      env: { ...process.env, SALES_UPDATE_PAYLOAD: JSON.stringify(payload) }, encoding: 'utf8' });
    const month = JSON.parse(await readFile(join(dir, monthPath), 'utf8'));
    for (const [p, text] of before) if (p !== monthPath || result.status !== 0) assert.equal(await readFile(join(dir,p),'utf8'),text,p+' unexpectedly changed');
    return { result, month };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('timing correction changes only requested fields and uses explicit payroll', async () => {
  const { result, month } = await run([timing]);
  assert.equal(result.status, 0, result.stderr);
  const expected = structuredClone(sourceMonth);
  const target = expected.sessions.find(item => item.id === session.id);
  target.endTime = timing.endTime;
  target.durationSeconds = timing.durationSeconds;
  expected.approvedPayrollSeconds = 123456;
  assert.deepEqual(month, expected);
});

test('GMV and timing corrections can target the same existing session', async () => {
  const { result, month } = await run([gmv, timing], total + 100);
  assert.equal(result.status, 0, result.stderr);
  const target = month.sessions.find(item => item.id === session.id);
  assert.equal(target.gmvCents, gmv.gmvCents);
  assert.equal(target.endTime, timing.endTime);
  assert.equal(target.durationSeconds, timing.durationSeconds);
});

test('duplicate or conflicting timing corrections are rejected without writing', async () => {
  for (const second of [timing, { ...timing, durationSeconds: 10801 }]) {
    const { result, month } = await run([timing, second]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Duplicate correct_session_timing/);
    assert.deepEqual(month, sourceMonth);
  }
});

test('timing fields must be valid', async () => {
  for (const change of [{ ...timing, endTime: '25:00' }, { ...timing, durationSeconds: -1 },
    { ...timing, durationSeconds: 1.5 }]) {
    const { result, month } = await run([change]);
    assert.notEqual(result.status, 0);
    assert.deepEqual(month, sourceMonth);
  }
});

const addedSession = {
  ...session, id: descriptor.period + '-02-s99', date: descriptor.period + '-02',
  sessionNumber: 99, legacyId: 'synthetic-addition', gmvCents: 250
};
const addition = { operation: 'add_session', session: addedSession };

test('add_session preserves existing data and changes only the current monthly JSON', async () => {
  const { result, month } = await run([addition], total + 250);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(month, { ...sourceMonth, approvedPayrollSeconds: 123456,
    sessions: [...sourceMonth.sessions, addedSession] });
});

test('duplicate additions, existing IDs, natural keys and GMV corrections are rejected', async () => {
  for (const changes of [[addition, addition], [{ operation: 'add_session', session }],
    [{ operation: 'add_session', session: { ...session, id: session.id + 'x', legacyId: 'new' } }],
    [gmv, gmv]]) {
    const { result } = await run(changes, total + 250);
    assert.notEqual(result.status, 0);
  }
});

test('GMV safeguard and invalid payroll reject the batch without any writes', async () => {
  for (const overrides of [{ expectedMonthlyTotalCents: total + 251 },
    { expectedApprovedPayrollSeconds: -1 }, { expectedApprovedPayrollSeconds: 1.5 }]) {
    const { result } = await run([addition], total + 250, overrides);
    assert.notEqual(result.status, 0);
  }
});

test('non-current periods and corrections to completed months are rejected', async () => {
  for (const period of [...manifest.months.filter(d => d.period !== descriptor.period).map(d => d.period), '2099-01']) {
    const { result } = await run([addition], total + 250, { period });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not the current period/);
  }
  const closed = manifest.months.find(d => d.status === 'completed');
  const historical = JSON.parse(await readFile(join(root, 'data', closed.path), 'utf8'));
  const { result } = await run([{ operation: 'correct_gmv', sessionId: historical.sessions[0].id,
    gmvCents: historical.sessions[0].gmvCents + 1 }]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not in the current open period/);
});


test('first addition to an empty open month succeeds', async () => {
  const empty = { ...sourceMonth, sessions: [], attendance: [], approvedPayrollSeconds: 0 };
  const { result, month } = await run([addition], 250, { expectedApprovedPayrollSeconds: addedSession.durationSeconds }, empty);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(month, { ...empty, sessions: [addedSession], approvedPayrollSeconds: addedSession.durationSeconds });
});
