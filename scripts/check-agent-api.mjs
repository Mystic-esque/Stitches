import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Disposable synthetic guests. Never advance a provider request in this rehearsal.
const base = process.env.STITCHES_BASE_URL ?? 'http://127.0.0.1:3100';
const origin = new URL(base).origin;
async function call(path, { method = 'GET', cookie, body, raw, foreignOrigin = false } = {}) {
  const headers = { ...(cookie ? { Cookie: cookie } : {}) };
  if (body !== undefined || raw !== undefined) {
    headers.Origin = foreignOrigin ? 'https://not-stitches.invalid' : origin;
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(new URL(path, base), { method, headers,
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined), signal: AbortSignal.timeout(60000) });
  return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0],
    cache: response.headers.get('cache-control'), data: await response.json() };
}
const guest = await call('/api/projects'), stranger = await call('/api/projects');
assert.ok(guest.cookie && stranger.cookie && guest.cookie !== stranger.cookie);
const created = await call('/api/projects', { method: 'POST', cookie: guest.cookie,
  body: { title: 'Synthetic agent API rehearsal', brief: 'Private prose must not leave this notebook.',
    source: { kind: 'candidate', designId: 'sandy' }, idempotencyKey: randomUUID() } });
assert.equal(created.status, 201);
const project = created.data.project, path = `/api/projects/${project.id}/agent`;
const preview = await call(path, { cookie: guest.cookie });
assert.equal(preview.status, 200); assert.equal(preview.cache, 'no-store');
assert.ok(preview.data.preparation?.basis); assert.equal(preview.data.runs.length, 0);
assert.ok(!JSON.stringify(preview.data.preparation).includes(project.brief));
const input = { idempotencyKey: randomUUID(), expectedBasis: preview.data.preparation.basis,
  task: 'next_preparation', consent: { version: 'preparation-v1', sharePreparationSummary: true } };
async function rejected(body, status, options = {}) {
  const result = await call(path, { method: 'POST', cookie: guest.cookie, body, ...options });
  assert.equal(result.status, status); assert.ok(result.data.error?.requestId);
  assert.equal(result.cache, 'no-store'); return result;
}
await rejected({ ...input, consent: { ...input.consent, sharePreparationSummary: false } }, 400);
await rejected({ ...input, task: 'execute_shell' }, 400);
await rejected({ ...input, privatePrompt: project.brief }, 400);
await rejected(input, 403, { foreignOrigin: true });
await rejected({ ...input, expectedBasis: { ...input.expectedBasis, catalogFingerprint: '0'.repeat(64) } }, 409);
await rejected(undefined, 413, { raw: ' '.repeat(5000) });
const start = await call(path, { method: 'POST', cookie: guest.cookie, body: input });
assert.equal(start.status, 201); assert.equal(start.data.run.status, 'ready');
assert.equal(start.data.run.requests, 0); assert.equal(start.data.run.capability, 'plan_only');
const runPath = `${path}/${start.data.run.id}`;
const replay = await call(path, { method: 'POST', cookie: guest.cookie, body: input });
assert.equal(replay.status, 200); assert.equal(replay.data.replayed, true);
assert.equal(replay.data.run.id, start.data.run.id);
await rejected({ ...input, task: 'review_gaps' }, 409);
await rejected({ ...input, idempotencyKey: randomUUID() }, 400); // One active run per project.
assert.equal((await call(path, { cookie: stranger.cookie })).status, 404);
assert.equal((await call(runPath, { cookie: stranger.cookie })).status, 404);
assert.equal((await call(runPath, { method: 'POST', cookie: stranger.cookie, body: { action: 'advance' } })).status, 404);
assert.equal((await call(runPath, { method: 'POST', cookie: guest.cookie, body: { action: 'cancel' }, foreignOrigin: true })).status, 403);
assert.equal((await call(runPath, { method: 'POST', cookie: guest.cookie, body: { action: 'cancel', tool: 'write_project' } })).status, 400);
const stopped = await call(runPath, { method: 'POST', cookie: guest.cookie, body: { action: 'cancel' } });
assert.equal(stopped.status, 200); assert.equal(stopped.data.run.status, 'cancelled');
assert.equal((await call(runPath, { cookie: guest.cookie })).data.run.status, 'cancelled');
const next = await call(path, { method: 'POST', cookie: guest.cookie, body: { ...input, idempotencyKey: randomUUID(), task: 'review_gaps' } });
assert.equal(next.status, 201);
const changed = await call(`/api/projects/${project.id}`, { method: 'PATCH', cookie: guest.cookie,
  body: { expectedSequence: project.sequence, expectedBasisHash: project.basisHash,
    brief: 'Changed saved plan basis.', idempotencyKey: randomUUID() } });
assert.equal(changed.status, 200);
const stale = await call(`${path}/${next.data.run.id}`, { cookie: guest.cookie });
assert.equal(stale.data.run.status, 'stale'); assert.equal(stale.data.run.requests, 0);
await rejected({ ...input, idempotencyKey: randomUUID() }, 409);
const final = await call(path, { cookie: guest.cookie });
assert.equal(final.data.runs.length, 2);
for (const run of final.data.runs) {
  for (const field of ['session', 'feedback', 'pendingResponse', 'callIds', 'leaseId', 'leaseUntil', 'startedMs']) assert.equal(run[field], undefined);
  assert.equal(run.requests, 0); assert.equal(run.projectChanged, false); assert.equal(run.modelTextVerified, false);
}
const report = { kind: 'actual-local-production-agent-control-api', checkedAt: new Date().toISOString(), base,
  providerRequests: 0, sanityWrites: 0, source: 'actual-Stitches-development-Content-Lake', syntheticPrivateGuests: true,
  cases: { minimizedPreview: true, consentAndStrictTaskRequired: true, originAndGuestDenial: true,
    boundedInput: true, startReplayAndConflict: true, oneActiveRun: true, cancelPersistence: true,
    savedPlanMakesRunStale: true, staleStartDenied: true, privateProviderStateWithheld: true },
  limitations: ['No provider inference or physical making claim.', 'Independent live provider receipts cover the model integration.'] };
await writeFile(resolve(import.meta.dirname, '../evidence/agent-api-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
