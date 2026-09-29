import { describe, expect, it } from "vitest";
import { cubicLengthMm, draftShoulderSpike, type BodiceFragment, type ShoulderSpikeInput } from "./shoulder-spike";

const front: BodiceFragment = {
  neckline: { start: { x: 0, y: 30 }, control1: { x: 18, y: 29 }, control2: { x: 28, y: 2 }, end: { x: 40, y: 0 } },
  shoulderNeck: { x: 40, y: 0 }, shoulderTip: { x: 100, y: 20 },
  armhole: { start: { x: 100, y: 20 }, control1: { x: 114, y: 48 }, control2: { x: 128, y: 75 }, end: { x: 120, y: 100 } },
};
const back: BodiceFragment = {
  neckline: { start: { x: 0, y: 10 }, control1: { x: 20, y: 10 }, control2: { x: 30, y: 1 }, end: { x: 40, y: 0 } },
  shoulderNeck: { x: 40, y: 0 }, shoulderTip: { x: 100, y: 20 },
  armhole: { start: { x: 100, y: 20 }, control1: { x: 111, y: 44 }, control2: { x: 125, y: 80 }, end: { x: 120, y: 100 } },
};
const input: ShoulderSpikeInput = {
  patternVersionId: "version.illustrative-1", sourceStatus: "illustrative", front, back,
  allowedAmountMm: { min: 0, max: 20 }, shoulderJoinToleranceMm: 0.5,
};

describe("shoulder seam geometry spike", () => {
  it("preserves the neckline and shoulder join across the sample input envelope", () => {
    for (let amount = 0; amount <= 20; amount++) {
      const result = draftShoulderSpike(input, amount);
      expect(result.front.neckline).toEqual(front.neckline);
      expect(result.back.neckline).toEqual(back.neckline);
      expect(result.front.shoulderTip.x).toBe(front.shoulderTip.x + amount);
      expect(result.back.shoulderTip.x).toBe(back.shoulderTip.x + amount);
      expect(result.checks.find((check) => check.id === "shoulder-join")?.status).toBe("pass");
      expect(result.checks.find((check) => check.id === "armhole-sleeve")?.status).toBe("unknown");
      expect(result.readiness).toBe("incomplete");
      expect(Number.isFinite(result.armholeLengthMm.front)).toBe(true);
    }
  });

  it("is deterministic and does not mutate source geometry", () => {
    const before = JSON.stringify(input);
    expect(draftShoulderSpike(input, 12)).toEqual(draftShoulderSpike(input, 12));
    expect(JSON.stringify(input)).toBe(before);
  });

  it("rejects unsupported amounts, disconnected edges, and invalid coordinates", () => {
    expect(() => draftShoulderSpike(input, 20.1)).toThrow("Unsupported");
    expect(() => draftShoulderSpike(input, Number.NaN)).toThrow("Unsupported");
    expect(() => draftShoulderSpike({ ...input, front: { ...front, shoulderTip: { x: 99, y: 20 } } }, 5)).toThrow("disconnected");
    expect(() => draftShoulderSpike({ ...input, back: { ...back, shoulderTip: { x: Number.POSITIVE_INFINITY, y: 20 } } }, 5)).toThrow("coordinate");
  });

  it("reports a shoulder-join failure rather than a ready result", () => {
    const longerBack: BodiceFragment = {
      ...back, shoulderTip: { x: 106, y: 20 }, armhole: { ...back.armhole, start: { x: 106, y: 20 } },
    };
    const result = draftShoulderSpike({ ...input, back: longerBack }, 10);
    expect(result.checks.find((check) => check.id === "shoulder-join")?.status).toBe("fail");
    expect(result.readiness).toBe("incomplete");
  });

  it("measures a straight cubic to its exact endpoint distance", () => {
    const line = { start: { x: 0, y: 0 }, control1: { x: 10, y: 0 }, control2: { x: 20, y: 0 }, end: { x: 30, y: 0 } };
    expect(cubicLengthMm(line)).toBeCloseTo(30, 8);
    expect(() => cubicLengthMm(line, 0)).toThrow("Invalid");
  });
});
