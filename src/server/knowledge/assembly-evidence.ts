import type { PatternSnapshot } from "../../domain/knowledge/resolve-pattern";
import type { ContextResult } from "./context-mcp";

export class AssemblyEvidenceError extends Error {
  constructor(public readonly code: "missing-knowledge" | "conflict", message: string) {
    super(message);
    this.name = "AssemblyEvidenceError";
  }
}

/**
 * Context is maintained explanation, not an instruction engine. Only show its
 * assembly note when it corroborates the exact versioned source graph.
 */
export function verifyAssemblyEvidence(snapshot: PatternSnapshot, evidence: ContextResult) {
  if (evidence.tool !== "knowledge_base_read" || evidence.paths.length !== 1 || evidence.paths[0] !== "construction_sequence" || !evidence.knowledgeBaseId) {
    throw new AssemblyEvidenceError("missing-knowledge", "The construction Knowledge Base entry is unavailable.");
  }
  const shoulder = snapshot.assemblySteps.find((step) => step.key === "join-shoulders");
  const neckline = snapshot.assemblySteps.find((step) => step.key === "finish-neckline");
  const sleeves = snapshot.assemblySteps.find((step) => step.key === "prepare-sleeves");
  if (!shoulder || !neckline || !sleeves ||
    shoulder.prerequisiteKeys.length !== 0 ||
    neckline.prerequisiteKeys.length !== 1 || neckline.prerequisiteKeys[0] !== shoulder.key ||
    sleeves.prerequisiteKeys.length !== 1 || sleeves.prerequisiteKeys[0] !== shoulder.key ||
    !neckline.pieceKeys.includes("front") || !neckline.pieceKeys.includes("back")) {
    throw new AssemblyEvidenceError("conflict", "The authored assembly graph is outside this verified explanation.");
  }
  const text = evidence.text;
  const hasVersion = text.includes(snapshot.versionId) || text.includes(snapshot.versionId.replace("pattern-version.", ""));
  const hasPieces = text.includes("piece.front") && text.includes("piece.back");
  const hasParallel = /parallel branches|no dependency or ordering between them/i.test(text);
  const hasOldClaim = /has no listed pattern pieces of its own/i.test(text);
  const hasFalseChain = /step\.shoulders\s*[─-]+[►>]+\s*step\.neckline\s*[─-]+[►>]+\s*step\.sleeves/.test(text);
  if (!hasVersion || !hasPieces || !hasParallel || hasOldClaim || hasFalseChain) {
    throw new AssemblyEvidenceError("conflict", "The maintained construction note needs review before it can guide this version.");
  }
  return {
    title: "Two paths after the shoulder seam",
    explanation: `${neckline.title} uses the front and back bodice. Once ${shoulder.title.toLowerCase()} is complete, ${neckline.title.toLowerCase()} and ${sleeves.title.toLowerCase()} can proceed in either order.`,
    knowledgeBaseId: evidence.knowledgeBaseId,
    path: evidence.paths[0],
    snapshotFingerprint: snapshot.fingerprint,
    sourceIds: [...snapshot.sourceIds],
    readiness: "illustrative" as const,
  };
}
