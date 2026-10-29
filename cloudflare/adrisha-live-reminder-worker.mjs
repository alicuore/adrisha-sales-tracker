const TIME_ZONE = 'Asia/Kuala_Lumpur';
const STUDIO = 'TikTok Studio 1 (Main)';
const MAXIMUM_DELAY_MS = 59 * 60 * 1000;
const STATE_TTL_SECONDS = 90 * 24 * 60 * 60;
const MILESTONE_STEP_CENTS = 10_000 * 100;
const MONTH_DATA_URLS = Object.freeze({
  '2026-10': 'https://raw.githubusercontent.com/alicuore/adrisha-sales-tracker/main/data/2026/10-october.json',
  '2026-11': 'https://raw.githubusercontent.com/alicuore/adrisha-sales-tracker/main/data/2026/11-november.json'
});
const TEST_MESSAGE = `\u2705\uFE0F ADRISHA LIVE REMINDER TEST

Cloudflare is connected and ready for the 29\u201331 October pilot.`;

const PILOT_EVENTS = Object.freeze([
  { utc: '2026-10-27T23:00:00.000Z', date: '2026-10-28', reminderHours: 4 },
  { utc: '2026-10-28T02:00:00.000Z', date: '2026-10-28', reminderHours: 1 },
  { utc: '2026-10-28T19:00:00.000Z', date: '2026-10-29', reminderHours: 4 },
  { utc: '2026-10-28T22:00:00.000Z', date: '2026-10-29', reminderHours: 1 },
  { utc: '2026-10-29T19:00:00.000Z', date: '2026-10-30', reminderHours: 4 },
  { utc: '2026-10-29T22:00:00.000Z', date: '2026-10-30', reminderHours: 1 },
  { utc: '2026-10-30T19:00:00.000Z', date: '2026-10-31', reminderHours: 4 },
  { utc: '2026-10-30T22:00:00.000Z', date: '2026-10-31', reminderHours: 1 }
]);

const NOVEMBER_SHIFTS = Object.freeze([
  { date: '2026-11-01', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-02', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-03', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-04', startTime: '15:00', endTime: '19:00' },
  { date: '2026-11-05', startTime: '16:00', endTime: '19:00' },
  { date: '2026-11-06', startTime: '15:00', endTime: '19:00' },
  { date: '2026-11-07', startTime: '11:00', endTime: '15:00' },
  { date: '2026-11-08', startTime: '11:00', endTime: '15:00' },
  { date: '2026-11-09', startTime: '11:00', endTime: '15:00' },
  { date: '2026-11-10', startTime: '07:00', endTime: '11:00' },
  { date: '2026-11-11', startTime: '07:00', endTime: '11:00' },
  { date: '2026-11-12', startTime: '07:00', endTime: '11:00' },
  { date: '2026-11-13', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-14', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-15', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-16', startTime: '15:00', endTime: '19:00' },
  { date: '2026-11-17', startTime: '15:00', endTime: '19:00' },
  { date: '2026-11-18', startTime: '15:00', endTime: '19:00' },
  { date: '2026-11-19', startTime: '11:00', endTime: '15:00' },
  { date: '2026-11-20', startTime: '11:00', endTime: '15:00' },
  { date: '2026-11-21', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-22', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-23', startTime: '07:00', endTime: '11:00' },
  { date: '2026-11-24', startTime: '07:00', endTime: '11:00' },
  { date: '2026-11-25', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-26', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-27', startTime: '11:00', endTime: '15:00' },
  { date: '2026-11-28', startTime: '20:00', endTime: '00:00' },
  { date: '2026-11-29', startTime: '15:00', endTime: '19:00' },
  { date: '2026-11-30', startTime: '15:00', endTime: '19:00' }
]);

function buildReminderEvents(shifts) {
  return shifts.flatMap(shift => {
    const start = Date.parse(`${shift.date}T${shift.startTime}:00+08:00`);
    if (!Number.isFinite(start)) {
      throw new Error(`Invalid shift date or start time for ${shift.date}.`);
    }
    return [4, 1].map(reminderHours => ({
      utc: new Date(start - reminderHours * 60 * 60 * 1000).toISOString(),
      date: shift.date,
      reminderHours
    }));
  });
}

const REMINDER_EVENTS = Object.freeze([
  ...PILOT_EVENTS,
  ...buildReminderEvents(NOVEMBER_SHIFTS)
]);

function eventKey(event) {
  return `telegram-reminder:v1:${event.date}:${event.reminderHours}h`;
}

function resolveDueEvent(now) {
  const timestamp = now.getTime();
  return REMINDER_EVENTS.find(event => {
    const scheduledAt = Date.parse(event.utc);
    return timestamp >= scheduledAt && timestamp <= scheduledAt + MAXIMUM_DELAY_MS;
  }) ?? null;
}

function resolveNextEvent(now) {
  return REMINDER_EVENTS.find(event => Date.parse(event.utc) >= now.getTime()) ?? null;
}

async function loadMonth(period, fetchImpl = fetch) {
  const url = MONTH_DATA_URLS[period];
  if (!url) {
    throw new Error(`No monthly data source configured for ${period}.`);
  }
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`Schedule fetch failed (HTTP ${response.status}).`);
  }
  const month = await response.json();
  if (month?.period !== period || !Array.isArray(month.schedule) || !Array.isArray(month.sessions)) {
    throw new Error(`${period} monthly data is missing or invalid.`);
  }
  return month;
}

function extractShift(month, date) {
  const item = month.schedule.find(entry => entry.date === date);
  if (!item || typeof item.label !== 'string' || item.label.length === 0 || item.slots?.length !== 1) {
    throw new Error(`Expected one labelled schedule slot for ${date}.`);
  }
  const [{ startTime, endTime }] = item.slots;
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    throw new Error(`Invalid schedule time for ${date}.`);
  }
  return { date: item.date, label: item.label, startTime, endTime };
}

function formatTime(time) {
  const [hourText, minute] = time.split(':');
  const hour = Number(hourText);
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function calculateGmvProgress(month) {
  if (!Array.isArray(month?.sessions)) {
    throw new Error('Monthly sessions are missing or invalid.');
  }
  const totalGmvCents = month.sessions.reduce((total, session) => {
    if (!Number.isInteger(session?.gmvCents) || session.gmvCents < 0) {
      throw new Error(`Invalid GMV for session ${session?.id ?? 'unknown'}.`);
    }
    return total + session.gmvCents;
  }, 0);
  const nextMilestoneCents =
    (Math.floor(totalGmvCents / MILESTONE_STEP_CENTS) + 1) * MILESTONE_STEP_CENTS;
  return {
    totalGmvCents,
    nextMilestoneCents,
    remainingCents: nextMilestoneCents - totalGmvCents
  };
}

function formatGmv(cents) {
  return new Intl.NumberFormat('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

function buildReminderMessage(event, shift, progress) {
  if (event.date !== shift.date || ![1, 4].includes(event.reminderHours)) {
    throw new Error('Reminder event and shift do not match.');
  }
  if (!progress || !Number.isInteger(progress.totalGmvCents) ||
      !Number.isInteger(progress.nextMilestoneCents) || !Number.isInteger(progress.remainingCents)) {
    throw new Error('GMV milestone progress is missing or invalid.');
  }
  const fourHour = event.reminderHours === 4;
  const heading = fourHour
    ? '\u23F0 ADRISHA LIVE REMINDER'
    : '\uD83D\uDEA8 ADRISHA LIVE REMINDER';
  const closing = fourHour
    ? 'Starting in 4 hours. Please get ready and travel safely. \u2764\uFE0F'
    : 'Starting in 1 hour. See you soon! \u2764\uFE0F';
  const milestone = [
    `\uD83D\uDCC8 Current GMV: RM${formatGmv(progress.totalGmvCents)}`,
    `\uD83C\uDFAF Next milestone: RM${formatGmv(progress.nextMilestoneCents)}`,
    `\uD83D\uDD25 Remaining to milestone: RM${formatGmv(progress.remainingCents)}`
  ].join('\n');
  return `${heading}\n\nToday\u2019s livestream:\n${formatDate(shift.date)}\n${STUDIO}\n${formatTime(shift.startTime)} \u2013 ${formatTime(shift.endTime)}\n\n${milestone}\n\n${closing}`;
}

async function sendTelegram(message, env, fetchImpl = fetch) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error('Required Telegram secrets are not configured.');
  }
  const response = await fetchImpl(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message })
    }
  );
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Telegram returned invalid JSON (HTTP ${response.status}).`);
  }
  if (!response.ok || payload?.ok !== true) {
    throw new Error(`Telegram rejected the message (HTTP ${response.status}, ok: false).`);
  }
  return payload;
}

async function runScheduled(now, env, fetchImpl = fetch) {
  if (!env.REMINDER_STATE) {
    throw new Error('REMINDER_STATE KV binding is not configured.');
  }
  const event = resolveDueEvent(now);
  if (!event) {
    return { sent: false, reason: 'no-event-due' };
  }
  const key = eventKey(event);
  if (await env.REMINDER_STATE.get(key)) {
    return { sent: false, reason: 'already-sent', key };
  }
  const month = await loadMonth(event.date.slice(0, 7), fetchImpl);
  const shift = extractShift(month, event.date);
  const progress = calculateGmvProgress(month);
  const message = buildReminderMessage(event, shift, progress);
  await sendTelegram(message, env, fetchImpl);
  await env.REMINDER_STATE.put(
    key,
    JSON.stringify({ sentAt: now.toISOString(), event }),
    { expirationTtl: STATE_TTL_SECONDS }
  );
  return { sent: true, key, event };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/test') {
      if (request.method !== 'POST') {
        return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
      }
      if (!env.ADMIN_KEY || request.headers.get('authorization') !== `Bearer ${env.ADMIN_KEY}`) {
        return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
      }
      await sendTelegram(TEST_MESSAGE, env);
      return jsonResponse({ ok: true, sent: true, type: 'connectivity-test' });
    }
    if (url.pathname !== '/' && url.pathname !== '/health') {
      return jsonResponse({ ok: false, error: 'Not found' }, 404);
    }
    const now = new Date();
    return jsonResponse({
      ok: true,
      service: 'Adrisha Live Reminder',
      scheduler: 'Cloudflare Cron every 5 minutes',
      timeZone: TIME_ZONE,
      telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
      stateConfigured: Boolean(env.REMINDER_STATE),
      nextEvent: resolveNextEvent(now),
      checkedAt: now.toISOString()
    });
  },

  async scheduled(controller, env, ctx) {
    const now = new Date(controller.scheduledTime ?? Date.now());
    ctx.waitUntil(
      runScheduled(now, env).then(result => {
        console.log(JSON.stringify({ type: 'scheduled-check', at: now.toISOString(), ...result }));
      }).catch(error => {
        console.error(JSON.stringify({ type: 'scheduled-error', at: now.toISOString(), message: error.message }));
        throw error;
      })
    );
  }
};

export {
  PILOT_EVENTS,
  NOVEMBER_SHIFTS,
  REMINDER_EVENTS,
  buildReminderEvents,
  buildReminderMessage,
  calculateGmvProgress,
  eventKey,
  extractShift,
  loadMonth,
  resolveDueEvent,
  runScheduled,
  sendTelegram
};
