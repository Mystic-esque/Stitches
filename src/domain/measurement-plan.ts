import { projectPlanSchema, type ProjectPlan } from "./guest-project";

export type MeasurementField = { key: string; label: string; unit: "cm" | "degrees"; helpUrl?: string };
export type MeasurementDraft = { lengths: Record<string, string>; angles: Record<string, string> };
const docs = "https://freesewing.eu/docs/measurements/";
// Maps exact source-listed labels to private planning keys. It is not an engine input adapter or measurement envelope.
const sourceFields: MeasurementField[] = [
  { key: "waist", label: "Waist circumference", unit: "cm", helpUrl: docs + "waist/" },
  { key: "waistToFloor", label: "Waist to floor", unit: "cm", helpUrl: docs + "waisttofloor/" },
  { key: "waistToHips", label: "Waist to hips", unit: "cm", helpUrl: docs + "waisttohips/" },
  { key: "hips", label: "Hips circumference", unit: "cm", helpUrl: docs + "hips/" },
  { key: "head", label: "Head circumference", unit: "cm", helpUrl: docs + "head/" },
  { key: "biceps", label: "Biceps circumference", unit: "cm", helpUrl: docs + "biceps/" },
  { key: "chest", label: "Chest circumference", unit: "cm", helpUrl: docs + "chest/" },
  { key: "hpsToWaistBack", label: "HPS to waist back", unit: "cm", helpUrl: docs + "hpstowaistback/" },
  { key: "neck", label: "Neck circumference", unit: "cm", helpUrl: docs + "neck/" },
  { key: "shoulderToShoulder", label: "Shoulder to shoulder", unit: "cm", helpUrl: docs + "shouldertoshoulder/" },
  { key: "shoulderSlope", label: "Shoulder slope", unit: "degrees", helpUrl: docs + "shoulderslope/" },
  { key: "waistToArmpit", label: "Waist to armpit", unit: "cm", helpUrl: docs + "waisttoarmpit/" },
  { key: "waistToSeat", label: "Waist to seat", unit: "cm", helpUrl: docs + "waisttoseat/" },
  { key: "seat", label: "Seat circumference", unit: "cm", helpUrl: docs + "seat/" },
  { key: "shoulderToWrist", label: "Shoulder to wrist", unit: "cm", helpUrl: docs + "shouldertowrist/" },
  { key: "waistToUnderbust", label: "Waist to underbust", unit: "cm", helpUrl: docs + "waisttounderbust/" },
  { key: "wrist", label: "Wrist circumference", unit: "cm", helpUrl: docs + "wrist/" },
];
export function measurementFields(requiredLabels?: string[]) {
  if (!requiredLabels) return { fields: [
    { key: "waist", label: "Waist", unit: "cm" }, { key: "bust", label: "Bust", unit: "cm" },
    { key: "hip", label: "Hip", unit: "cm" },
  ] as MeasurementField[], unmappedLabels: [] as string[] };
  const fields: MeasurementField[] = [], unmappedLabels: string[] = [];
  for (const label of requiredLabels) {
    const field = sourceFields.find((entry) => entry.label === label);
    if (!field) unmappedLabels.push(label);
    else if (!fields.some((entry) => entry.key === field.key)) fields.push(field);
  }
  return { fields, unmappedLabels };
}
export function profileMeasurementFields(): MeasurementField[] {
  return [...sourceFields, { key: "bust", label: "Bust (personal note; not chest)", unit: "cm" },
    { key: "hip", label: "Hip (personal note; not hips)", unit: "cm" }];
}
export function measurementDraftFor(plan: ProjectPlan): MeasurementDraft {
  return { lengths: Object.fromEntries(Object.entries(plan.measurementsMm).map(([key, value]) => [key, String(value / 10)])),
    angles: Object.fromEntries(Object.entries(plan.measurementsDegrees ?? {}).map(([key, value]) => [key, String(value)])) };
}
function numberOrAbsent(text: string, key: string): number | undefined {
  if (!text.trim()) return undefined;
  // Do not silently omit a negative/invalid value, or accept hexadecimal/exponent input.
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim()) || !Number.isFinite(Number(text)))
    throw new Error(`Review the measurement for ${key}. Use a plain number or leave it blank.`);
  return Number(text);
}
export function applyMeasurementDraft(plan: ProjectPlan, draft: MeasurementDraft): ProjectPlan {
  const lengths = { ...plan.measurementsMm };
  const angles: Record<string, number> = { ...plan.measurementsDegrees };
  for (const [key, text] of Object.entries(draft.lengths)) {
    if (plan.measurementsMm[key] !== undefined && text === String(plan.measurementsMm[key] / 10)) continue;
    const value = numberOrAbsent(text, key);
    if (value === undefined) delete lengths[key]; else lengths[key] = value * 10;
  }
  for (const [key, text] of Object.entries(draft.angles)) {
    const value = numberOrAbsent(text, key);
    if (value === undefined) delete angles[key]; else angles[key] = value;
  }
  const next = { ...plan, measurementsMm: lengths };
  if (Object.keys(angles).length || plan.measurementsDegrees !== undefined) next.measurementsDegrees = angles;
  return projectPlanSchema.parse(next);
}
export function measurementCoverage(fields: MeasurementField[], draft: MeasurementDraft) {
  return fields.filter((field) => (field.unit === "degrees" ? draft.angles[field.key] : draft.lengths[field.key])?.trim()).length;
}
