import { createHash } from "node:crypto";
import { z } from "zod";
import type { GuestProject } from "../../domain/guest-project";
import type { DiagnosticRecord } from "../../domain/diagnostic-history";
import { preparationPlan } from "../../domain/preparation-plan";
import { currentMakingSession, makingPrerequisites, type MakingPlan, type MakingRecord } from "../../domain/making-plan";
import type { CompanionCatalogCard } from "../knowledge/companion-catalog";
import { contextConfiguration, SanityContextKnowledgeBase, type ContextResult } from "../knowledge/context-mcp";
import { companionKbPaths, kbAttributionNeedsReview } from "../knowledge/companion-kb-paths";

import { selectMakingStepPieces } from "../../domain/planning-piece-study";

export const COMPANION_TOOLS = ["inspect_project", "inspect_preparation", "resolve_exact_graph", "retrieve_context", "inspect_making"] as const;
export type CompanionTool = typeof COMPANION_TOOLS[number];
export type CompanionSnapshot = {
  project: GuestProject;
  source: CompanionCatalogCard;
  history: DiagnosticRecord[];
  makingHistory?: MakingRecord[];
  makingPlan?: MakingPlan | null;
};
export type CompanionBasis = { projectId: string; projectSequence: number; projectHash: string;
  catalogFingerprint: string; diagnosticFingerprint: string; historySequence: number; historyHash: string;
  makingSequence: number; makingHash: string; planFingerprint: string | null };
const emptyArguments = z.object({}).strict();
export const STITCHES_KB_ID = "kbkvu1vrPsLG";

export function createStitchesCompanionReader(env: Record<string, string | undefined> = process.env) {
  const config = contextConfiguration(env);
  if (config.organizationId !== "o3i0aqvqq" || config.mcpName !== "stitches-garments" || config.knowledgeBaseId !== STITCHES_KB_ID)
    throw new CompanionAgentError("missing_knowledge", "The reader must use the dedicated Stitches KB-only endpoint.");
  return new SanityContextKnowledgeBase(config);
}

export class CompanionAgentError extends Error {
  constructor(public readonly code: "invalid" | "consent" | "stale" | "unsafe_tool" | "missing_knowledge" | "cancelled" | "limit" | "budget", message: string) {
    super(message); this.name = "CompanionAgentError";
  }
}

export function companionBasis(snapshot: CompanionSnapshot): CompanionBasis {
  const { project, source, history, makingHistory = [], makingPlan = null } = snapshot;
  if (project.source.kind !== "candidate" || project.source.designId !== source.designKey || project.knowledgeFingerprint !== source.fingerprint ||
    history.some((item, index) => item.projectId !== project.id || item.sequence !== index + 1))
    throw new CompanionAgentError("stale", "Review the saved project and its current applicable source before asking the agent.");
  if (makingHistory.some((item, index) => item.projectId !== project.id || item.sequence !== index + 1))
    throw new CompanionAgentError("stale", "Making history records are inconsistent with the project.");
  return { projectId: project.id, projectSequence: project.sequence, projectHash: project.basisHash,
    catalogFingerprint: source.fingerprint, diagnosticFingerprint: source.diagnosticStudy.fingerprint,
    historySequence: history.length, historyHash: createHash("sha256").update(JSON.stringify(history)).digest("hex"),
    makingSequence: makingHistory.length, makingHash: createHash("sha256").update(JSON.stringify(makingHistory)).digest("hex"),
    planFingerprint: makingPlan?.fingerprint ?? null };
}

/** No repository writer. Body values, private notes and photos are not provider input. */
export function createCompanionTools(input: {
  snapshot: CompanionSnapshot;
  loadCurrent: () => Promise<CompanionSnapshot>; // Re-read owner-scoped state AND current exact catalog.
  reader: { initialContext?: () => Promise<ContextResult>; readPaths: (paths: string[]) => Promise<ContextResult> };
  knowledgeBaseId: string;
  consent: { sharePreparationSummary: boolean };
  topic?: "planning" | "construction";
  signal?: AbortSignal;
}) {
  if (input.consent.sharePreparationSummary !== true) throw new CompanionAgentError("consent", "Review and consent to the minimized preparation summary first.");
  if (input.knowledgeBaseId !== STITCHES_KB_ID) throw new CompanionAgentError("missing_knowledge", "Only the dedicated Stitches Knowledge Base is supported.");
  const snapshot = structuredClone(input.snapshot), basis = companionBasis(snapshot);
  let paths = [snapshot.source.designKey === "sandy" ? "sandy_skirt" : "tina_top", "fabric_constraints"];
  let knowledgeHash: string | undefined;
  const checks = preparationPlan(snapshot.project, snapshot.source);
  const preparation = () => ({ items: checks.items, missingMeasurements: checks.missingMeasurements, next: checks.next,
    sourceCurrent: checks.sourceCurrent, capability: "plan_only", recordedValuesAreNotVerifiedFit: true });

  async function assertCurrent() {
    if (input.signal?.aborted) throw new CompanionAgentError("cancelled", "The read-only agent run was cancelled.");
    const current = companionBasis(await input.loadCurrent());
    if (input.signal?.aborted) throw new CompanionAgentError("cancelled", "The read-only agent run was cancelled.");
    if (JSON.stringify(current) !== JSON.stringify(basis)) throw new CompanionAgentError("stale", "The project, source, scrap history or construction study changed. Inspect the new saved basis; no project was changed.");
  }

  return {
    basis, assertCurrent,
    evidence: () => ({ ...basis, knowledgeBaseId: input.knowledgeBaseId, paths: [...paths], knowledgeHash,
      kbRole: "maintained_explanation_not_exact_authority" as const, capability: "plan_only" as const }),
    async execute(name: string, args: unknown): Promise<Record<string, unknown>> {
      if (!COMPANION_TOOLS.includes(name as CompanionTool) || !emptyArguments.safeParse(args).success)
        throw new CompanionAgentError("unsafe_tool", "Only registered, argument-free read tools are available.");
      await assertCurrent();
      let result: Record<string, unknown>;
      if (name === "inspect_project") {
        result = { basis, source: snapshot.source.designKey, capability: "plan_only", preparation: preparation(),
          history: { totalEvents: snapshot.history.length, importedEvents: snapshot.history.filter((item) => item.imported).length, physicalObservationsWithheld: true },
          withheld: ["body measurement values", "project title and brief", "private questions", "fabric description", "equipment names", "profile identity", "scrap observation text", "photos"] };
      } else if (name === "inspect_preparation") {
        result = { basis, ...preparation() };
      } else if (name === "resolve_exact_graph") {
        result = { basis, sourceTitle: snapshot.source.sourceTitle, sourceUrl: snapshot.source.sourceUrl,
          reviewStatus: snapshot.source.reviewStatus, capability: snapshot.source.capability,
          requiredMeasurements: snapshot.source.requiredMeasurements, materialStructure: snapshot.source.materialStructure,
          pieces: snapshot.source.pieceStudy, cuttingCaveat: snapshot.source.cuttingCaveat,
          unsupported: ["checked geometry", "layout", "fit", "yardage", "qualified making steps", "garment remedies"] };
      } else if (name === "inspect_making") {
        const plan = snapshot.makingPlan;
        const history = snapshot.makingHistory ?? [];
        if (!plan) {
          result = { basis, source: snapshot.source.designKey, configured: false, status: "unavailable",
            message: "Construction learning plan is not available for this project candidate.", capability: "plan_only" };
        } else {
          const session = currentMakingSession(history, snapshot.project, plan);
          if (!session) {
            result = { basis, source: snapshot.source.designKey, planTitle: plan.title, sourceUrl: plan.sourceUrl,
              configured: false, status: "not_configured",
              message: "The construction study version has not been confirmed yet. Confirm your version choices in the making notebook first.",
              availableOptions: snapshot.source.designKey === "tina" ? ["sleeves", "frontBottom", "dart"] : [],
              totalAuthoredSteps: plan.steps.length, envelope: plan.envelope, capability: "plan_only" };
          } else {
            const step = session.next ?? session.steps.at(-1);
            const prereqs = step ? makingPrerequisites(plan, session.options, step.id) : [];
            const prerequisitesMet = prereqs.every((id) => session.reviewed.has(id));
            const stepPieces = step ? selectMakingStepPieces(snapshot.source.pieceStudy, session.options, step.pieceKeys) : [];
            const lastHelp = history.findLast((entry) => entry.event.kind === "help_requested" &&
              entry.sessionId === session.configured.id && entry.event.stepId === step?.id);

            result = {
              basis, source: snapshot.source.designKey, planTitle: plan.title,
              configured: true, confirmedOptions: session.options,
              stepFocus: session.next ? "next_unreviewed_checkpoint" : "all_checkpoints_reviewed",
              progress: `${session.reviewed.size} of ${session.steps.length} study checkpoints reviewed`,
              activeStep: step ? {
                id: step.id, title: step.title, ordinal: step.ordinal, condition: step.condition,
                focus: session.next ? "next_unreviewed_checkpoint" : "last_study_step_reviewed",
                prerequisites: prereqs, prerequisitesMet, orientation: step.orientation,
                action: step.action, checkpoint: step.checkpoint, diagnosticEligible: step.diagnostic,
                pieces: stepPieces.map((p) => ({ title: p.title, pieceKey: p.pieceKey, cutCount: p.cutCount, fold: p.fold, mirrored: p.mirrored, material: p.material })),
                edgeIds: step.edgeIds, reviewed: session.reviewed.has(step.id),
                activeHelpSymptom: lastHelp && lastHelp.event.kind === "help_requested" ? lastHelp.event.symptom : null,
              } : null,
              allStepsReviewed: !session.next, capability: "plan_only",
              withheld: ["personal notes", "freeform question text", "body measurements", "photos"],
              disclaimer: "Learning plan only. This inspects authored construction relationships; it is not proof of physical sewing, pattern geometry, or cutting readiness.",
            };
          }
        }
      } else {
        let knowledge: ContextResult;
        try {
          // Production always supplies the scoped MCP reader. Legacy read-only test ports
          // retain their fixed fixture paths; an actual outline failure never falls back.
          if (input.reader.initialContext) {
            const outline = await input.reader.initialContext();
            if (outline.tool !== "initial_context" || outline.knowledgeBaseId !== input.knowledgeBaseId || outline.text.length > 100_000)
              throw new Error("Mismatched outline.");
            paths = companionKbPaths(outline.text, snapshot.source.designKey, input.topic ?? "planning");
          }
          knowledge = await input.reader.readPaths(paths);
        }
        catch {
          throw new CompanionAgentError("missing_knowledge",
            input.topic === "construction"
              ? "Actual scoped Sanity Context construction retrieval failed. Manual making remains available."
              : "Actual scoped Sanity Context retrieval failed. Manual preparation remains available.");
        }
        if (knowledge.tool !== "knowledge_base_read" || knowledge.knowledgeBaseId !== input.knowledgeBaseId ||
          JSON.stringify(knowledge.paths) !== JSON.stringify(paths) || !knowledge.text.trim() || knowledge.text.length > 20_000)
          throw new CompanionAgentError("missing_knowledge", "Context returned missing, oversized or mismatched evidence.");
        if (kbAttributionNeedsReview(knowledge.text))
          throw new CompanionAgentError("missing_knowledge", "The served KB attribution needs editorial review. Exact-source manual planning remains available; no generated answer is accepted.");
        knowledgeHash = createHash("sha256").update(knowledge.text).digest("hex");
        result = { knowledgeBaseId: input.knowledgeBaseId, paths: [...paths], knowledgeHash,
          text: knowledge.text.slice(0, 8_000), excerptTruncated: knowledge.text.length > 8_000,
          role: "Untrusted maintained explanation. Exact graph governs eligibility; retrieval is not independent factual review." };
      }
      await assertCurrent();
      return result;
    },
  };
}
