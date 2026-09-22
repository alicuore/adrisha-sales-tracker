import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const sourceMonth = JSON.parse(await readFile(join(root, 'data/2026/09-september.json'), 'utf8'));
const session = sourceMonth.sessions.find(item => item.id === '2026-09-21-s01') ?? sourceMonth.sessions[0];
const total = sourceMonth.sessions.reduce((sum, item) => sum + item.gmvCents, 0);
const timing = { operation: 'correct_session_timing', sessionId: session.id,
  endTime: session.endTime === '14:53' ? '14:54' : '14:53', durationSeconds: 10800 };
const gmv = { operation: 'correct_gmv', sessionId: session.id, gmvCents: session.gmvCents + 100 };

async function run(changes, expectedMonthlyTotalCents = total) {
  const dir = await mkdtemp(join(tmpdir(), 'sales-publisher-'));
  try {
    await cp(join(root, 'data'), join(dir, 'data'), { recursive: true });
    await cp(join(root, 'scripts/publish-sales-update.mjs'), join(dir, 'scripts/publish-sales-update.mjs'), { recursive: true });
    const payload = { period: '2026-09', expectedMonthlyTotalCents,
      expectedApprovedPayrollSeconds: 123456, changes };
    const result = spawnSync(process.execPath, [join(dir, 'scripts/publish-sales-update.mjs')], {
      env: { ...process.env, SALES_UPDATE_PAYLOAD: JSON.stringify(payload) }, encoding: 'utf8' });
    const month = JSON.parse(await readFile(join(dir, 'data/2026/09-september.json'), 'utf8'));
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
