import { z } from "zod";
import type { DemoProject } from "../../domain/demo-project";
import { runFitLoop, type FitLoopResult, type KnowledgeReader, type ModelSession } from "./fit-loop";
import { illustrativeShoulderGeometry } from "./illustrative-geometry";
import type { WorktableKnowledgeSelection } from "../knowledge/worktable-selection";

const requestSchema = z.object({
  request: z.string().trim().min(1).max(400),
  baseSequence: z.number().int().min(0),
  patternVersionId: z.string().regex(/^[a-zA-Z0-9._-]{1,120}$/),
  snapshotFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

export class FitPreviewError extends Error {
  constructor(public readonly code: "disabled" | "invalid" | "stale", message: string) {
    super(message);
    this.name = "FitPreviewError";
  }
}

export type FitPreviewDependencies = {
  enabled: boolean;
  project: () => Promise<DemoProject>;
  knowledge: () => Promise<WorktableKnowledgeSelection>;
  reader: KnowledgeReader;
  session: (request: string) => ModelSession;
  knowledgeBaseId: string;
  knowledgePaths: string[];
  signal?: AbortSignal;
};

/** Development-only preview. It never saves or accepts a revision. */
export async function previewDevelopmentFit(raw: unknown, dependencies: FitPreviewDependencies): Promise<FitLoopResult & { illustrative: true; acceptAllowed: false }> {
  if (!dependencies.enabled) throw new FitPreviewError("disabled", "The live development preview is disabled.");
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) throw new FitPreviewError("invalid", "Supply a bounded fit request and exact current version, fingerprint, and revision.");
  const input = parsed.data;
  const [project, selected] = await Promise.all([dependencies.project(), dependencies.knowledge()]);
  if (selected.origin !== "sanity-development" || selected.snapshot.mode !== "illustrative" || selected.canAcceptSample)
    throw new FitPreviewError("disabled", "Only read-only Sanity development inspection is supported by this preview.");
  if (input.baseSequence !== project.currentSequence || input.patternVersionId !== project.patternVersionId ||
    input.patternVersionId !== selected.snapshot.versionId || input.snapshotFingerprint !== selected.snapshot.fingerprint)
    throw new FitPreviewError("stale", "The project or Sanity knowledge changed. Reload and preview again.");
  const geometry = illustrativeShoulderGeometry(selected.snapshot.versionId);
  const result = await runFitLoop({
    request: input.request,
    snapshot: selected.snapshot,
    geometry,
    knowledgeBaseId: dependencies.knowledgeBaseId,
    knowledgePaths: dependencies.knowledgePaths,
    reader: dependencies.reader,
    session: dependencies.session(input.request),
    signal: dependencies.signal,
  });
  return { ...result, illustrative: true, acceptAllowed: false };
}
