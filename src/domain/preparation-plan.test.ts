import { describe, expect, it } from "vitest";
import { emptyProjectPlan, type GuestProject } from "./guest-project";
import { preparationPlan, planningBrief } from "./preparation-plan";

const source = { fingerprint: "a".repeat(64), title: "Source planning start", sourceTitle: "Source documentation", sourceUrl: "https://example.invalid/source",
  requiredMeasurements: ["Waist circumference", "Hips circumference", "Shoulder slope"], materialStructure: "woven" as const, reviewStatus: "pending" as const };
const project: GuestProject = { id: "synthetic", title: "My project", brief: "For review", source: { kind: "candidate", designId: "sandy" }, plan: emptyProjectPlan(),
  capability: "plan_only", sequence: 1, basisHash: "b".repeat(64), knowledgeFingerprint: source.fingerprint, createdAt: "2026-10-02T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z" };
describe("truthful preparation and planning brief", () => {
  it("uses exact current names and dimensions, preserves a zero angle, and never treats complete notes as cut-ready", () => {
    const withNotes = { ...project, plan: { ...project.plan, measurementsMm: { waist: 720, hip: 960 }, measurementsDegrees: { shoulderSlope: 0 } } };
    const partial = preparationPlan(withNotes, source); expect(partial.missingMeasurements).toEqual(["Hips circumference"]);
    const full = preparationPlan({ ...withNotes, plan: { ...withNotes.plan, measurementsMm: { waist: 720, hips: 960 }, fabric: { description: "Cotton", structure: "woven", widthMm: 1400, lengthMm: 2200 }, equipment: ["Machine"] } }, source);
    expect(full.items.find((item) => item.id === "measurements")?.state).toBe("recorded");
    expect(full.items.find((item) => item.id === "cutting")?.state).toBe("blocked");
    expect(full.items.find((item) => item.id === "source")?.state).toBe("review");
    expect(planningBrief(withNotes, [], source)).toContain("shoulderSlope: 0 degrees");
    expect(planningBrief(withNotes, [], source)).toContain("waist: 720 mm");
    expect(planningBrief(withNotes, [], source)).toContain("NOT a sewing pattern");
  });
  it("does not apply cached or unknown source requirements, detects material conflict, and keeps personal ideas independent", () => {
    expect(preparationPlan(project, { ...source, fingerprint: "c".repeat(64) }).sourceCurrent).toBe(false);
    expect(preparationPlan(project).missingMeasurements).toEqual([]);
    expect(preparationPlan({ ...project, source: { kind: "own_idea" } }, source).sourceCurrent).toBe(false);
    expect(preparationPlan(project, { ...source, requiredMeasurements: ["Unknown dimension"] }).items.find((item) => item.id === "measurements")?.detail).toContain("Nothing is guessed");
    const conflict = preparationPlan({ ...project, plan: { ...project.plan, fabric: { ...project.plan.fabric, structure: "knit" } } }, source);
    expect(conflict.items.find((item) => item.id === "material")?.state).toBe("review");
    expect(planningBrief(project, [], { ...source, fingerprint: "c".repeat(64) })).not.toContain(source.sourceUrl);
  });
});
