import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { emptyProjectPlan, type GuestProject } from "../../domain/guest-project";
import { resolveCompanionCatalog } from "../knowledge/companion-catalog";
import { createPatternStudy, PatternStudyError } from "./pattern-study";
const docs = ["companion-candidates", "companion-piece-studies", "companion-diagnostic"].flatMap(name => JSON.parse(readFileSync(new URL(`../../../fixtures/${name}.json`, import.meta.url), "utf8")).documents).map((item: object, index: number) => ({ ...item, _rev: `study-${index}` }));
const [source, tina] = resolveCompanionCatalog(docs);
const project: GuestProject = { id: "a3663796-4a7c-4b73-84d5-39910901c643", title: "Synthetic study", brief: "Not a maker trial", source: { kind: "candidate", designId: "sandy" }, plan: { ...emptyProjectPlan(), measurementsMm: { waist: 720, hips: 960, waistToFloor: 1000, waistToHips: 200 } }, capability: "plan_only", sequence: 1, basisHash: "a".repeat(64), knowledgeFingerprint: source.fingerprint, createdAt: "2026-10-02T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z" };
const command = { expectedSequence: 1, expectedBasisHash: project.basisHash, expectedSourceFingerprint: source.fingerprint, useSavedMeasurements: true as const, command: "study_hem_length" as const, lengthRatio: .5, deltaLengthMm: 50, seamAllowanceMm: 10 };
describe("actual pinned measured study, not cutting qualification", () => {
  it("redrafts two inputs deterministically with real impacts and unchanged waist/band", () => {
    for (const measurementsMm of [project.plan.measurementsMm, { waist: 880, hips: 1100, waistToFloor: 1080, waistToHips: 220 }]) {
      const current = { ...project, plan: { ...project.plan, measurementsMm } }, saved = JSON.stringify(current), study = createPatternStudy(current, source, command);
      expect(study).toEqual(createPatternStudy(current, source, command));
      expect(study.before.mapping.artifactHash).not.toBe(study.after.mapping.artifactHash);
      expect(study.before.mapping.edges.map(e => e.id)).toEqual(study.after.mapping.edges.map(e => e.id));
      expect(study.impact.changedEdgeIds.sort()).toEqual(["sandy.skirt/hem", "sandy.skirt/opening", "sandy.skirt/fold"].sort());
      const edge = study.impact.edgeLengthChanges.find(e => e.id.endsWith("/opening"))!;
      expect(edge.afterMm - edge.beforeMm).toBeCloseTo(50, 8);
      expect(study.after.draft.measuredJoin.differenceMm).toBeLessThan(.5);
      expect(study.after.mapping.notchComparison.approvedPair).toBe(false);
      expect(study.after.mapping.steps.every(s => !s.executionEnabled)).toBe(true);
      expect(study.after.draft.parts.map(p => p.cut.materials.fabric[0].onFold)).toEqual([true, false]);
      expect(study.cutReady).toBe(false); expect(study.capability).toBe("plan_only"); expect(JSON.stringify(current)).toBe(saved);
    }
  });
  it("refuses missing inputs, unsupported source and mathematical conflicts", () => {
    expect(() => createPatternStudy({ ...project, plan: emptyProjectPlan() }, source, command)).toThrow(/Save these/);
    expect(() => createPatternStudy({ ...project, source: { kind: "candidate", designId: "tina" } }, tina, command)).toThrow(/only for Sandy/);
    expect(() => createPatternStudy(project, { ...source, requiredMeasurements: ["Waist circumference"] }, command)).toThrow(/contract changed/);
    expect(() => createPatternStudy(project, { ...source, pieceStudy: source.pieceStudy.map(p => p.pieceKey === "waistband-straight" ? { ...p, cutCount: 2 } : p) }, command)).toThrow(/cut\/fold contract/);
    expect(() => createPatternStudy({ ...project, plan: { ...project.plan, measurementsMm: { ...project.plan.measurementsMm, hips: 600 } } }, source, command)).toThrow(/mathematical study/);
  });
  it("exposes current basis on stale project or source, without generating substitute geometry", () => {
    for (const current of [{ ...project, sequence: 2 }, { ...project, basisHash: "b".repeat(64) }, { ...project, knowledgeFingerprint: "c".repeat(64) }]) {
      try { createPatternStudy(current, source, command); throw Error("Expected refusal"); }
      catch (error) { expect(error).toBeInstanceOf(PatternStudyError); expect((error as PatternStudyError).code).toBe("stale"); expect((error as PatternStudyError).currentBasis?.sequence).toBe(current.sequence); }
    }
    expect(() => createPatternStudy(project, { ...source, fingerprint: "d".repeat(64) }, command)).toThrow(/source changed/);
  });
  it("refuses path/point injection, unsupported commands, bounds and out-of-range redraft", () => {
    for (const input of [{ ...command, command: "move_point" }, { ...command, points: "M0 0" }, { ...command, deltaLengthMm: 201 }, { ...command, seamAllowanceMm: -1 }]) expect(() => createPatternStudy(project, source, input)).toThrow();
    expect(() => createPatternStudy(project, source, { ...command, lengthRatio: .95, deltaLengthMm: 100 })).toThrow(/envelope/);
  });
  it("zero comparison is identical and zero allowance does not invent an outline", () => {
    const study = createPatternStudy(project, source, { ...command, deltaLengthMm: 0, seamAllowanceMm: 0 });
    expect(study.before.mapping.artifactHash).toBe(study.after.mapping.artifactHash); expect(study.impact.changedEdgeIds).toEqual([]);
    expect(study.after.draft.parts.every(p => p.paths.sa === undefined)).toBe(true);
  });
});
