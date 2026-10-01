import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@sanity/client';

const root = resolve(import.meta.dirname, '..');
const fixture = JSON.parse(await readFile(resolve(root, 'fixtures/companion-diagnostic.json'), 'utf8'));
assert.equal(fixture.fixtureStatus, 'source-linked-pending-review-diagnostic');
assert.equal(process.env.SANITY_PROJECT_ID, 'l4eeamth', 'Wrong project; refusing writes.');
assert.equal(process.env.SANITY_DATASET, 'development', 'Wrong dataset; refusing writes.');
const expected = [
  ['companion-source-coats-pucker-20261001', 'sourceDocument'],
  ['companion-procedure-scrap-seam-check-20261001', 'constructionProcedure'],
  ['companion-issue-tension-pucker-20261001', 'issuePattern'],
  ['companion-issue-unresolved-pucker-20261001', 'issuePattern'],
  ['companion-test-scrap-stitch-release-20261001', 'diagnosticTest'],
  ['companion-remedy-sample-lower-tension-20261001', 'remedy'],
];
assert.deepEqual(fixture.documents.map(({ _id, _type }) => [_id, _type]), expected);
for (const doc of fixture.documents) {
  assert.equal(doc.reviewStatus, 'pending');
  if (doc._type !== 'sourceDocument') assert.deepEqual(doc.sources.map(({ _ref }) => _ref), [expected[0][0]]);
  if (['constructionProcedure', 'issuePattern'].includes(doc._type))
    assert.deepEqual(doc.planningCandidates.map(({ _ref }) => _ref).sort(), [
      'companion-candidate-sandy-20261001', 'companion-candidate-tina-20261001',
    ]);
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
const ownFields = (item) => Object.fromEntries(Object.entries(item).filter(([key]) => !['_rev', '_createdAt', '_updatedAt', '_originalId'].includes(key)));
const ids = expected.map(([id]) => id);
const client = createClient({ projectId: 'l4eeamth', dataset: 'development', apiVersion: '2026-09-28',
  useCdn: false, perspective: 'published', token: process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN });
const parents = await client.fetch('*[_id in $ids]{_id,_type}', { ids: ['companion-candidate-sandy-20261001', 'companion-candidate-tina-20261001'] });
assert.deepEqual(parents.map((item) => `${item._id}:${item._type}`).sort(), [
  'companion-candidate-sandy-20261001:planningCandidate', 'companion-candidate-tina-20261001:planningCandidate',
]);
const existing = await client.fetch('*[_id in $ids]', { ids });
for (const stored of existing) {
  const desired = fixture.documents.find((item) => item._id === stored._id);
  assert.ok(desired, 'Unexpected existing ID.');
  assert.deepEqual(canonical(ownFields(stored)), canonical(desired), `Existing ${stored._id} differs; refusing overwrite.`);
}
if (!process.argv.includes('--apply')) {
  console.log(`Dry run: ${ids.length} pending-review diagnostic records; ${existing.length} already present; only l4eeamth/development permitted.`);
  process.exit(0);
}
assert.ok(process.env.SANITY_WRITE_TOKEN, 'SANITY_WRITE_TOKEN missing; refusing writes.');
const writer = client.withConfig({ token: process.env.SANITY_WRITE_TOKEN });
for (const item of fixture.documents) await writer.createIfNotExists(item);
const served = await writer.fetch('*[_id in $ids]', { ids });
assert.equal(served.length, ids.length);
for (const stored of served) {
  const desired = fixture.documents.find((item) => item._id === stored._id);
  assert.deepEqual(canonical(ownFields(stored)), canonical(desired), `Read-back mismatch for ${stored._id}.`);
}
const report = { checkedAt: new Date().toISOString(), target: 'l4eeamth/development',
  status: 'published-content-lake-only', records: served.map((item) => ({ id: item._id, type: item._type, revision: item._rev })),
  pendingReview: true, testOnScrapOnly: true, noMakerReviewOrKbRebuildClaim: true };
await writeFile(resolve(root, 'evidence/companion-diagnostic-sanity.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ target: report.target, count: served.length, pendingReview: true, noKbRebuildClaim: true }));
