import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = resolve(repoRoot, 'data');

function fail(message) {
  throw new Error(message);
}

function parseCents(label, value) {
  const trimmed = value?.trim();
  if (!/^(0|[1-9]\d*)$/.test(trimmed || '')) {
    fail(`${label} must be a non-negative whole number of cents without commas or decimals.`);
  }

  const cents = Number(trimmed);
  if (!Number.isSafeInteger(cents)) fail(`${label} is too large.`);
  return cents;
}

function monthFilePath(descriptor) {
  if (typeof descriptor.path !== 'string' || descriptor.path.length === 0) {
    fail('The open month has no valid data path in data/manifest.json.');
  }

  const path = resolve(dataRoot, ...descriptor.path.split('/'));
  const withinData = relative(dataRoot, path);
  if (!withinData || withinData.startsWith(`..${sep}`) || withinData === '..' || extname(path) !== '.json') {
    fail(`Unsafe monthly data path in manifest: ${descriptor.path}`);
  }
  return path;
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    fail(`Unable to read ${label}: ${error.message}`);
  }
}

const [rawSessionId, rawNewGmvCents, rawExpectedTotalCents, ...extraArgs] = process.argv.slice(2);
if (extraArgs.length > 0 || [rawSessionId, rawNewGmvCents, rawExpectedTotalCents].some(value => value === undefined)) {
  fail('Usage: node scripts/update-session-gmv.mjs <session-id> <new-gmv-cents> <expected-monthly-total-cents>');
}

const sessionId = rawSessionId.trim();
const idMatch = /^(\d{4}-\d{2})-\d{2}-s\d{2,}$/.exec(sessionId);
if (!idMatch) fail('Session ID must look like 2026-09-14-s01.');

const requestedPeriod = idMatch[1];
const newGmvCents = parseCents('New session GMV', rawNewGmvCents);
const expectedTotalCents = parseCents('Expected monthly total', rawExpectedTotalCents);
const manifestPath = resolve(dataRoot, 'manifest.json');
const manifest = await readJson(manifestPath, 'data/manifest.json');

if (manifest.defaultPeriod !== requestedPeriod) {
  fail(`Session ${sessionId} belongs to ${requestedPeriod}, but the current month is ${manifest.defaultPeriod}.`);
}

const openMonths = manifest.months.filter(item => item.period === manifest.defaultPeriod);
if (openMonths.length !== 1) {
  fail(`Expected exactly one manifest entry for current month ${manifest.defaultPeriod}; found ${openMonths.length}.`);
}

const currentDescriptor = openMonths[0];
if (currentDescriptor.status !== 'open') {
  fail(`Current month ${manifest.defaultPeriod} is not open for corrections.`);
}

const loadedMonths = [];
for (const descriptor of manifest.months) {
  const path = monthFilePath(descriptor);
  const month = await readJson(path, `data/${descriptor.path}`);
  if (!Array.isArray(month.sessions)) fail(`data/${descriptor.path} has no sessions array.`);
  loadedMonths.push({ descriptor, path, month });
}

const matches = loadedMonths.flatMap(item =>
  item.month.sessions
    .map((session, index) => ({ ...item, session, index }))
    .filter(item => item.session.id === sessionId)
);

if (matches.length === 0) fail(`Session ID ${sessionId} does not exist.`);
if (matches.length > 1) fail(`Session ID ${sessionId} is duplicated; refusing to choose one.`);

const match = matches[0];
if (match.descriptor.period !== manifest.defaultPeriod || match.path !== monthFilePath(currentDescriptor)) {
  fail(`Session ${sessionId} is not in the current open month file.`);
}
if (match.session.gmvCents === newGmvCents) {
  fail(`Session ${sessionId} already has GMV ${newGmvCents} cents; nothing to publish.`);
}

const originalMonth = match.month;
const updatedMonth = structuredClone(originalMonth);
updatedMonth.sessions[match.index].gmvCents = newGmvCents;

const resultingTotal = updatedMonth.sessions.reduce((sum, session) => sum + session.gmvCents, 0);
if (!Number.isSafeInteger(resultingTotal)) fail('The resulting monthly total is not a safe integer.');
if (resultingTotal !== expectedTotalCents) {
  fail(`Expected monthly total ${expectedTotalCents} cents, but this correction would produce ${resultingTotal} cents.`);
}

const restoredMonth = structuredClone(updatedMonth);
restoredMonth.sessions[match.index].gmvCents = originalMonth.sessions[match.index].gmvCents;
assert.deepStrictEqual(restoredMonth, originalMonth, 'Internal safeguard: more than gmvCents changed.');

const originalText = await readFile(match.path, 'utf8');
const newline = originalText.includes('\r\n') ? '\r\n' : '\n';
await writeFile(match.path, `${JSON.stringify(updatedMonth, null, 2)}${newline}`, 'utf8');

console.log(
  `Prepared ${sessionId}: ${originalMonth.sessions[match.index].gmvCents} -> ${newGmvCents} cents; `
  + `${manifest.defaultPeriod} total -> ${resultingTotal} cents.`
);
