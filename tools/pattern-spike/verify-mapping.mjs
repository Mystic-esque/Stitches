import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { draftSandy, digest } from './draft.mjs';
import { mapStraightSandy, eligibleStudySteps, validateDag, compareStudyEdges } from './mapping.mjs';

const input = { measurements: { waist: 720, hips: 960, waistToFloor: 1000, waistToHips: 200 },
  lengthRatio: 0.55, seamAllowanceMm: 10, waistbandShape: 'straight' };
const artifact = draftSandy(input), mapping = mapStraightSandy(artifact);
assert.equal(digest(mapping), digest(mapStraightSandy(draftSandy(input))), 'Mapping is not repeat-deterministic');
assert.equal(mapping.edges.length, 9);
assert.equal(mapping.markings.length, 6);
assert.ok(mapping.notchComparison.differenceMm > 10.8 && mapping.notchComparison.differenceMm < 10.81);
assert.equal(mapping.notchComparison.approvedPair, false);
assert.deepEqual(eligibleStudySteps(mapping, []), ['prepare-skirt', 'prepare-band']);
assert.deepEqual(eligibleStudySteps(mapping, ['prepare-skirt']), ['prepare-opening', 'prepare-band']);
assert.deepEqual(eligibleStudySteps(mapping, ['prepare-skirt', 'prepare-opening', 'prepare-band']), ['attach-band']);
assert.throws(() => eligibleStudySteps(mapping, ['attach-band']));
assert.throws(() => eligibleStudySteps(mapping, ['unknown']));
assert.throws(() => eligibleStudySteps(mapping, ['prepare-band', 'prepare-band']));
assert.throws(() => validateDag([{ ...mapping.steps[0], requires: ['absent'] }], mapping.edges));
assert.throws(() => validateDag([{ ...mapping.steps[0], requires: ['prepare-skirt'] }], mapping.edges));
assert.throws(() => validateDag([{ ...mapping.steps[0], edges: ['absent'] }], mapping.edges));
assert.throws(() => mapStraightSandy(draftSandy({ ...input, waistbandShape: 'curved' })));
const tampered = structuredClone(artifact); tampered.parts[0].points.in1.x += 1;
assert.throws(() => mapStraightSandy(tampered), /actual stitch-outline/);
const badFold = structuredClone(artifact); badFold.parts[0].cut.cutOnFold[0].x += 1;
assert.throws(() => mapStraightSandy(badFold), /Fold metadata/);
const movedNotch = structuredClone(artifact); movedNotch.parts[1].markings[0].anchor.x += 1;
assert.throws(() => mapStraightSandy(movedNotch), /Notch missing/);
const incompatible = structuredClone(artifact); incompatible.engineIdentity.version = 'unsupported';
assert.throws(() => mapStraightSandy(incompatible), /engine identity/);
const longer = mapStraightSandy(draftSandy({ ...input, lengthRatio: 0.65 }));
const impact = compareStudyEdges(mapping, longer);
assert.deepEqual(impact.changedEdgeIds, ['sandy.skirt/hem', 'sandy.skirt/opening', 'sandy.skirt/fold']);
assert.deepEqual(impact.affectedStudyStepIds, ['prepare-skirt', 'prepare-opening', 'hem']);
assert.ok(Math.abs(impact.edgeLengthChanges.find((edge) => edge.id === 'sandy.skirt/opening').afterMm -
  impact.edgeLengthChanges.find((edge) => edge.id === 'sandy.skirt/opening').beforeMm - 100) < 1e-8,
  'Expected 100 mm length increase within floating-point precision');
const second = mapStraightSandy(draftSandy({ ...input,
  measurements: { waist: 880, hips: 1100, waistToFloor: 1080, waistToHips: 220 }, lengthRatio: 0.7 }));
assert.ok(second.notchComparison.differenceMm > 13.2 && second.notchComparison.differenceMm < 13.21);
assert.deepEqual(mapping.edges.map((edge) => edge.id), second.edges.map((edge) => edge.id));
assert.deepEqual(mapping.markings.map((mark) => mark.id), second.markings.map((mark) => mark.id));
const directory = resolve(import.meta.dirname, '../../evidence/pattern-engine');
await mkdir(directory, { recursive: true });
for (const result of [mapping, longer, second])
  await writeFile(resolve(directory, `mapping-${digest(result).slice(0, 16)}.json`), JSON.stringify(result, null, 2) + '\n');
const packageSourceHashes = {};
for (const file of ['skirt.mjs', 'straight-waistband.mjs'])
  packageSourceHashes[file] = digest(await readFile(resolve(import.meta.dirname, `node_modules/@freesewing/sandy/src/${file}`), 'utf8'));
const report = { checkedAt: new Date().toISOString(), provenance: 'real-engine-plus-local-authored-unreviewed-map',
  mappingFiles: [mapping, longer, second].map((result) => `evidence/pattern-engine/mapping-${digest(result).slice(0, 16)}.json`),
  exactPackageSourceHashes: packageSourceHashes, allStitchSegmentsNamedExactlyOnce: true,
  stableEdgesAndMarksAtTwoInputs: true, tamperedGeometryAndFoldAndNotchRejected: true,
  invalidDagAndProgressRejected: true, curveConflictExcluded: true,
  notchComparisons: [mapping.notchComparison, second.notchComparison],
  lengthOnlyImpact: impact, liveSanityStepGraph: false, physicalActionsEnabled: false, fullQualificationPassed: false };
await writeFile(resolve(directory, 'mapping-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
