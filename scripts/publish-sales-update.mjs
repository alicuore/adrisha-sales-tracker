import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = resolve(repoRoot, 'data');

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(label, value) {
  if (!isPlainObject(value)) fail(`${label} must be a JSON object.`);
}

function requireExactKeys(label, value, requiredKeys, optionalKeys = []) {
  requireObject(label, value);
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
  const missingKeys = requiredKeys.filter(key => !Object.hasOwn(value, key));
  const unknownKeys = Object.keys(value).filter(key => !allowedKeys.has(key));

  if (missingKeys.length > 0) fail(`${label} is missing: ${missingKeys.join(', ')}.`);
  if (unknownKeys.length > 0) fail(`${label} has unknown fields: ${unknownKeys.join(', ')}.`);
}

function requireString(label, value, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') fail(`${label} must be a string.`);
  if (!allowEmpty && value.length === 0) fail(`${label} must not be empty.`);
  if (value !== value.trim()) fail(`${label} must not have leading or trailing whitespace.`);
  return value;
}

function requireInteger(label, value, { positive = false } = {}) {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0)) {
    fail(`${label} must be a ${positive ? 'positive' : 'non-negative'} safe integer.`);
  }
  return value;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function requireDate(label, value) {
  requireString(label, value);
  if (!validDate(value)) fail(`${label} must be a real date in YYYY-MM-DD format.`);
  return value;
}

function requireTime(label, value) {
  requireString(label, value);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    fail(`${label} must be a valid 24-hour time in HH:MM format.`);
  }
  return value;
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

function parsePayload(rawPayload) {
  if (typeof rawPayload !== 'string' || rawPayload.trim().length === 0) {
    fail('A JSON payload is required.');
  }

  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    fail(`Payload is not valid JSON: ${error.message}`);
  }
}

function validateSession(rawSession, changeNumber, period) {
  const label = `changes[${changeNumber}].session`;
  requireExactKeys(label, rawSession, [
    'id',
    'legacyId',
    'sessionNumber',
    'date',
    'startTime',
    'endTime',
    'durationSeconds',
    'gmvCents',
    'notes'
  ]);

  const date = requireDate(`${label}.date`, rawSession.date);
  const sessionNumber = requireInteger(`${label}.sessionNumber`, rawSession.sessionNumber, { positive: true });
  const expectedId = `${date}-s${String(sessionNumber).padStart(2, '0')}`;
  const id = requireString(`${label}.id`, rawSession.id);
  if (id !== expectedId) fail(`${label}.id must be ${expectedId}.`);
  if (!date.startsWith(`${period}-`)) fail(`${label}.date must be inside the open period ${period}.`);

  return {
    id,
    legacyId: requireString(`${label}.legacyId`, rawSession.legacyId),
    date,
    sessionNumber,
    startTime: requireTime(`${label}.startTime`, rawSession.startTime),
    endTime: requireTime(`${label}.endTime`, rawSession.endTime),
    durationSeconds: requireInteger(`${label}.durationSeconds`, rawSession.durationSeconds),
    gmvCents: requireInteger(`${label}.gmvCents`, rawSession.gmvCents),
    notes: requireString(`${label}.notes`, rawSession.notes, { allowEmpty: true })
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    fail('Usage: node scripts/publish-sales-update.mjs [json-payload]');
  }

  const payload = parsePayload(args[0] ?? process.env.SALES_UPDATE_PAYLOAD);
  requireExactKeys('payload', payload, [
    'period',
    'expectedMonthlyTotalCents',
    'expectedApprovedPayrollSeconds',
    'changes'
  ]);

  const period = requireString('payload.period', payload.period);
  if (!/^\d{4}-\d{2}$/.test(period)) fail('payload.period must use YYYY-MM format.');
  const expectedTotalCents = requireInteger(
    'payload.expectedMonthlyTotalCents',
    payload.expectedMonthlyTotalCents
  );
  const expectedPayrollSeconds = requireInteger(
    'payload.expectedApprovedPayrollSeconds',
    payload.expectedApprovedPayrollSeconds
  );
  if (!Array.isArray(payload.changes) || payload.changes.length === 0) {
    fail('payload.changes must be a non-empty array.');
  }

  const manifestPath = resolve(dataRoot, 'manifest.json');
  const manifest = await readJson(manifestPath, 'data/manifest.json');
  if (manifest.defaultPeriod !== period) {
    fail(`Payload period ${period} is not the current period ${manifest.defaultPeriod}.`);
  }

  const openMonths = manifest.months.filter(item => item.period === manifest.defaultPeriod);
  if (openMonths.length !== 1) {
    fail(`Expected exactly one manifest entry for current period ${manifest.defaultPeriod}; found ${openMonths.length}.`);
  }
  const currentDescriptor = openMonths[0];
  if (currentDescriptor.status !== 'open') fail(`Current period ${period} is not open.`);

  const loadedMonths = [];
  for (const descriptor of manifest.months) {
    const path = monthFilePath(descriptor);
    const month = await readJson(path, `data/${descriptor.path}`);
    if (!Array.isArray(month.sessions)) fail(`data/${descriptor.path} has no sessions array.`);
    loadedMonths.push({ descriptor, path, month });
  }

  const currentPath = monthFilePath(currentDescriptor);
  const currentEntry = loadedMonths.find(item => item.path === currentPath);
  if (!currentEntry) fail(`Unable to load the current period file data/${currentDescriptor.path}.`);
  const originalMonth = currentEntry.month;
  requireInteger('Current approvedPayrollSeconds', originalMonth.approvedPayrollSeconds);

  const globalSessionsById = new Map();
  for (const item of loadedMonths) {
    for (let index = 0; index < item.month.sessions.length; index += 1) {
      const session = item.month.sessions[index];
      const matches = globalSessionsById.get(session.id) || [];
      matches.push({ ...item, session, index });
      globalSessionsById.set(session.id, matches);
    }
  }

  const usedLegacyIds = new Set();
  for (const [index, session] of originalMonth.sessions.entries()) {
    if (typeof session.legacyId !== 'string' || session.legacyId.length === 0) {
      fail(`Current session at index ${index} has a missing legacyId.`);
    }
    if (usedLegacyIds.has(session.legacyId)) {
      fail(`Current period already contains duplicate legacyId ${session.legacyId}.`);
    }
    usedLegacyIds.add(session.legacyId);
  }
  for (const attendance of originalMonth.attendance || []) {
    if (typeof attendance.legacyId === 'string' && attendance.legacyId.length > 0) {
      usedLegacyIds.add(attendance.legacyId);
    }
  }

  const normalizedChanges = [];
  const targetedSessionIds = new Set();
  let addedDurationSeconds = 0;

  for (let index = 0; index < payload.changes.length; index += 1) {
    const rawChange = payload.changes[index];
    const label = `changes[${index}]`;
    requireObject(label, rawChange);
    const operation = requireString(`${label}.operation`, rawChange.operation);

    if (operation === 'correct_gmv') {
      requireExactKeys(label, rawChange, ['operation', 'sessionId', 'gmvCents']);
      const sessionId = requireString(`${label}.sessionId`, rawChange.sessionId);
      if (!/^\d{4}-\d{2}-\d{2}-s\d{2,}$/.test(sessionId)) {
        fail(`${label}.sessionId must look like 2026-09-14-s01.`);
      }
      if (targetedSessionIds.has(sessionId)) fail(`Conflicting changes target session ID ${sessionId}.`);
      targetedSessionIds.add(sessionId);

      const matches = globalSessionsById.get(sessionId) || [];
      if (matches.length === 0) fail(`Session ID ${sessionId} does not exist.`);
      if (matches.length > 1) fail(`Session ID ${sessionId} is duplicated; refusing to choose one.`);
      const match = matches[0];
      if (match.path !== currentPath || match.descriptor.period !== period) {
        fail(`Session ${sessionId} is not in the current open period ${period}.`);
      }

      const gmvCents = requireInteger(`${label}.gmvCents`, rawChange.gmvCents);
      if (match.session.gmvCents === gmvCents) {
        fail(`Session ${sessionId} already has GMV ${gmvCents} cents; nothing to publish.`);
      }
      normalizedChanges.push({ operation, sessionId, gmvCents, match });
      continue;
    }

    if (operation === 'add_session') {
      requireExactKeys(label, rawChange, ['operation', 'session']);
      const session = validateSession(rawChange.session, index, period);
      if (targetedSessionIds.has(session.id)) fail(`Conflicting changes target session ID ${session.id}.`);
      targetedSessionIds.add(session.id);
      if (globalSessionsById.has(session.id)) fail(`Session ID ${session.id} already exists.`);
      if (usedLegacyIds.has(session.legacyId)) {
        fail(`legacyId ${session.legacyId} already exists in the current period or this batch.`);
      }
      usedLegacyIds.add(session.legacyId);

      const attendance = (originalMonth.attendance || []).find(item => item.date === session.date);
      if (attendance && attendance.status !== 'working') {
        fail(`Session ${session.id} conflicts with ${attendance.status} attendance on ${session.date}.`);
      }

      addedDurationSeconds += session.durationSeconds;
      if (!Number.isSafeInteger(addedDurationSeconds)) fail('Added session duration total is too large.');
      normalizedChanges.push({ operation, session });
      continue;
    }

    fail(`${label}.operation must be correct_gmv or add_session.`);
  }

  const updatedMonth = structuredClone(originalMonth);
  for (const change of normalizedChanges) {
    if (change.operation === 'correct_gmv') {
      updatedMonth.sessions[change.match.index].gmvCents = change.gmvCents;
    } else {
      updatedMonth.sessions.push(change.session);
    }
  }

  const resultingTotal = updatedMonth.sessions.reduce((sum, session) => sum + session.gmvCents, 0);
  if (!Number.isSafeInteger(resultingTotal)) fail('The resulting monthly total is not a safe integer.');
  if (resultingTotal !== expectedTotalCents) {
    fail(`Expected monthly total ${expectedTotalCents} cents, but this batch would produce ${resultingTotal} cents.`);
  }

  const resultingPayrollSeconds = originalMonth.approvedPayrollSeconds + addedDurationSeconds;
  if (!Number.isSafeInteger(resultingPayrollSeconds)) fail('The resulting approved payroll is not a safe integer.');
  if (resultingPayrollSeconds !== expectedPayrollSeconds) {
    fail(
      `Expected approved payroll ${expectedPayrollSeconds} seconds, `
      + `but this batch would produce ${resultingPayrollSeconds} seconds.`
    );
  }
  updatedMonth.approvedPayrollSeconds = resultingPayrollSeconds;

  const restoredMonth = structuredClone(updatedMonth);
  restoredMonth.approvedPayrollSeconds = originalMonth.approvedPayrollSeconds;
  const addedIds = new Set(
    normalizedChanges.filter(change => change.operation === 'add_session').map(change => change.session.id)
  );
  restoredMonth.sessions = restoredMonth.sessions.filter(session => !addedIds.has(session.id));
  for (const change of normalizedChanges) {
    if (change.operation === 'correct_gmv') {
      restoredMonth.sessions[change.match.index].gmvCents = change.match.session.gmvCents;
    }
  }
  assert.deepStrictEqual(restoredMonth, originalMonth, 'Internal safeguard: unspecified monthly data changed.');

  const originalText = await readFile(currentPath, 'utf8');
  const newline = originalText.includes('\r\n') ? '\r\n' : '\n';
  await writeFile(currentPath, `${JSON.stringify(updatedMonth, null, 2)}${newline}`, 'utf8');

  const correctionCount = normalizedChanges.filter(change => change.operation === 'correct_gmv').length;
  const additionCount = normalizedChanges.length - correctionCount;
  console.log(
    `Prepared ${period}: ${additionCount} addition(s), ${correctionCount} correction(s); `
    + `total ${resultingTotal} cents; approved payroll ${resultingPayrollSeconds} seconds.`
  );
}

main().catch(error => {
  console.error(`Sales update rejected: ${error.message}`);
  process.exitCode = 1;
});
