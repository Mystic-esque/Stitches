import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KnowledgeError, resolvePatternSnapshot } from "./resolve-pattern";

const versionId = "pattern-version.everyday-blouse.0-1-0";
type FixtureDocument = Record<string, any>;

function documents(): FixtureDocument[] {
  const fixture = JSON.parse(readFileSync(join(process.cwd(), "fixtures/knowledge-graph.json"), "utf8"));
  return structuredClone(fixture.documents);
}

function record(rows: FixtureDocument[], id: string): FixtureDocument {
  const found = rows.find((row) => row._id === id);
  if (!found) throw new Error(`Missing fixture ${id}`);
  return found;
}

describe("structured knowledge resolver", () => {
  it("derives effects, dependencies, and unresolved checks from the graph", () => {
    const snapshot = resolvePatternSnapshot(documents(), versionId, "illustrative");
    expect(snapshot.pieceIds).toEqual(["piece.back", "piece.front", "piece.sleeve"]);
    expect(snapshot.effectsByOperation["shoulder-width"].pieces.map((item) => [item.pieceId, item.via])).toEqual([
      ["piece.back", "direct"], ["piece.front", "direct"], ["piece.sleeve", "join"],
    ]);
    expect(snapshot.effectsByOperation["shoulder-width"].stepIds).toEqual(["step.shoulders", "step.sleeves"]);
    expect(snapshot.effectsByOperation["shoulder-width"].unresolvedChecks).toEqual(["join.armhole-sleeve", "join.shoulders"]);
    expect(snapshot.sourceIds).toEqual(["source.stitches-demo"]);
    expect(snapshot.sourceDetails[0]).toMatchObject({ id: "source.stitches-demo", title: "Stitches authored interaction fixture", reviewStatus: "illustrative" });
  });

  it("changes the effect trail and fingerprint when a join relationship changes", () => {
    const rows = documents();
    const before = resolvePatternSnapshot(rows, versionId, "illustrative");
    record(rows, "rule.shoulder-width").recheckJoins = [{ _ref: "join.shoulders" }];
    const after = resolvePatternSnapshot(rows, versionId, "illustrative");
    expect(after.effectsByOperation["shoulder-width"].pieces.map((item) => item.pieceId)).toEqual(["piece.back", "piece.front"]);
    expect(after.fingerprint).not.toBe(before.fingerprint);
  });

  it("derives the garment dissection and assembly order from references, not display constants", () => {
    const rows = documents();
    const snapshot = resolvePatternSnapshot(rows, versionId, "illustrative");
    expect(snapshot.garmentPieces.find((item) => item.key === "sleeve")).toMatchObject({ cutCount: 2, mirrored: true });
    expect(snapshot.garmentConnections.find((item) => item.id === "join.armhole-sleeve")?.pieceKeys).toEqual(["front", "back", "sleeve"]);
    expect(snapshot.assemblySteps.map((item) => item.key)).toEqual(["join-shoulders", "finish-neckline", "prepare-sleeves"]);
    expect(snapshot.assemblySteps.find((item) => item.key === "prepare-sleeves")?.prerequisiteKeys).toEqual(["join-shoulders"]);
    record(rows, "step.sleeves").title = "Set the sleeve after a cap check";
    record(rows, "step.sleeves").pieces = [{ _ref: "piece.front" }, { _ref: "piece.sleeve" }];
    const corrected = resolvePatternSnapshot(rows, versionId, "illustrative");
    expect(corrected.assemblySteps.find((item) => item.key === "prepare-sleeves")).toMatchObject({ title: "Set the sleeve after a cap check", pieceKeys: ["front", "sleeve"] });
    expect(corrected.fingerprint).not.toBe(snapshot.fingerprint);
  });

  it("changes the content fingerprint when editorial source text is corrected", () => {
    const rows = documents();
    const before = resolvePatternSnapshot(rows, versionId, "illustrative");
    record(rows, "source.stitches-demo").content = "Correction: shoulder source wording revised.";
    const after = resolvePatternSnapshot(rows, versionId, "illustrative");
    expect(after.fingerprint).not.toBe(before.fingerprint);
    expect(after.effectsByOperation["shoulder-width"].pieces).toEqual(before.effectsByOperation["shoulder-width"].pieces);
    expect(after.sourceDetails[0]?.content).toBe("Correction: shoulder source wording revised.");
  });

  it("withholds an unresolved source conflict until precedence is documented", () => {
    const rows = documents();
    rows.push({ _id: "source.erratum", _type: "sourceDocument", title: "Erratum", reviewStatus: "illustrative", content: "Corrected source" });
    record(rows, "source.stitches-demo").conflicts = [{ _ref: "source.erratum" }];
    expect(() => resolvePatternSnapshot(rows, versionId, "illustrative")).toThrow(/conflict without documented precedence/);
    record(rows, "source.erratum").supersedes = [{ _ref: "source.stitches-demo" }];
    expect(resolvePatternSnapshot(rows, versionId, "illustrative").sourceIds).toEqual(["source.erratum", "source.stitches-demo"]);
  });

  it("rejects cross-version references and missing edges", () => {
    const rows = documents();
    record(rows, "piece.sleeve").patternVersion._ref = "pattern-version.other";
    expect(() => resolvePatternSnapshot(rows, versionId, "illustrative")).toThrowError(KnowledgeError);
    expect(() => resolvePatternSnapshot(rows, versionId, "illustrative")).toThrow(/another pattern version/);

    const missingEdge = documents();
    record(missingEdge, "join.shoulders").endpoints[0].edgeId = "nonexistent";
    expect(() => resolvePatternSnapshot(missingEdge, versionId, "illustrative")).toThrow(/Edge nonexistent is missing/);
  });

  it("rejects cycles, duplicate IDs, and unreviewed fixture content in reviewed mode", () => {
    const cycle = documents();
    record(cycle, "step.shoulders").prerequisites = [{ _ref: "step.sleeves" }];
    expect(() => resolvePatternSnapshot(cycle, versionId, "illustrative")).toThrow(/cycle/);
    const duplicate = documents();
    duplicate.push(structuredClone(duplicate[0]));
    expect(() => resolvePatternSnapshot(duplicate, versionId, "illustrative")).toThrow(/Duplicate knowledge ID/);
    expect(() => resolvePatternSnapshot(documents(), versionId, "reviewed")).toThrow(/not reviewed/);
  });

  it("rejects ambiguous piece and step keys used by the garment studio", () => {
    const repeatedPiece = documents();
    record(repeatedPiece, "piece.back").pieceKey = "front";
    expect(() => resolvePatternSnapshot(repeatedPiece, versionId, "illustrative")).toThrow(/piece keys must be unique/);
    const repeatedStep = documents();
    record(repeatedStep, "step.neckline").stepKey = "join-shoulders";
    expect(() => resolvePatternSnapshot(repeatedStep, versionId, "illustrative")).toThrow(/step keys must be unique/);
  });

  it("permits a fully reviewed synthetic graph, without upgrading the fixture", () => {
    const rows = documents();
    for (const row of rows) {
      row._rev = `reviewed-${row._id}`;
      if ("reviewStatus" in row) row.reviewStatus = "reviewed";
      if (row._type === "seamConnection") { row.constraintStatus = "reviewed"; row.intendedEaseMm = 0; row.toleranceMm = 1; }
      if (row._type === "adjustmentRule") row.reviewedBounds = { min: 0, max: 8 };
    }
    rows.push({ _id: "fabric.requirement", _rev: "reviewed-fabric", _type: "fabricRequirement", patternVersion: { _ref: versionId }, title: "Synthetic woven fabric", reviewStatus: "reviewed", sources: [{ _ref: "source.stitches-demo" }] });
    const snapshot = resolvePatternSnapshot(rows, versionId, "reviewed");
    expect(snapshot.mode).toBe("reviewed");
    expect(snapshot.effectsByOperation["shoulder-width"].unresolvedChecks).toEqual([]);
  });
});
