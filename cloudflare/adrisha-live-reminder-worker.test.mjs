import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PILOT_EVENTS,
  NOVEMBER_SHIFTS,
  REMINDER_EVENTS,
  buildReminderEvents,
  buildReminderMessage,
  calculateGmvProgress,
  eventKey,
  resolveDueEvent,
  runScheduled
} from './adrisha-live-reminder-worker.mjs';
import worker from './adrisha-live-reminder-worker.mjs';

const novemberData = JSON.parse(
  readFileSync(new URL('../data/2026/11-november.json', import.meta.url), 'utf8')
);

const month = {
  period: '2026-10',
  sessions: [
    { id: 's01', gmvCents: 10_000_000 },
    { id: 's02', gmvCents: 1_005_807 }
  ],
  schedule: [
    { date: '2026-10-29', label: '7AM – 11AM', slots: [{ startTime: '07:00', endTime: '11:00' }] }
  ]
};

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('all eight events resolve for the full 59-minute retry window', () => {
  assert.equal(PILOT_EVENTS.length, 8);
  for (const event of PILOT_EVENTS) {
    assert.deepEqual(resolveDueEvent(new Date(event.utc)), event);
    assert.deepEqual(resolveDueEvent(new Date(Date.parse(event.utc) + 59 * 60 * 1000)), event);
    assert.equal(resolveDueEvent(new Date(Date.parse(event.utc) + 60 * 60 * 1000)), null);
  }
});

test('all 30 November shifts produce exact four-hour and one-hour events', () => {
  const events = buildReminderEvents(NOVEMBER_SHIFTS);
  assert.equal(NOVEMBER_SHIFTS.length, 30);
  assert.equal(events.length, 60);
  assert.equal(REMINDER_EVENTS.length, 68);
  assert.deepEqual(events[0], {
    utc: '2026-11-01T08:00:00.000Z',
    date: '2026-11-01',
    reminderHours: 4
  });
  assert.deepEqual(events[1], {
    utc: '2026-11-01T11:00:00.000Z',
    date: '2026-11-01',
    reminderHours: 1
  });
  assert.deepEqual(events[18], {
    utc: '2026-11-09T19:00:00.000Z',
    date: '2026-11-10',
    reminderHours: 4
  });
});

test('November monthly data matches all Worker shifts exactly', () => {
  assert.equal(novemberData.period, '2026-11');
  assert.deepEqual(
    novemberData.schedule.map(entry => {
      assert.equal(entry.slots.length, 1);
      const [slot] = entry.slots;
      return {
        date: entry.date,
        startTime: slot.startTime,
        endTime: slot.endTime
      };
    }),
    NOVEMBER_SHIFTS
  );
});

test('message content matches the existing Telegram reminder format', () => {
  const event = PILOT_EVENTS[2];
  const shift = { date: '2026-10-29', label: '7AM – 11AM', startTime: '07:00', endTime: '11:00' };
  const progress = calculateGmvProgress(month);
  const message = buildReminderMessage(event, shift, progress);
  assert.match(message, /^⏰ ADRISHA LIVE REMINDER/);
  assert.match(message, /Thursday, 29 October 2026/);
  assert.match(message, /TikTok Studio 1 \(Main\)/);
  assert.match(message, /7:00 AM – 11:00 AM/);
  assert.match(message, /Current GMV: RM110,058.07/);
  assert.match(message, /Next milestone: RM120,000.00/);
  assert.match(message, /Remaining to milestone: RM9,941.93/);
  assert.match(message, /Starting in 4 hours/);
});

test('GMV milestones advance in exact RM10,000 steps', () => {
  assert.deepEqual(calculateGmvProgress({ sessions: [{ id: 'a', gmvCents: 10_500_000 }] }), {
    totalGmvCents: 10_500_000,
    nextMilestoneCents: 11_000_000,
    remainingCents: 500_000
  });
  assert.deepEqual(calculateGmvProgress({ sessions: [{ id: 'a', gmvCents: 11_000_000 }] }), {
    totalGmvCents: 11_000_000,
    nextMilestoneCents: 12_000_000,
    remainingCents: 1_000_000
  });
});

test('successful send is marked only after Telegram accepts it', async () => {
  const stored = new Map();
  const env = {
    TELEGRAM_BOT_TOKEN: 'test-token',
    TELEGRAM_CHAT_ID: 'test-chat',
    REMINDER_STATE: {
      get: async key => stored.get(key) ?? null,
      put: async (key, value) => stored.set(key, value)
    }
  };
  let telegramCalls = 0;
  const fetchImpl = async url => {
    if (url.includes('raw.githubusercontent.com')) return response(month);
    telegramCalls += 1;
    return response({ ok: true });
  };
  const now = new Date(PILOT_EVENTS[2].utc);
  const first = await runScheduled(now, env, fetchImpl);
  const second = await runScheduled(new Date(now.getTime() + 5 * 60 * 1000), env, fetchImpl);
  assert.equal(first.sent, true);
  assert.equal(second.reason, 'already-sent');
  assert.equal(telegramCalls, 1);
  assert.ok(stored.has(eventKey(PILOT_EVENTS[2])));
});

test('Telegram failure is not marked, allowing the next cron check to retry', async () => {
  const stored = new Map();
  const env = {
    TELEGRAM_BOT_TOKEN: 'test-token',
    TELEGRAM_CHAT_ID: 'test-chat',
    REMINDER_STATE: {
      get: async key => stored.get(key) ?? null,
      put: async (key, value) => stored.set(key, value)
    }
  };
  const fetchImpl = async url => url.includes('raw.githubusercontent.com')
    ? response(month)
    : response({ ok: false }, 500);
  await assert.rejects(() => runScheduled(new Date(PILOT_EVENTS[2].utc), env, fetchImpl), /Telegram rejected/);
  assert.equal(stored.size, 0);
});

test('manual test endpoint requires the admin secret', async () => {
  const env = {
    ADMIN_KEY: 'private-admin-key',
    TELEGRAM_BOT_TOKEN: 'test-token',
    TELEGRAM_CHAT_ID: 'test-chat'
  };
  const unauthorized = await worker.fetch(new Request('https://example.test/test', { method: 'POST' }), env);
  assert.equal(unauthorized.status, 401);
});
