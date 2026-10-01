import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const base = process.env.STITCHES_BASE_URL ?? 'http://127.0.0.1:3100';
const origin = new URL(base).origin;
const root = resolve(import.meta.dirname, '..');
async function call(path, { method = 'GET', cookie, body } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body) { headers.Origin = origin; headers['Content-Type'] = 'application/json'; }
  const response = await fetch(new URL(path, base), { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(90000) });
  return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json() };
}

const key = randomUUID();
const createBody = { title: 'Disposable local API rehearsal', brief: 'No personal information.', source: { kind: 'own_idea' }, idempotencyKey: key };
const created = await call('/api/projects', { method: 'POST', body: createBody });
assert.equal(created.status, 201);
assert.match(created.cookie ?? '', /^stitches_guest=/);
const project = created.data.project;
const own = await call(`/api/projects/${project.id}`, { cookie: created.cookie });
assert.equal(own.status, 200);
assert.equal(own.data.project.id, project.id);
assert.equal(own.data.revisions.length, 1);
const other = await call(`/api/projects/${project.id}`);
assert.equal(other.status, 404);
const change = { expectedSequence: project.sequence, expectedBasisHash: project.basisHash, idempotencyKey: randomUUID(), title: 'Rehearsal revision 2' };
const updated = await call(`/api/projects/${project.id}`, { method: 'PATCH', cookie: created.cookie, body: change });
assert.equal(updated.status, 200);
assert.equal(updated.data.project.sequence, 2);
const repeated = await call(`/api/projects/${project.id}`, { method: 'PATCH', cookie: created.cookie, body: change });
assert.equal(repeated.status, 200);
assert.equal(repeated.data.project.sequence, 2);
const stale = await call(`/api/projects/${project.id}`, { method: 'PATCH', cookie: created.cookie, body: { ...change, idempotencyKey: randomUUID() } });
assert.equal(stale.status, 409);
const final = await call(`/api/projects/${project.id}`, { cookie: created.cookie });
assert.equal(final.data.revisions.length, 2);
const report = { kind: 'local-production-api', checkedAt: new Date().toISOString(), results: { directCreate: 201, ownerRead: 200, crossGuestRead: 404, update: 200, duplicateReplay: 200, staleUpdate: 409, revisionCount: 2 }, storage: 'ignored local .data SQLite; disposable synthetic project retained', noSecretsLogged: true };
await writeFile(join(root, 'evidence', 'guest-api-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
