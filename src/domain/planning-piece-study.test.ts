import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { selectMakingStepPieces, selectPlanningPieces } from "./planning-piece-study";

const fixture = JSON.parse(readFileSync(new URL("../../fixtures/companion-piece-studies.json", import.meta.url), "utf8"));
type FixturePiece = { candidate: { _ref: string }; condition: string; pieceKey: string; fold: string; cutCount: number; mirrored: boolean };
const pieces = fixture.documents as FixturePiece[];
const sandy = pieces.filter((item) => item.candidate._ref.includes("sandy"));
const tina = pieces.filter((item) => item.candidate._ref.includes("tina"));
const base = { skirt: "default" as const, waistband: "straight" as const, frontBottom: false, sleeves: false };

describe("source-derived educational cut-list variants", () => {
  it("changes both Sandy fold and waistband count without leaking mutually exclusive parts", () => {
    const baseline = selectPlanningPieces(sandy, base);
    expect(baseline.map((item) => item.pieceKey)).toEqual(["skirt-default", "waistband-straight", "waistband-interfacing"]);
    const alternate = selectPlanningPieces(sandy, { ...base, skirt: "seamless", waistband: "curved" });
    expect(alternate.map((item) => item.pieceKey)).toEqual(["skirt-seamless", "waistband-curved", "waistband-interfacing"]);
    expect(alternate[0].fold).toBe("double");
    expect(alternate[1].cutCount).toBe(2);
  });
  it("adds only selected Tina option parts and preserves mirrored fronts", () => {
    expect(selectPlanningPieces(tina, base).map((item) => item.pieceKey)).toEqual(["front", "back"]);
    const expanded = selectPlanningPieces(tina, { ...base, frontBottom: true, sleeves: true });
    expect(expanded).toHaveLength(4);
    expect(expanded.filter((item) => item.mirrored).map((item) => item.pieceKey)).toEqual(["front", "sleeve"]);
  });
  it("projects authored Sandy variants and removes disabled Tina options from making steps", () => {
    expect(selectMakingStepPieces(sandy, { sleeves: false, frontBottom: false },
      ["skirt-default", "waistband-straight", "waistband-interfacing"])
      .map((item) => item.pieceKey)).toEqual(["skirt-default", "waistband-straight", "waistband-interfacing"]);
    expect(selectMakingStepPieces(tina, { sleeves: false, frontBottom: false },
      ["front", "back", "front-bottom", "sleeve"]).map((item) => item.pieceKey)).toEqual(["front", "back"]);
  });
});
