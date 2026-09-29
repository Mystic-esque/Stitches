/** Deterministic seam-geometry spike, separate from the illustrative SVG. */
export type Point = Readonly<{ x: number; y: number }>;
export type Cubic = Readonly<{ start: Point; control1: Point; control2: Point; end: Point }>;
export type BodiceFragment = Readonly<{
  neckline: Cubic;
  shoulderNeck: Point;
  shoulderTip: Point;
  armhole: Cubic;
}>;
export type ShoulderSpikeInput = Readonly<{
  patternVersionId: string;
  sourceStatus: "illustrative" | "reviewed";
  front: BodiceFragment;
  back: BodiceFragment;
  allowedAmountMm: Readonly<{ min: number; max: number }>;
  shoulderJoinToleranceMm: number;
}>;
export type GeometryCheck = Readonly<{
  id: string;
  status: "pass" | "fail" | "unknown";
  detail: string;
  measuredMm?: number;
  limitMm?: number;
}>;
export type ShoulderSpikeResult = Readonly<{
  engineVersion: "shoulder-spike/0.1.0";
  patternVersionId: string;
  amountMm: number;
  front: BodiceFragment;
  back: BodiceFragment;
  armholeLengthMm: Readonly<{ front: number; back: number }>;
  checks: readonly GeometryCheck[];
  readiness: "incomplete";
}>;

const MAX_COORDINATE_MM = 10000;
function finitePoint(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) &&
    Math.abs(point.x) <= MAX_COORDINATE_MM && Math.abs(point.y) <= MAX_COORDINATE_MM;
}
function finiteCubic(curve: Cubic): boolean {
  return [curve.start, curve.control1, curve.control2, curve.end].every(finitePoint);
}
function samePoint(a: Point, b: Point): boolean { return a.x === b.x && a.y === b.y; }
function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y); }
function pointOnCubic(curve: Cubic, t: number): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * curve.start.x + 3 * u ** 2 * t * curve.control1.x + 3 * u * t ** 2 * curve.control2.x + t ** 3 * curve.end.x,
    y: u ** 3 * curve.start.y + 3 * u ** 2 * t * curve.control1.y + 3 * u * t ** 2 * curve.control2.y + t ** 3 * curve.end.y,
  };
}

/** Fixed subdivision gives reproducible length; this is not a sewing-rule tolerance. */
export function cubicLengthMm(curve: Cubic, subdivisions = 1024): number {
  if (!finiteCubic(curve) || !Number.isInteger(subdivisions) || subdivisions < 16 || subdivisions > 8192)
    throw new Error("Invalid cubic or subdivision count");
  let total = 0;
  let previous = curve.start;
  for (let index = 1; index <= subdivisions; index++) {
    const next = pointOnCubic(curve, index / subdivisions);
    total += distance(previous, next);
    previous = next;
  }
  return total;
}

function validateFragment(fragment: BodiceFragment, label: string): void {
  if (!finiteCubic(fragment.neckline) || !finiteCubic(fragment.armhole) ||
    !finitePoint(fragment.shoulderNeck) || !finitePoint(fragment.shoulderTip))
    throw new Error(`${label} contains a non-finite or out-of-range coordinate`);
  if (!samePoint(fragment.neckline.end, fragment.shoulderNeck) ||
    !samePoint(fragment.armhole.start, fragment.shoulderTip))
    throw new Error(`${label} seam endpoints are disconnected`);
  if (distance(fragment.shoulderNeck, fragment.shoulderTip) < 10 ||
    distance(fragment.armhole.start, fragment.armhole.end) < 10)
    throw new Error(`${label} has a degenerate shoulder or armhole`);
  if (fragment.shoulderTip.x <= fragment.shoulderNeck.x)
    throw new Error(`${label} does not use the supported outward-positive X orientation`);
}
function extendFragment(fragment: BodiceFragment, amountMm: number): BodiceFragment {
  const tip = { x: fragment.shoulderTip.x + amountMm, y: fragment.shoulderTip.y };
  return {
    neckline: fragment.neckline,
    shoulderNeck: fragment.shoulderNeck,
    shoulderTip: tip,
    armhole: {
      start: tip,
      control1: { x: fragment.armhole.control1.x + amountMm, y: fragment.armhole.control1.y },
      control2: fragment.armhole.control2,
      end: fragment.armhole.end,
    },
  };
}

export function draftShoulderSpike(input: ShoulderSpikeInput, amountMm: number): ShoulderSpikeResult {
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(input.patternVersionId)) throw new Error("Invalid pattern version ID");
  if (input.sourceStatus !== "illustrative" && input.sourceStatus !== "reviewed") throw new Error("Invalid source status");
  const { min, max } = input.allowedAmountMm;
  if (![amountMm, min, max, input.shoulderJoinToleranceMm].every(Number.isFinite) ||
    min < 0 || max > 50 || min > max || amountMm < min || amountMm > max ||
    input.shoulderJoinToleranceMm < 0 || input.shoulderJoinToleranceMm > 10)
    throw new Error("Unsupported shoulder amount or constraint");
  validateFragment(input.front, "front");
  validateFragment(input.back, "back");
  const front = extendFragment(input.front, amountMm);
  const back = extendFragment(input.back, amountMm);
  validateFragment(front, "drafted front");
  validateFragment(back, "drafted back");

  const shoulderDifferenceMm = Math.abs(distance(front.shoulderNeck, front.shoulderTip) - distance(back.shoulderNeck, back.shoulderTip));
  const checks: GeometryCheck[] = [
    {
      id: "neckline-lock",
      status: JSON.stringify(front.neckline) === JSON.stringify(input.front.neckline) &&
        JSON.stringify(back.neckline) === JSON.stringify(input.back.neckline) ? "pass" : "fail",
      detail: "Original neckline curves must remain unchanged.",
    },
    {
      id: "shoulder-join",
      status: shoulderDifferenceMm <= input.shoulderJoinToleranceMm ? "pass" : "fail",
      detail: "Front and back shoulder seam lengths must be within the supplied tolerance.",
      measuredMm: shoulderDifferenceMm,
      limitMm: input.shoulderJoinToleranceMm,
    },
    { id: "armhole-sleeve", status: "unknown", detail: "The sleeve cap has not been redrafted or measured against the new armholes." },
    {
      id: "maker-review", status: "unknown",
      detail: input.sourceStatus === "illustrative"
        ? "This pattern source is illustrative and has no physical review."
        : "A reviewed source does not establish a physical sewing trial for this new operation.",
    },
  ];
  return {
    engineVersion: "shoulder-spike/0.1.0",
    patternVersionId: input.patternVersionId,
    amountMm,
    front,
    back,
    armholeLengthMm: { front: cubicLengthMm(front.armhole), back: cubicLengthMm(back.armhole) },
    checks,
    readiness: "incomplete",
  };
}
