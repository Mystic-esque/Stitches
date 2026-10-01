import { createHash } from "node:crypto";
import { createClient, type SanityClient } from "@sanity/client";
import { z } from "zod";

const source = z.object({ _id: z.string(), _type: z.literal("sourceDocument"), _rev: z.string().min(1),
  title: z.string().min(1), url: z.url(), locator: z.string().min(1), reviewStatus: z.enum(["pending", "reviewed"]) });
const candidate = z.object({ _id: z.string(), _type: z.literal("planningCandidate"), _rev: z.string().min(1),
  designKey: z.enum(["sandy", "tina"]), title: z.string().min(1), materialStructure: z.enum(["woven", "knit"]),
  requiredMeasurements: z.array(z.string().min(1)).min(1).max(30), cuttingCaveat: z.string().min(20),
  reviewStatus: z.enum(["pending", "reviewed"]), source: z.object({ _ref: z.string() }) });
const piece = z.object({ _id: z.string(), _type: z.literal("planningPiece"), _rev: z.string().min(1),
  candidate: z.object({ _ref: z.string() }), pieceKey: z.string().min(1), title: z.string().min(1),
  cutCount: z.number().int().positive(), fold: z.enum(["none", "single", "double"]), mirrored: z.boolean(),
  material: z.enum(["main", "interfacing"]), condition: z.enum(["always", "default", "seamless", "straight", "curved", "front-bottom", "sleeves"]),
  reviewStatus: z.enum(["pending", "reviewed"]), source: z.object({ _ref: z.string() }) });

export const COMPANION_CATALOG_QUERY = '*[_id in $ids][0...14]';
const IDS = ["companion-source-sandy-20261001", "companion-source-tina-20261001",
  "companion-candidate-sandy-20261001", "companion-candidate-tina-20261001",
  ...["skirt-default", "skirt-seamless", "waistband-straight", "waistband-curved", "waistband-interfacing"].map((key) => `companion-piece-sandy-${key}-20261001`),
  ...["front", "back", "front-bottom", "sleeve"].map((key) => `companion-piece-tina-${key}-20261001`)] as const;
export type CompanionPlanningPiece = { pieceKey: string; title: string; cutCount: number; fold: "none" | "single" | "double";
  mirrored: boolean; material: "main" | "interfacing"; condition: "always" | "default" | "seamless" | "straight" | "curved" | "front-bottom" | "sleeves";
  reviewStatus: "pending" | "reviewed" };
export type CompanionCatalogCard = { designKey: "sandy" | "tina"; title: string; materialStructure: "woven" | "knit";
  requiredMeasurements: string[]; cuttingCaveat: string; sourceTitle: string; sourceUrl: string;
  sourceLocator: string; reviewStatus: "pending" | "reviewed"; fingerprint: string; capability: "plan_only";
  pieceStudy: CompanionPlanningPiece[] };

export class CatalogError extends Error {
  constructor(public readonly code: "missing" | "invalid" | "unavailable", message: string) { super(message); }
}

export function resolveCompanionCatalog(raw: unknown): CompanionCatalogCard[] {
  if (!Array.isArray(raw) || raw.length !== IDS.length) throw new CatalogError("missing", "Planning source records are incomplete.");
  const docs = new Map<string, Record<string, unknown>>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || typeof item._id !== "string" || !IDS.includes(item._id as typeof IDS[number]) || docs.has(item._id))
      throw new CatalogError("invalid", "Unexpected or repeated planning source record.");
    docs.set(item._id, item);
  }
  return (["sandy", "tina"] as const).map((designKey) => {
    const rawSource = docs.get(`companion-source-${designKey}-20261001`);
    const rawCandidate = docs.get(`companion-candidate-${designKey}-20261001`);
    const checkedSource = source.safeParse(rawSource);
    const checkedCandidate = candidate.safeParse(rawCandidate);
    if (!checkedSource.success || !checkedCandidate.success) throw new CatalogError("invalid", `${designKey} planning source is malformed or unreviewed/rejected.`);
    const sourceDoc = checkedSource.data;
    const candidateDoc = checkedCandidate.data;
    if (candidateDoc.designKey !== designKey || candidateDoc.source._ref !== sourceDoc._id || !sourceDoc.url.startsWith("https://"))
      throw new CatalogError("invalid", `${designKey} planning source binding is inconsistent.`);
    const rawPieces = IDS.filter((id) => id.startsWith(`companion-piece-${designKey}-`)).map((id) => docs.get(id));
    const parsedPieces = rawPieces.map((entry) => piece.safeParse(entry));
    if (parsedPieces.some((entry) => !entry.success)) throw new CatalogError("invalid", `${designKey} planning piece is malformed or unreviewed/rejected.`);
    const pieceDocs = parsedPieces.map((entry) => { if (!entry.success) throw new CatalogError("invalid", "Planning piece is malformed."); return entry.data; });
    if (pieceDocs.some((entry) => entry.candidate._ref !== candidateDoc._id || entry.source._ref !== sourceDoc._id) ||
      new Set(pieceDocs.map((entry) => entry.pieceKey)).size !== pieceDocs.length)
      throw new CatalogError("invalid", `${designKey} planning piece binding is inconsistent or duplicated.`);
    const expectedConditions = designKey === "sandy" ? ["default", "seamless", "straight", "curved", "always"] : ["always", "always", "front-bottom", "sleeves"];
    if (JSON.stringify(pieceDocs.map((entry) => entry.condition).sort()) !== JSON.stringify(expectedConditions.sort()))
      throw new CatalogError("invalid", `${designKey} planning piece conditions are incomplete.`);
    const fingerprint = createHash("sha256").update(JSON.stringify({ sourceDoc, candidateDoc, pieceDocs })).digest("hex");
    return { designKey, title: candidateDoc.title, materialStructure: candidateDoc.materialStructure,
      requiredMeasurements: candidateDoc.requiredMeasurements, cuttingCaveat: candidateDoc.cuttingCaveat,
      sourceTitle: sourceDoc.title, sourceUrl: sourceDoc.url, sourceLocator: sourceDoc.locator,
      reviewStatus: candidateDoc.reviewStatus === "reviewed" && sourceDoc.reviewStatus === "reviewed" ? "reviewed" as const : "pending" as const,
      fingerprint, capability: "plan_only" as const,
      pieceStudy: pieceDocs.map((entry) => ({ pieceKey: entry.pieceKey, title: entry.title, cutCount: entry.cutCount,
        fold: entry.fold, mirrored: entry.mirrored, material: entry.material, condition: entry.condition,
        reviewStatus: entry.reviewStatus })) };
  });
}

type QueryClient = Pick<SanityClient, "fetch">;
export async function loadCompanionCatalog(client: QueryClient): Promise<CompanionCatalogCard[]> {
  const raw = await client.fetch<unknown>(COMPANION_CATALOG_QUERY, { ids: [...IDS] });
  return resolveCompanionCatalog(raw);
}

export function createCompanionCatalogClient(env: Record<string, string | undefined> = process.env): QueryClient {
  if (env.SANITY_PROJECT_ID !== "l4eeamth" || env.SANITY_DATASET !== "development" || !env.SANITY_READ_TOKEN)
    throw new CatalogError("unavailable", "Dedicated Stitches development read configuration is missing.");
  return createClient({ projectId: "l4eeamth", dataset: "development", apiVersion: env.SANITY_API_VERSION || "2026-09-28",
    useCdn: false, perspective: "published", token: env.SANITY_READ_TOKEN });
}
