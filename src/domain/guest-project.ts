import { z } from "zod";

const label = (max: number) => z.string().trim().min(1).max(max);
const labels = z.array(label(100)).max(24);

export const projectSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("own_idea") }).strict(),
  z.object({ kind: z.literal("candidate"), designId: z.enum(["sandy", "tina"]) }).strict(),
]);

export const projectPlanSchema = z.object({
  features: labels,
  openQuestions: labels,
  measurementsMm: z.record(z.string().regex(/^[a-z][a-zA-Z0-9]{0,63}$/), z.number().finite().positive().max(3000)),
  fabric: z.object({
    description: z.string().trim().max(180),
    widthMm: z.number().int().min(100).max(5000).nullable(),
    lengthMm: z.number().int().min(100).max(50000).nullable(),
    structure: z.enum(["unknown", "woven", "knit"]),
  }).strict(),
  equipment: labels,
}).strict();

export const createGuestProjectSchema = z.object({
  title: label(100),
  brief: z.string().trim().max(1500),
  source: projectSourceSchema,
  plan: projectPlanSchema.optional(),
  idempotencyKey: z.string().uuid(),
}).strict();

export const projectBackupSchema = z.object({
  format: z.literal("stitches-project-backup"),
  version: z.literal(1),
  title: label(100),
  brief: z.string().trim().max(1500),
  source: projectSourceSchema,
  plan: projectPlanSchema,
}).strict();

export const updateGuestProjectSchema = z.object({
  expectedSequence: z.number().int().min(1),
  expectedBasisHash: z.string().regex(/^[a-f0-9]{64}$/),
  idempotencyKey: z.string().uuid(),
  title: label(100).optional(),
  brief: z.string().trim().max(1500).optional(),
  plan: projectPlanSchema.optional(),
}).strict().refine((input) => input.title !== undefined || input.brief !== undefined || input.plan !== undefined,
  "At least one project field must change.");

export type ProjectSource = z.infer<typeof projectSourceSchema>;
export type ProjectPlan = z.infer<typeof projectPlanSchema>;
export type CreateGuestProjectInput = z.infer<typeof createGuestProjectSchema>;
export type UpdateGuestProjectInput = z.infer<typeof updateGuestProjectSchema>;

export interface GuestProject {
  id: string;
  title: string;
  brief: string;
  source: ProjectSource;
  plan: ProjectPlan;
  capability: "plan_only";
  sequence: number;
  basisHash: string;
  knowledgeFingerprint: null;
  createdAt: string;
  updatedAt: string;
}

export function emptyProjectPlan(): ProjectPlan {
  return {
    features: [], openQuestions: [], measurementsMm: {},
    fabric: { description: "", widthMm: null, lengthMm: null, structure: "unknown" },
    equipment: [],
  };
}
