import { z } from "zod";

export const makingOptionsSchema = z.object({ sleeves: z.boolean(), frontBottom: z.boolean(), dart: z.boolean() }).strict();
export type MakingOptions = z.infer<typeof makingOptionsSchema>;
export type MakingStep = {
  id: string; title: string; ordinal: number; condition: "always" | "sleeves" | "front-bottom" | "dart";
  requires: string[]; pieceKeys: string[]; edgeIds: string[]; orientation: string; action: string;
  checkpoint: string; diagnostic: boolean;
};
export type MakingPlan = {
  id: string; designKey: "sandy" | "tina"; title: string; fingerprint: string;
  sourceUrl: string; sourceTitle: string; envelope: string; reviewStatus: "pending";
  capability: "plan_only"; steps: MakingStep[];
};

export function activeMakingSteps(plan: MakingPlan, options: MakingOptions): MakingStep[] {
  return plan.steps.filter((step) => step.condition === "always" ||
    (step.condition === "sleeves" && options.sleeves) ||
    (step.condition === "front-bottom" && options.frontBottom) || (step.condition === "dart" && options.dart));
}

// A disabled optional step carries its prerequisites through, not a false completion.
export function makingPrerequisites(plan: MakingPlan, options: MakingOptions, stepId: string): string[] {
  const active = new Set(activeMakingSteps(plan, options).map((step) => step.id));
  const byId = new Map(plan.steps.map((step) => [step.id, step]));
  const walk = (id: string, seen = new Set<string>()): string[] => {
    if (seen.has(id)) throw new Error("Cyclic making prerequisites.");
    const step = byId.get(id);
    if (!step) throw new Error("Missing making prerequisite.");
    if (active.has(id)) return [id];
    return step.requires.flatMap((parent) => walk(parent, new Set([...seen, id])));
  };
  const step = byId.get(stepId);
  if (!step) throw new Error("Unknown making step.");
  return [...new Set(step.requires.flatMap((id) => walk(id)))];
}

const fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
const text = z.string().trim().min(1).max(600);
export const makingEventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("configured"), options: makingOptionsSchema }).strict(),
  z.object({ kind: z.literal("reviewed"), stepId: text, checkpointConfirmed: z.literal(true) }).strict(),
  z.object({ kind: z.literal("help_requested"), stepId: text, symptom: z.enum(["seam_puckering", "alignment", "other"]), detail: text }).strict(),
  z.object({ kind: z.literal("paused"), reason: text }).strict(),
]);
export const recordMakingSchema = z.object({
  expectedProjectSequence: z.number().int().positive(), expectedBasisHash: fingerprint,
  expectedHistorySequence: z.number().int().min(0), planFingerprint: fingerprint,
  idempotencyKey: z.string().uuid(), event: makingEventSchema,
}).strict();
export const makingRecordSchema = z.object({
  id: z.string().uuid(), projectId: z.string().uuid(), sequence: z.number().int().positive(),
  basisSequence: z.number().int().positive(), basisHash: fingerprint, catalogFingerprint: fingerprint,
  planFingerprint: fingerprint, sessionId: z.string().uuid(), event: makingEventSchema,
  createdAt: z.iso.datetime(), imported: z.boolean(),
}).strict();
export type MakingRecord = z.infer<typeof makingRecordSchema>;
export type RecordMakingInput = z.infer<typeof recordMakingSchema>;

export function currentMakingSession(history: MakingRecord[], basis: {
  sequence: number; basisHash: string; knowledgeFingerprint: string | null;
}, plan: MakingPlan) {
  const current = history.filter((entry) => !entry.imported && entry.basisSequence === basis.sequence &&
    entry.basisHash === basis.basisHash && entry.catalogFingerprint === basis.knowledgeFingerprint &&
    entry.planFingerprint === plan.fingerprint);
  const configured = current.findLast((entry) => entry.event.kind === "configured");
  if (!configured || configured.event.kind !== "configured") return null;
  const records = current.filter((entry) => entry.sessionId === configured.id);
  const options = configured.event.options;
  const reviewed = new Set(records.filter((entry) => entry.event.kind === "reviewed")
    .map((entry) => entry.event.kind === "reviewed" ? entry.event.stepId : ""));
  const steps = activeMakingSteps(plan, options);
  const next = steps.find((step) => !reviewed.has(step.id) && makingPrerequisites(plan, options, step.id).every((id) => reviewed.has(id)));
  return { configured, options, records, reviewed, steps, next };
}

export function makingTransitionError(history: MakingRecord[], basis: Parameters<typeof currentMakingSession>[1],
  plan: MakingPlan, input: RecordMakingInput): string | null {
  if (input.event.kind === "configured") {
    if (plan.designKey === "sandy" && Object.values(input.event.options).some(Boolean))
      return "Sandy's supported study has no sleeve, front-bottom or dart options.";
    return null;
  }
  const session = currentMakingSession(history, basis, plan);
  if (!session) return "Review the source and explicitly confirm a configuration for this revision first.";
  if (input.event.kind === "paused") return null;
  const stepId = input.event.stepId;
  if (!session.steps.some((step) => step.id === stepId)) return "That step is not part of the confirmed configuration.";
  if (!makingPrerequisites(plan, session.options, stepId).every((id) => session.reviewed.has(id)))
    return "Review the authored prerequisites before this step.";
  if (input.event.kind === "reviewed" && session.reviewed.has(stepId)) return "This study checkpoint has already been recorded.";
  if (input.event.kind === "help_requested" && session.next?.id !== stepId) return "Contextual help belongs to the next unreviewed study step.";
  if (input.event.kind === "help_requested" && input.event.symptom === "seam_puckering" &&
    !session.steps.find((step) => step.id === stepId)?.diagnostic) return "The scrap-seam diagnostic does not apply to this step.";
  return null;
}
