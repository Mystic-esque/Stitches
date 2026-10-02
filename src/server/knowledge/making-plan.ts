import { createHash } from "node:crypto";
import { z } from "zod";
import type { SanityClient } from "@sanity/client";
import type { CompanionCatalogCard } from "./companion-catalog";
import type { MakingPlan } from "../../domain/making-plan";

const reference = z.object({ _ref: z.string().min(1) });
const common = { _id: z.string(), _rev: z.string().min(1), candidate: reference, source: reference, reviewStatus: z.literal("pending") };
const planSchema = z.object({ ...common, _type: z.literal("constructionPlan"), designKey: z.enum(["sandy", "tina"]),
  version: z.literal(1), title: z.string().min(1), sourceUrl: z.url(), envelope: z.string().min(20), steps: z.array(reference).min(1).max(16) });
const stepSchema = z.object({ ...common, _type: z.literal("constructionStep"), plan: reference, stepKey: z.string().min(1),
  title: z.string().min(1), ordinal: z.number().int().positive(), condition: z.enum(["always", "sleeves", "front-bottom", "dart"]),
  pieceKeys: z.array(z.string()).min(1).max(6), edgeIds: z.array(z.string()).max(9),
  orientation: z.string().min(1).max(600), action: z.string().min(1).max(600), checkpoint: z.string().min(1).max(600),
  diagnostic: z.boolean(), prerequisites: z.array(reference).max(8) });
const keys = { sandy: ["closure-seam", "opening", "band", "band-finish", "hem"],
  tina: ["marks", "dart", "shoulders", "neck", "sleeves", "front-bottom", "sides", "finishes"] } as const;
export const makingRecordIds = (design: "sandy" | "tina") => [`companion-making-${design}-v1`,
  ...keys[design].map((key) => `companion-making-${design}-v1-${key}`)];
export const MAKING_PLAN_QUERY = '*[_id in $ids][0...17]';

export function resolveMakingPlan(raw: unknown, card: CompanionCatalogCard): MakingPlan {
  if (!Array.isArray(raw) || raw.length !== makingRecordIds(card.designKey).length) throw new Error("Incomplete construction learning graph.");
  const ids = makingRecordIds(card.designKey);
  const docs = new Map<string, unknown>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || !ids.includes(item._id) || docs.has(item._id)) throw new Error("Unexpected construction record.");
    docs.set(item._id, item);
  }
  const plan = planSchema.parse(docs.get(ids[0]));
  const steps = ids.slice(1).map((id) => stepSchema.parse(docs.get(id)));
  const candidate = `companion-candidate-${card.designKey}-20261001`;
  const source = `companion-source-${card.designKey}-20261001`;
  if (plan.designKey !== card.designKey || plan.sourceUrl !== `https://freesewing.eu/docs/designs/${card.designKey}/instructions/` ||
    [plan, ...steps].some((entry) => entry.candidate._ref !== candidate || entry.source._ref !== source) ||
    plan.steps.map((ref) => ref._ref).join("|") !== ids.slice(1).join("|")) throw new Error("Construction source binding mismatch.");
  const allowedPieces = new Set(card.pieceStudy.map((piece) => piece.pieceKey));
  const allowedEdges = new Set(card.designKey === "sandy" ? ["sandy.skirt/hem", "sandy.skirt/opening", "sandy.skirt/waist", "sandy.waistband/attachment"] : []);
  steps.forEach((step, index) => {
    if (step.plan._ref !== plan._id || step.stepKey !== keys[card.designKey][index] || step.ordinal !== index + 1 ||
      step.pieceKeys.some((key) => !allowedPieces.has(key)) || new Set(step.pieceKeys).size !== step.pieceKeys.length ||
      step.edgeIds.some((id) => !allowedEdges.has(id)) ||
      step.prerequisites.some((ref) => !ids.slice(1, index + 1).includes(ref._ref)) ||
      new Set(step.prerequisites.map((ref) => ref._ref)).size !== step.prerequisites.length)
      throw new Error("Construction graph has invalid pieces, edges, order or prerequisites.");
    const expectedCondition = step.stepKey === "dart" ? "dart" : step.stepKey === "sleeves" ? "sleeves" : step.stepKey === "front-bottom" ? "front-bottom" : "always";
    if (step.condition !== expectedCondition || (index > 0 && !step.prerequisites.length)) throw new Error("Construction branch is incomplete.");
  });
  return { id: plan._id, designKey: card.designKey, title: plan.title, sourceUrl: plan.sourceUrl,
    sourceTitle: card.sourceTitle, envelope: plan.envelope, capability: "plan_only", reviewStatus: "pending",
    fingerprint: createHash("sha256").update(JSON.stringify({ plan, steps, catalogFingerprint: card.fingerprint })).digest("hex"),
    steps: steps.map((step) => ({ id: step._id, title: step.title, ordinal: step.ordinal, condition: step.condition,
      requires: step.prerequisites.map((ref) => ref._ref), pieceKeys: step.pieceKeys, edgeIds: step.edgeIds,
      orientation: step.orientation, action: step.action, checkpoint: step.checkpoint, diagnostic: step.diagnostic })) };
}

export async function loadMakingPlan(client: Pick<SanityClient, "fetch">, card: CompanionCatalogCard): Promise<MakingPlan> {
  return resolveMakingPlan(await client.fetch<unknown>(MAKING_PLAN_QUERY, { ids: makingRecordIds(card.designKey) },
    { signal: AbortSignal.timeout(12000) }), card);
}
