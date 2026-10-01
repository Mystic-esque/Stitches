// Isolated research adapter. No app route, user inputs, or cutting claim is enabled.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Sandy, about } from '@freesewing/sandy';
import { version } from '@freesewing/core';

export const engineIdentity = { engine: '@freesewing/core', version, design: about.pkg, designVersion: about.version };
const coordinate = (point) => {
  assert.ok(point && Number.isFinite(point.x) && Number.isFinite(point.y), 'Non-finite engine point');
  return { x: point.x, y: point.y };
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function validateInput(input) {
  assert.deepEqual(Object.keys(input).sort(), ['lengthRatio', 'measurements', 'seamAllowanceMm', 'waistbandShape']);
  assert.deepEqual(Object.keys(input.measurements).sort(), ['hips', 'waist', 'waistToFloor', 'waistToHips']);
  for (const value of Object.values(input.measurements)) assert.ok(Number.isFinite(value) && value > 0);
  assert.ok(input.measurements.hips > input.measurements.waist, 'Curved radius requires distinct waist/hips');
  assert.ok(input.measurements.waistToFloor > input.measurements.waistToHips);
  assert.ok(Number.isFinite(input.lengthRatio) && input.lengthRatio >= 0.1 && input.lengthRatio <= 1);
  assert.ok(Number.isFinite(input.seamAllowanceMm) && input.seamAllowanceMm >= 0 && input.seamAllowanceMm <= 30);
  assert.ok(['straight', 'curved'].includes(input.waistbandShape));
  // These are mathematical spike guards, not a clinically/maker-qualified measurement envelope.
}

function serializePath(path) {
  return { hidden: path.hidden, svgPath: path.asPathstring(), operations: path.ops.map((operation) => {
    assert.ok(['move', 'line', 'curve', 'close'].includes(operation.type), 'Unsupported path operation');
    return { type: operation.type, ...Object.fromEntries(['to', 'cp1', 'cp2'].filter((key) => operation[key])
      .map((key) => [key, coordinate(operation[key])])) };
  }) };
}

// Independent de Casteljau length estimate, not the engine's Path.length implementation.
export function cubicLength(points, tolerance = 0.0001, depth = 0) {
  const [a, b, c, d] = points;
  const chord = distance(a, d), polygon = distance(a, b) + distance(b, c) + distance(c, d);
  if (polygon - chord < tolerance || depth >= 24) return (polygon + chord) / 2;
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const ab = mid(a, b), bc = mid(b, c), cd = mid(c, d), abc = mid(ab, bc), bcd = mid(bc, cd), split = mid(abc, bcd);
  return cubicLength([a, ab, abc, split], tolerance / 2, depth + 1) +
    cubicLength([split, bcd, cd, d], tolerance / 2, depth + 1);
}

export function draftSandy(input) {
  validateInput(input);
  const normalizedInput = { measurements: { waist: input.measurements.waist, hips: input.measurements.hips,
    waistToFloor: input.measurements.waistToFloor, waistToHips: input.measurements.waistToHips },
    lengthRatio: input.lengthRatio, seamAllowanceMm: input.seamAllowanceMm, waistbandShape: input.waistbandShape };
  const settings = { measurements: normalizedInput.measurements, sa: input.seamAllowanceMm,
    expand: true, paperless: false, options: { waistbandShape: input.waistbandShape,
      waistbandPosition: 0, waistbandWidth: 0.04, waistbandOverlap: 0.03, lengthBonus: input.lengthRatio,
      circleRatio: 0.5, panels: 1, gathering: 0, seamlessFullCircle: false } };
  const pattern = new Sandy(settings).draft();
  const logs = pattern.getLogs();
  assert.equal(logs.pattern.error.length, 0, 'Engine logged a pattern error');
  assert.ok(logs.sets.every((set) => set.error.length === 0), 'Engine logged a set error');
  const cutlist = pattern.setStores[0].get('cutlist');
  const parts = Object.entries(pattern.parts[0]).map(([id, part]) => ({ id,
    hidden: part.hidden,
    // Preserve named source points, but omit duplicate macro bookkeeping/title positions.
    points: Object.fromEntries(Object.entries(part.points).filter(([key]) => !key.startsWith('__macro_'))
      .map(([key, point]) => [key, coordinate(point)])),
    paths: Object.fromEntries(Object.entries(part.paths).map(([key, path]) => [key, serializePath(path)])),
    markings: Object.entries(part.snippets).filter(([, snippet]) => /notch/.test(snippet.def))
      .map(([id, snippet]) => ({ id, type: snippet.def, anchor: coordinate(snippet.anchor) })),
    cut: cutlist[id],
  }));
  const skirt = pattern.parts[0]['sandy.skirt'].points;
  const inner = [
    [skirt.in2, skirt.in2c, skirt.in1c, skirt.in1],
    [skirt.in1, skirt.in1cFlipped, skirt.in2cFlipped, skirt.in2Flipped],
  ].map((curve) => curve.map(coordinate));
  const waistArcMm = inner.reduce((sum, curve) => sum + cubicLength(curve), 0) * 2; // authored single fold
  const waistband = pattern.parts[0]['sandy.waistband'].points;
  const join = input.waistbandShape === 'straight' ? {
    id: 'sandy-waist-join', skirtEdgeId: 'sandy.skirt/waist', waistbandEdgeId: 'sandy.waistband/attachment',
    skirtStitchMm: waistArcMm,
    waistbandStitchMm: distance(waistband.bottomLeft, waistband.bottomRight) - pattern.setStores[0].get('waistbandOverlap'),
    overlapMm: pattern.setStores[0].get('waistbandOverlap'),
    note: 'Scalar comparison for one panel, single fold, zero gathering, straight waistband; not assembly or fit approval.',
  } : null;
  if (join) join.differenceMm = Math.abs(join.skirtStitchMm - join.waistbandStitchMm);
  return { format: 'stitches-engine-spike-v1', units: 'mm', engineIdentity, input: normalizedInput,
    capability: 'qualification_spike_only', parts, measuredJoin: join,
    warnings: [...logs.pattern.warn, ...logs.sets.flatMap((set) => set.warn)],
    missingReceipts: ['rights-notice-review', 'complete-step-and-edge-map', 'allowance-geometry-validation',
      'fabric-layout', 'physical-print-calibration', 'maker-review'],
    curvedCutCountConflict: input.waistbandShape === 'curved' ? {
      engineCount: cutlist['sandy.waistband'].materials.fabric[0].cut,
      publishedPlanningCount: 2, status: 'unresolved-source-version-conflict',
    } : null,
  };
}
