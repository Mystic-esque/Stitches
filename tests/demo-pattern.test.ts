import { describe, expect, it } from "vitest";
import { demoPiecePath, normalizeDemoAmount } from "../src/domain/demo-pattern";

describe("illustrative demo bounds", () => {
  it("rejects nonfinite input and clamps the sample-only UI range", () => {
    expect(normalizeDemoAmount(Number.NaN)).toBe(0);
    expect(normalizeDemoAmount(-4)).toBe(0);
    expect(normalizeDemoAmount(27)).toBe(20);
  });

  it("keeps the original outline stable while previewing", () => {
    const original = demoPiecePath("front", 0);
    expect(demoPiecePath("front", 12)).not.toBe(original);
    expect(demoPiecePath("front", 0)).toBe(original);
  });
});
