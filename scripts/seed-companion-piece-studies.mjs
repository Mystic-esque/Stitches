import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@sanity/client';

const root = resolve(import.meta.dirname, '..');
const fixture = JSON.parse(await readFile(resolve(root, 'fixtures/companion-piece-studies.json'), 'utf8'));
assert.equal(fixture.fixtureStatus, 'source-linked-educational-cut-list');
assert.equal(process.env.SANITY_PROJECT_ID, 'l4eeamth', 'Wrong Sanity project; refusing all writes.');
assert.equal(process.env.SANITY_DATASET, 'development', 'Wrong Sanity dataset; refusing all writes.');
assert.equal(fixture.documents.length, 9);
const ids = fixture.documents.map((item) => item._id);
assert.equal(new Set(ids).size, ids.length);
for (const item of fixture.documents) {
  const design = item._id.includes('-sandy-') ? 'sandy' : 'tina';
  assert.equal(item._type, 'planningPiece');
  assert.equal(item.reviewStatus, 'pending');
  assert.equal(item.candidate._ref, `companion-candidate-${design}-20261001`);
  assert.equal(item.source._ref, `companion-source-${design}-20261001`);
  assert.ok(Number.isInteger(item.cutCount) && item.cutCount > 0);
  assert.ok(['none', 'single', 'double'].includes(item.fold));
  assert.ok(['main', 'interfacing'].includes(item.material));
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
const ownFields = (item) => Object.fromEntries(Object.entries(item).filter(([key]) => !['_rev', '_createdAt', '_updatedAt', '_originalId'].includes(key)));
const client = createClient({ projectId: 'l4eeamth', dataset: 'development', apiVersion: '2026-09-28',
  useCdn: false, perspective: 'published', token: process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN });
const parents = await client.fetch('*[_id in $ids]{_id,_type}', { ids: [
  'companion-source-sandy-20261001', 'companion-source-tina-20261001',
  'companion-candidate-sandy-20261001', 'companion-candidate-tina-20261001',
] });
assert.equal(parents.length, 4, 'Source and candidate records must exist before piece studies.');
assert.deepEqual(parents.map((item) => `${item._id}:${item._type}`).sort(), [
  'companion-source-sandy-20261001:sourceDocument', 'companion-source-tina-20261001:sourceDocument',
  'companion-candidate-sandy-20261001:planningCandidate', 'companion-candidate-tina-20261001:planningCandidate',
].sort(), 'Source and candidate types must match the scoped piece links.');
const existing = await client.fetch('*[_id in $ids]', { ids });
assert.ok(Array.isArray(existing));
for (const stored of existing) {
  const desired = fixture.documents.find((item) => item._id === stored._id);
  assert.ok(desired, 'Unexpected existing ID.');
  assert.deepEqual(canonical(ownFields(stored)), canonical(desired), `Existing ${stored._id} differs; refusing overwrite.`);
}
if (!process.argv.includes('--apply')) {
  console.log(`Dry run: ${ids.length} source-linked educational pieces; ${existing.length} already present; only l4eeamth/development permitted.`);
  process.exit(0);
}
assert.ok(process.env.SANITY_WRITE_TOKEN, 'SANITY_WRITE_TOKEN missing; refusing write.');
const writer = client.withConfig({ token: process.env.SANITY_WRITE_TOKEN });
for (const item of fixture.documents) await writer.createIfNotExists(item);
const served = await writer.fetch('*[_id in $ids]', { ids });
assert.equal(served.length, ids.length, 'Created records did not all appear in published Content Lake.');
for (const stored of served) {
  const desired = fixture.documents.find((item) => item._id === stored._id);
  assert.deepEqual(canonical(ownFields(stored)), canonical(desired), `Read-back mismatch for ${stored._id}.`);
}
const report = { checkedAt: new Date().toISOString(), target: 'l4eeamth/development',
  status: 'published-content-lake-only', records: served.map((item) => ({ id: item._id, type: item._type, revision: item._rev })),
  pendingReview: true, noMeasuredGeometryOrCuttingQualification: true, kbRebuildNotClaimed: true };
await writeFile(resolve(root, 'evidence/companion-piece-studies-sanity.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ target: report.target, count: served.length, pendingReview: true, kbRebuildNotClaimed: true }));
