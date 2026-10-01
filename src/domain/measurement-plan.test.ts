import { describe, expect, it } from "vitest";
import { emptyProjectPlan, projectPlanSchema } from "./guest-project";
import { applyMeasurementDraft, measurementDraftFor, measurementFields, measurementCoverage } from "./measurement-plan";
import sourceFixture from "../../fixtures/companion-candidates.json";

describe("private source-specific measurement planning", () => {
  it("maps both exact candidate lists with length/angle separation and refuses to invent a new label", () => {
    const candidates = sourceFixture.documents.filter((doc) => doc._type === "planningCandidate");
    for (const candidate of candidates) {
      const resolved = measurementFields(candidate.requiredMeasurements);
      expect(resolved.unmappedLabels).toEqual([]);
      expect(resolved.fields.map((field) => field.label)).toEqual(candidate.requiredMeasurements);
    }
    const slope = measurementFields(["Shoulder slope", "Unknown future measure"]);
    expect(slope.fields[0].unit).toBe("degrees");
    expect(slope.unmappedLabels).toEqual(["Unknown future measure"]);
  });
  it("preserves unexposed values and the legacy plan shape while editing a different field", () => {
    const plan = { ...emptyProjectPlan(), measurementsMm: { waist: 780, hip: 980, specialistLength: 100.3 } };
    expect(applyMeasurementDraft(plan, measurementDraftFor(plan))).toEqual(plan);
    const next = applyMeasurementDraft(plan, { lengths: { waist: "81.25" }, angles: {} });
    expect(next.measurementsMm).toEqual({ waist: 812.5, hip: 980, specialistLength: 100.3 });
    expect(next).not.toHaveProperty("measurementsDegrees");
    expect(plan.measurementsMm.waist).toBe(780);
  });
  it("clears only deliberately blanked keys, preserves zero degrees, and never aliases hip/bust to hips/chest", () => {
    const plan = { ...emptyProjectPlan(), measurementsMm: { bust: 900, hip: 1000, waist: 780 } };
    const next = applyMeasurementDraft(plan, { lengths: { waist: "", hips: "102.5" }, angles: { shoulderSlope: "0" } });
    expect(next.measurementsMm).toEqual({ bust: 900, hip: 1000, hips: 1025 });
    expect(next.measurementsDegrees).toEqual({ shoulderSlope: 0 });
    const fields = measurementFields(["Hips circumference", "Chest circumference", "Shoulder slope"]).fields;
    expect(measurementCoverage(fields, measurementDraftFor(next))).toBe(2);
  });
  it("refuses invalid numeric text, angle-in-length, unsupported angles and out-of-storage-bounds without changing the plan", () => {
    const plan = emptyProjectPlan();
    for (const text of ["-3", "NaN", "Infinity", "0x20", "1e2", "0", "301"])
      expect(() => applyMeasurementDraft(plan, { lengths: { waist: text }, angles: {} })).toThrow();
    expect(() => applyMeasurementDraft(plan, { lengths: { shoulderSlope: "15" }, angles: {} })).toThrow();
    expect(() => applyMeasurementDraft(plan, { lengths: {}, angles: { shoulderSlope: "91" } })).toThrow();
    expect(() => applyMeasurementDraft(plan, { lengths: {}, angles: { unknownAngle: "10" } })).toThrow();
    expect(projectPlanSchema.safeParse({ ...plan, measurementsDegrees: { shoulderSlope: -1 } }).success).toBe(false);
    expect(plan).toEqual(emptyProjectPlan());
  });
});
