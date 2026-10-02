import { z } from "zod";

const fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
export const diagnosticEventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("observation"), observation: z.enum(["not-tested", "relaxes", "unchanged"]), detail: z.string().trim().max(600) }).strict(),
  z.object({ kind: z.literal("comparison_started"), observationId: z.string().uuid() }).strict(),
  z.object({ kind: z.literal("comparison_result"), attemptId: z.string().uuid(), outcome: z.enum(["helped", "no_change", "worse", "unsure"]), detail: z.string().trim().max(600) }).strict(),
  z.object({ kind: z.literal("paused"), reason: z.string().trim().min(1).max(600) }).strict(),
]);
export const diagnosticBindingSchema = z.object({
  catalogFingerprint: fingerprint, diagnosticFingerprint: fingerprint,
  sourceId: z.string().min(1).max(160), testId: z.string().min(1).max(160), remedyId: z.string().min(1).max(160),
  makingContext: z.object({ eventId: z.string().uuid(), planFingerprint: fingerprint,
    stepId: z.string().min(1).max(160), historySequence: z.number().int().positive() }).strict().optional(),
}).strict();
export const recordDiagnosticSchema = z.object({
  expectedProjectSequence: z.number().int().min(1), expectedBasisHash: fingerprint,
  expectedHistorySequence: z.number().int().min(0), expectedDiagnosticFingerprint: fingerprint,
  idempotencyKey: z.string().uuid(), event: diagnosticEventSchema,
  makingEventId: z.string().uuid().optional(),
}).strict();
export const diagnosticRecordSchema = z.object({
  id: z.string().uuid(), projectId: z.string().uuid(), sequence: z.number().int().min(1),
  basisSequence: z.number().int().min(1), basisHash: fingerprint, binding: diagnosticBindingSchema,
  event: diagnosticEventSchema, createdAt: z.iso.datetime(), imported: z.boolean(),
}).strict();
export type DiagnosticEvent = z.infer<typeof diagnosticEventSchema>;
export type DiagnosticBinding = z.infer<typeof diagnosticBindingSchema>;
export type DiagnosticRecord = z.infer<typeof diagnosticRecordSchema>;
export type RecordDiagnosticInput = z.infer<typeof recordDiagnosticSchema>;

// Pure eligibility, shared with the server. An imported record is history, never permission.
export function diagnosticTransitionError(history: DiagnosticRecord[], event: DiagnosticEvent, basisHash: string, binding: DiagnosticBinding, basisSequence: number): string | null {
  const eligible = history.filter((item) => !item.imported && item.basisHash === basisHash && item.basisSequence === basisSequence &&
    item.binding.catalogFingerprint === binding.catalogFingerprint && item.binding.diagnosticFingerprint === binding.diagnosticFingerprint);
  const last = eligible.at(-1);
  if (event.kind === "observation") return last?.event.kind === "comparison_started" ? "Record the comparison result or pause before another observation." : null;
  if (event.kind === "paused") return !last || last.event.kind === "paused" ? "There is no active check to pause." : null;
  if (event.kind === "comparison_started") {
    if (last?.binding.makingContext?.eventId !== binding.makingContext?.eventId)
      return "The comparison must retain its original making-step context.";
    if (!last || last.id !== event.observationId || last.event.kind !== "observation" || last.event.observation !== "relaxes")
      return "A current saved relaxed-sample observation is required before this comparison.";
    if (eligible.some((item) => item.event.kind === "comparison_result") ||
      eligible.some((item) => item.event.kind === "paused")) return "Do not repeat a completed, unsuccessful or paused comparison on this basis. Keep the evidence and seek review.";
    return null;
  }
  return last?.event.kind === "comparison_started" && last.id === event.attemptId &&
    last.binding.makingContext?.eventId === binding.makingContext?.eventId ? null : "This result must belong to the active, current scrap comparison.";
}

export function diagnosticEventLabel(event: DiagnosticEvent): string {
  if (event.kind === "observation") return event.observation === "relaxes" ? "Sample relaxed after stitch release" : event.observation === "unchanged" ? "No visible change after stitch release" : "Not tested yet";
  if (event.kind === "comparison_started") return "Started a lower-tension scrap comparison";
  if (event.kind === "paused") return "Paused this check";
  return { helped: "Maker reported improvement", no_change: "Maker reported no improvement", worse: "Maker reported a worse result", unsure: "Maker is unsure of the result" }[event.outcome];
}
