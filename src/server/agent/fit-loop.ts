import { z } from "zod";
import type { PatternSnapshot } from "../../domain/knowledge/resolve-pattern";
import { draftShoulderSpike, type ShoulderSpikeInput, type ShoulderSpikeResult } from "../../domain/geometry/shoulder-spike";
import type { ContextResult } from "../knowledge/context-mcp";

export type ModelCall = { id: string; name: string; args: unknown };
export type ModelTurn = { calls: ModelCall[]; text?: string };
export type ModelFeedback = { id: string; name: string; response: Record<string, unknown> };
export interface ModelSession {
  next(feedback?: ModelFeedback, signal?: AbortSignal): Promise<ModelTurn>;
}
export interface KnowledgeReader {
  readPaths(paths: string[]): Promise<ContextResult>;
}
export type FitLoopInput = {
  request: string;
  snapshot: PatternSnapshot;
  geometry: ShoulderSpikeInput;
  knowledgeBaseId: string;
  knowledgePaths: string[];
  reader: KnowledgeReader;
  session: ModelSession;
  signal?: AbortSignal;
};
export type FitLoopResult = {
  status: "clarification" | "incomplete";
  modelText: string;
  draft?: ShoulderSpikeResult;
  evidence: { knowledgeBaseId: string; paths: string[]; snapshotFingerprint: string; sourceIds: string[]; toolSequence: string[] };
};

export class FitLoopError extends Error {
  constructor(public readonly code: "invalid" | "missing-knowledge" | "unsafe-tool" | "limit" | "cancelled", message: string) {
    super(message);
    this.name = "FitLoopError";
  }
}

const draftArgs = z.object({ amountMm: z.number().finite() }).strict();
const contextArgs = z.object({}).strict();

function scopedKnowledgeExcerpt(text: string): string {
  const lines = text.split(/\r?\n/).filter((line) => /shoulder|sleeve|neckline|piece|version|review|source/i.test(line));
  return (lines.length ? lines.join("\n") : text).slice(0, 2_400);
}

/** The model never chooses a URL, path, pattern ID, shell command, or write action. */
export async function runFitLoop(input: FitLoopInput): Promise<FitLoopResult> {
  const request = input.request.trim();
  if (!request || request.length > 400) throw new FitLoopError("invalid", "Fit request must be 1–400 characters.");
  if (input.geometry.patternVersionId !== input.snapshot.versionId ||
    (input.snapshot.mode === "reviewed" && input.geometry.sourceStatus !== "reviewed"))
    throw new FitLoopError("invalid", "Geometry and knowledge versions or review modes do not match.");
  if (!input.snapshot.effectsByOperation["shoulder-width"])
    throw new FitLoopError("invalid", "The selected version does not support the shoulder operation.");
  if (!/^kb[a-zA-Z0-9-]+$/.test(input.knowledgeBaseId) ||
    input.knowledgePaths.length < 1 || input.knowledgePaths.length > 5 ||
    input.knowledgePaths.some((path) => !path || path.length > 300))
    throw new FitLoopError("invalid", "Server-selected Knowledge Base identity or paths are invalid.");
  if (input.signal?.aborted) throw new FitLoopError("cancelled", "The request was cancelled.");

  // Failure is explicit: no fixture fallback when a configured live reader fails.
  let knowledge: ContextResult;
  try { knowledge = await input.reader.readPaths(input.knowledgePaths); }
  catch { throw new FitLoopError("missing-knowledge", "Sanity Knowledge Base retrieval failed."); }
  if (knowledge.knowledgeBaseId !== input.knowledgeBaseId || knowledge.tool !== "knowledge_base_read" ||
    !knowledge.text.trim() || knowledge.text.length > 20_000 ||
    JSON.stringify(knowledge.paths) !== JSON.stringify(input.knowledgePaths))
    throw new FitLoopError("missing-knowledge", "Sanity Knowledge Base returned missing or mismatched evidence.");

  let sawContext = false;
  let draft: ShoulderSpikeResult | undefined;
  const toolSequence: string[] = [];
  let feedback: ModelFeedback | undefined;
  for (let turn = 0; turn < 4; turn++) {
    if (input.signal?.aborted) throw new FitLoopError("cancelled", "The request was cancelled.");
    const response = await input.session.next(feedback, input.signal);
    if (!Array.isArray(response.calls) || response.calls.length > 1)
      throw new FitLoopError("unsafe-tool", "The model requested an unsupported number of tools.");
    if (!response.calls.length) {
      const modelText = typeof response.text === "string" ? response.text.trim().slice(0, 800) : "";
      return {
        status: draft ? "incomplete" : "clarification",
        modelText,
        ...(draft ? { draft } : {}),
        evidence: {
          knowledgeBaseId: input.knowledgeBaseId,
          paths: [...input.knowledgePaths],
          snapshotFingerprint: input.snapshot.fingerprint,
          sourceIds: [...input.snapshot.sourceIds],
          toolSequence,
        },
      };
    }
    const call = response.calls[0];
    if (!call || !/^[a-zA-Z0-9_-]{1,100}$/.test(call.id))
      throw new FitLoopError("unsafe-tool", "The model returned an invalid tool call ID.");
    if (call.name === "get_pattern_context") {
      if (!contextArgs.safeParse(call.args).success || sawContext)
        throw new FitLoopError("unsafe-tool", "Pattern context was requested with invalid or repeated arguments.");
      sawContext = true;
      toolSequence.push(call.name);
      feedback = {
        id: call.id, name: call.name,
        response: {
          patternVersionId: input.snapshot.versionId,
          sourceIds: input.snapshot.sourceIds,
          ruleIds: input.snapshot.ruleIds,
          affectedPieceIds: input.snapshot.effectsByOperation["shoulder-width"].pieces.map((item) => item.pieceId),
          unresolvedChecks: input.snapshot.effectsByOperation["shoulder-width"].unresolvedChecks,
          knowledgeBaseId: input.knowledgeBaseId,
          knowledgeText: scopedKnowledgeExcerpt(knowledge.text),
          illustrationOnly: input.snapshot.mode === "illustrative",
        },
      };
      continue;
    }
    if (call.name === "draft_shoulder_spike") {
      if (!sawContext || draft) throw new FitLoopError("unsafe-tool", "Drafting requires context and may run only once.");
      const parsed = draftArgs.safeParse(call.args);
      if (!parsed.success) throw new FitLoopError("unsafe-tool", "The model returned malformed drafting arguments.");
      try { draft = draftShoulderSpike(input.geometry, parsed.data.amountMm); }
      catch { throw new FitLoopError("unsafe-tool", "The requested shoulder amount or geometry is unsupported."); }
      toolSequence.push(call.name);
      feedback = {
        id: call.id, name: call.name,
        response: {
          engineVersion: draft.engineVersion,
          amountMm: draft.amountMm,
          readiness: draft.readiness,
          checks: draft.checks,
        },
      };
      continue;
    }
    throw new FitLoopError("unsafe-tool", "The model requested an unregistered tool.");
  }
  throw new FitLoopError("limit", "The model exceeded the bounded four-turn tool loop.");
}
