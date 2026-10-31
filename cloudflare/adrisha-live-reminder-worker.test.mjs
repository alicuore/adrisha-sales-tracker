import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PILOT_EVENTS,
  NOVEMBER_SHIFTS,
  REMINDER_EVENTS,
  MOTIVATIONAL_QUOTES,
  buildMonthEvents,
  buildReminderEvents,
  buildReminderMessage,
  buildMotivationMessage,
  buildDailyReport,
  buildSalaryReply,
  buildTargetReply,
  buildWeekReply,
  buildMonthReply,
  buildPerformanceReply,
  buildStatusReply,
  buildScheduleReply,
  calculateGmvProgress,
  checkMissingReportWarning,
  eventKey,
  handleTelegramUpdate,
  loadActiveMonth,
  normalizeCommand,
  resolveDueEvent,
  runScheduled,
  selectMotivationalQuote,
  sendMilestoneAlert,
  sendDailyReport
} from './adrisha-live-reminder-worker.mjs';
import worker from './adrisha-live-reminder-worker.mjs';

const novemberData = JSON.parse(
  readFileSync(new URL('../data/2026/11-november.json', import.meta.url), 'utf8')
);

const manifest = {
  defaultPeriod: '2026-10',
  months: [
    { period: '2026-10', status: 'open', path: '2026/10-october.json' },
    { period: '2026-11', status: 'open', path: '2026/11-november.json' }
  ]
};

const novemberManifest = {
  ...manifest,
  defaultPeriod: '2026-11',
  months: manifest.months.map(item => ({ ...item, status: item.period === '2026-11' ? 'open' : 'completed' }))
};

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

const reportMonth = {
  period: '2026-10',
  approvedPayrollSeconds: 354_180,
  sessions: [
    { id: '2026-10-26-s01', date: '2026-10-26', sessionNumber: 1, startTime: '10:00', endTime: '14:00', durationSeconds: 339_420, gmvCents: 10_124_152 },
    { id: '2026-10-27-s01', date: '2026-10-27', sessionNumber: 1, startTime: '10:35', endTime: '14:05', durationSeconds: 12_600, gmvCents: 285_907 },
    { id: '2026-10-27-s02', date: '2026-10-27', sessionNumber: 2, startTime: '14:31', endTime: '15:07', durationSeconds: 2_160, gmvCents: 95_748 }
  ],
  schedule: [
    { date: '2026-10-27', label: '10:35AM – 3:07PM', slots: [{ startTime: '10:35', endTime: '15:07' }] }
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
  const monthEvents = buildMonthEvents(novemberData);
  assert.equal(NOVEMBER_SHIFTS.length, 30);
  assert.equal(events.length, 60);
  assert.equal(monthEvents.length, 90);
  assert.equal(monthEvents.filter(event => event.type === 'motivation').length, 30);
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

test('one-hour reminder omits GMV while four-hour reminder includes it', () => {
  const shift = { date: '2026-10-29', label: '7AM – 11AM', startTime: '07:00', endTime: '11:00' };
  const progress = calculateGmvProgress(month);
  assert.match(buildReminderMessage(PILOT_EVENTS[2], shift, progress), /Current GMV/);
  const oneHour = buildReminderMessage(PILOT_EVENTS[3], shift, undefined);
  assert.doesNotMatch(oneHour, /Current GMV|Next milestone|Remaining to milestone/);
  assert.match(oneHour, /Starting in 1 hour/);
});

test('daily report matches tracker totals and excludes estimated earnings', () => {
  const report = buildDailyReport(reportMonth, '2026-10-27');
  assert.match(report, /27th October 2026/);
  assert.match(report, /Session 1[\s\S]*Start      : 10:35:00/);
  assert.match(report, /Session 2[\s\S]*Sales      : RM957.48/);
  assert.match(report, /Total Duration : 04:06:00/);
  assert.match(report, /Updated Total Sales  : RM105,058.07/);
  assert.match(report, /Total Hours          : 98:23:00/);
  assert.match(report, /Hours Remaining      : 21:37:00/);
  assert.match(report, /Commission   : RM8,000.00/);
  assert.doesNotMatch(report, /Salary|Total Earn/);
});

test('salary reply is available only on demand', () => {
  const reply = buildSalaryReply(reportMonth);
  assert.match(reply, /ESTIMATED EARNINGS/);
  assert.match(reply, /Salary      : RM1,639.73/);
  assert.match(reply, /Commission  : RM8,000.00/);
  assert.match(reply, /Total Earn  : RM9,639.73/);
});

test('schedule replies use English for days without a livestream', () => {
  assert.match(buildScheduleReply(reportMonth, '2026-10-28'), /No livestream scheduled today\./);
});

test('plain and slash bot keywords normalize to the same command', () => {
  assert.equal(normalizeCommand('salary'), 'salary');
  assert.equal(normalizeCommand('/SALARY@AdrishaBot extra'), 'salary');
});

test('target, week, month and performance insights use tracker data', () => {
  const targetMonth = {
    ...reportMonth,
    schedule: [
      ...reportMonth.schedule,
      { date: '2026-10-28', label: '11AM – 3PM', slots: [{ startTime: '11:00', endTime: '15:00' }] },
      { date: '2026-10-29', label: '7AM – 11AM', slots: [{ startTime: '07:00', endTime: '11:00' }] }
    ]
  };
  const target = buildTargetReply(targetMonth, '2026-10-28');
  assert.match(target, /GMV Remaining     : RM4,941.93/);
  assert.match(target, /Remaining Shifts  : 2/);
  assert.match(target, /Required per Shift: RM2,470.97/);

  const week = buildWeekReply(reportMonth, '2026-10-27');
  assert.match(week, /WEEKLY SUMMARY/);
  assert.match(week, /Sales       : RM105,058.07/);
  assert.match(week, /Hours       : 98:23:00/);

  const monthly = buildMonthReply(reportMonth);
  assert.match(monthly, /MONTHLY SUMMARY/);
  assert.match(monthly, /October 2026/);
  assert.match(monthly, /Sessions        : 3/);

  const performance = buildPerformanceReply(reportMonth);
  assert.match(performance, /Best Sales Day       : Monday, 26 October 2026/);
  assert.match(performance, /Best Daily Sales     : RM101,241.52/);
  assert.match(performance, /Recorded Sessions    : 3/);
});

test('weekly summary includes sessions across a month boundary', () => {
  const novemberWeekMonth = {
    period: '2026-11',
    sessions: [
      { id: '2026-11-01-s01', date: '2026-11-01', sessionNumber: 1, startTime: '12:00', endTime: '13:00', durationSeconds: 3_600, gmvCents: 50_000 }
    ],
    schedule: []
  };
  const week = buildWeekReply([reportMonth, novemberWeekMonth], '2026-11-01');
  assert.match(week, /Monday, 26 October 2026 – Sunday, 1 November 2026/);
  assert.match(week, /Sales       : RM105,558.07/);
  assert.match(week, /Hours       : 99:23:00/);
  assert.match(week, /Sessions    : 4/);
  assert.match(week, /Active Days : 3/);
});

test('status reply reports data health and the next reminder', () => {
  const reply = buildStatusReply(
    reportMonth,
    new Date('2026-10-27T12:00:00Z'),
    { date: '2026-10-27' },
    { REMINDER_STATE: {} }
  );
  assert.match(reply, /SYSTEM STATUS/);
  assert.match(reply, /Bot              : Online/);
  assert.match(reply, /Storage          : Connected/);
  assert.match(reply, /Latest Report    : Tuesday, 27 October 2026/);
  assert.match(reply, /Next Automation  : No future event scheduled/);
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
    if (url.endsWith('/data/manifest.json')) return response(novemberManifest);
    if (url.includes('/data/2026/11-november.json')) return response(novemberData);
    telegramCalls += 1;
    return response({ ok: true });
  };
  const firstEvent = buildMonthEvents(novemberData)[0];
  const now = new Date(firstEvent.utc);
  const first = await runScheduled(now, env, fetchImpl);
  const second = await runScheduled(new Date(now.getTime() + 5 * 60 * 1000), env, fetchImpl);
  assert.equal(first.sent, true);
  assert.equal(second.reason, 'already-sent');
  assert.equal(telegramCalls, 1);
  assert.ok(stored.has(eventKey(firstEvent)));
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
  const fetchImpl = async url => {
    if (url.endsWith('/data/manifest.json')) return response(novemberManifest);
    if (url.includes('/data/2026/11-november.json')) return response(novemberData);
    return response({ ok: false }, 500);
  };
  const firstEvent = buildMonthEvents(novemberData)[0];
  await assert.rejects(() => runScheduled(new Date(firstEvent.utc), env, fetchImpl), /Telegram rejected/);
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

test('Telegram commands answer only the configured chat', async () => {
  const env = { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '1707' };
  const sent = [];
  const fetchImpl = async (url, options) => {
    if (url.endsWith('/data/manifest.json')) return response(manifest);
    if (url.includes('/data/2026/10-october.json')) return response(reportMonth);
    sent.push(JSON.parse(options.body));
    return response({ ok: true });
  };
  const ignored = await handleTelegramUpdate({ message: { chat: { id: 999 }, text: 'sales' } }, env, fetchImpl);
  assert.equal(ignored.reason, 'unauthorized-chat');
  await handleTelegramUpdate({ message: { chat: { id: 1707 }, text: '/sales' } }, env, fetchImpl, new Date('2026-10-27T04:00:00Z'));
  await handleTelegramUpdate({ message: { chat: { id: 1707 }, text: '/salary' } }, env, fetchImpl, new Date('2026-10-27T04:00:00Z'));
  await handleTelegramUpdate({ message: { chat: { id: 1707 }, text: '/gaji' } }, env, fetchImpl, new Date('2026-10-27T04:00:00Z'));
  assert.equal(sent.length, 3);
  assert.match(sent[0].text, /Total GMV     : RM105,058.07/);
  assert.match(sent[1].text, /ESTIMATED EARNINGS/);
  assert.equal(sent[1].text, sent[2].text);
});

test('daily report is idempotent, data-aware and explicitly labels corrections', async () => {
  const stored = new Map();
  const messages = [];
  const env = {
    TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '1707',
    REMINDER_STATE: {
      get: async key => stored.get(key) ?? null,
      put: async (key, value) => stored.set(key, value)
    }
  };
  const fetchImpl = async (url, options) => {
    if (url.includes('raw.githubusercontent.com')) {
      if (url.endsWith('/data/manifest.json')) return response(manifest);
      if (url.includes('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb') ||
          url.includes('cccccccccccccccccccccccccccccccccccccccc')) {
        return response({
          ...reportMonth,
          sessions: reportMonth.sessions.map(session => session.id === '2026-10-27-s02'
            ? { ...session, gmvCents: 100_000 }
            : session)
        });
      }
      return response(reportMonth);
    }
    messages.push(JSON.parse(options.body).text);
    return response({ ok: true });
  };
  const first = await sendDailyReport({ period: '2026-10', date: '2026-10-27', commitSha: 'a'.repeat(40) }, env, fetchImpl);
  const duplicate = await sendDailyReport({ period: '2026-10', date: '2026-10-27', commitSha: 'a'.repeat(40) }, env, fetchImpl);
  const correction = await sendDailyReport({ period: '2026-10', date: '2026-10-27', commitSha: 'b'.repeat(40), corrected: true }, env, fetchImpl);
  const sameData = await sendDailyReport({ period: '2026-10', date: '2026-10-27', commitSha: 'c'.repeat(40) }, env, fetchImpl);
  assert.equal(first.sent, true);
  assert.equal(duplicate.reason, 'already-sent');
  assert.equal(correction.corrected, true);
  assert.equal(correction.reportType, 'corrected');
  assert.equal(sameData.reason, 'already-sent-data');
  assert.equal(messages.length, 2);
  assert.match(messages[1], /CORRECTED DAILY SALES REPORT/);
  assert.ok(stored.has('telegram-report:v1:latest'));
});

test('active month follows the production manifest without a Worker code change', async () => {
  const requested = [];
  const fetchImpl = async url => {
    requested.push(url);
    if (url.endsWith('/data/manifest.json')) return response(novemberManifest);
    if (url.includes('/data/2026/11-november.json')) return response(novemberData);
    return response({}, 404);
  };
  const loaded = await loadActiveMonth(fetchImpl);
  assert.equal(loaded.manifest.defaultPeriod, '2026-11');
  assert.equal(loaded.month.period, '2026-11');
  assert.ok(requested.some(url => url.includes('/data/2026/11-november.json')));
});

test('motivational quotes do not repeat until the full pool is exhausted', () => {
  let rawState = null;
  const indexes = [];
  for (let index = 0; index < MOTIVATIONAL_QUOTES.length; index += 1) {
    const selected = selectMotivationalQuote(rawState, () => 0);
    indexes.push(selected.index);
    rawState = JSON.stringify(selected.state);
  }
  assert.equal(new Set(indexes).size, MOTIVATIONAL_QUOTES.length);
  const next = selectMotivationalQuote(rawState, () => 0);
  assert.notEqual(next.index, indexes.at(-1));
  assert.match(buildMotivationMessage(next.quote), /LIVE START MOTIVATION/);
});

test('scheduled start sends one motivational message and stores its delivery state', async () => {
  const stored = new Map();
  const sent = [];
  const env = {
    TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '1707',
    REMINDER_STATE: {
      get: async key => stored.get(key) ?? null,
      put: async (key, value) => stored.set(key, value)
    }
  };
  const fetchImpl = async (url, options) => {
    if (url.endsWith('/data/manifest.json')) return response(novemberManifest);
    if (url.includes('/data/2026/11-november.json')) return response(novemberData);
    sent.push(JSON.parse(options.body));
    return response({ ok: true });
  };
  const motivation = buildMonthEvents(novemberData).find(event => event.type === 'motivation');
  const first = await runScheduled(new Date(motivation.utc), env, fetchImpl, () => 0);
  const second = await runScheduled(new Date(Date.parse(motivation.utc) + 5 * 60 * 1000), env, fetchImpl, () => 0);
  assert.equal(first.sent, true);
  assert.equal(second.reason, 'already-sent');
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /LIVE START MOTIVATION/);
  assert.ok(stored.has(eventKey(motivation)));
});

test('administrator chat has full commands, private diagnostics and clickable menu buttons', async () => {
  const sent = [];
  const env = {
    TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '1707', ADMIN_TELEGRAM_CHAT_ID: '9989',
    REMINDER_STATE: { get: async () => null }
  };
  const fetchImpl = async (url, options) => {
    if (url.endsWith('/data/manifest.json')) return response(manifest);
    if (url.includes('/data/2026/10-october.json')) return response(reportMonth);
    sent.push(JSON.parse(options.body));
    return response({ ok: true });
  };
  const sales = await handleTelegramUpdate(
    { message: { chat: { id: 9989 }, text: '/sales' } }, env, fetchImpl,
    new Date('2026-10-27T04:00:00Z')
  );
  const health = await handleTelegramUpdate(
    { message: { chat: { id: 9989 }, text: '/health' } }, env, fetchImpl,
    new Date('2026-10-27T04:00:00Z')
  );
  await handleTelegramUpdate({ message: { chat: { id: 9989 }, text: '/menu' } }, env, fetchImpl);
  const hostAdminAttempt = await handleTelegramUpdate(
    { message: { chat: { id: 1707 }, text: '/health' } }, env, fetchImpl
  );
  assert.equal(sales.role, 'admin');
  assert.equal(health.command, 'health');
  assert.equal(hostAdminAttempt.reason, 'admin-command-requires-admin-chat');
  assert.match(sent[0].text, /SALES & HOURS/);
  assert.match(sent[1].text, /ADMIN HEALTH/);
  assert.ok(sent[2].reply_markup.keyboard.flat().includes('/admin'));
});

test('missing-report warning alerts the administrator once after the grace period', async () => {
  const stored = new Map();
  const sent = [];
  const env = {
    TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '1707', ADMIN_TELEGRAM_CHAT_ID: '9989',
    REMINDER_STATE: {
      get: async key => stored.get(key) ?? null,
      put: async (key, value) => stored.set(key, value)
    }
  };
  const fetchImpl = async (_url, options) => {
    sent.push(JSON.parse(options.body));
    return response({ ok: true });
  };
  const now = new Date('2026-10-27T09:00:00.000Z');
  const first = await checkMissingReportWarning(reportMonth, now, env, fetchImpl);
  const second = await checkMissingReportWarning(reportMonth, now, env, fetchImpl);
  assert.equal(first.sent, true);
  assert.equal(second.sent, false);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].chat_id, '9989');
  assert.match(sent[0].text, /No Telegram sales report is recorded/);
});

test('new commission milestone sends one deduplicated celebration', async () => {
  const stored = new Map();
  const sent = [];
  const milestoneMonth = {
    period: '2026-11', approvedPayrollSeconds: 7_200, schedule: [],
    sessions: [
      { id: '2026-11-01-s01', date: '2026-11-01', durationSeconds: 3_600, gmvCents: 1_400_000 },
      { id: '2026-11-02-s01', date: '2026-11-02', durationSeconds: 3_600, gmvCents: 200_000 }
    ]
  };
  const env = {
    TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '1707',
    REMINDER_STATE: {
      get: async key => stored.get(key) ?? null,
      put: async (key, value) => stored.set(key, value)
    }
  };
  const fetchImpl = async (_url, options) => {
    sent.push(JSON.parse(options.body));
    return response({ ok: true });
  };
  const first = await sendMilestoneAlert(milestoneMonth, '2026-11-02', env, fetchImpl);
  const second = await sendMilestoneAlert(milestoneMonth, '2026-11-02', env, fetchImpl);
  assert.equal(first.sent, true);
  assert.equal(second.reason, 'already-announced');
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /MILESTONE ACHIEVED/);
  assert.match(sent[0].text, /Commission unlocked: RM100.00/);
});

test('publish workflow forwards correction intent to the report endpoint', () => {
  const workflow = readFileSync(new URL('../.github/workflows/publish-sales-update.yml', import.meta.url), 'utf8');
  assert.match(workflow, /const corrected=changes\.some\(c=>c\.operation!=='add_session'\)/);
  assert.match(workflow, /commitSha:process\.env\.COMMIT_SHA,corrected/);
});

