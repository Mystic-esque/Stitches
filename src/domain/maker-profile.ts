import { z } from "zod";
import { projectPlanSchema, type ProjectPlan } from "./guest-project";

export const experienceSchema = z.enum(["beginner", "comfortable", "experienced"]);
export const profileValuesSchema = z.object({
  name: z.string().trim().min(1).max(100),
  experience: experienceSchema,
  measurementsMm: projectPlanSchema.shape.measurementsMm,
  measurementsDegrees: projectPlanSchema.shape.measurementsDegrees,
  equipment: projectPlanSchema.shape.equipment,
}).strict();
export const profileBackupSchema = z.object({
  format: z.literal("stitches-maker-backup"), version: z.literal(1), profile: profileValuesSchema,
}).strict();
export const saveMakerProfileSchema = z.object({
  profile: profileValuesSchema,
  expectedSequence: z.number().int().min(0),
  expectedBasisHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  idempotencyKey: z.string().uuid(),
}).strict().refine((v) => (v.expectedSequence === 0) === (v.expectedBasisHash === null), "Review the profile basis.");
export const importMakerProfileSchema = z.object({
  backup: profileBackupSchema,
  expectedSequence: z.number().int().min(0),
  expectedBasisHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  idempotencyKey: z.string().uuid(),
}).strict();
export const copyMakerProfileSchema = z.object({
  expectedSequence: z.number().int().min(1), expectedBasisHash: z.string().regex(/^[a-f0-9]{64}$/),
  profileId: z.string().uuid(), expectedProfileSequence: z.number().int().min(1),
  expectedProfileBasisHash: z.string().regex(/^[a-f0-9]{64}$/), idempotencyKey: z.string().uuid(),
}).strict();
export type ProfileValues = z.infer<typeof profileValuesSchema>;
export type MakerProfile = ProfileValues & { id: string; sequence: number; basisHash: string; createdAt: string; updatedAt: string };
export type SaveMakerProfileInput = z.infer<typeof saveMakerProfileSchema>;
export type CopyMakerProfileInput = z.infer<typeof copyMakerProfileSchema>;

// Explicit fill-missing policy: never infer aliases or replace a project value, including a zero angle.
export function profileCopyPreview(plan: ProjectPlan, profile: MakerProfile) {
  const measurementsMm = { ...plan.measurementsMm };
  const measurementsDegrees = { ...plan.measurementsDegrees };
  const added: string[] = [], retained: string[] = [];
  for (const [key, value] of Object.entries(profile.measurementsMm)) {
    if (measurementsMm[key] === undefined) { measurementsMm[key] = value; added.push(`${key}: ${value / 10} cm`); }
    else if (measurementsMm[key] !== value) retained.push(`${key}: kept ${measurementsMm[key] / 10} cm`);
  }
  for (const [key, value] of Object.entries(profile.measurementsDegrees ?? {})) {
    if (measurementsDegrees[key as "shoulderSlope"] === undefined) {
      measurementsDegrees[key as "shoulderSlope"] = value; added.push(`${key}: ${value} degrees`);
    } else if (measurementsDegrees[key as "shoulderSlope"] !== value) retained.push(`${key}: kept ${measurementsDegrees[key as "shoulderSlope"]} degrees`);
  }
  const equipment = [...plan.equipment];
  for (const item of profile.equipment) if (!equipment.includes(item)) { equipment.push(item); added.push(`Tool: ${item}`); }
  if (plan.experience === undefined) added.push(`Experience: ${profile.experience}`);
  else if (plan.experience !== profile.experience) retained.push(`Experience: kept ${plan.experience}`);
  const next: ProjectPlan = { ...plan, measurementsMm, equipment, experience: plan.experience ?? profile.experience,
    profileBasis: { profileId: profile.id, name: profile.name, sequence: profile.sequence, basisHash: profile.basisHash } };
  if (plan.measurementsDegrees !== undefined || Object.keys(measurementsDegrees).length) next.measurementsDegrees = measurementsDegrees;
  return { plan: projectPlanSchema.parse(next), added, retained };
}
