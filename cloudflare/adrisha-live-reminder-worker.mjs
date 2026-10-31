const TIME_ZONE = 'Asia/Kuala_Lumpur';
const STUDIO = 'TikTok Studio 1 (Main)';
const MAXIMUM_DELAY_MS = 59 * 60 * 1000;
const MISSING_REPORT_GRACE_MS = 90 * 60 * 1000;
const MISSING_REPORT_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const STATE_TTL_SECONDS = 90 * 24 * 60 * 60;
const MILESTONE_STEP_CENTS = 10_000 * 100;
const MONTHLY_HOURS_TARGET_SECONDS = 120 * 60 * 60;
const HOURLY_RATE = '16.6667';
const REPORT_STATE_TTL_SECONDS = 180 * 24 * 60 * 60;
const LATEST_REPORT_STATE_KEY = 'telegram-report:v1:latest';
const MOTIVATION_STATE_KEY = 'telegram-motivation:v1:quote-state';
const REPOSITORY = 'alicuore/adrisha-sales-tracker';
const MANIFEST_PATH = 'data/manifest.json';
const TEST_MESSAGE = `\u2705\uFE0F ADRISHA LIVE REMINDER TEST

Cloudflare is connected. Reminders, reports and bot commands are ready.`;

const COMMISSION_TIERS = Object.freeze([
  [0, 1_499_999, 0], [1_500_000, 1_999_999, 10_000],
  [2_000_000, 2_499_999, 20_000], [2_500_000, 2_999_999, 50_000],
  [3_000_000, 3_499_999, 100_000], [3_500_000, 3_999_999, 160_000],
  [4_000_000, 4_499_999, 230_000], [4_500_000, 4_999_999, 310_000],
  [5_000_000, 5_999_999, 400_000], [6_000_000, 6_999_999, 480_000],
  [7_000_000, 7_999_999, 560_000], [8_000_000, 8_999_999, 640_000],
  [9_000_000, 9_999_999, 720_000], [10_000_000, 10_999_999, 800_000]
]);

const MOTIVATIONAL_QUOTES = Object.freeze([
  'Start with confidence. Every great result begins with one focused moment.',
  'Your energy sets the room. Bring your best and let the momentum build.',
  'One session, one goal, one strong finish. You are ready for this.',
  'Show up with purpose, speak with confidence, and enjoy the journey.',
  'A calm start creates a powerful finish. Breathe, focus, and go live.',
  'Today is another chance to surprise yourself with what you can achieve.',
  'Small wins add up quickly when you give every moment your full attention.',
  'Trust your preparation. Your confidence will carry the session forward.',
  'Be present, be positive, and let your natural spark do the work.',
  'The target is built one customer and one good moment at a time.',
  'Your consistency is your advantage. Keep showing up and keep growing.',
  'Bring good energy to the screen and good results will have room to follow.',
  'Progress loves action. Start strong and let the next step reveal itself.',
  'You do not need a perfect start—just a brave and focused one.',
  'Every live session is a fresh opportunity to connect, improve, and win.',
  'Focus on serving the audience well; the numbers will follow the value.',
  'Your best tool today is the confidence you have already earned.',
  'Let each minute count, but remember to enjoy the session too.',
  'A positive voice, a clear goal, and steady effort can change the whole day.',
  'You have handled hard sessions before. This one is another chance to shine.',
  'Keep the energy warm, the message clear, and the momentum moving.',
  'Confidence grows while you act. Press start and build from there.',
  'The next milestone begins with the first hello. Make it a good one.',
  'Stay patient with the pace and persistent with the purpose.',
  'Good sessions are built through presence, not pressure. You have this.',
  'Bring your personality, trust your rhythm, and let the results unfold.',
  'Each session adds experience that no single number can measure.',
  'Strong results begin with steady focus. One moment at a time.',
  'Your audience is here for your energy. Give them something memorable.',
  'Start fresh, stay flexible, and finish proud of the effort you gave.',
  'Momentum can begin at any minute. Keep creating opportunities.',
  'You are not starting from zero—you are starting from experience.',
  'Make today’s session better through one thoughtful improvement.',
  'Keep your goal in sight and your attention on the person in front of you.',
  'A determined heart and a clear mind make a powerful team.',
  'The work you repeat becomes the strength people notice.',
  'Step into the session with gratitude, confidence, and a clear purpose.',
  'Stay steady when it is quiet and ready when the momentum arrives.',
  'Believe in the process you have built. Now give it your best energy.',
  'Finish the session knowing you gave every opportunity a real chance.'
]);

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

function buildMonthEvents(month) {
  if (!month?.period || !Array.isArray(month.schedule)) {
    throw new Error('Monthly schedule is missing or invalid.');
  }
  return month.schedule.flatMap(entry => {
    if (!entry?.date || !Array.isArray(entry.slots)) {
      throw new Error('Monthly schedule entry is missing or invalid.');
    }
    return entry.slots.flatMap((slot, slotIndex) => {
      const start = Date.parse(`${entry.date}T${slot.startTime}:00+08:00`);
      if (!Number.isFinite(start)) throw new Error(`Invalid schedule start for ${entry.date}.`);
      const common = {
        period: month.period,
        date: entry.date,
        slotIndex,
        startTime: slot.startTime,
        endTime: slot.endTime,
        endDayOffset: slot.endDayOffset ?? (slot.endTime <= slot.startTime ? 1 : 0)
      };
      return [
        { ...common, type: 'reminder', reminderHours: 4,
          utc: new Date(start - 4 * 60 * 60 * 1000).toISOString() },
        { ...common, type: 'reminder', reminderHours: 1,
          utc: new Date(start - 60 * 60 * 1000).toISOString() },
        { ...common, type: 'motivation', utc: new Date(start).toISOString() }
      ];
    });
  }).sort((a, b) => a.utc.localeCompare(b.utc) || a.type.localeCompare(b.type));
}

const REMINDER_EVENTS = Object.freeze([
  ...PILOT_EVENTS,
  ...buildReminderEvents(NOVEMBER_SHIFTS)
]);

function eventKey(event) {
  if (event.type === 'motivation') {
    return `telegram-motivation-event:v1:${event.date}:${event.slotIndex ?? 0}:${event.startTime}`;
  }
  if (Number.isInteger(event.slotIndex) && event.startTime) {
    return `telegram-reminder:v2:${event.date}:${event.slotIndex}:${event.startTime}:${event.reminderHours}h`;
  }
  return `telegram-reminder:v1:${event.date}:${event.reminderHours}h`;
}

function resolveDueEvent(now, events = REMINDER_EVENTS) {
  const timestamp = now.getTime();
  return events.find(event => {
    const scheduledAt = Date.parse(event.utc);
    return timestamp >= scheduledAt && timestamp <= scheduledAt + MAXIMUM_DELAY_MS;
  }) ?? null;
}

function resolveDueEvents(now, events) {
  const timestamp = now.getTime();
  return events.filter(event => {
    const scheduledAt = Date.parse(event.utc);
    return timestamp >= scheduledAt && timestamp <= scheduledAt + MAXIMUM_DELAY_MS;
  });
}

function resolveNextEvent(now, events = REMINDER_EVENTS) {
  return events.find(event => Date.parse(event.utc) >= now.getTime()) ?? null;
}

function rawUrl(path, ref = 'main') {
  return `https://raw.githubusercontent.com/${REPOSITORY}/${encodeURIComponent(ref)}/${path}`;
}

async function loadManifest(fetchImpl = fetch, ref = 'main') {
  const response = await fetchImpl(rawUrl(MANIFEST_PATH, ref), {
    headers: { accept: 'application/json' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Manifest fetch failed (HTTP ${response.status}).`);
  const manifest = await response.json();
  if (!/^\d{4}-\d{2}$/.test(manifest?.defaultPeriod) || !Array.isArray(manifest.months)) {
    throw new Error('Production manifest is missing or invalid.');
  }
  return manifest;
}

async function loadMonth(period, fetchImpl = fetch, ref = 'main', suppliedManifest = null) {
  const manifest = suppliedManifest ?? await loadManifest(fetchImpl, ref);
  const descriptor = manifest.months.find(item => item.period === period);
  if (!descriptor?.path) throw new Error(`No monthly data source configured for ${period}.`);
  const path = `data/${descriptor.path}`;
  const response = await fetchImpl(rawUrl(path, ref), {
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

async function loadActiveMonth(fetchImpl = fetch, ref = 'main') {
  const manifest = await loadManifest(fetchImpl, ref);
  return { manifest, month: await loadMonth(manifest.defaultPeriod, fetchImpl, ref, manifest) };
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

function formatDuration(totalSeconds) {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0) {
    throw new Error('Duration must be a non-negative number of seconds.');
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

function salaryCents(seconds) {
  const decimals = HOURLY_RATE.split('.')[1]?.length ?? 0;
  return Math.round(seconds * Number(HOURLY_RATE.replace('.', '')) * 100 / (3600 * 10 ** decimals));
}

function commissionProgress(gmvCents) {
  const tier = COMMISSION_TIERS.find(([, max]) => gmvCents <= max);
  if (tier) {
    const [min, max, commissionCents] = tier;
    return { minGmvCents: min, maxGmvCents: max, commissionCents,
      nextTierCents: max + 1, remainingCents: max + 1 - gmvCents };
  }
  const level = Math.floor((gmvCents - 10_000_000) / 1_000_000);
  const minGmvCents = 10_000_000 + level * 1_000_000;
  const maxGmvCents = minGmvCents + 999_999;
  return { minGmvCents, maxGmvCents,
    commissionCents: 800_000 + level * 80_000,
    nextTierCents: maxGmvCents + 1, remainingCents: maxGmvCents + 1 - gmvCents };
}

function sessionsThrough(month, date = '9999-12-31') {
  return month.sessions.filter(session => session.date <= date);
}

function summarizeMonth(month, date) {
  const sessions = sessionsThrough(month, date);
  const gmvCents = sessions.reduce((sum, session) => sum + session.gmvCents, 0);
  const payrollSeconds = date
    ? sessions.reduce((sum, session) => sum + session.durationSeconds, 0)
    : month.approvedPayrollSeconds;
  const commission = commissionProgress(gmvCents);
  return {
    sessions, gmvCents, payrollSeconds, commission,
    salaryCents: salaryCents(payrollSeconds),
    hoursRemainingSeconds: Math.max(0, MONTHLY_HOURS_TARGET_SECONDS - payrollSeconds),
    hoursProgress: payrollSeconds / MONTHLY_HOURS_TARGET_SECONDS * 100
  };
}

function ordinalDate(date) {
  const day = Number(date.slice(8, 10));
  const mod100 = day % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th');
  const monthYear = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, month: 'long', year: 'numeric'
  }).format(new Date(`${date}T12:00:00.000Z`));
  return `${day}${suffix} ${monthYear}`;
}

function buildDailyReport(month, date, reportType = 'daily') {
  const dailySessions = month.sessions
    .filter(session => session.date === date)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);
  if (dailySessions.length === 0) throw new Error(`No sales sessions found for ${date}.`);
  const summary = summarizeMonth(month, date);
  const dailyGmvCents = dailySessions.reduce((sum, session) => sum + session.gmvCents, 0);
  const dailySeconds = dailySessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const previousGmvCents = summary.gmvCents - dailyGmvCents;
  const sessionBlocks = dailySessions.map((session, index) => [
    `Session ${index + 1}`,
    '',
    `Start      : ${session.startTime}:00`,
    `End        : ${session.endTime}:00`,
    `Duration   : ${formatDuration(session.durationSeconds)}`,
    `Sales      : RM${formatGmv(session.gmvCents)}`
  ].join('\n')).join('\n\n');
  const c = summary.commission;
  const titles = {
    daily: '\uD83D\uDCCA DAILY SALES REPORT',
    updated: '\uD83D\uDD04 UPDATED DAILY SALES REPORT',
    corrected: '\u270F\uFE0F CORRECTED DAILY SALES REPORT'
  };
  const title = titles[reportType];
  if (!title) throw new Error(`Unknown daily report type: ${reportType}.`);
  return `${title}\n\n${ordinalDate(date)}\n\n${sessionBlocks}\n\n`
    + `Total Duration : ${formatDuration(dailySeconds)}\nTotal Sales    : RM${formatGmv(dailyGmvCents)}\n\n`
    + `Previous Total Sales : RM${formatGmv(previousGmvCents)}\n`
    + `${Number(date.slice(8, 10))} ${new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: TIME_ZONE }).format(new Date(`${date}T12:00:00Z`))} Sales         : +RM${formatGmv(dailyGmvCents)}\n`
    + `Updated Total Sales  : RM${formatGmv(summary.gmvCents)}\n\n`
    + `Total Hours          : ${formatDuration(summary.payrollSeconds)}\n`
    + `Hours Remaining      : ${formatDuration(summary.hoursRemainingSeconds)}\n`
    + `Hours Progress       : ${summary.hoursProgress.toFixed(2)}%\n\n`
    + `Current Tier : RM${formatGmv(c.minGmvCents)} \u2013 RM${formatGmv(c.maxGmvCents)}\n`
    + `Commission   : RM${formatGmv(c.commissionCents)}\n\n`
    + `Next Tier    : RM${formatGmv(c.nextTierCents)}\n`
    + `Remaining    : RM${formatGmv(c.remainingCents)}`;
}

function buildReminderMessage(event, shift, progress) {
  if (event.date !== shift.date || ![1, 4].includes(event.reminderHours)) {
    throw new Error('Reminder event and shift do not match.');
  }
  if (event.reminderHours === 4 && (!progress || !Number.isInteger(progress.totalGmvCents) ||
      !Number.isInteger(progress.nextMilestoneCents) || !Number.isInteger(progress.remainingCents))) {
    throw new Error('GMV milestone progress is missing or invalid.');
  }
  const fourHour = event.reminderHours === 4;
  const heading = fourHour
    ? '\u23F0 ADRISHA LIVE REMINDER'
    : '\uD83D\uDEA8 ADRISHA LIVE REMINDER';
  const closing = fourHour
    ? 'Starting in 4 hours. Please get ready and travel safely. \u2764\uFE0F'
    : 'Starting in 1 hour. See you soon! \u2764\uFE0F';
  const milestone = fourHour ? [
    `\uD83D\uDCC8 Current GMV: RM${formatGmv(progress.totalGmvCents)}`,
    `\uD83C\uDFAF Next milestone: RM${formatGmv(progress.nextMilestoneCents)}`,
    `\uD83D\uDD25 Remaining to milestone: RM${formatGmv(progress.remainingCents)}`
  ].join('\n') : '';
  const middle = milestone ? `\n\n${milestone}` : '';
  return `${heading}\n\nToday\u2019s livestream:\n${formatDate(shift.date)}\n${STUDIO}\n${formatTime(shift.startTime)} \u2013 ${formatTime(shift.endTime)}${middle}\n\n${closing}`;
}

async function telegramApi(method, body, env, fetchImpl = fetch) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error('Required Telegram secrets are not configured.');
  }
  const response = await fetchImpl(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
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

async function sendTelegram(message, env, fetchImpl = fetch, chatId = env.TELEGRAM_CHAT_ID, extra = {}) {
  return telegramApi('sendMessage', { chat_id: chatId, text: message, ...extra }, env, fetchImpl);
}

function buildMotivationMessage(quote) {
  return `\u2728 LIVE START MOTIVATION\n\n${quote}\n\nYou\u2019ve got this, Adrisha! \u2764\uFE0F`;
}

function selectMotivationalQuote(rawState = null, random = Math.random) {
  let state = { used: [], lastIndex: null, cycle: 1 };
  if (rawState) {
    try {
      const parsed = typeof rawState === 'string' ? JSON.parse(rawState) : rawState;
      if (Array.isArray(parsed?.used)) state = { ...state, ...parsed };
    } catch { /* start a fresh cycle */ }
  }
  const validUsed = [...new Set(state.used.filter(index =>
    Number.isInteger(index) && index >= 0 && index < MOTIVATIONAL_QUOTES.length))];
  let used = validUsed;
  let cycle = Number.isInteger(state.cycle) && state.cycle > 0 ? state.cycle : 1;
  if (used.length >= MOTIVATIONAL_QUOTES.length) {
    used = [];
    cycle += 1;
  }
  let available = MOTIVATIONAL_QUOTES.map((_, index) => index).filter(index => !used.includes(index));
  if (available.length > 1 && Number.isInteger(state.lastIndex)) {
    available = available.filter(index => index !== state.lastIndex);
  }
  const value = Math.min(Math.max(Number(random()), 0), 0.999999999999);
  const index = available[Math.floor(value * available.length)];
  return {
    index,
    quote: MOTIVATIONAL_QUOTES[index],
    state: { used: [...used, index], lastIndex: index, cycle }
  };
}

function scheduleEndTimestamp(entry) {
  return Math.max(...entry.slots.map(slot => {
    const offset = slot.endDayOffset ?? (slot.endTime <= slot.startTime ? 1 : 0);
    return Date.parse(`${entry.date}T${slot.endTime}:00+08:00`) + offset * 24 * 60 * 60 * 1000;
  }));
}

function reportWarningKey(period, date) {
  return `telegram-report-warning:v1:${period}:${date}`;
}

async function checkMissingReportWarning(month, now, env, fetchImpl = fetch) {
  if (!env.ADMIN_TELEGRAM_CHAT_ID) return { sent: false, reason: 'admin-not-configured' };
  const nowMs = now.getTime();
  const candidates = month.schedule
    .map(entry => ({ entry, warningAt: scheduleEndTimestamp(entry) + MISSING_REPORT_GRACE_MS }))
    .filter(({ warningAt }) => nowMs >= warningAt && nowMs - warningAt <= MISSING_REPORT_LOOKBACK_MS)
    .sort((a, b) => b.warningAt - a.warningAt);
  for (const { entry } of candidates) {
    const reportKey = reportStateKey(month.period, entry.date);
    if (await env.REMINDER_STATE.get(reportKey)) continue;
    const key = reportWarningKey(month.period, entry.date);
    if (await env.REMINDER_STATE.get(key)) continue;
    const sent = await sendAdminAlert(
      `No Telegram sales report is recorded for ${formatDate(entry.date)} `
      + `90 minutes after the scheduled livestream ended. Please confirm whether the session ran `
      + `and publish or repair the report if needed.`,
      env,
      fetchImpl
    );
    if (!sent) return { sent: false, reason: 'admin-delivery-failed', key };
    await env.REMINDER_STATE.put(key, JSON.stringify({ warnedAt: now.toISOString() }), {
      expirationTtl: REPORT_STATE_TTL_SECONDS
    });
    return { sent: true, key, date: entry.date };
  }
  return { sent: false, reason: 'no-missing-report' };
}

async function runScheduled(now, env, fetchImpl = fetch, random = Math.random) {
  if (!env.REMINDER_STATE) throw new Error('REMINDER_STATE KV binding is not configured.');
  const { month } = await loadActiveMonth(fetchImpl);
  const events = buildMonthEvents(month);
  const dueEvents = resolveDueEvents(now, events);
  const delivered = [];
  let firstExistingKey = null;
  for (const event of dueEvents) {
    const key = eventKey(event);
    if (await env.REMINDER_STATE.get(key)) {
      firstExistingKey ??= key;
      continue;
    }
    if (event.type === 'motivation') {
      const rawState = await env.REMINDER_STATE.get(MOTIVATION_STATE_KEY);
      const selection = selectMotivationalQuote(rawState, random);
      await sendTelegram(buildMotivationMessage(selection.quote), env, fetchImpl);
      await env.REMINDER_STATE.put(MOTIVATION_STATE_KEY, JSON.stringify(selection.state), {
        expirationTtl: REPORT_STATE_TTL_SECONDS
      });
    } else {
      const progress = event.reminderHours === 4 ? calculateGmvProgress(month) : undefined;
      await sendTelegram(buildReminderMessage(event, event, progress), env, fetchImpl);
    }
    await env.REMINDER_STATE.put(key, JSON.stringify({ sentAt: now.toISOString(), event }), {
      expirationTtl: STATE_TTL_SECONDS
    });
    delivered.push({ key, event });
  }
  const warning = await checkMissingReportWarning(month, now, env, fetchImpl);
  if (delivered.length > 0) {
    return { sent: true, key: delivered[0].key, event: delivered[0].event,
      eventsSent: delivered.length, warning };
  }
  if (warning.sent) return { sent: true, type: 'missing-report-warning', warning };
  if (firstExistingKey) return { sent: false, reason: 'already-sent', key: firstExistingKey, warning };
  return { sent: false, reason: 'no-event-due', warning };
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDays(date, days) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function normalizeCommand(text) {
  const token = String(text ?? '').trim().toLowerCase().split(/\s+/)[0];
  return token.replace(/^\//, '').split('@')[0];
}

function buildScheduleReply(month, date, label = 'Today') {
  const item = month.schedule.find(entry => entry.date === date);
  if (!item) return `${label}: ${formatDate(date)}\n\nNo livestream scheduled ${label.toLowerCase()}.`;
  const slots = item.slots.map(slot => `${formatTime(slot.startTime)} \u2013 ${formatTime(slot.endTime)}`).join('\n');
  return `\uD83D\uDCC5 ${label.toUpperCase()}\u2019S SCHEDULE\n\n${formatDate(date)}\n${STUDIO}\n${slots}`;
}

function buildSalesReply(month) {
  const s = summarizeMonth(month);
  const c = s.commission;
  return `\uD83D\uDCCA SALES & HOURS\n\n`
    + `Total GMV     : RM${formatGmv(s.gmvCents)}\n`
    + `Total Hours   : ${formatDuration(s.payrollSeconds)}\n`
    + `Hours Progress: ${s.hoursProgress.toFixed(2)}%\n\n`
    + `Current Tier  : RM${formatGmv(c.minGmvCents)} \u2013 RM${formatGmv(c.maxGmvCents)}\n`
    + `Next Tier     : RM${formatGmv(c.nextTierCents)}\n`
    + `Remaining     : RM${formatGmv(c.remainingCents)}`;
}

function buildSalaryReply(month) {
  const s = summarizeMonth(month);
  return `\uD83D\uDCB0 ESTIMATED EARNINGS\n\n`
    + `Salary      : RM${formatGmv(s.salaryCents)}\n`
    + `Commission  : RM${formatGmv(s.commission.commissionCents)}\n\n`
    + `Total Earn  : RM${formatGmv(s.salaryCents + s.commission.commissionCents)}\n\n`
    + `Based on ${formatDuration(s.payrollSeconds)} approved hours and current GMV.`;
}

function latestSessionDate(month) {
  return month.sessions.reduce((latest, session) => session.date > latest ? session.date : latest, '');
}

function formatPeriod(period) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, month: 'long', year: 'numeric'
  }).format(new Date(`${period}-01T12:00:00.000Z`));
}

function buildTargetReply(month, today = localDate()) {
  const s = summarizeMonth(month);
  const completedDates = new Set(month.sessions.map(session => session.date));
  const remainingShifts = month.schedule.filter(entry => entry.date >= today && !completedDates.has(entry.date));
  const count = remainingShifts.length;
  const requiredPerShiftCents = count > 0 ? Math.ceil(s.commission.remainingCents / count) : null;
  return `\uD83C\uDFAF TARGET PROGRESS\n\n`
    + `Current GMV       : RM${formatGmv(s.gmvCents)}\n`
    + `Next Tier         : RM${formatGmv(s.commission.nextTierCents)}\n`
    + `GMV Remaining     : RM${formatGmv(s.commission.remainingCents)}\n\n`
    + `Remaining Shifts  : ${count}\n`
    + (requiredPerShiftCents === null
      ? 'Required per Shift: No remaining scheduled shifts'
      : `Required per Shift: RM${formatGmv(requiredPerShiftCents)}`)
    + `\nHours Remaining   : ${formatDuration(s.hoursRemainingSeconds)}`;
}

function weekRange(date) {
  const day = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  const mondayOffset = (day + 6) % 7;
  const start = addDays(date, -mondayOffset);
  return { start, end: addDays(start, 6) };
}

function buildWeekReply(monthOrMonths, today = localDate()) {
  const { start, end } = weekRange(today);
  const months = Array.isArray(monthOrMonths) ? monthOrMonths : [monthOrMonths];
  const sessions = months.flatMap(month => month.sessions)
    .filter(session => session.date >= start && session.date <= end);
  const gmvCents = sessions.reduce((sum, session) => sum + session.gmvCents, 0);
  const seconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const activeDays = new Set(sessions.map(session => session.date)).size;
  return `\uD83D\uDCC6 WEEKLY SUMMARY\n\n`
    + `${formatDate(start)} \u2013 ${formatDate(end)}\n\n`
    + `Sales       : RM${formatGmv(gmvCents)}\n`
    + `Hours       : ${formatDuration(seconds)}\n`
    + `Sessions    : ${sessions.length}\n`
    + `Active Days : ${activeDays}`;
}

function buildMonthReply(month) {
  const s = summarizeMonth(month);
  return `\uD83D\uDCC5 MONTHLY SUMMARY\n\n`
    + `${formatPeriod(month.period)}\n\n`
    + `Total GMV       : RM${formatGmv(s.gmvCents)}\n`
    + `Total Hours     : ${formatDuration(s.payrollSeconds)}\n`
    + `Sessions        : ${s.sessions.length}\n`
    + `Hours Progress  : ${s.hoursProgress.toFixed(2)}%\n\n`
    + `Current Tier    : RM${formatGmv(s.commission.minGmvCents)} \u2013 RM${formatGmv(s.commission.maxGmvCents)}\n`
    + `Commission      : RM${formatGmv(s.commission.commissionCents)}\n`
    + `Next Tier       : RM${formatGmv(s.commission.nextTierCents)}\n`
    + `GMV Remaining   : RM${formatGmv(s.commission.remainingCents)}`;
}

function buildPerformanceReply(month) {
  if (month.sessions.length === 0) return `\uD83D\uDCC8 PERFORMANCE\n\nNo sales sessions have been published for ${formatPeriod(month.period)}.`;
  const daily = new Map();
  let totalGmvCents = 0;
  let totalSeconds = 0;
  for (const session of month.sessions) {
    totalGmvCents += session.gmvCents;
    totalSeconds += session.durationSeconds;
    daily.set(session.date, (daily.get(session.date) ?? 0) + session.gmvCents);
  }
  const [bestDate, bestGmvCents] = [...daily.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const averageSessionCents = Math.round(totalGmvCents / month.sessions.length);
  const gmvPerHourCents = totalSeconds > 0 ? Math.round(totalGmvCents * 3600 / totalSeconds) : 0;
  return `\uD83D\uDCC8 PERFORMANCE\n\n`
    + `Best Sales Day       : ${formatDate(bestDate)}\n`
    + `Best Daily Sales     : RM${formatGmv(bestGmvCents)}\n`
    + `Average per Session  : RM${formatGmv(averageSessionCents)}\n`
    + `Average GMV per Hour : RM${formatGmv(gmvPerHourCents)}\n`
    + `Recorded Sessions    : ${month.sessions.length}`;
}

function buildStatusReply(month, now = new Date(), latestReport = null, env = {}) {
  const next = resolveNextEvent(now, buildMonthEvents(month));
  const latestDate = latestSessionDate(month);
  const nextLabel = next?.type === 'motivation'
    ? `${formatDate(next.date)} (start motivation)`
    : next ? `${formatDate(next.date)} (${next.reminderHours}-hour reminder)` : 'No future event scheduled';
  return `\uD83D\uDFE2 SYSTEM STATUS\n\n`
    + `Bot              : Online\n`
    + `Data Period      : ${formatPeriod(month.period)}\n`
    + `Sessions Recorded: ${month.sessions.length}\n`
    + `Latest Sales Data: ${latestDate ? formatDate(latestDate) : 'Not published yet'}\n`
    + `Latest Report    : ${latestReport?.date ? formatDate(latestReport.date) : 'Not recorded yet'}\n`
    + `Storage          : ${env.REMINDER_STATE ? 'Connected' : 'Unavailable'}\n\n`
    + `Next Automation  : ${nextLabel}`;
}

const PUBLIC_COMMANDS = Object.freeze([
  { command: 'salary', description: 'Estimated salary and commission' },
  { command: 'sales', description: 'Total GMV, hours and tier progress' },
  { command: 'schedule', description: 'Today\'s livestream schedule' },
  { command: 'tomorrow', description: 'Tomorrow\'s livestream schedule' },
  { command: 'report', description: 'Latest daily sales report' },
  { command: 'target', description: 'GMV required for the next tier' },
  { command: 'week', description: 'Current weekly summary' },
  { command: 'month', description: 'Current monthly summary' },
  { command: 'performance', description: 'Sales performance insights' },
  { command: 'status', description: 'Bot and data health' },
  { command: 'menu', description: 'Show all commands' }
]);

const ADMIN_COMMANDS = Object.freeze([
  { command: 'admin', description: 'Administrator command menu' },
  { command: 'health', description: 'Detailed production health' },
  { command: 'next', description: 'Next automated bot event' },
  { command: 'missing', description: 'Check for a missing sales report' }
]);

const MENU_MESSAGE = `\uD83E\uDD16 ADRISHA BOT MENU

/salary \u2013 estimated salary and commission
/sales \u2013 total GMV, hours and tier progress
/schedule \u2013 today\u2019s livestream schedule
/tomorrow \u2013 tomorrow\u2019s livestream schedule
/report \u2013 latest daily sales report
/target \u2013 GMV required for the next tier
/week \u2013 current weekly summary
/month \u2013 current monthly summary
/performance \u2013 sales performance insights
/status \u2013 bot and data health
/menu \u2013 show this command list

You can also type the command without /.`;

const ADMIN_MENU_MESSAGE = `${MENU_MESSAGE}\n\n\uD83D\uDD10 ADMIN COMMANDS\n\n`
  + `/admin \u2013 show administrator commands\n`
  + `/health \u2013 detailed production health\n`
  + `/next \u2013 next automated bot event\n`
  + `/missing \u2013 check for a missing sales report`;

function menuKeyboard(isAdmin = false) {
  const keyboard = [
    ['/salary', '/sales'],
    ['/schedule', '/tomorrow'],
    ['/report', '/target'],
    ['/week', '/month'],
    ['/performance', '/status'],
    ['/menu']
  ];
  if (isAdmin) keyboard.push(['/admin', '/health'], ['/next', '/missing']);
  return { keyboard, resize_keyboard: true, is_persistent: true };
}

function buildAdminHealthReply(manifest, month, now, latestReport, env) {
  const next = resolveNextEvent(now, buildMonthEvents(month));
  return `\uD83D\uDEE0 ADMIN HEALTH\n\n`
    + `Production Period : ${manifest.defaultPeriod}\n`
    + `Month Status      : ${month.status}\n`
    + `Sessions Recorded : ${month.sessions.length}\n`
    + `Host Chat         : ${env.TELEGRAM_CHAT_ID ? 'Configured' : 'Missing'}\n`
    + `Admin Chat        : ${env.ADMIN_TELEGRAM_CHAT_ID ? 'Configured' : 'Missing'}\n`
    + `KV Storage        : ${env.REMINDER_STATE ? 'Connected' : 'Unavailable'}\n`
    + `Latest Report     : ${latestReport?.date ? formatDate(latestReport.date) : 'Not recorded yet'}\n`
    + `Next Event        : ${next ? `${formatDate(next.date)} — ${next.type === 'motivation'
      ? 'start motivation' : `${next.reminderHours}-hour reminder`}` : 'None scheduled'}`;
}

function buildNextAutomationReply(month, now) {
  const next = resolveNextEvent(now, buildMonthEvents(month));
  if (!next) return '\u23ED NEXT AUTOMATION\n\nNo future automation is scheduled for the active month.';
  const label = next.type === 'motivation'
    ? 'Start-time motivational message'
    : `${next.reminderHours}-hour livestream reminder`;
  return `\u23ED NEXT AUTOMATION\n\n${label}\n${formatDate(next.date)}\n`
    + `${formatTime(next.startTime)} \u2013 ${formatTime(next.endTime)}`;
}

function buildMissingReportReply(month, now, latestReport) {
  const completed = month.schedule
    .filter(entry => scheduleEndTimestamp(entry) + MISSING_REPORT_GRACE_MS <= now.getTime())
    .sort((a, b) => b.date.localeCompare(a.date));
  if (completed.length === 0) {
    return '\uD83D\uDCC4 REPORT CHECK\n\nNo scheduled livestream has reached the report-warning window.';
  }
  const latest = completed[0];
  const recorded = latestReport?.period === month.period && latestReport?.date >= latest.date;
  return `\uD83D\uDCC4 REPORT CHECK\n\nLatest completed schedule: ${formatDate(latest.date)}\n`
    + `Report status: ${recorded ? 'Recorded' : 'Missing — please verify whether the session ran'}`;
}

const COMMAND_ALIASES = Object.freeze({
  gaji: 'salary', jadual: 'schedule', esok: 'tomorrow',
  laporan: 'report', minggu: 'week', bulan: 'month', prestasi: 'performance'
});

async function latestReportState(env) {
  if (!env.REMINDER_STATE) return null;
  const value = await env.REMINDER_STATE.get(LATEST_REPORT_STATE_KEY);
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

async function handleTelegramUpdate(update, env, fetchImpl = fetch, now = new Date()) {
  const message = update?.message;
  if (!message?.chat?.id || typeof message.text !== 'string') {
    return { handled: false, reason: 'no-text-message' };
  }
  const chatId = String(message.chat.id);
  const isHost = chatId === String(env.TELEGRAM_CHAT_ID);
  const isAdmin = Boolean(env.ADMIN_TELEGRAM_CHAT_ID) && chatId === String(env.ADMIN_TELEGRAM_CHAT_ID);
  if (!isHost && !isAdmin) {
    return { handled: false, reason: 'unauthorized-chat' };
  }
  const inputCommand = normalizeCommand(message.text);
  const command = COMMAND_ALIASES[inputCommand] ?? inputCommand;
  const publicNames = PUBLIC_COMMANDS.map(item => item.command);
  const adminNames = ADMIN_COMMANDS.map(item => item.command);
  if (![...publicNames, ...adminNames, 'start', 'help'].includes(command)) {
    return { handled: false, reason: 'unknown-command' };
  }
  if (adminNames.includes(command) && !isAdmin) {
    return { handled: false, reason: 'admin-command-requires-admin-chat' };
  }
  const menuCommand = ['menu', 'start', 'help', 'admin'].includes(command);
  if (menuCommand) {
    await sendTelegram(isAdmin ? ADMIN_MENU_MESSAGE : MENU_MESSAGE, env, fetchImpl, message.chat.id, {
      reply_markup: menuKeyboard(isAdmin)
    });
    return { handled: true, command };
  }

  const today = localDate(now);
  const date = command === 'tomorrow' ? addDays(today, 1) : today;
  const reportState = ['report', 'status', 'health', 'missing'].includes(command)
    ? await latestReportState(env) : null;
  const { manifest, month: activeMonth } = await loadActiveMonth(fetchImpl);
  let month = activeMonth;
  if (command === 'report' && reportState?.period) {
    month = await loadMonth(reportState.period, fetchImpl, reportState.commitSha ?? 'main');
  } else if (command === 'schedule' || command === 'tomorrow') {
    const datePeriod = date.slice(0, 7);
    if (manifest.months.some(item => item.period === datePeriod)) {
      month = await loadMonth(datePeriod, fetchImpl, 'main', manifest);
    }
  }

  let reply;
  if (command === 'salary') reply = buildSalaryReply(month);
  else if (command === 'sales') reply = buildSalesReply(month);
  else if (command === 'schedule' || command === 'tomorrow') {
    reply = buildScheduleReply(month, date, command === 'tomorrow' ? 'Tomorrow' : 'Today');
  } else if (command === 'target') reply = buildTargetReply(month, today);
  else if (command === 'week') {
    const { start, end } = weekRange(today);
    const weekPeriods = [...new Set([start.slice(0, 7), end.slice(0, 7)])];
    const weekMonths = [];
    for (const weekPeriod of weekPeriods) {
      if (manifest.months.some(item => item.period === weekPeriod)) {
        weekMonths.push(await loadMonth(weekPeriod, fetchImpl, 'main', manifest));
      }
    }
    reply = buildWeekReply(weekMonths.length > 0 ? weekMonths : [activeMonth], today);
  } else if (command === 'month') reply = buildMonthReply(month);
  else if (command === 'performance') reply = buildPerformanceReply(month);
  else if (command === 'status') reply = buildStatusReply(month, now, reportState, env);
  else if (command === 'health') reply = buildAdminHealthReply(manifest, activeMonth, now, reportState, env);
  else if (command === 'next') reply = buildNextAutomationReply(activeMonth, now);
  else if (command === 'missing') reply = buildMissingReportReply(activeMonth, now, reportState);
  else {
    const reportDate = reportState?.date ?? latestSessionDate(month);
    reply = reportDate
      ? buildDailyReport(month, reportDate, reportState?.reportType ?? 'daily')
      : `\uD83D\uDCC4 LATEST DAILY SALES REPORT\n\nNo daily sales report is available yet.`;
  }
  await sendTelegram(reply, env, fetchImpl, message.chat.id);
  return { handled: true, command, role: isAdmin ? 'admin' : 'host' };
}

function reportStateKey(period, date) {
  return `telegram-report:v1:${period}:${date}`;
}

function reportSignature(month, date) {
  const summary = summarizeMonth(month, date);
  const sessions = month.sessions.filter(session => session.date === date)
    .sort((a, b) => a.sessionNumber - b.sessionNumber)
    .map(({ id, startTime, endTime, durationSeconds, gmvCents }) => ({ id, startTime, endTime, durationSeconds, gmvCents }));
  return JSON.stringify({ date, sessions, gmvCents: summary.gmvCents, payrollSeconds: summary.payrollSeconds });
}

function milestoneStateKey(period, kind, value) {
  return `telegram-milestone:v1:${period}:${kind}:${value}`;
}

async function sendMilestoneAlert(month, date, env, fetchImpl = fetch) {
  const current = summarizeMonth(month, date);
  const previous = summarizeMonth(month, addDays(date, -1));
  const currentStep = Math.floor(current.gmvCents / MILESTONE_STEP_CENTS);
  const previousStep = Math.floor(previous.gmvCents / MILESTONE_STEP_CENTS);
  const reachedGmvMilestone = currentStep > previousStep ? currentStep * MILESTONE_STEP_CENTS : null;
  const reachedCommissionTier = current.commission.commissionCents > previous.commission.commissionCents
    ? current.commission.minGmvCents : null;
  const keys = [];
  if (reachedGmvMilestone) keys.push(milestoneStateKey(month.period, 'gmv', reachedGmvMilestone));
  if (reachedCommissionTier) keys.push(milestoneStateKey(month.period, 'tier', reachedCommissionTier));
  if (keys.length === 0) return { sent: false, reason: 'no-new-milestone' };
  const unsentKeys = [];
  for (const key of keys) {
    if (!await env.REMINDER_STATE.get(key)) unsentKeys.push(key);
  }
  if (unsentKeys.length === 0) return { sent: false, reason: 'already-announced' };
  const achievements = [];
  if (reachedGmvMilestone) achievements.push(`\uD83C\uDFAF RM${formatGmv(reachedGmvMilestone)} GMV milestone reached`);
  if (reachedCommissionTier) {
    achievements.push(`\uD83D\uDCB0 Commission unlocked: RM${formatGmv(current.commission.commissionCents)}`);
  }
  const message = `\uD83C\uDFC6 ADRISHA MILESTONE ACHIEVED\n\n${achievements.join('\n')}`
    + `\n\nCurrent GMV: RM${formatGmv(current.gmvCents)}`
    + `\nNext tier: RM${formatGmv(current.commission.nextTierCents)}`
    + `\nRemaining: RM${formatGmv(current.commission.remainingCents)}`
    + `\n\nAmazing effort\u2014keep the momentum going! \u2764\uFE0F`;
  await sendTelegram(message, env, fetchImpl);
  for (const key of unsentKeys) {
    await env.REMINDER_STATE.put(key, JSON.stringify({ date, sentAt: new Date().toISOString() }), {
      expirationTtl: REPORT_STATE_TTL_SECONDS
    });
  }
  return { sent: true, keys: unsentKeys };
}

async function sendDailyReport({ period, date, commitSha, corrected = false }, env, fetchImpl = fetch) {
  if (!env.REMINDER_STATE) throw new Error('REMINDER_STATE KV binding is not configured.');
  if (!/^\d{4}-\d{2}$/.test(period) || !date.startsWith(`${period}-`) ||
      !/^[0-9a-f]{40}$/i.test(commitSha) || typeof corrected !== 'boolean') {
    throw new Error('Report request must contain a valid period, date and commit SHA.');
  }
  const key = reportStateKey(period, date);
  const previous = await env.REMINDER_STATE.get(key);
  let previousState = null;
  if (previous) {
    try { previousState = JSON.parse(previous); } catch { previousState = null; }
    if (previousState?.commitSha === commitSha) return { sent: false, reason: 'already-sent', key };
  }
  const month = await loadMonth(period, fetchImpl, commitSha);
  const signature = reportSignature(month, date);
  if (previousState?.signature === signature) return { sent: false, reason: 'already-sent-data', key };
  const reportType = corrected ? 'corrected' : previousState ? 'updated' : 'daily';
  const message = buildDailyReport(month, date, reportType);
  await sendTelegram(message, env, fetchImpl);
  const state = { period, date, commitSha, signature, reportType, sentAt: new Date().toISOString() };
  await env.REMINDER_STATE.put(key, JSON.stringify(state), {
    expirationTtl: REPORT_STATE_TTL_SECONDS
  });
  await env.REMINDER_STATE.put(LATEST_REPORT_STATE_KEY, JSON.stringify(state), {
    expirationTtl: REPORT_STATE_TTL_SECONDS
  });
  let milestone;
  try {
    milestone = await sendMilestoneAlert(month, date, env, fetchImpl);
  } catch (error) {
    await sendAdminAlert(`Milestone alert delivery failed: ${error.message}`, env, fetchImpl);
    milestone = { sent: false, reason: 'delivery-failed' };
  }
  return { sent: true, updated: Boolean(previousState), corrected, reportType, key, milestone };
}

async function sendAdminAlert(message, env, fetchImpl = fetch) {
  if (!env.ADMIN_TELEGRAM_CHAT_ID) return false;
  try {
    await sendTelegram(`\u26A0\uFE0F ADRISHA BOT ALERT\n\n${message}`, env, fetchImpl, env.ADMIN_TELEGRAM_CHAT_ID);
    return true;
  } catch (error) {
    console.error(JSON.stringify({ type: 'admin-alert-error', message: error.message }));
    return false;
  }
}

async function configureTelegram(origin, env, fetchImpl = fetch) {
  const secret = env.TELEGRAM_WEBHOOK_SECRET || env.ADMIN_KEY;
  if (!secret) throw new Error('Telegram webhook secret is not configured.');
  const webhook = await telegramApi('setWebhook', {
    url: `${origin}/telegram-webhook`,
    secret_token: secret,
    allowed_updates: ['message'],
    drop_pending_updates: true
  }, env, fetchImpl);
  const commands = await telegramApi('setMyCommands', { commands: PUBLIC_COMMANDS }, env, fetchImpl);
  let adminCommands = null;
  if (env.ADMIN_TELEGRAM_CHAT_ID) {
    const admin = await telegramApi('setMyCommands', {
      commands: [...PUBLIC_COMMANDS, ...ADMIN_COMMANDS],
      scope: { type: 'chat', chat_id: env.ADMIN_TELEGRAM_CHAT_ID }
    }, env, fetchImpl);
    adminCommands = admin.ok;
  }
  return { webhook: webhook.ok, commands: commands.ok, adminCommands };
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
    if (url.pathname === '/telegram-webhook') {
      if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
      const secret = env.TELEGRAM_WEBHOOK_SECRET || env.ADMIN_KEY;
      if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
        return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
      }
      const result = await handleTelegramUpdate(await request.json(), env);
      return jsonResponse({ ok: true, ...result });
    }
    if (url.pathname === '/report') {
      if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
      const secret = env.REPORT_KEY || env.ADMIN_KEY;
      if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
        return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
      }
      try {
        const result = await sendDailyReport(await request.json(), env);
        return jsonResponse({ ok: true, ...result });
      } catch (error) {
        await sendAdminAlert(`Daily report delivery failed: ${error.message}`, env);
        return jsonResponse({ ok: false, error: error.message }, 400);
      }
    }
    if (url.pathname === '/test' || url.pathname === '/configure-telegram') {
      if (request.method !== 'POST') {
        return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
      }
      if (!env.ADMIN_KEY || request.headers.get('authorization') !== `Bearer ${env.ADMIN_KEY}`) {
        return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
      }
      if (url.pathname === '/configure-telegram') {
        return jsonResponse({ ok: true, ...(await configureTelegram(url.origin, env)) });
      }
      await sendTelegram(TEST_MESSAGE, env);
      return jsonResponse({ ok: true, sent: true, type: 'connectivity-test' });
    }
    if (url.pathname !== '/' && url.pathname !== '/health') {
      return jsonResponse({ ok: false, error: 'Not found' }, 404);
    }
    const now = new Date();
    let activePeriod = null;
    let nextEvent = null;
    let dataError = null;
    try {
      const { manifest, month } = await loadActiveMonth();
      activePeriod = manifest.defaultPeriod;
      nextEvent = resolveNextEvent(now, buildMonthEvents(month));
    } catch (error) {
      dataError = error.message;
    }
    return jsonResponse({
      ok: !dataError,
      service: 'Adrisha Live Reminder',
      scheduler: 'Cloudflare Cron every 5 minutes',
      timeZone: TIME_ZONE,
      telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
      adminConfigured: Boolean(env.ADMIN_TELEGRAM_CHAT_ID),
      stateConfigured: Boolean(env.REMINDER_STATE),
      commandsConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET || env.ADMIN_KEY),
      reportsConfigured: Boolean(env.REPORT_KEY || env.ADMIN_KEY),
      activePeriod,
      nextEvent,
      dataError,
      checkedAt: now.toISOString()
    });
  },

  async scheduled(controller, env, ctx) {
    const now = new Date(controller.scheduledTime ?? Date.now());
    ctx.waitUntil(
      runScheduled(now, env).then(result => {
        console.log(JSON.stringify({ type: 'scheduled-check', at: now.toISOString(), ...result }));
      }).catch(async error => {
        console.error(JSON.stringify({ type: 'scheduled-error', at: now.toISOString(), message: error.message }));
        await sendAdminAlert(`Scheduled reminder failed: ${error.message}`, env);
        throw error;
      })
    );
  }
};

export {
  PILOT_EVENTS,
  NOVEMBER_SHIFTS,
  REMINDER_EVENTS,
  MOTIVATIONAL_QUOTES,
  buildMonthEvents,
  buildReminderEvents,
  buildReminderMessage,
  buildMotivationMessage,
  buildDailyReport,
  buildAdminHealthReply,
  buildMissingReportReply,
  buildNextAutomationReply,
  buildSalaryReply,
  buildSalesReply,
  buildScheduleReply,
  buildTargetReply,
  buildWeekReply,
  buildMonthReply,
  buildPerformanceReply,
  buildStatusReply,
  calculateGmvProgress,
  checkMissingReportWarning,
  commissionProgress,
  eventKey,
  extractShift,
  formatDuration,
  handleTelegramUpdate,
  loadActiveMonth,
  loadManifest,
  loadMonth,
  localDate,
  normalizeCommand,
  reportStateKey,
  reportSignature,
  resolveDueEvent,
  resolveDueEvents,
  runScheduled,
  selectMotivationalQuote,
  sendDailyReport,
  sendMilestoneAlert,
  sendTelegram
};

