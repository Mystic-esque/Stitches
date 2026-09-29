import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePatternSnapshot } from "../../domain/knowledge/resolve-pattern";
import { AssemblyEvidenceError, verifyAssemblyEvidence } from "./assembly-evidence";

const rows = JSON.parse(readFileSync(join(process.cwd(), "fixtures/knowledge-graph.json"), "utf8")).documents;
const version = "pattern-version.everyday-blouse.0-1-0";
const correctedRows = structuredClone(rows);
correctedRows.find((row: { _id: string }) => row._id === "step.neckline").pieces = [{ _ref: "piece.front" }, { _ref: "piece.back" }];
const snapshot = resolvePatternSnapshot(correctedRows, version, "illustrative");
const base = {
  tool: "knowledge_base_read" as const,
  knowledgeBaseId: "kbkvu1vrPsLG",
  paths: ["construction_sequence"],
  text: `${version} piece.front piece.back. Finish the neckline and Prepare the sleeves are parallel branches after Join the shoulders.`,
};

describe("assembly evidence gate", () => {
  it("corroborates the source graph and binds the note to its fingerprint", () => {
    expect(verifyAssemblyEvidence(snapshot, base)).toMatchObject({
      knowledgeBaseId: "kbkvu1vrPsLG",
      path: "construction_sequence",
      snapshotFingerprint: snapshot.fingerprint,
      sourceIds: ["source.stitches-demo"],
      readiness: "illustrative",
    });
  });

  it("refuses a stale or contradictory generated summary", () => {
    expect(() => verifyAssemblyEvidence(snapshot, { ...base, text: `${base.text} Has no listed pattern pieces of its own.` })).toThrow(AssemblyEvidenceError);
    expect(() => verifyAssemblyEvidence(snapshot, { ...base, text: `${base.text} step.shoulders ──► step.neckline ──► step.sleeves` })).toThrow(/needs review/);
    expect(() => verifyAssemblyEvidence(snapshot, { ...base, paths: ["seam_assembly"] })).toThrow(/unavailable/);
  });

  it("refuses a changed authored prerequisite even when Context still asserts the old graph", () => {
    expect(() => verifyAssemblyEvidence(resolvePatternSnapshot(rows, version, "illustrative"), base)).toThrow(/outside this verified explanation/);
    const changed = structuredClone(correctedRows);
    changed.find((row: { _id: string }) => row._id === "step.sleeves").prerequisites = [{ _ref: "step.neckline" }];
    const changedSnapshot = resolvePatternSnapshot(changed, version, "illustrative");
    expect(() => verifyAssemblyEvidence(changedSnapshot, base)).toThrow(/outside this verified explanation/);
  });
});
