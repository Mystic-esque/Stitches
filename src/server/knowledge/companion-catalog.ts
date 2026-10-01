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
const references = z.array(z.object({ _ref: z.string() }));
const reviewed = z.enum(["pending", "reviewed"]);
const procedure = z.object({ _id: z.string(), _type: z.literal("constructionProcedure"), _rev: z.string().min(1),
  title: z.string().min(1), purpose: z.string().min(20), planningCandidates: references, sources: references, reviewStatus: reviewed });
const issue = z.object({ _id: z.string(), _type: z.literal("issuePattern"), _rev: z.string().min(1),
  issueKey: z.string().min(1), title: z.string().min(1), planningCandidates: references, procedures: references,
  riskNotes: z.string().min(20), sources: references, reviewStatus: reviewed });
const diagnosticTest = z.object({ _id: z.string(), _type: z.literal("diagnosticTest"), _rev: z.string().min(1),
  makerQuestion: z.string().min(20), howToCheck: z.string().min(20), possibleOutcomes: z.array(z.string()),
  distinguishes: references, riskNotes: z.string().min(20), sources: references, reviewStatus: reviewed });
const remedy = z.object({ _id: z.string(), _type: z.literal("remedy"), _rev: z.string().min(1),
  title: z.string().min(1), issues: references, requiredTests: references, safeAction: z.string().min(20),
  confirmationCheck: z.string().min(20), irreversible: z.literal(false), riskNotes: z.string().min(20),
  sources: references, reviewStatus: reviewed });

export const COMPANION_CATALOG_QUERY = '*[_id in $ids][0...20]';
const IDS = ["companion-source-sandy-20261001", "companion-source-tina-20261001",
  "companion-candidate-sandy-20261001", "companion-candidate-tina-20261001",
  ...["skirt-default", "skirt-seamless", "waistband-straight", "waistband-curved", "waistband-interfacing"].map((key) => `companion-piece-sandy-${key}-20261001`),
  ...["front", "back", "front-bottom", "sleeve"].map((key) => `companion-piece-tina-${key}-20261001`),
  "companion-source-coats-pucker-20261001", "companion-procedure-scrap-seam-check-20261001",
  "companion-issue-tension-pucker-20261001", "companion-issue-unresolved-pucker-20261001",
  "companion-test-scrap-stitch-release-20261001", "companion-remedy-sample-lower-tension-20261001"] as const;
export type CompanionPlanningPiece = { pieceKey: string; title: string; cutCount: number; fold: "none" | "single" | "double";
  mirrored: boolean; material: "main" | "interfacing"; condition: "always" | "default" | "seamless" | "straight" | "curved" | "front-bottom" | "sleeves";
  reviewStatus: "pending" | "reviewed" };
export type CompanionCatalogCard = { designKey: "sandy" | "tina"; title: string; materialStructure: "woven" | "knit";
  requiredMeasurements: string[]; cuttingCaveat: string; sourceTitle: string; sourceUrl: string;
  sourceLocator: string; reviewStatus: "pending" | "reviewed"; fingerprint: string; capability: "plan_only";
  pieceStudy: CompanionPlanningPiece[]; diagnosticStudy: CompanionDiagnosticStudy };
export type CompanionDiagnosticStudy = { title: string; purpose: string; makerQuestion: string; howToCheck: string;
  riskNotes: string; tensionIssue: string; tensionRiskNotes: string; unresolvedIssue: string; unresolvedRiskNotes: string;
  safeAction: string; confirmationCheck: string;
  sourceTitle: string; sourceUrl: string; reviewStatus: "pending" | "reviewed"; capability: "sample_check_only"; fingerprint: string };

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
  const sharedSource = source.safeParse(docs.get("companion-source-coats-pucker-20261001"));
  const sharedProcedure = procedure.safeParse(docs.get("companion-procedure-scrap-seam-check-20261001"));
  const tension = issue.safeParse(docs.get("companion-issue-tension-pucker-20261001"));
  const unresolved = issue.safeParse(docs.get("companion-issue-unresolved-pucker-20261001"));
  const test = diagnosticTest.safeParse(docs.get("companion-test-scrap-stitch-release-20261001"));
  const sampleRemedy = remedy.safeParse(docs.get("companion-remedy-sample-lower-tension-20261001"));
  if (!sharedSource.success || !sharedProcedure.success || !tension.success || !unresolved.success || !test.success || !sampleRemedy.success)
    throw new CatalogError("invalid", "Shared diagnostic graph is malformed or unreviewed/rejected.");
  const graph = { source: sharedSource.data, procedure: sharedProcedure.data, tension: tension.data,
    unresolved: unresolved.data, test: test.data, remedy: sampleRemedy.data };
  const refs = (entries: { _ref: string }[]) => entries.map((entry) => entry._ref).sort().join("|");
  const candidates = ["companion-candidate-sandy-20261001", "companion-candidate-tina-20261001"].sort().join("|");
  const sourceRef = graph.source._id;
  const sourceMatches = [graph.procedure, graph.tension, graph.unresolved, graph.test, graph.remedy]
    .every((entry) => refs(entry.sources) === sourceRef);
  const applicable = [graph.procedure, graph.tension, graph.unresolved]
    .every((entry) => refs(entry.planningCandidates) === candidates);
  if (!graph.source.url.startsWith("https://www.coats.com/") || !sourceMatches || !applicable ||
      refs(graph.tension.procedures) !== graph.procedure._id || refs(graph.unresolved.procedures) !== graph.procedure._id ||
      refs(graph.test.distinguishes) !== [graph.tension._id, graph.unresolved._id].sort().join("|") ||
      refs(graph.remedy.issues) !== graph.tension._id || refs(graph.remedy.requiredTests) !== graph.test._id ||
      graph.tension.issueKey !== "tension-pucker" || graph.unresolved.issueKey !== "unresolved-pucker" ||
      graph.test.possibleOutcomes.join("|") !== "relaxes|unchanged|not-tested")
    throw new CatalogError("invalid", "Shared diagnostic references or outcomes are inconsistent.");
  const diagnosticFingerprint = createHash("sha256").update(JSON.stringify(graph)).digest("hex");
  const diagnosticStudy: CompanionDiagnosticStudy = { title: graph.procedure.title, purpose: graph.procedure.purpose,
    makerQuestion: graph.test.makerQuestion, howToCheck: graph.test.howToCheck, riskNotes: graph.test.riskNotes,
    tensionIssue: graph.tension.title, tensionRiskNotes: graph.tension.riskNotes,
    unresolvedIssue: graph.unresolved.title, unresolvedRiskNotes: graph.unresolved.riskNotes,
    safeAction: graph.remedy.safeAction, confirmationCheck: graph.remedy.confirmationCheck,
    sourceTitle: graph.source.title, sourceUrl: graph.source.url, reviewStatus: [graph.source, graph.procedure,
      graph.tension, graph.unresolved, graph.test, graph.remedy].every((entry) => entry.reviewStatus === "reviewed") ? "reviewed" : "pending",
    capability: "sample_check_only", fingerprint: diagnosticFingerprint };
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
    const fingerprint = createHash("sha256").update(JSON.stringify({ sourceDoc, candidateDoc, pieceDocs, diagnosticFingerprint })).digest("hex");
    return { designKey, title: candidateDoc.title, materialStructure: candidateDoc.materialStructure,
      requiredMeasurements: candidateDoc.requiredMeasurements, cuttingCaveat: candidateDoc.cuttingCaveat,
      sourceTitle: sourceDoc.title, sourceUrl: sourceDoc.url, sourceLocator: sourceDoc.locator,
      reviewStatus: candidateDoc.reviewStatus === "reviewed" && sourceDoc.reviewStatus === "reviewed" ? "reviewed" as const : "pending" as const,
      fingerprint, capability: "plan_only" as const,
      pieceStudy: pieceDocs.map((entry) => ({ pieceKey: entry.pieceKey, title: entry.title, cutCount: entry.cutCount,
        fold: entry.fold, mirrored: entry.mirrored, material: entry.material, condition: entry.condition,
        reviewStatus: entry.reviewStatus })), diagnosticStudy };
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
