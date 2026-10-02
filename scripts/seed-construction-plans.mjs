import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { createClient } from '@sanity/client';
import { constructionRecords } from './content/construction-records.mjs';

assert.equal(process.env.SANITY_PROJECT_ID, 'l4eeamth', 'Wrong project; refusing writes.');
assert.equal(process.env.SANITY_DATASET, 'development', 'Wrong dataset; refusing writes.');
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;
const ownFields = (item) => Object.fromEntries(Object.entries(item).filter(([key]) => !['_rev', '_createdAt', '_updatedAt', '_originalId'].includes(key)));
const digest = (value) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const ids = constructionRecords.map((doc) => doc._id);
assert.equal(ids.length, 15); assert.equal(new Set(ids).size, ids.length);
for (const design of ['sandy', 'tina']) {
  const plan = constructionRecords.find((doc) => doc._id === `companion-making-${design}-v1`);
  assert.ok(plan); assert.equal(plan.sourceUrl, `https://freesewing.eu/docs/designs/${design}/instructions/`);
  const steps = plan.steps.map((ref) => constructionRecords.find((doc) => doc._id === ref._ref));
  for (const [index, step] of steps.entries()) {
    assert.ok(step); assert.equal(step._type, 'constructionStep'); assert.equal(step.ordinal, index + 1);
    assert.equal(step.plan._ref, plan._id);
    assert.ok(step.prerequisites.every((ref) => steps.slice(0, index).some((parent) => parent._id === ref._ref)));
  }
  for (const doc of [plan, ...steps]) {
    assert.equal(doc.reviewStatus, 'pending'); assert.equal(doc.source._ref, `companion-source-${design}-20261001`);
    assert.equal(doc.candidate._ref, `companion-candidate-${design}-20261001`);
  }
}
const client = createClient({ projectId: 'l4eeamth', dataset: 'development', apiVersion: '2026-09-28',
  useCdn: false, perspective: 'published', token: process.env.SANITY_READ_TOKEN, timeout: 12000, maxRetries: 0 });
const parents = await client.fetch('*[_id in $ids]{_id,_type}', { ids: ['sandy', 'tina'].flatMap((design) =>
  [`companion-source-${design}-20261001`, `companion-candidate-${design}-20261001`]) });
assert.deepEqual(parents.map((doc) => `${doc._id}:${doc._type}`).sort(), ['sandy', 'tina'].flatMap((design) =>
  [`companion-source-${design}-20261001:sourceDocument`, `companion-candidate-${design}-20261001:planningCandidate`]).sort());
const existing = await client.fetch('*[_id in $ids][0...17]', { ids });
for (const doc of existing) assert.equal(digest(ownFields(doc)), digest(constructionRecords.find((item) => item._id === doc._id)), `Existing ${doc._id} differs; refusing overwrite.`);
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ mode: 'dry-run', target: 'l4eeamth/development', newRecords: 15 - existing.length,
    graphValidated: true, pendingPhysicalReview: true, transactionContentHash: digest(constructionRecords) })); process.exit(0);
}
assert.ok(process.env.SANITY_WRITE_TOKEN, 'Write token missing.');
const writer = client.withConfig({ token: process.env.SANITY_WRITE_TOKEN });
let transaction = writer.transaction();
for (const doc of constructionRecords) transaction = transaction.createIfNotExists(doc);
await transaction.commit({ visibility: 'sync' });
const actual = await client.fetch('*[_id in $ids][0...17]', { ids });
assert.equal(actual.length, ids.length);
for (const doc of actual) assert.equal(digest(ownFields(doc)), digest(constructionRecords.find((item) => item._id === doc._id)), 'Read-back mismatch.');
await writeFile(new URL('../evidence/construction-sanity.json', import.meta.url), JSON.stringify({ checkedAt: new Date().toISOString(),
  target: 'l4eeamth/development', publishedContentLakeOnly: true, kbUpdated: false, pendingPhysicalReview: true,
  contentHash: digest(constructionRecords), records: actual.map((doc) => ({ id: doc._id, type: doc._type, revision: doc._rev })) }, null, 2) + '\n');
console.log(JSON.stringify({ target: 'l4eeamth/development', readBackVerified: actual.length, kbUpdated: false, pendingPhysicalReview: true }));
