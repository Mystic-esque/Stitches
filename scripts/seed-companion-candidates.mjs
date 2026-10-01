import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@sanity/client';

const root = resolve(import.meta.dirname, '..');
const fixture = JSON.parse(await readFile(resolve(root, 'fixtures/companion-candidates.json'), 'utf8'));
assert.equal(fixture.fixtureStatus, 'source-linked-planning-only');
assert.equal(process.env.SANITY_PROJECT_ID, 'l4eeamth', 'Wrong Sanity project; refusing all writes.');
assert.equal(process.env.SANITY_DATASET, 'development', 'Wrong Sanity dataset; refusing all writes.');
assert.equal(fixture.documents.length, 4);
const ids = fixture.documents.map((item) => item._id);
assert.equal(new Set(ids).size, 4);
assert.deepEqual(ids, [
  'companion-source-sandy-20261001', 'companion-source-tina-20261001',
  'companion-candidate-sandy-20261001', 'companion-candidate-tina-20261001',
]);
for (const item of fixture.documents) {
  assert.equal(item.reviewStatus, 'pending');
  assert.ok(['sourceDocument', 'planningCandidate'].includes(item._type));
  if (item._type === 'sourceDocument') assert.ok(item.url.startsWith('https://freesewing.eu/docs/designs/'));
  if (item._type === 'planningCandidate') {
    assert.equal(item.source._ref, `companion-source-${item.designKey}-20261001`);
    assert.ok(item.cuttingCaveat.includes('before cutting'));
  }
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
const ownFields = (item) => Object.fromEntries(Object.entries(item).filter(([key]) => !['_rev', '_createdAt', '_updatedAt', '_originalId'].includes(key)));
const client = createClient({ projectId: 'l4eeamth', dataset: 'development', apiVersion: '2026-09-28',
  useCdn: false, perspective: 'published', token: process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN });
const existing = await client.fetch('*[_id in $ids]', { ids });
assert.ok(Array.isArray(existing));
for (const stored of existing) {
  const desired = fixture.documents.find((item) => item._id === stored._id);
  assert.ok(desired, 'Unexpected existing ID.');
  assert.deepEqual(canonical(ownFields(stored)), canonical(desired), `Existing ${stored._id} differs; refusing overwrite.`);
}
if (!process.argv.includes('--apply')) {
  console.log(`Dry run: ${ids.length} pending, plan-only records; ${existing.length} already present; only l4eeamth/development permitted.`);
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
  pendingReview: true, noPatternOrCuttingQualification: true, kbRebuildNotClaimed: true };
await writeFile(resolve(root, 'evidence/companion-candidates-sanity.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ target: report.target, count: served.length, pendingReview: true, kbRebuildNotClaimed: true }));
