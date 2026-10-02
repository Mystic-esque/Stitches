import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { draftSandy, engineIdentity } from './draft.mjs';
import { mapStraightSandy } from './mapping.mjs';

// Explain measured discrepancies, without approving a notch mate or changing vendor geometry/counts.
assert.equal(engineIdentity.designVersion, '4.10.2');
const samples = [
  { waist: 720, hips: 960, waistToFloor: 1000, waistToHips: 200 },
  { waist: 880, hips: 1100, waistToFloor: 1080, waistToHips: 220 },
];
const rows = samples.map(measurements => {
  const input = { measurements, lengthRatio: .55, seamAllowanceMm: 10, waistbandShape: 'straight' };
  const artifact = draftSandy(input), mapped = mapStraightSandy(artifact);
  const band = artifact.parts.find(p => p.id === 'sandy.waistband');
  const notch = band.points.centerNotch, overlapMm = artifact.measuredJoin.overlapMm;
  assert.equal(notch.x, -overlapMm / 2);
  const comparison = mapped.notchComparison;
  // Numerical reconstruction of the pinned engine formula, not a sewing tolerance.
  assert.ok(Math.abs(comparison.differenceMm - overlapMm / 2) < .002);
  assert.equal(comparison.approvedPair, false);
  const curved = draftSandy({ ...input, waistbandShape: 'curved' });
  assert.equal(curved.curvedCutCountConflict.engineCount, 1);
  assert.equal(curved.curvedCutCountConflict.publishedPlanningCount, 2);
  return { waistMm: measurements.waist, overlapMm, engineCenterNotchXmm: notch.x,
    measuredCandidateDifferenceMm: comparison.differenceMm,
    reconstructedOverlapHalfMm: overlapMm / 2,
    approvedCounterpart: false, curvedEngineFabricCount: 1, currentDocumentationImpliedCurvedPieces: 2 };
});
const sourceHashes = {};
for (const file of ['straight-waistband.mjs', 'curved-waistband.mjs']) {
  sourceHashes[file] = createHash('sha256').update(await readFile(resolve(import.meta.dirname,
    `node_modules/@freesewing/sandy/src/${file}`))).digest('hex');
}
const report = { checkedAt: new Date().toISOString(), engineIdentity,
  provenance: 'actual-pinned-engine-and-independent-numeric-reconstruction', sourceHashes, samples: rows,
  findings: {
    notchOffsetOrigin: 'The pinned engine places centerNotch at minus half the overlap, not at x=0. The measured candidate mismatch follows that formula; it is not measurement-dependent unexplained drift.',
    notchMeaning: 'Published instructions do not assign this center mark to the proposed skirt-fold midpoint. Counterpart/orientation remains unqualified; no shifting, trimming or recutting is authorized.',
    curvedCount: 'Pinned code sets fabric cut count to one; current instructions refer to an interfaced curved part and a second non-interfaced part. Source/version discrepancy remains open; curved output stays excluded.',
  }, officialReferences: ['https://freesewing.eu/docs/designs/sandy/instructions/',
    'https://freesewing.eu/docs/designs/sandy/options/'], officialPagesCheckedAt: '2026-10-02',
  geometryChanged: false, sanityWrites: 0, counterpartApproved: false, cutReady: false,
  next: 'Author the narrow straight-band closure/method and orientation map with reviewed evidence, then independently check allowance/layout/print and physical making. Do not approve a midpoint mate by name.' };
await writeFile(resolve(import.meta.dirname, '../../evidence/pattern-engine/conflict-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
