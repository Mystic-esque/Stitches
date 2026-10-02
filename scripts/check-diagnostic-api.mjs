import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.STITCHES_BASE_URL ?? 'http://127.0.0.1:3100', origin = new URL(base).origin;
async function call(path, { method = 'GET', cookie, body, foreignOrigin = false } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body) { headers.Origin = foreignOrigin ? 'https://not-stitches.invalid' : origin; headers['Content-Type'] = 'application/json'; }
  const response = await fetch(new URL(path, base), { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json(), cache: response.headers.get('cache-control') };
}
const guest = await call('/api/projects'), foreign = await call('/api/projects');
const liveCatalog = await call('/api/catalog'); assert.equal(liveCatalog.status, 200);
const card = liveCatalog.data.cards.find(item => item.designKey === 'sandy');
assert.ok(card.diagnosticStudy.sourceId && card.diagnosticStudy.testId && card.diagnosticStudy.remedyId);
const created = await call('/api/projects', { method: 'POST', cookie: guest.cookie, body: { title: 'Synthetic saved scrap check', brief: 'Not a maker trial.', source: { kind: 'candidate', designId: 'sandy' }, idempotencyKey: randomUUID() } });
assert.equal(created.status, 201); const project = created.data.project, path = `/api/projects/${project.id}/diagnostics`;
let sequence = 0;
function input(event) { return { expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash,
  expectedHistorySequence: sequence, expectedDiagnosticFingerprint: card.diagnosticStudy.fingerprint, idempotencyKey: randomUUID(), event }; }
const firstInput = input({ kind: 'observation', observation: 'relaxes', detail: 'Synthetic report: scrap flattened.' });
const first = await call(path, { method: 'POST', cookie: guest.cookie, body: firstInput }); assert.equal(first.status, 201); sequence++;
const replay = await call(path, { method: 'POST', cookie: guest.cookie, body: firstInput }); assert.equal(replay.status, 200); assert.deepEqual(replay.data.record, first.data.record); assert.equal(replay.data.replayed, true);
assert.equal((await call(path, { cookie: foreign.cookie })).status, 404);
assert.equal((await call(path, { method: 'POST', cookie: foreign.cookie, body: firstInput })).status, 404);
assert.equal((await call(path, { method: 'POST', cookie: guest.cookie, body: firstInput, foreignOrigin: true })).status, 403);
assert.equal((await call(path, { method: 'POST', cookie: guest.cookie, body: { ...firstInput, idempotencyKey: randomUUID() } })).status, 409);
assert.equal((await call(path, { method: 'POST', cookie: guest.cookie, body: { ...input({ kind: 'paused', reason: 'Review source.' }), expectedDiagnosticFingerprint: '0'.repeat(64) } })).status, 409);
assert.equal((await call(path, { method: 'POST', cookie: guest.cookie, body: input({ kind: 'comparison_result', attemptId: first.data.record.id, outcome: 'helped', detail: '' }) })).status, 400);
const started = await call(path, { method: 'POST', cookie: guest.cookie, body: input({ kind: 'comparison_started', observationId: first.data.record.id }) }); assert.equal(started.status, 201); sequence++;
const result = await call(path, { method: 'POST', cookie: guest.cookie, body: input({ kind: 'comparison_result', attemptId: started.data.record.id, outcome: 'no_change', detail: 'Synthetic unsuccessful comparison; stopped.' }) }); assert.equal(result.status, 201); sequence++;
const fresh = await call(path, { method: 'POST', cookie: guest.cookie, body: input({ kind: 'observation', observation: 'relaxes', detail: '' }) }); assert.equal(fresh.status, 201); sequence++;
assert.equal((await call(path, { method: 'POST', cookie: guest.cookie, body: input({ kind: 'comparison_started', observationId: fresh.data.record.id }) })).status, 400);
const history = await call(path, { cookie: guest.cookie }); assert.equal(history.cache, 'no-store'); assert.equal(history.data.diagnostics.length, 4);
const changed = await call(`/api/projects/${project.id}`, { method: 'PATCH', cookie: guest.cookie, body: { expectedSequence: project.sequence, expectedBasisHash: project.basisHash, brief: 'Changed project basis.', idempotencyKey: randomUUID() } }); assert.equal(changed.status, 200);
assert.equal((await call(path, { method: 'POST', cookie: guest.cookie, body: input({ kind: 'paused', reason: 'Old basis.' }) })).status, 409);
assert.deepEqual((await call(path, { method: 'POST', cookie: guest.cookie, body: firstInput })).data.record, first.data.record);
const backup = { format: 'stitches-project-backup', version: 3, title: project.title, brief: project.brief, source: project.source, plan: project.plan,
  knowledgeFingerprint: project.knowledgeFingerprint, notes: [], diagnostics: history.data.diagnostics };
const restored = await call('/api/projects/import', { method: 'POST', cookie: guest.cookie, body: { backup, idempotencyKey: randomUUID() } }); assert.equal(restored.status, 201);
assert.equal(restored.data.diagnostics.length, 4); assert.ok(restored.data.diagnostics.every(item => item.imported));
assert.equal((await call(`/api/projects/${restored.data.project.id}/diagnostics`, { method: 'POST', cookie: guest.cookie, body: { ...input({ kind: 'comparison_started', observationId: fresh.data.record.id }), expectedProjectSequence: 1, expectedBasisHash: restored.data.project.basisHash } })).status, 400);
assert.equal((await call(`/api/projects/${restored.data.project.id}`, { cookie: foreign.cookie })).status, 404);
const report = { kind: 'real-local-production-api-with-live-development-catalog', checkedAt: new Date().toISOString(), base,
  cases: { separateObservationAttemptResult: true, guestAndOriginDenial: true, staleHistoryProjectSource: true, exactReplay: true,
    invalidTransitionDenied: true, failedRepeatDenied: true, historyRetained: true, untrustedV3Restore: true, noCapabilityPromotion: changed.data.project.capability === 'plan_only' },
  sourceFingerprint: card.fingerprint, diagnosticFingerprint: card.diagnosticStudy.fingerprint, limitations: ['Synthetic user reports, not physical maker evidence.', 'Pending review; sacrificial sample only.'] };
await writeFile(resolve(import.meta.dirname, '../evidence/diagnostic-api-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
