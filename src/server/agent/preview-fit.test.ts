import { describe, expect, it, vi } from "vitest";
import graph from "../../../fixtures/knowledge-graph.json";
import { createDemoProject } from "../../domain/demo-project";
import { resolvePatternSnapshot } from "../../domain/knowledge/resolve-pattern";
import type { ModelTurn } from "./fit-loop";
import { FitPreviewError, previewDevelopmentFit, type FitPreviewDependencies } from "./preview-fit";

const versionId = "pattern-version.everyday-blouse.0-1-0";
const snapshot = resolvePatternSnapshot(graph.documents, versionId, "illustrative");
const request = {
  request: "Add 12 mm at each shoulder, leaving the neckline unchanged.",
  baseSequence: 0,
  patternVersionId: versionId,
  snapshotFingerprint: snapshot.fingerprint,
};
function dependencies(turns: ModelTurn[]): FitPreviewDependencies {
  return {
    enabled: true,
    project: async () => createDemoProject("fixture"),
    knowledge: async () => ({ snapshot, origin: "sanity-development", canAcceptSample: false }),
    reader: { readPaths: vi.fn(async (paths) => ({ text: "Illustrative KB evidence, not a cut-ready source.", tool: "knowledge_base_read" as const, knowledgeBaseId: "kb-stitches", paths })) },
    session: vi.fn(() => ({ next: async () => turns.shift() ?? { calls: [] } })),
    knowledgeBaseId: "kb-stitches",
    knowledgePaths: ["/patterns/everyday-blouse/shoulder"],
  };
}

describe("development fit preview", () => {
  it("gates provider use when disabled or the request is stale", async () => {
    const disabled = dependencies([]);
    disabled.enabled = false;
    await expect(previewDevelopmentFit(request, disabled)).rejects.toMatchObject({ code: "disabled" });
    expect(disabled.session).not.toHaveBeenCalled();

    const stale = dependencies([]);
    await expect(previewDevelopmentFit({ ...request, snapshotFingerprint: "0".repeat(64) }, stale)).rejects.toMatchObject({ code: "stale" });
    expect(stale.reader.readPaths).not.toHaveBeenCalled();
    expect(stale.session).not.toHaveBeenCalled();
  });

  it("refuses caller-supplied tools, paths, and a reviewed selection", async () => {
    const deps = dependencies([]);
    await expect(previewDevelopmentFit({ ...request, knowledgePaths: ["/another"] }, deps)).rejects.toMatchObject({ code: "invalid" });
    expect(deps.session).not.toHaveBeenCalled();
    deps.knowledge = async () => ({ snapshot: { ...snapshot, mode: "reviewed" }, origin: "sanity-reviewed", canAcceptSample: false });
    await expect(previewDevelopmentFit(request, deps)).rejects.toBeInstanceOf(FitPreviewError);
    expect(deps.reader.readPaths).not.toHaveBeenCalled();
  });

  it("returns only an incomplete, non-accepting draft after exact KB retrieval", async () => {
    const deps = dependencies([
      { calls: [{ id: "a", name: "get_pattern_context", args: {} }] },
      { calls: [{ id: "b", name: "draft_shoulder_spike", args: { amountMm: 12 } }] },
      { calls: [], text: "The sleeve and physical sample still need review." },
    ]);
    const result = await previewDevelopmentFit(request, deps);
    expect(result.status).toBe("incomplete");
    expect(result.illustrative).toBe(true);
    expect(result.acceptAllowed).toBe(false);
    expect(result.draft?.readiness).toBe("incomplete");
    expect(result.draft?.checks.find((item) => item.id === "armhole-sleeve")?.status).toBe("unknown");
    expect(result.evidence.snapshotFingerprint).toBe(snapshot.fingerprint);
    expect(deps.reader.readPaths).toHaveBeenCalledWith(["/patterns/everyday-blouse/shoulder"]);
  });
});
