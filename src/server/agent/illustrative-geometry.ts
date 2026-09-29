import type { BodiceFragment, ShoulderSpikeInput } from "../../domain/geometry/shoulder-spike";

const versionId = "pattern-version.everyday-blouse.0-1-0";
const front: BodiceFragment = {
  neckline: { start: { x: 0, y: 20 }, control1: { x: 12, y: 20 }, control2: { x: 30, y: 0 }, end: { x: 40, y: 0 } },
  shoulderNeck: { x: 40, y: 0 }, shoulderTip: { x: 100, y: 20 },
  armhole: { start: { x: 100, y: 20 }, control1: { x: 110, y: 45 }, control2: { x: 130, y: 70 }, end: { x: 120, y: 100 } },
};

/** An interaction fixture, not a traced, printable, or maker-reviewed pattern. */
export function illustrativeShoulderGeometry(patternVersionId: string): ShoulderSpikeInput {
  if (patternVersionId !== versionId) throw new Error("No illustrative geometry is bound to this pattern version.");
  return {
    patternVersionId: versionId,
    sourceStatus: "illustrative",
    front,
    back: front,
    allowedAmountMm: { min: 0, max: 20 },
    shoulderJoinToleranceMm: 0.5,
  };
}
