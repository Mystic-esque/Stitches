// Explicit, revision-guarded correction of two shared development source fields.
// Dry-run by default. The saved baseline makes an unexpected concurrent edit a refusal.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@sanity/client';
import { loadCompanionCatalog } from '../src/server/knowledge/companion-catalog.ts';

assert.equal(process.env.SANITY_PROJECT_ID, 'l4eeamth');
assert.equal(process.env.SANITY_DATASET, 'development');
assert.ok(process.env.SANITY_READ_TOKEN);
const root = resolve(import.meta.dirname, '..');
const fixture = JSON.parse(await readFile(resolve(root, 'fixtures/companion-diagnostic.json'), 'utf8'));
const corrections = [
  { id: 'companion-test-scrap-stitch-release-20261001', type: 'diagnosticTest', field: 'howToCheck',
    previous: 'Use scrap material only. Sew a short sample with the same machine, thread and settings. Carefully release both threads along a small section without pulling or damaging the fabric; compare the released and still-stitched sections.' },
  { id: 'companion-remedy-sample-lower-tension-20261001', type: 'remedy', field: 'riskNotes',
    previous: 'This is a test-sample experiment, not authorization to alter, unpick or restitch the finished garment.' },
];
const client = createClient({ projectId: 'l4eeamth', dataset: 'development', apiVersion: '2026-09-28',
  token: process.env.SANITY_READ_TOKEN, useCdn: false, perspective: 'published', timeout: 15000, maxRetries: 0 });
const ids = corrections.map(({ id }) => id);
const docs = await client.fetch('*[_id in $ids]', { ids });
assert.equal(docs.length, 2);
const pending = [];
for (const correction of corrections) {
  const doc = docs.find(({ _id }) => _id === correction.id);
  const desired = fixture.documents.find(({ _id }) => _id === correction.id);
  assert.equal(doc?._type, correction.type);
  assert.equal(doc.reviewStatus, 'pending');
  assert.deepEqual(doc.sources.map(({ _ref }) => _ref), ['companion-source-coats-pucker-20261001']);
  assert.ok(desired?.[correction.field]?.includes('not-tested'));
  assert.ok(doc[correction.field] === correction.previous || doc[correction.field] === desired[correction.field],
    'Unexpected source edit; refusing overwrite.');
  if (doc[correction.field] !== desired[correction.field]) pending.push({ ...correction, doc, desired });
}
console.log(JSON.stringify({ target: 'l4eeamth/development', dryRun: !process.argv.includes('--apply'),
  expectedRecords: 2, changes: pending.length, revisionGuards: true }));
if (!process.argv.includes('--apply') || !pending.length) process.exit(0);
assert.ok(process.env.SANITY_WRITE_TOKEN);
const beforeCatalog = await loadCompanionCatalog(client);
await writeFile(resolve(root, 'evidence/companion-diagnostic-correction-before.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), target: 'l4eeamth/development', documents: docs,
  candidateFingerprints: beforeCatalog.map(({ designKey, fingerprint }) => ({ designKey, fingerprint })),
}, null, 2) + '\n');
const writer = client.withConfig({ token: process.env.SANITY_WRITE_TOKEN });
let transaction = writer.transaction();
for (const { id, field, doc, desired } of pending) {
  transaction = transaction.patch(id, (patch) => patch.ifRevisionId(doc._rev).set({ [field]: desired[field] }));
}
await transaction.commit();
const afterDocs = await client.fetch('*[_id in $ids]', { ids });
for (const { id, field, desired } of pending) assert.equal(afterDocs.find(({ _id }) => _id === id)?.[field], desired[field]);
const afterCatalog = await loadCompanionCatalog(client);
const changed = afterCatalog.map(({ designKey, fingerprint }) => {
  const before = beforeCatalog.find((item) => item.designKey === designKey);
  assert.notEqual(fingerprint, before.fingerprint);
  return { designKey, before: before.fingerprint, after: fingerprint, changed: true };
});
const report = { checkedAt: new Date().toISOString(), target: 'l4eeamth/development',
  sourceReadBackVerified: true, records: afterDocs.map(({ _id, _rev }) => ({ id: _id, revision: _rev })),
  candidateFingerprints: changed, pendingReview: true, servedKbCorrectionNotYetVerified: true,
  actualGuestProjectRecoveryNotYetVerified: true };
await writeFile(resolve(root, 'evidence/companion-diagnostic-correction.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
