import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PILOT_EVENTS,
  TEST_MESSAGE,
  buildReminderMessage,
  extractShift,
  loadOctoberSchedule,
  resolveMalaysiaDateTime,
  resolveScheduledEvent,
  runReminder
} from '../scripts/telegram-reminder.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('Malaysia date resolution crosses UTC midnight correctly', () => {
  assert.deepEqual(resolveMalaysiaDateTime(new Date('2026-10-27T23:00:00Z')), {
    date: '2026-10-28',
    time: '07:00'
  });
  assert.deepEqual(resolveMalaysiaDateTime(new Date('2026-10-30T22:00:00Z')), {
    date: '2026-10-31',
    time: '06:00'
  });
});

test('all eight UTC pilot events resolve and send their guarded Malaysia reminder', async () => {
  assert.equal(PILOT_EVENTS.length, 8);
  for (const expected of PILOT_EVENTS) {
    assert.deepEqual(resolveScheduledEvent(new Date(expected.utc), expected.schedule), expected);
    let body;
    const result = await runReminder({
      mode: 'scheduled',
      now: new Date(expected.utc),
      schedule: expected.schedule,
      env: { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-chat' },
      fetchImpl: async (_url, options) => {
        body = JSON.parse(options.body);
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      },
      log() {}
    });
    assert.equal(result.sent, true);
    assert.equal(result.event, expected);
    assert.equal(body.text, result.message);
  }
});

test('pilot shifts are extracted from the authoritative October JSON', async () => {
  const month = await loadOctoberSchedule();
  const expected = {
    '2026-10-28': ['11AM – 3PM', '11:00', '15:00'],
    '2026-10-29': ['7AM – 11AM', '07:00', '11:00'],
    '2026-10-30': ['7AM – 11AM', '07:00', '11:00'],
    '2026-10-31': ['7AM – 11AM', '07:00', '11:00']
  };

  for (const [date, [label, startTime, endTime]] of Object.entries(expected)) {
    assert.deepEqual(extractShift(month, date), { date, label, startTime, endTime });
  }
});

test('4-hour and 1-hour messages use schedule times and spell Adrisha correctly', async () => {
  const month = await loadOctoberSchedule();
  const shift = extractShift(month, '2026-10-28');
  const fourHour = buildReminderMessage(PILOT_EVENTS[0], shift);
  const oneHour = buildReminderMessage(PILOT_EVENTS[1], shift);

  assert.match(fourHour, /^⏰ ADRISHA LIVE REMINDER/);
  assert.match(fourHour, /Wednesday, 28 October 2026/);
  assert.match(fourHour, /TikTok Studio 1 \(Main\)/);
  assert.match(fourHour, /11:00 AM – 3:00 PM/);
  assert.match(fourHour, /Starting in 4 hours\. Please get ready and travel safely\. ❤️$/);
  assert.match(oneHour, /^🚨 ADRISHA LIVE REMINDER/);
  assert.match(oneHour, /Starting in 1 hour\. See you soon! ❤️$/);
  assert.match(`${fourHour}\n${oneHour}\n${TEST_MESSAGE}`, /ADRISHA/g);
  assert.doesNotMatch(`${fourHour}\n${oneHour}\n${TEST_MESSAGE}`, /Adrisah/i);
});

test('scheduled execution is a no-op outside the pilot and on reruns', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  };
  const options = { mode: 'scheduled', schedule: '0 23 27 10 *', fetchImpl, log() {} };

  const before = await runReminder({ ...options, now: new Date('2026-10-26T23:00:00Z') });
  const after = await runReminder({ ...options, now: new Date('2027-10-27T23:00:00Z') });
  const rerun = await runReminder({ ...options, now: new Date(PILOT_EVENTS[0].utc), runAttempt: 2 });

  assert.equal(before.sent, false);
  assert.equal(after.sent, false);
  assert.equal(rerun.sent, false);
  assert.equal(calls, 0);
});

test('manual dry-run previews a resolved reminder without calling Telegram', async () => {
  let calls = 0;
  const result = await runReminder({
    mode: 'dry-run',
    now: new Date('2026-10-27T22:00:00Z'),
    fetchImpl: async () => { calls += 1; },
    log() {}
  });

  assert.equal(result.sent, false);
  assert.equal(result.type, 'preview');
  assert.equal(result.event, PILOT_EVENTS[0]);
  assert.equal(calls, 0);
});

test('manual send-test sends only the fixed test message and requires Telegram ok true', async () => {
  let sentBody;
  const result = await runReminder({
    mode: 'send-test',
    env: { TELEGRAM_BOT_TOKEN: 'not-a-real-token', TELEGRAM_CHAT_ID: 'test-chat' },
    fetchImpl: async (_url, options) => {
      sentBody = JSON.parse(options.body);
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    },
    log() {}
  });

  assert.equal(result.type, 'test');
  assert.equal(sentBody.text, TEST_MESSAGE);
  assert.ok(!PILOT_EVENTS.some(event => TEST_MESSAGE.includes(event.date)));

  await assert.rejects(() => runReminder({
    mode: 'send-test',
    env: { TELEGRAM_BOT_TOKEN: 'not-a-real-token', TELEGRAM_CHAT_ID: 'test-chat' },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: false }) }),
    log() {}
  }), /Telegram rejected the message/);
});

test('candidate tracked files contain secret references but no Telegram token value', async () => {
  const names = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: repoRoot,
    encoding: 'utf8'
  }).trim().split(/\r?\n/).filter(Boolean);
  const tokenPattern = /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/;

  for (const name of names) {
    const content = await readFile(resolve(repoRoot, name), 'utf8');
    assert.doesNotMatch(content, tokenPattern, `${name} contains a token-shaped value`);
  }

  const workflow = await readFile(resolve(repoRoot, '.github/workflows/telegram-reminder-pilot.yml'), 'utf8');
  assert.match(workflow, /TELEGRAM_BOT_TOKEN: \$\{\{ secrets\.TELEGRAM_BOT_TOKEN \}\}/);
  assert.match(workflow, /TELEGRAM_CHAT_ID: \$\{\{ secrets\.TELEGRAM_CHAT_ID \}\}/);
  assert.match(workflow, /permissions:\s+contents: read/);
  for (const cron of [
    '0 23 27 10 *',
    '0 2 28 10 *',
    '0 19 28-30 10 *',
    '0 22 28-30 10 *'
  ]) {
    assert.ok(workflow.includes(`cron: '${cron}'`), `missing cron ${cron}`);
  }
});
