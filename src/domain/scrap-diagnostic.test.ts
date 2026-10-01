import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveScrapObservation } from "./scrap-diagnostic";

const docs = JSON.parse(readFileSync(new URL("../../fixtures/companion-diagnostic.json", import.meta.url), "utf8")).documents;
const find = (type: string, key?: string) => docs.find((item: Record<string, string>) => item._type === type && (!key || item.issueKey === key));
const study = { tensionIssue: find("issuePattern", "tension-pucker").title, tensionRiskNotes: find("issuePattern", "tension-pucker").riskNotes,
  unresolvedIssue: find("issuePattern", "unresolved-pucker").title, unresolvedRiskNotes: find("issuePattern", "unresolved-pucker").riskNotes,
  howToCheck: find("diagnosticTest").howToCheck, safeAction: find("remedy").safeAction,
  confirmationCheck: find("remedy").confirmationCheck };

describe("scrap-only seam-puckering decision", () => {
  it("withholds an adjustment before a discriminating observation", () => {
    const result = resolveScrapObservation(study, "not-tested");
    expect(result.state).toBe("not-tested");
    expect(result.nextAction).toContain("scrap");
    expect(result.nextAction).not.toContain("lower upper-thread tension");
  });
  it("permits only a second scrap comparison when stitches release the pucker", () => {
    const result = resolveScrapObservation(study, "relaxes");
    expect(result.state).toBe("possible-tension");
    expect(result.nextAction).toContain("scrap seam only");
    expect(result.confirmation).toContain("balanced");
    expect(result.explanation).toContain("does not establish the only cause");
  });
  it("stops the tension path when a sample does not relax", () => {
    const result = resolveScrapObservation(study, "unchanged");
    expect(result.state).toBe("unresolved");
    expect(result.confirmation).toBeNull();
    expect(result.nextAction).not.toContain("lower upper-thread tension");
  });
});
