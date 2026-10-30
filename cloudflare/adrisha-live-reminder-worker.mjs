const TIME_ZONE = 'Asia/Kuala_Lumpur';
const STUDIO = 'TikTok Studio 1 (Main)';
const MAXIMUM_DELAY_MS = 59 * 60 * 1000;
const STATE_TTL_SECONDS = 90 * 24 * 60 * 60;
const MILESTONE_STEP_CENTS = 10_000 * 100;
const MONTHLY_HOURS_TARGET_SECONDS = 120 * 60 * 60;
const HOURLY_RATE = '16.6667';
const REPORT_STATE_TTL_SECONDS = 180 * 24 * 60 * 60;
const LATEST_REPORT_STATE_KEY = 'telegram-report:v1:latest';
const REPOSITORY = 'alicuore/adrisha-sales-tracker';
const MONTH_DATA_PATHS = Object.freeze({
  '2026-10': 'data/2026/10-october.json',
  '2026-11': 'data/2026/11-november.json'
});
const MONTH_DATA_URLS = Object.freeze({
  '2026-10': 'https://raw.githubusercontent.com/alicuore/adrisha-sales-tracker/main/data/2026/10-october.json',
  '2026-11': 'https://raw.githubusercontent.com/alicuore/adrisha-sales-tracker/main/data/2026/11-november.json'
});
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

async function loadMonth(period, fetchImpl = fetch, ref = 'main') {
  const path = MONTH_DATA_PATHS[period];
  if (!path) {
    throw new Error(`No monthly data source configured for ${period}.`);
  }
  const url = ref === 'main'
    ? MONTH_DATA_URLS[period]
    : `https://raw.githubusercontent.com/${REPOSITORY}/${encodeURIComponent(ref)}/${path}`;
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

async function sendTelegram(message, env, fetchImpl = fetch, chatId = env.TELEGRAM_CHAT_ID) {
  return telegramApi('sendMessage', { chat_id: chatId, text: message }, env, fetchImpl);
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
  const next = resolveNextEvent(now);
  const latestDate = latestSessionDate(month);
  return `\uD83D\uDFE2 SYSTEM STATUS\n\n`
    + `Bot              : Online\n`
    + `Data Period      : ${formatPeriod(month.period)}\n`
    + `Sessions Recorded: ${month.sessions.length}\n`
    + `Latest Sales Data: ${latestDate ? formatDate(latestDate) : 'Not published yet'}\n`
    + `Latest Report    : ${latestReport?.date ? formatDate(latestReport.date) : 'Not recorded yet'}\n`
    + `Storage          : ${env.REMINDER_STATE ? 'Connected' : 'Unavailable'}\n\n`
    + `Next Reminder    : ${next ? `${formatDate(next.date)} (${next.reminderHours}-hour reminder)` : 'No future reminder scheduled'}`;
}

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
  if (String(message.chat.id) !== String(env.TELEGRAM_CHAT_ID)) {
    return { handled: false, reason: 'unauthorized-chat' };
  }
  const inputCommand = normalizeCommand(message.text);
  const command = COMMAND_ALIASES[inputCommand] ?? inputCommand;
  if (!['salary', 'sales', 'schedule', 'tomorrow', 'report', 'target', 'week', 'month',
    'performance', 'status', 'menu', 'start', 'help'].includes(command)) {
    return { handled: false, reason: 'unknown-command' };
  }
  let reply = MENU_MESSAGE;
  if (!['menu', 'start', 'help'].includes(command)) {
    const today = localDate(now);
    const date = command === 'tomorrow' ? addDays(today, 1) : today;
    let reportState = null;
    if (command === 'report' || command === 'status') reportState = await latestReportState(env);
    const period = command === 'report' && reportState?.period ? reportState.period : date.slice(0, 7);
    const ref = command === 'report' && reportState?.commitSha ? reportState.commitSha : 'main';
    const month = await loadMonth(period, fetchImpl, ref);
    if (command === 'salary') reply = buildSalaryReply(month);
    else if (command === 'sales') reply = buildSalesReply(month);
    else if (command === 'schedule' || command === 'tomorrow') {
      reply = buildScheduleReply(month, date, command === 'tomorrow' ? 'Tomorrow' : 'Today');
    } else if (command === 'target') reply = buildTargetReply(month, today);
    else if (command === 'week') {
      const { start, end } = weekRange(today);
      const weekPeriods = [...new Set([start.slice(0, 7), end.slice(0, 7)])];
      const weekMonths = [month];
      for (const weekPeriod of weekPeriods) {
        if (weekPeriod !== month.period && MONTH_DATA_PATHS[weekPeriod]) {
          weekMonths.push(await loadMonth(weekPeriod, fetchImpl));
        }
      }
      reply = buildWeekReply(weekMonths, today);
    }
    else if (command === 'month') reply = buildMonthReply(month);
    else if (command === 'performance') reply = buildPerformanceReply(month);
    else if (command === 'status') reply = buildStatusReply(month, now, reportState, env);
    else {
      const reportDate = reportState?.date ?? latestSessionDate(month);
      reply = reportDate
        ? buildDailyReport(month, reportDate, reportState?.reportType ?? 'daily')
        : `\uD83D\uDCC4 LATEST DAILY SALES REPORT\n\nNo daily sales report is available yet.`;
    }
  }
  await sendTelegram(reply, env, fetchImpl, message.chat.id);
  return { handled: true, command };
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
  return { sent: true, updated: Boolean(previousState), corrected, reportType, key };
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
  const commands = await telegramApi('setMyCommands', { commands: [
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
  ] }, env, fetchImpl);
  return { webhook: webhook.ok, commands: commands.ok };
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
    return jsonResponse({
      ok: true,
      service: 'Adrisha Live Reminder',
      scheduler: 'Cloudflare Cron every 5 minutes',
      timeZone: TIME_ZONE,
      telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
      stateConfigured: Boolean(env.REMINDER_STATE),
      commandsConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET || env.ADMIN_KEY),
      reportsConfigured: Boolean(env.REPORT_KEY || env.ADMIN_KEY),
      nextEvent: resolveNextEvent(now),
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
  buildReminderEvents,
  buildReminderMessage,
  buildDailyReport,
  buildSalaryReply,
  buildSalesReply,
  buildScheduleReply,
  buildTargetReply,
  buildWeekReply,
  buildMonthReply,
  buildPerformanceReply,
  buildStatusReply,
  calculateGmvProgress,
  commissionProgress,
  eventKey,
  extractShift,
  formatDuration,
  handleTelegramUpdate,
  loadMonth,
  localDate,
  normalizeCommand,
  reportStateKey,
  reportSignature,
  resolveDueEvent,
  runScheduled,
  sendDailyReport,
  sendTelegram
};

