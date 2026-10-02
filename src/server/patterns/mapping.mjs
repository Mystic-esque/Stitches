// Exact-engine semantic study. Neither this local DAG nor its unreviewed bindings is a live Sanity method.
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { cubicLength, digest, engineIdentity } from './draft.mjs';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const same = isDeepStrictEqual;
const source = {
  planningSourceId: 'companion-source-sandy-20261001',
  instructionsUrl: 'https://freesewing.eu/docs/designs/sandy/instructions/',
  package: '@freesewing/sandy', version: '4.10.2',
  gitHead: '3d290d25d0b6a65852dd31aec125c97bc8ca6e2c',
  reviewStatus: 'pending', graphOrigin: 'local-authored-study-not-published-to-Sanity',
};

// Own concise paraphrases of the cited sections. Edges are adapter bindings, not claims from KB prose.
export const studySteps = [
  { id: 'prepare-skirt', title: 'Prepare the skirt seam', requires: [],
    section: 'Step 1', edges: ['sandy.skirt/opening'],
    explanation: 'The opening position needs confirmation before joining the seam.' },
  { id: 'prepare-opening', title: 'Resolve the opening method', requires: ['prepare-skirt'],
    section: 'Step 2', edges: ['sandy.skirt/opening'],
    explanation: 'Choose an applicable opening method; its detailed technique is not mapped here.' },
  { id: 'prepare-band', title: 'Prepare the straight waistband', requires: [],
    section: 'Step 4: Closures', edges: ['sandy.waistband/finish', 'sandy.waistband/fold'],
    explanation: 'Identify the interfaced half and the opposite edge before attachment.' },
  { id: 'attach-band', title: 'Study the waist join', requires: ['prepare-opening', 'prepare-band'],
    section: 'Step 4: Closures', edges: ['sandy.skirt/waist', 'sandy.waistband/attachment'],
    explanation: 'Compare the skirt waist with the band attachment span, excluding the overlap.' },
  { id: 'finish-band', title: 'Study the waistband fold and ends', requires: ['attach-band'],
    section: 'Step 4: Other closures', edges: ['sandy.waistband/fold', 'sandy.waistband/left-end',
      'sandy.waistband/right-end', 'sandy.waistband/finish'],
    explanation: 'The closure choice determines how the ends and inside edge are finished.' },
  { id: 'hem', title: 'Choose the hem method', requires: ['finish-band'],
    section: 'Step 5', edges: ['sandy.skirt/hem'],
    explanation: 'Select a compatible hem finish; the engine allowance alone does not choose it.' },
];

export function validateDag(steps, edges) {
  const stepIds = new Set(steps.map((step) => step.id));
  const edgeIds = new Set(edges.map((edge) => edge.id));
  assert.equal(stepIds.size, steps.length, 'Duplicate step ID');
  assert.equal(edgeIds.size, edges.length, 'Duplicate edge ID');
  const done = new Set(), visiting = new Set();
  const visit = (id) => {
    assert.ok(stepIds.has(id), 'Dangling prerequisite');
    assert.ok(!visiting.has(id), 'Cyclic making prerequisite');
    if (done.has(id)) return;
    visiting.add(id);
    const step = steps.find((entry) => entry.id === id);
    assert.equal(new Set(step.requires).size, step.requires.length, 'Repeated prerequisite');
    step.edges.forEach((edge) => assert.ok(edgeIds.has(edge), 'Unknown step edge'));
    step.requires.forEach(visit);
    visiting.delete(id); done.add(id);
  };
  steps.forEach((step) => visit(step.id));
}

export function eligibleStudySteps(mapping, completedIds) {
  assert.equal(new Set(completedIds).size, completedIds.length, 'Repeated completed step');
  for (const id of completedIds) {
    const step = mapping.steps.find((entry) => entry.id === id);
    assert.ok(step, 'Unknown completed step');
    assert.ok(step.requires.every((required) => completedIds.includes(required)), 'Completion skips a prerequisite');
  }
  return mapping.steps.filter((step) => !completedIds.includes(step.id) &&
    step.requires.every((required) => completedIds.includes(required))).map((step) => step.id);
}

export function mapStraightSandy(artifact) {
  assert.equal(artifact.format, 'stitches-engine-spike-v1');
  assert.ok(same(artifact.engineIdentity, engineIdentity), 'Unsupported engine identity');
  assert.equal(engineIdentity.version, '4.10.2', 'Mapping must be re-audited after version changes');
  assert.equal(artifact.input.waistbandShape, 'straight', 'Curved count conflict is excluded');
  assert.equal(artifact.capability, 'qualification_spike_only');
  assert.equal(artifact.parts.length, 2);
  const edges = [];
  const part = (id) => {
    const matches = artifact.parts.filter((entry) => entry.id === id);
    assert.equal(matches.length, 1, 'Missing or duplicated part');
    return matches[0];
  };
  const skirt = part('sandy.skirt'), band = part('sandy.waistband');
  const add = (piece, role, pointIds, types, onSeam = true) => {
    const p = piece.points;
    pointIds.flat().forEach((id) => assert.ok(p[id] && Number.isFinite(p[id].x) && Number.isFinite(p[id].y), 'Missing named point'));
    const operations = [{ type: 'move', to: p[pointIds[0]] }];
    let lengthMm = 0, previous = p[pointIds[0]];
    for (const [index, type] of types.entries()) {
      const ids = pointIds[index + 1];
      if (type === 'curve') {
        const [cp1, cp2, to] = ids.map((id) => p[id]);
        operations.push({ type, cp1, cp2, to });
        lengthMm += cubicLength([previous, cp1, cp2, to]); previous = to;
      } else {
        const to = p[ids]; operations.push({ type, to });
        lengthMm += distance(previous, to); previous = to;
      }
    }
    if (onSeam) {
      const seam = piece.paths.seam.operations;
      const at = seam.findIndex((op, i) => i < seam.length - 1 && op.to && same(op.to, operations[0].to) &&
        same(seam.slice(i + 1, i + operations.length), operations.slice(1)));
      assert.ok(at >= 0, 'Named edge does not match actual stitch-outline operations');
    }
    edges.push({ id: `${piece.id}/${role}`, pieceId: piece.id, sourcePointIds: pointIds,
      operations, lengthMm, stitchOutlineSegment: onSeam });
  };
  add(skirt, 'hem', ['ex2Flipped', ['ex2cFlipped', 'ex1cFlipped', 'ex1'], ['ex1c', 'ex2c', 'ex2']], ['curve', 'curve']);
  add(skirt, 'opening', ['ex2', 'in2'], ['line']);
  add(skirt, 'waist', ['in2', ['in2c', 'in1c', 'in1'], ['in1cFlipped', 'in2cFlipped', 'in2Flipped']], ['curve', 'curve']);
  add(skirt, 'fold', ['in2Flipped', 'ex2Flipped'], ['line']);
  add(band, 'left-end', ['topLeft', 'bottomLeft'], ['line']);
  add(band, 'attachment', ['bottomLeft', 'bottomRight'], ['line']);
  add(band, 'right-end', ['bottomRight', 'topRight'], ['line']);
  add(band, 'finish', ['topRight', 'topLeft'], ['line']);
  add(band, 'fold', ['centerRight', 'centerLeft'], ['line'], false);
  assert.ok(same(band.paths.fold.operations, edges.at(-1).operations), 'Band fold differs from engine path');
  for (const piece of [skirt, band]) {
    const segments = piece.paths.seam.operations.filter((op) => op.type !== 'move' && op.type !== 'close');
    const mapped = edges.filter((edge) => edge.pieceId === piece.id && edge.stitchOutlineSegment)
      .flatMap((edge) => edge.operations.slice(1));
    assert.equal(mapped.length, segments.length, 'Incomplete stitch-outline coverage');
    assert.ok(segments.every((op) => mapped.filter((entry) => same(entry, op)).length === 1), 'Missing/repeated stitch segment');
  }
  assert.equal(skirt.cut.materials.fabric[0].cut, 1);
  assert.equal(skirt.cut.materials.fabric[0].onFold, true);
  assert.equal(band.cut.materials.fabric[0].cut, 1);
  assert.equal(band.cut.materials.fabric[0].onFold, false);
  const cutFold = skirt.cut.cutOnFold.map(({ x, y }) => ({ x, y }));
  assert.ok(same(cutFold, edges.find((edge) => edge.id === 'sandy.skirt/fold').operations.map((op) => op.to)), 'Fold metadata mismatch');
  const markingAnchors = {
    'sandy.skirt': { 'in2-notch': 'in2', 'gridAnchor-notch': 'gridAnchor', center: 'center' },
    'sandy.waistband': { 'centerNotch-notch': 'centerNotch', 'buttonNotch-notch': 'buttonNotch', 'bottomLeft-notch': 'bottomLeft' },
  };
  for (const piece of [skirt, band]) {
    const expected = markingAnchors[piece.id];
    assert.deepEqual(piece.markings.map((mark) => mark.id).sort(), Object.keys(expected).sort(), 'Unknown or missing engine mark');
    for (const mark of piece.markings)
      assert.ok(same(mark.anchor, piece.points[expected[mark.id]]), 'Notch missing/moved from named anchor');
  }
  const marks = [skirt, band].flatMap((piece) => piece.markings.map((mark) => ({
    id: `${piece.id}/${mark.id}`, pieceId: piece.id, anchor: mark.anchor,
    status: 'engine-mark-only', approvedCounterpartId: null,
  })));
  const bandMark = band.markings.find((mark) => mark.id === 'centerNotch-notch');
  assert.ok(bandMark && same(bandMark.anchor, band.points.centerNotch), 'Center notch missing/moved');
  const skirtHalfLength = edges.find((edge) => edge.id === 'sandy.skirt/waist').lengthMm;
  const bandCenterDistance = distance(band.points.bottomLeft, bandMark.anchor);
  const notchComparison = { kind: 'unapproved-midpoint-candidate',
    skirtFoldMarkId: 'sandy.skirt/gridAnchor-notch', bandMarkId: 'sandy.waistband/centerNotch-notch',
    unfoldedSkirtMidpointMm: skirtHalfLength, waistbandCenterMarkMm: bandCenterDistance,
    differenceMm: Math.abs(skirtHalfLength - bandCenterDistance),
    status: 'unresolved-notch-correspondence', approvedPair: false,
    note: 'Name similarity is not evidence of a mating role. No notch pair or recut adjustment is authorized.' };
  validateDag(studySteps, edges);
  return { format: 'stitches-sandy-mapping-study-v1', artifactHash: digest(artifact), source,
    applicability: { waistbandShape: 'straight', panels: 1, gathering: 0, seamlessFullCircle: false,
      lining: false, pockets: false, closureTechnique: 'unresolved' },
    edges, markings: marks, notchComparison,
    steps: studySteps.map((step) => ({ ...step, sourceUrl: source.instructionsUrl,
      reviewStatus: 'pending', executionEnabled: false })),
    fullMakingGraphQualified: false, cutReady: false,
    missingBindings: ['opening-position-and-closure-method', 'interfacing-template', 'notch-counterparts',
      'method-and-equipment-compatibility', 'allowance-and-hem-method-validation', 'Sanity-authored-step-graph', 'physical-maker-review'] };
}

export function compareStudyEdges(before, after) {
  assert.ok(same(before.source, after.source), 'Cannot compare different source versions');
  assert.ok(same(before.applicability, after.applicability), 'Cannot compare different constructions');
  const prior = new Map(before.edges.map((edge) => [edge.id, edge]));
  assert.deepEqual([...prior.keys()].sort(), after.edges.map((edge) => edge.id).sort(), 'Changed edge identity');
  const changed = after.edges.filter((edge) => !same(prior.get(edge.id).operations, edge.operations));
  return { beforeArtifactHash: before.artifactHash, afterArtifactHash: after.artifactHash,
    changedEdgeIds: changed.map((edge) => edge.id),
    edgeLengthChanges: changed.map((edge) => ({ id: edge.id, beforeMm: prior.get(edge.id).lengthMm, afterMm: edge.lengthMm })),
    affectedStudyStepIds: after.steps.filter((step) => step.edges.some((id) => changed.some((edge) => edge.id === id))).map((step) => step.id),
    claim: 'measured-coordinate-change-only-not-approved-alteration' };
}
