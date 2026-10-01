import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { draftSandy, digest, cubicLength, engineIdentity } from './draft.mjs';

const inputs = [
  { measurements: { waist: 720, hips: 960, waistToFloor: 1000, waistToHips: 200 },
    lengthRatio: 0.55, seamAllowanceMm: 10, waistbandShape: 'straight' },
  { measurements: { waist: 880, hips: 1100, waistToFloor: 1080, waistToHips: 220 },
    lengthRatio: 0.7, seamAllowanceMm: 10, waistbandShape: 'straight' },
];
assert.equal(cubicLength([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 30, y: 0 }]), 30);
const directory = resolve(import.meta.dirname, '../../evidence/pattern-engine');
await mkdir(directory, { recursive: true });
const artifacts = inputs.map(draftSandy);
const checks = [];
for (const [index, artifact] of artifacts.entries()) {
  assert.equal(digest(artifact), digest(draftSandy(inputs[index])), 'Repeat draft changed measured artifact');
  assert.ok(artifact.measuredJoin.differenceMm < 0.5, 'Independent waist join scalar comparison failed');
  assert.deepEqual(artifact.parts.map((part) => part.id), ['sandy.skirt', 'sandy.waistband']);
  for (const part of artifact.parts) {
    assert.ok(part.paths.seam.operations.length > 0 && part.paths.sa.operations.length > 0);
    assert.ok(Number.isFinite(part.cut.grain));
    assert.ok(part.markings.length > 0);
    assert.ok(part.cut.materials.fabric[0].cut > 0);
  }
  const filename = `sandy-${index + 1}-${digest(artifact).slice(0, 16)}.json`;
  await writeFile(resolve(directory, filename), JSON.stringify(artifact, null, 2) + '\n');
  checks.push({ input: inputs[index], file: `evidence/pattern-engine/${filename}`, hash: digest(artifact),
    repeatedDraftIdentical: true, join: artifact.measuredJoin, engineWarnings: artifact.warnings });
}
assert.notEqual(digest(artifacts[0]), digest(artifacts[1]), 'Different inputs did not alter geometry');
assert.equal(digest(artifacts[0]), digest(draftSandy({ waistbandShape: 'straight', seamAllowanceMm: 10,
  lengthRatio: 0.55, measurements: { waistToHips: 200, waistToFloor: 1000, hips: 960, waist: 720 } })),
  'Equivalent object ordering changed artifact identity');
assert.deepEqual(artifacts[0].parts.map((part) => Object.keys(part.paths)), artifacts[1].parts.map((part) => Object.keys(part.paths)));
assert.deepEqual(artifacts[0].parts.map((part) => part.markings.map((mark) => mark.id)),
  artifacts[1].parts.map((part) => part.markings.map((mark) => mark.id)));
const invalids = [
  { ...inputs[0], measurements: { ...inputs[0].measurements, waistToHips: 0 } },
  { ...inputs[0], lengthRatio: Number.NaN },
  { ...inputs[0], lengthRatio: 1.5 },
  { ...inputs[0], svgPath: 'M0,0' },
  { ...inputs[0], measurements: { ...inputs[0].measurements, hiddenPoint: 1 } },
];
for (const invalid of invalids) assert.throws(() => draftSandy(invalid));
const noAllowance = draftSandy({ ...inputs[0], seamAllowanceMm: 0 });
assert.ok(noAllowance.parts.every((part) => !part.paths.sa));
const curved = draftSandy({ ...inputs[0], waistbandShape: 'curved' });
assert.equal(curved.curvedCutCountConflict.engineCount, 1);
assert.equal(curved.curvedCutCountConflict.publishedPlanningCount, 2);
const inventory = await Promise.all(['core', 'sandy', 'tina', 'plugin-transform', 'config'].map(async (name) => {
  const pkg = JSON.parse(await readFile(resolve(import.meta.dirname, `node_modules/@freesewing/${name}/package.json`), 'utf8'));
  return { name: pkg.name, version: pkg.version, declaredLicense: pkg.license };
}));
const report = { checkedAt: new Date().toISOString(), provenance: 'real-local-engine-synthetic-measurements',
  node: process.version, engineIdentity, inventory, drafts: checks, distinctInputsChangedGeometry: true,
  equivalentInputOrderCanonical: true, scalarJoinResearchThresholdMm: 0.5, approvedSewingToleranceEstablished: false,
  stablePartAndPathIds: true, stableNotchIds: true, invalidInputRefusals: invalids.length, zeroAllowanceLayerAbsent: true,
  rightsEvidence: { registryGitHead: '3d290d25d0b6a65852dd31aec125c97bc8ca6e2c',
    licenseUrl: 'https://codeberg.org/freesewing/freesewing/raw/commit/3d290d25d0b6a65852dd31aec125c97bc8ca6e2c/LICENSE',
    localNotice: 'tools/pattern-spike/FREESEWING-LICENSE.txt',
    noticeHash: digest(await readFile(resolve(import.meta.dirname, 'FREESEWING-LICENSE.txt'), 'utf8')),
    commercialUseSource: 'https://freesewing.eu/docs/about/faq/commercial-use/',
    secondPersonReviewEstablished: false },
  curvedWaistbandConflict: curved.curvedCutCountConflict,
  completeQualificationPassed: false, appIntegrationEnabled: false,
  limitations: ['Curved waistband engine cut count conflicts with published documentation/planning records.',
    'No complete step DAG or named seam/notch counterpart map.', 'No independent allowance/layout/physical print/maker receipts.',
    'Npm tarballs omit LICENSE; exact registry gitHead LICENSE retrieved successfully and notice retained. Independent rights review remains open.'] };
await writeFile(resolve(directory, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
