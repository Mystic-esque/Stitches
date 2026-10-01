import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const base = process.env.STITCHES_BASE_URL ?? 'http://127.0.0.1:3100', origin = new URL(base).origin;
async function call(path, { method = 'GET', cookie, body, foreignOrigin = false } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body) { headers.Origin = foreignOrigin ? 'https://not-stitches.invalid' : origin; headers['Content-Type'] = 'application/json'; }
  const response = await fetch(new URL(path, base), { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json(), cache: response.headers.get('cache-control') };
}
const own = await call('/api/profile'), foreign = await call('/api/profile');
assert.equal(own.status, 200); assert.equal(own.data.profile, null); assert.equal(own.cache, 'no-store');
assert.notEqual(own.cookie, foreign.cookie);
const values = { name: 'Synthetic maker profile', experience: 'comfortable', measurementsMm: { waist: 720, chest: 900, specialist: 100.3 }, measurementsDegrees: { shoulderSlope: 14 }, equipment: ['Machine', 'Iron'] };
const request = { profile: values, expectedSequence: 0, expectedBasisHash: null, idempotencyKey: randomUUID() };
const first = await call('/api/profile', { method: 'PUT', cookie: own.cookie, body: request });
assert.equal(first.status, 200);
assert.deepEqual((await call('/api/profile', { method: 'PUT', cookie: own.cookie, body: request })).data.profile, first.data.profile);
assert.equal((await call('/api/profile', { cookie: foreign.cookie })).data.profile, null);
assert.equal((await call('/api/profile', { method: 'PUT', cookie: own.cookie, body: { ...request, idempotencyKey: randomUUID() } })).status, 409);
assert.equal((await call('/api/profile', { method: 'PUT', cookie: own.cookie, body: { ...request, profile: { ...values, name: 'Changed key' } } })).status, 409);
assert.equal((await call('/api/profile', { method: 'PUT', cookie: own.cookie, body: request, foreignOrigin: true })).status, 403);
assert.equal((await call('/api/profile', { method: 'PUT', cookie: own.cookie, body: { ...request, profile: { ...values, measurementsMm: { shoulderSlope: 140 } }, idempotencyKey: randomUUID() } })).status, 400);
const created = await call('/api/projects', { method: 'POST', cookie: own.cookie, body: { title: 'Synthetic copy rehearsal', brief: 'No personal values.', source: { kind: 'own_idea' }, idempotencyKey: randomUUID(),
  plan: { features: [], openQuestions: [], measurementsMm: { waist: 780, bust: 930 }, measurementsDegrees: { shoulderSlope: 0 }, fabric: { description: '', widthMm: null, lengthMm: null, structure: 'unknown' }, equipment: ['Iron'] } } });
assert.equal(created.status, 201);
const project = created.data.project, profile = first.data.profile;
const copy = { expectedSequence: project.sequence, expectedBasisHash: project.basisHash, profileId: profile.id, expectedProfileSequence: profile.sequence, expectedProfileBasisHash: profile.basisHash, idempotencyKey: randomUUID() };
const copied = await call(`/api/projects/${project.id}/profile`, { method: 'POST', cookie: own.cookie, body: copy });
assert.equal(copied.status, 200); assert.equal(copied.data.project.sequence, 2);
assert.deepEqual(copied.data.project.plan.measurementsMm, { waist: 780, bust: 930, chest: 900, specialist: 100.3 });
assert.equal(copied.data.project.plan.measurementsDegrees.shoulderSlope, 0);
assert.equal((await call(`/api/projects/${project.id}`, { method: 'PATCH', cookie: own.cookie, body: {
  expectedSequence: 2, expectedBasisHash: copied.data.project.basisHash, idempotencyKey: randomUUID(),
  plan: { ...copied.data.project.plan, profileBasis: { ...copied.data.project.plan.profileBasis, sequence: 99 } }
} })).status, 400);
assert.deepEqual((await call(`/api/projects/${project.id}/profile`, { method: 'POST', cookie: own.cookie, body: copy })).data.project, copied.data.project);
assert.equal((await call(`/api/projects/${project.id}/profile`, { method: 'POST', cookie: foreign.cookie, body: copy })).status, 404);
const changed = await call('/api/profile', { method: 'PUT', cookie: own.cookie, body: { ...request, expectedSequence: 1, expectedBasisHash: profile.basisHash,
  profile: { ...values, measurementsMm: { waist: 800 } }, idempotencyKey: randomUUID() } });
assert.equal(changed.status, 200);
assert.deepEqual((await call(`/api/projects/${project.id}`, { cookie: own.cookie })).data.project, copied.data.project);
const staleProfileCopy = { ...copy, expectedSequence: 2, expectedBasisHash: copied.data.project.basisHash, idempotencyKey: randomUUID() };
assert.equal((await call(`/api/projects/${project.id}/profile`, { method: 'POST', cookie: own.cookie, body: staleProfileCopy })).status, 409);
const backup = { format: 'stitches-maker-backup', version: 1, profile: values };
const importRequest = { backup, expectedSequence: 2, expectedBasisHash: changed.data.profile.basisHash, idempotencyKey: randomUUID() };
const restored = await call('/api/profile', { method: 'POST', cookie: own.cookie, body: importRequest });
assert.equal(restored.status, 200); assert.equal(restored.data.profile.sequence, 3);
assert.deepEqual((await call('/api/profile', { method: 'POST', cookie: own.cookie, body: importRequest })).data.profile, restored.data.profile);
assert.equal((await call('/api/profile', { method: 'POST', cookie: own.cookie, body: { ...importRequest, backup: { ...backup, version: 2 }, idempotencyKey: randomUUID() } })).status, 400);
assert.equal((await call('/api/profile', { cookie: own.cookie })).data.revisions.length, 3);
assert.deepEqual((await call(`/api/projects/${project.id}`, { cookie: own.cookie })).data.project, copied.data.project);
const report = { kind: 'real-local-production-api', checkedAt: new Date().toISOString(), base,
  syntheticOnly: true, ownerIsolation: true, noStore: true, crossOriginDenied: true, malformedUnitsRefused: true,
  profileSaveReplayConflictAndStale: true, projectCopyReplayAndIsolation: true, zeroAndConflictsPreserved: true,
  profileChangeLeavesProjectUnchanged: true, staleProfileCopyRefused: true, reviewedBackupImportAndReplay: true,
  immutableProfileRevisions: 3, forgedCopyProvenanceRefused: true, notVerified: ['physical fit', 'cutting', 'production multi-instance durability', 'profile deletion'] };
await writeFile(join(resolve(import.meta.dirname, '..'), 'evidence', 'maker-profile-api-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
