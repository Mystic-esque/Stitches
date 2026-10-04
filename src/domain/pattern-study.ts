import { z } from "zod";

const point = z.object({ x: z.number().finite().min(-100000).max(100000), y: z.number().finite().min(-100000).max(100000) });
export const pathOperationsSchema = z.array(z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), to: point }), z.object({ type: z.literal("line"), to: point }),
  z.object({ type: z.literal("curve"), to: point, cp1: point, cp2: point }), z.object({ type: z.literal("close") }),
])).min(2).max(1000);
export type PathOperations = z.infer<typeof pathOperationsSchema>;
export type StudyPoint = z.infer<typeof point>;
export const patternStudyRequestSchema = z.object({
  expectedSequence: z.number().int().positive(), expectedBasisHash: z.string().regex(/^[a-f0-9]{64}$/),
  expectedSourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/), useSavedMeasurements: z.literal(true),
  command: z.literal("study_hem_length"), lengthRatio: z.number().finite().min(.1).max(1),
  deltaLengthMm: z.number().finite().min(-200).max(200), seamAllowanceMm: z.number().finite().min(0).max(30),
}).strict();
export type PatternStudyRequest = z.infer<typeof patternStudyRequestSchema>;
export const studyMappingSchema = z.object({ artifactHash: z.string().regex(/^[a-f0-9]{64}$/),
  edges: z.array(z.object({ id: z.string(), pieceId: z.string(), operations: pathOperationsSchema, lengthMm: z.number().finite().nonnegative(), stitchOutlineSegment: z.boolean() })),
  markings: z.array(z.object({ id: z.string(), pieceId: z.string(), anchor: point, status: z.literal("engine-mark-only"), approvedCounterpartId: z.null() })),
  steps: z.array(z.object({ id: z.string(), title: z.string(), requires: z.array(z.string()), edges: z.array(z.string()), section: z.string(), explanation: z.string(), sourceUrl: z.url(), reviewStatus: z.literal("pending"), executionEnabled: z.literal(false) })),
  missingBindings: z.array(z.string()), notchComparison: z.object({ differenceMm: z.number().finite(), approvedPair: z.literal(false) }),
});
export type StudyMapping = z.infer<typeof studyMappingSchema>;
export const rawDraftSchema = z.object({ units: z.literal("mm"),
  parts: z.array(z.object({ id: z.enum(["sandy.skirt", "sandy.waistband"]),
    paths: z.record(z.string(), z.object({ operations: pathOperationsSchema })),
    cut: z.object({ grain: z.number().finite(), materials: z.object({ fabric: z.array(z.object({ cut: z.number().int().positive(), onFold: z.boolean() })).min(1) }) }),
  })).length(2), measuredJoin: z.object({ skirtStitchMm: z.number().finite(), waistbandStitchMm: z.number().finite(), overlapMm: z.number().finite(), differenceMm: z.number().finite() }),
});
export type StudyDraft = z.infer<typeof rawDraftSchema>;
export const studyImpactSchema = z.object({ changedEdgeIds: z.array(z.string()),
  edgeLengthChanges: z.array(z.object({ id: z.string(), beforeMm: z.number().finite(), afterMm: z.number().finite() })), affectedStudyStepIds: z.array(z.string()) });
export type PatternStudy = {
  basis: { projectId: string; sequence: number; basisHash: string; sourceFingerprint: string };
  engine: { engine: string; version: string; design: string; designVersion: string };
  command: PatternStudyRequest; before: { draft: StudyDraft; mapping: StudyMapping }; after: { draft: StudyDraft; mapping: StudyMapping };
  impact: z.infer<typeof studyImpactSchema>; capability: "plan_only"; projectChanged: false; cutReady: false;
  sourceUrl: string; missingReceipts: string[];
};
// A saved study is design intent and a reproducible receipt, never a cutting pattern.
export const savedStudySchema = z.object({
  id: z.uuid(), projectId: z.uuid(), createdAt: z.iso.datetime(),
  basis: z.object({ projectId: z.uuid(), sequence: z.number().int().positive(), basisHash: z.string().regex(/^[a-f0-9]{64}$/), sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  command: patternStudyRequestSchema,
  beforeHash: z.string().regex(/^[a-f0-9]{64}$/), afterHash: z.string().regex(/^[a-f0-9]{64}$/),
  impact: studyImpactSchema, capability: z.literal("plan_only"), cutReady: z.literal(false),
  imported: z.boolean().optional(),
}).strict();
export type SavedStudy = z.infer<typeof savedStudySchema>;
export const saveStudyRequestSchema = z.object({
  study: z.object({ basis: savedStudySchema.shape.basis, command: patternStudyRequestSchema,
    beforeHash: savedStudySchema.shape.beforeHash, afterHash: savedStudySchema.shape.afterHash }).strict(),
  idempotencyKey: z.uuid(),
}).strict();
export function operationsPath(operations: PathOperations): string {
  return operations.map(op => op.type === "close" ? "Z" : op.type === "curve"
    ? `C ${op.cp1.x} ${op.cp1.y} ${op.cp2.x} ${op.cp2.y} ${op.to.x} ${op.to.y}`
    : `${op.type === "move" ? "M" : "L"} ${op.to.x} ${op.to.y}`).join(" ");
}
export function studyBounds(paths: PathOperations[]) {
  const points = paths.flatMap(ops => ops.flatMap(op => op.type === "close" ? [] : op.type === "curve" ? [op.to, op.cp1, op.cp2] : [op.to]));
  if (!points.length) throw new Error("No measurable outline.");
  const xs = points.map(p => p.x), ys = points.map(p => p.y), padding = 24;
  const minX = Math.min(...xs) - padding, minY = Math.min(...ys) - padding;
  return `${minX} ${minY} ${Math.max(...xs) - minX + padding} ${Math.max(...ys) - minY + padding}`;
}
