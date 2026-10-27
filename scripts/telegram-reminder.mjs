import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TIME_ZONE = 'Asia/Kuala_Lumpur';
export const STUDIO = 'TikTok Studio 1 (Main)';
export const TEST_MESSAGE = `✅ ADRISHA LIVE REMINDER TEST

GitHub Actions is connected and ready for the 28–31 October pilot.`;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const octoberDataPath = resolve(repoRoot, 'data/2026/10-october.json');
// GitHub may start cron jobs a little late, but stale reminders must not linger.
const maximumScheduleDelayMs = 59 * 60 * 1000;

export const PILOT_EVENTS = Object.freeze([
  { utc: '2026-10-27T23:00:00.000Z', date: '2026-10-28', reminderHours: 4, schedule: '0 23 27 10 *' },
  { utc: '2026-10-28T02:00:00.000Z', date: '2026-10-28', reminderHours: 1, schedule: '0 2 28 10 *' },
  { utc: '2026-10-28T19:00:00.000Z', date: '2026-10-29', reminderHours: 4, schedule: '0 19 28-30 10 *' },
  { utc: '2026-10-28T22:00:00.000Z', date: '2026-10-29', reminderHours: 1, schedule: '0 22 28-30 10 *' },
  { utc: '2026-10-29T19:00:00.000Z', date: '2026-10-30', reminderHours: 4, schedule: '0 19 28-30 10 *' },
  { utc: '2026-10-29T22:00:00.000Z', date: '2026-10-30', reminderHours: 1, schedule: '0 22 28-30 10 *' },
  { utc: '2026-10-30T19:00:00.000Z', date: '2026-10-31', reminderHours: 4, schedule: '0 19 28-30 10 *' },
  { utc: '2026-10-30T22:00:00.000Z', date: '2026-10-31', reminderHours: 1, schedule: '0 22 28-30 10 *' }
]);

export function resolveMalaysiaDateTime(now) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('A valid Date is required.');
  }

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(now).filter(part => part.type !== 'literal').map(part => [part.type, part.value])
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

export function resolveScheduledEvent(now, schedule) {
  const malaysia = resolveMalaysiaDateTime(now);
  return PILOT_EVENTS.find(event => {
    const scheduledAt = Date.parse(event.utc);
    return event.schedule === schedule
      && event.date === malaysia.date
      && now.getTime() >= scheduledAt
      && now.getTime() <= scheduledAt + maximumScheduleDelayMs;
  }) ?? null;
}

export function resolveNextPilotEvent(now) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('A valid Date is required.');
  }
  return PILOT_EVENTS.find(event => Date.parse(event.utc) >= now.getTime()) ?? null;
}

export async function loadOctoberSchedule(path = octoberDataPath) {
  const month = JSON.parse(await readFile(path, 'utf8'));
  if (month.period !== '2026-10' || !Array.isArray(month.schedule)) {
    throw new Error('October schedule data is missing or invalid.');
  }
  return month;
}

export function extractShift(month, date) {
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
  const clockHour = hour % 12 || 12;
  return `${clockHour}:${minute} ${suffix}`;
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

export function buildReminderMessage(event, shift) {
  if (event.date !== shift.date || ![1, 4].includes(event.reminderHours)) {
    throw new Error('Reminder event and shift do not match.');
  }

  const fourHour = event.reminderHours === 4;
  const heading = fourHour ? '⏰ ADRISHA LIVE REMINDER' : '🚨 ADRISHA LIVE REMINDER';
  const closing = fourHour
    ? 'Starting in 4 hours. Please get ready and travel safely. ❤️'
    : 'Starting in 1 hour. See you soon! ❤️';

  return `${heading}

Today’s livestream:
${formatDate(shift.date)}
${STUDIO}
${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}

${closing}`;
}

export async function sendTelegram(message, { env = process.env, fetchImpl = fetch } = {}) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('Required Telegram credentials are not configured.');
  }

  let response;
  try {
    response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
  } catch {
    throw new Error('Telegram request failed before a response was received.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Telegram returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok || payload?.ok !== true) {
    throw new Error(`Telegram rejected the message (HTTP ${response.status}, ok: false).`);
  }
  return payload;
}

export async function runReminder({
  mode,
  now = new Date(),
  schedule = '',
  runAttempt = 1,
  dataPath = octoberDataPath,
  env = process.env,
  fetchImpl = fetch,
  log = console.log
}) {
  if (mode === 'send-test') {
    await sendTelegram(TEST_MESSAGE, { env, fetchImpl });
    log('Telegram test message sent successfully.');
    return { sent: true, type: 'test', message: TEST_MESSAGE };
  }

  const month = await loadOctoberSchedule(dataPath);

  if (mode === 'dry-run') {
    const event = resolveNextPilotEvent(now);
    if (!event) {
      log('Dry run: no upcoming reminder remains in the 28–31 October 2026 pilot. No message sent.');
      return { sent: false, reason: 'outside-pilot' };
    }
    const shift = extractShift(month, event.date);
    const message = buildReminderMessage(event, shift);
    log(`Dry run only — Telegram was not contacted.\n\n${message}`);
    return { sent: false, type: 'preview', event, shift, message };
  }

  if (mode === 'scheduled') {
    if (Number(runAttempt) !== 1) {
      log('Scheduled rerun suppressed to prevent a duplicate reminder. No message sent.');
      return { sent: false, reason: 'rerun' };
    }

    const event = resolveScheduledEvent(now, schedule);
    if (!event) {
      log('Outside the guarded 28–31 October 2026 pilot event window. No message sent.');
      return { sent: false, reason: 'outside-pilot' };
    }

    const shift = extractShift(month, event.date);
    const message = buildReminderMessage(event, shift);
    await sendTelegram(message, { env, fetchImpl });
    log(`Scheduled ${event.reminderHours}-hour reminder sent for ${event.date}.`);
    return { sent: true, type: 'scheduled', event, shift, message };
  }

  throw new Error(`Unsupported reminder mode: ${mode}`);
}

function readArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || value === undefined) {
      throw new Error('Arguments must be supplied as --name value pairs.');
    }
    values[flag.slice(2)] = value;
  }
  return values;
}

async function main() {
  const args = readArguments(process.argv.slice(2));
  await runReminder({
    mode: args.mode,
    schedule: args.schedule,
    runAttempt: args['run-attempt'] ?? 1
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
