import { createHash } from "node:crypto";
import { z } from "zod";

const reference = z.object({ _ref: z.string().min(1) });
const base = z.object({ _id: z.string().min(1), _rev: z.string().optional() });
const sourceSchema = base.extend({ _type: z.literal("sourceDocument"), title: z.string().min(1), reviewStatus: z.string(), locator: z.string().optional(), content: z.string().optional(), url: z.url().optional(), author: z.string().optional(), version: z.string().optional(), licenseNotes: z.string().optional(), reviewedAt: z.string().optional(), supersedes: z.array(reference).optional(), conflicts: z.array(reference).optional() });
const patternSchema = base.extend({ _type: z.literal("pattern"), title: z.string().min(1), category: z.string().optional(), creator: z.string().optional(), licenseStatus: z.string().optional() });
const versionSchema = base.extend({ _type: z.literal("patternVersion"), pattern: reference, version: z.string().min(1), reviewStatus: z.string(), engineAdapter: z.string().optional(), engineVersion: z.string().optional(), requiredMeasurements: z.array(z.string()).optional(), supportedOperationIds: z.array(z.string()), sources: z.array(reference).default([]) });
const pieceSchema = base.extend({ _type: z.literal("patternPiece"), patternVersion: reference, pieceKey: z.string().min(1), title: z.string().min(1), role: z.string().optional(), edgeIds: z.array(z.string()), cutCount: z.number().int().positive().optional(), mirrored: z.boolean().optional(), onFold: z.boolean().optional(), grainNotes: z.string().optional(), demoCut: z.object({ count: z.number().int().positive(), mirrored: z.boolean().optional(), onFold: z.boolean().optional() }).optional(), sources: z.array(reference).optional() });
const endpointSchema = z.object({ piece: reference, edgeId: z.string().min(1), side: z.string().optional() });
const joinSchema = base.extend({ _type: z.literal("seamConnection"), patternVersion: reference, endpoints: z.array(endpointSchema).min(2), relation: z.string().optional(), constraintStatus: z.string(), intendedEaseMm: z.number().nullable().optional(), toleranceMm: z.number().nullable().optional(), notchNotes: z.string().optional(), sources: z.array(reference).optional() });
const rangeSchema = z.object({ min: z.number().finite(), max: z.number().finite() });
const ruleSchema = base.extend({ _type: z.literal("adjustmentRule"), patternVersion: reference, operationId: z.string().min(1), inputUnit: z.string().min(1), reviewStatus: z.string(), explanation: z.string().optional(), reviewedBounds: rangeSchema.nullable().optional(), supportedLocks: z.array(z.string()), directPieces: z.array(reference), recheckJoins: z.array(reference), dependentRules: z.array(reference).optional(), invalidate: z.array(z.string()), sources: z.array(reference).min(1) });
const stepSchema = base.extend({ _type: z.literal("instructionStep"), patternVersion: reference, stepKey: z.string().min(1), title: z.string().min(1), body: z.array(z.unknown()).optional(), revisionApplicability: z.string().optional(), prerequisites: z.array(reference), pieces: z.array(reference).optional(), affectedBy: z.array(reference) });
const fabricSchema = base.extend({ _type: z.literal("fabricRequirement"), patternVersion: reference, title: z.string().min(1), constructionClass: z.string().optional(), behaviorNotes: z.string().optional(), grainDirection: z.string().optional(), reviewStatus: z.string(), sources: z.array(reference) });

export const knowledgeDocumentSchema = z.discriminatedUnion("_type", [sourceSchema, patternSchema, versionSchema, pieceSchema, joinSchema, ruleSchema, stepSchema, fabricSchema]);
export type KnowledgeDocument = z.infer<typeof knowledgeDocumentSchema>;
export type KnowledgeMode = "illustrative" | "reviewed";

export type PieceEffect = { pieceId: string; pieceTitle: string; via: "direct" | "join"; ruleId: string; joinId?: string; sourceIds: string[] };
export type SourceDetail = { id: string; title: string; reviewStatus: string; locator?: string; content?: string; url?: string; licenseNotes?: string };
export type GarmentPiece = { id: string; key: string; title: string; cutCount?: number; mirrored?: boolean; onFold?: boolean; edgeIds: string[] };
export type GarmentConnection = { id: string; pieceKeys: string[]; edgeIds: string[]; relation: string; constraintStatus: string };
export type AssemblyStep = { id: string; key: string; title: string; prerequisiteKeys: string[]; pieceKeys: string[]; affectedByOperationIds: string[] };
export type PatternSnapshot = {
  patternId: string;
  patternTitle: string;
  category?: string;
  versionId: string;
  version: string;
  mode: KnowledgeMode;
  fingerprint: string;
  pieceIds: string[];
  joinIds: string[];
  ruleIds: string[];
  stepIds: string[];
  sourceIds: string[];
  sourceDetails: SourceDetail[];
  garmentPieces: GarmentPiece[];
  garmentConnections: GarmentConnection[];
  assemblySteps: AssemblyStep[];
  effectsByOperation: Record<string, { pieces: PieceEffect[]; stepIds: string[]; dependentRuleIds: string[]; invalidates: string[]; unresolvedChecks: string[] }>;
};

export class KnowledgeError extends Error {
  constructor(public readonly code: "invalid" | "missing" | "cross-version" | "unreviewed" | "cycle" | "conflict", message: string) {
    super(message);
    this.name = "KnowledgeError";
  }
}

function parseDocuments(raw: unknown): KnowledgeDocument[] {
  if (!Array.isArray(raw)) throw new KnowledgeError("invalid", "Expected a bounded array of knowledge documents.");
  if (raw.length > 500) throw new KnowledgeError("invalid", "Knowledge response exceeds the document limit.");
  return raw.map((item) => {
    const result = knowledgeDocumentSchema.safeParse(item);
    if (!result.success) throw new KnowledgeError("invalid", `Malformed knowledge document: ${result.error.issues[0]?.path.join(".") ?? "unknown field"}.`);
    return result.data;
  });
}

export function resolvePatternSnapshot(raw: unknown, versionId: string, mode: KnowledgeMode): PatternSnapshot {
  const documents = parseDocuments(raw);
  const byId = new Map<string, KnowledgeDocument>();
  for (const document of documents) {
    if (byId.has(document._id)) throw new KnowledgeError("conflict", `Duplicate knowledge ID ${document._id}.`);
    byId.set(document._id, document);
  }
  function need<T extends KnowledgeDocument["_type"]>(id: string, type: T): Extract<KnowledgeDocument, { _type: T }> {
    const document = byId.get(id);
    if (!document || document._type !== type) throw new KnowledgeError("missing", `Required ${type} ${id} is missing or has the wrong type.`);
    return document as Extract<KnowledgeDocument, { _type: T }>;
  }
  const version = need(versionId, "patternVersion");
  const pattern = need(version.pattern._ref, "pattern");
  const pieces = documents.filter((item): item is Extract<KnowledgeDocument, { _type: "patternPiece" }> => item._type === "patternPiece" && item.patternVersion._ref === versionId);
  const joins = documents.filter((item): item is Extract<KnowledgeDocument, { _type: "seamConnection" }> => item._type === "seamConnection" && item.patternVersion._ref === versionId);
  const rules = documents.filter((item): item is Extract<KnowledgeDocument, { _type: "adjustmentRule" }> => item._type === "adjustmentRule" && item.patternVersion._ref === versionId);
  const steps = documents.filter((item): item is Extract<KnowledgeDocument, { _type: "instructionStep" }> => item._type === "instructionStep" && item.patternVersion._ref === versionId);
  const fabrics = documents.filter((item): item is Extract<KnowledgeDocument, { _type: "fabricRequirement" }> => item._type === "fabricRequirement" && item.patternVersion._ref === versionId);
  if (!pieces.length || !rules.length) throw new KnowledgeError("missing", "Pattern version needs pieces and adjustment rules.");
  if (new Set(pieces.map((item) => item.pieceKey)).size !== pieces.length) throw new KnowledgeError("conflict", "Pattern piece keys must be unique within a version.");
  if (new Set(steps.map((item) => item.stepKey)).size !== steps.length) throw new KnowledgeError("conflict", "Instruction step keys must be unique within a version.");
  if (mode === "reviewed" && (version.reviewStatus !== "reviewed" || !version._rev || !fabrics.length)) {
    throw new KnowledgeError("unreviewed", "Pattern version, revision, or fabric requirements are not reviewed.");
  }
  const used = new Set<string>([version._id, pattern._id]);
  function sameVersion<T extends "patternPiece" | "seamConnection" | "adjustmentRule" | "instructionStep" | "fabricRequirement">(id: string, type: T): Extract<KnowledgeDocument, { _type: T }> {
    const document = need(id, type);
    if (!("patternVersion" in document) || document.patternVersion._ref !== versionId) throw new KnowledgeError("cross-version", `${id} belongs to another pattern version.`);
    used.add(id);
    return document;
  }
  function source(id: string) {
    const document = need(id, "sourceDocument");
    if (mode === "reviewed" && (document.reviewStatus !== "reviewed" || !document._rev)) throw new KnowledgeError("unreviewed", `Source ${id} is not reviewed.`);
    used.add(id);
    return document;
  }
  for (const ref of version.sources) source(ref._ref);
  for (const item of pieces) { used.add(item._id); if (new Set(item.edgeIds).size !== item.edgeIds.length) throw new KnowledgeError("conflict", `Repeated edge ID on ${item._id}.`); if (mode === "reviewed" && !item._rev) throw new KnowledgeError("unreviewed", `Piece ${item._id} has no published revision.`); for (const ref of item.sources ?? []) source(ref._ref); }
  for (const join of joins) {
    used.add(join._id);
    for (const endpoint of join.endpoints) {
      const piece = sameVersion(endpoint.piece._ref, "patternPiece");
      if (!piece.edgeIds.includes(endpoint.edgeId)) throw new KnowledgeError("missing", `Edge ${endpoint.edgeId} is missing from ${piece._id}.`);
    }
    for (const ref of join.sources ?? []) source(ref._ref);
    if (mode === "reviewed" && (join.constraintStatus !== "reviewed" || join.intendedEaseMm == null || join.toleranceMm == null || join.toleranceMm < 0 || !join._rev)) {
      throw new KnowledgeError("unreviewed", `Join ${join._id} lacks a reviewed seam constraint.`);
    }
  }
  for (const fabric of fabrics) { used.add(fabric._id); for (const ref of fabric.sources) source(ref._ref); if (mode === "reviewed" && (fabric.reviewStatus !== "reviewed" || !fabric._rev)) throw new KnowledgeError("unreviewed", `Fabric requirement ${fabric._id} is not reviewed.`); }
  const stepById = new Map(steps.map((item) => [item._id, item]));
  for (const step of steps) {
    used.add(step._id);
    if (mode === "reviewed" && !step._rev) throw new KnowledgeError("unreviewed", `Instruction ${step._id} has no published revision.`);
    for (const ref of step.prerequisites) sameVersion(ref._ref, "instructionStep");
    for (const ref of step.pieces ?? []) sameVersion(ref._ref, "patternPiece");
    for (const ref of step.affectedBy) sameVersion(ref._ref, "adjustmentRule");
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const assemblyOrder: string[] = [];
  function visitStep(id: string) {
    if (visiting.has(id)) throw new KnowledgeError("cycle", `Instruction prerequisite cycle at ${id}.`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const ref of stepById.get(id)?.prerequisites ?? []) visitStep(ref._ref);
    visiting.delete(id);
    visited.add(id);
    assemblyOrder.push(id);
  }
  for (const step of steps) visitStep(step._id);
  const ruleById = new Map(rules.map((item) => [item._id, item]));
  const visitingRules = new Set<string>();
  const visitedRules = new Set<string>();
  function visitRule(id: string) {
    if (visitingRules.has(id)) throw new KnowledgeError("cycle", `Adjustment rule dependency cycle at ${id}.`);
    if (visitedRules.has(id)) return;
    visitingRules.add(id);
    for (const ref of ruleById.get(id)?.dependentRules ?? []) {
      sameVersion(ref._ref, "adjustmentRule");
      visitRule(ref._ref);
    }
    visitingRules.delete(id);
    visitedRules.add(id);
  }
  for (const rule of rules) visitRule(rule._id);
  function dependentRuleIds(id: string): string[] {
    const found = new Set<string>();
    function collect(currentId: string) {
      for (const ref of ruleById.get(currentId)?.dependentRules ?? []) {
        if (!found.has(ref._ref)) { found.add(ref._ref); collect(ref._ref); }
      }
    }
    collect(id);
    return [...found].sort();
  }
  const effectsByOperation: PatternSnapshot["effectsByOperation"] = {};
  for (const rule of rules) {
    used.add(rule._id);
    if (!version.supportedOperationIds.includes(rule.operationId)) throw new KnowledgeError("conflict", `Rule ${rule._id} is not allowed by version ${versionId}.`);
    if (effectsByOperation[rule.operationId]) throw new KnowledgeError("conflict", `Two rules claim operation ${rule.operationId}.`);
    if (mode === "reviewed" && (rule.reviewStatus !== "reviewed" || !rule._rev || !rule.reviewedBounds || rule.reviewedBounds.min > rule.reviewedBounds.max)) throw new KnowledgeError("unreviewed", `Rule ${rule._id} has no reviewed bounds.`);
    const sourceIds = rule.sources.map((ref) => source(ref._ref)._id);
    const pieceEffects = new Map<string, PieceEffect>();
    for (const ref of rule.directPieces) {
      const piece = sameVersion(ref._ref, "patternPiece");
      pieceEffects.set(piece._id, { pieceId: piece._id, pieceTitle: piece.title, via: "direct", ruleId: rule._id, sourceIds });
    }
    const unresolvedChecks: string[] = [];
    for (const ref of rule.recheckJoins) {
      const join = sameVersion(ref._ref, "seamConnection");
      if (join.constraintStatus !== "reviewed") unresolvedChecks.push(join._id);
      for (const endpoint of join.endpoints) {
        const piece = sameVersion(endpoint.piece._ref, "patternPiece");
        if (!pieceEffects.has(piece._id)) pieceEffects.set(piece._id, { pieceId: piece._id, pieceTitle: piece.title, via: "join", ruleId: rule._id, joinId: join._id, sourceIds });
      }
    }
    for (const ref of rule.dependentRules ?? []) sameVersion(ref._ref, "adjustmentRule");
    effectsByOperation[rule.operationId] = {
      pieces: [...pieceEffects.values()].sort((a, b) => a.pieceId.localeCompare(b.pieceId)),
      stepIds: steps.filter((step) => step.affectedBy.some((ref) => ref._ref === rule._id)).map((step) => step._id).sort(),
      dependentRuleIds: dependentRuleIds(rule._id),
      invalidates: [...new Set(rule.invalidate)].sort(),
      unresolvedChecks: unresolvedChecks.sort(),
    };
  }
  const sourceQueue = [...used].filter((id) => byId.get(id)?._type === "sourceDocument");
  for (const id of sourceQueue) {
    const item = need(id, "sourceDocument");
    for (const ref of [...(item.supersedes ?? []), ...(item.conflicts ?? [])]) {
      source(ref._ref);
      if (!sourceQueue.includes(ref._ref)) sourceQueue.push(ref._ref);
    }
  }
  for (const id of sourceQueue) {
    const item = need(id, "sourceDocument");
    for (const ref of item.conflicts ?? []) {
      const other = need(ref._ref, "sourceDocument");
      const precedence = item.supersedes?.some((entry) => entry._ref === other._id) || other.supersedes?.some((entry) => entry._ref === item._id);
      if (!precedence) throw new KnowledgeError("conflict", `Sources ${item._id} and ${other._id} conflict without documented precedence.`);
    }
  }
  const relevant = [...used].map((id) => byId.get(id)!).sort((a, b) => a._id.localeCompare(b._id));
  const fingerprint = createHash("sha256").update(JSON.stringify(relevant)).digest("hex");
  const sourceDetails = relevant.filter((item): item is Extract<KnowledgeDocument, { _type: "sourceDocument" }> => item._type === "sourceDocument")
    .map((item) => ({ id: item._id, title: item.title, reviewStatus: item.reviewStatus,
      ...(item.locator ? { locator: item.locator } : {}), ...(item.content ? { content: item.content } : {}),
      ...(item.url ? { url: item.url } : {}), ...(item.licenseNotes ? { licenseNotes: item.licenseNotes } : {}) }));
  const pieceById = new Map(pieces.map((item) => [item._id, item]));
  const garmentPieces = pieces.map((item) => ({ id: item._id, key: item.pieceKey, title: item.title,
    ...(item.cutCount ?? item.demoCut?.count ? { cutCount: item.cutCount ?? item.demoCut?.count } : {}),
    ...(item.mirrored ?? item.demoCut?.mirrored ? { mirrored: item.mirrored ?? item.demoCut?.mirrored } : {}),
    ...(item.onFold ?? item.demoCut?.onFold ? { onFold: item.onFold ?? item.demoCut?.onFold } : {}), edgeIds: item.edgeIds })).sort((a, b) => a.key.localeCompare(b.key));
  const garmentConnections = joins.map((item) => ({ id: item._id,
    pieceKeys: item.endpoints.map((endpoint) => pieceById.get(endpoint.piece._ref)!.pieceKey),
    edgeIds: item.endpoints.map((endpoint) => endpoint.edgeId), relation: item.relation ?? "unresolved", constraintStatus: item.constraintStatus })).sort((a, b) => a.id.localeCompare(b.id));
  const assemblySteps = assemblyOrder.map((id) => stepById.get(id)!).map((item) => ({ id: item._id, key: item.stepKey, title: item.title,
    prerequisiteKeys: item.prerequisites.map((ref) => stepById.get(ref._ref)!.stepKey),
    pieceKeys: (item.pieces ?? []).map((ref) => pieceById.get(ref._ref)!.pieceKey),
    affectedByOperationIds: item.affectedBy.map((ref) => ruleById.get(ref._ref)!.operationId) }));
  return { patternId: pattern._id, patternTitle: pattern.title, ...(pattern.category ? { category: pattern.category } : {}), versionId, version: version.version, mode, fingerprint, pieceIds: pieces.map((item) => item._id).sort(), joinIds: joins.map((item) => item._id).sort(), ruleIds: rules.map((item) => item._id).sort(), stepIds: steps.map((item) => item._id).sort(), sourceIds: sourceDetails.map((item) => item.id), sourceDetails, garmentPieces, garmentConnections, assemblySteps, effectsByOperation };
}
