import { describe, expect, it, vi } from "vitest";
import { FitLoopError, runFitLoop, type ModelFeedback, type ModelSession, type ModelTurn } from "./fit-loop";
import type { PatternSnapshot } from "../../domain/knowledge/resolve-pattern";
import type { BodiceFragment, ShoulderSpikeInput } from "../../domain/geometry/shoulder-spike";

const fragment: BodiceFragment = {
  neckline: { start: { x: 0, y: 20 }, control1: { x: 12, y: 20 }, control2: { x: 30, y: 0 }, end: { x: 40, y: 0 } },
  shoulderNeck: { x: 40, y: 0 }, shoulderTip: { x: 100, y: 20 },
  armhole: { start: { x: 100, y: 20 }, control1: { x: 110, y: 45 }, control2: { x: 130, y: 70 }, end: { x: 120, y: 100 } },
};
const geometry: ShoulderSpikeInput = {
  patternVersionId: "version.demo", sourceStatus: "illustrative", front: fragment, back: fragment,
  allowedAmountMm: { min: 0, max: 20 }, shoulderJoinToleranceMm: 0.5,
};
const snapshot: PatternSnapshot = {
  patternId: "pattern.demo", patternTitle: "Demo", versionId: "version.demo", version: "0.1.0",
  mode: "illustrative", fingerprint: "abc123", pieceIds: ["front", "back"], joinIds: ["shoulder"],
  ruleIds: ["rule.shoulder"], stepIds: [], sourceIds: ["source.demo"],
  sourceDetails: [{ id: "source.demo", title: "Synthetic source", reviewStatus: "illustrative" }],
  effectsByOperation: { "shoulder-width": { pieces: [
    { pieceId: "front", pieceTitle: "Front", via: "direct", ruleId: "rule.shoulder", sourceIds: ["source.demo"] },
  ], stepIds: [], dependentRuleIds: [], invalidates: ["fabric-layout"], unresolvedChecks: ["sleeve-cap"] } },
};
const reader = { readPaths: vi.fn(async (paths: string[]) => ({ tool: "knowledge_base_read" as const, knowledgeBaseId: "kb-demo", paths, text: "Illustrative sewing knowledge, not cutting authority." })) };
function session(turns: ModelTurn[]): { model: ModelSession; feedback: ModelFeedback[] } {
  const feedback: ModelFeedback[] = [];
  return {
    feedback,
    model: { next: async (value) => { if (value) feedback.push(value); return turns.shift() ?? { calls: [] }; } },
  };
}
function args(model: ModelSession) {
  return { request: "A little more shoulder room", snapshot, geometry, knowledgeBaseId: "kb-demo", knowledgePaths: ["/patterns/demo/shoulder"], reader, session: model };
}

describe("bounded fit tool loop", () => {
  it("retrieves the KB first, uses only registered tools, and returns an incomplete fragment draft", async () => {
    const { model, feedback } = session([
      { calls: [{ id: "c1", name: "get_pattern_context", args: {} }] },
      { calls: [{ id: "c2", name: "draft_shoulder_spike", args: { amountMm: 12 } }] },
      { calls: [], text: "This still needs the sleeve and maker checks." },
    ]);
    const result = await runFitLoop(args(model));
    expect(result.status).toBe("incomplete");
    expect(result.draft?.amountMm).toBe(12);
    expect(result.draft?.readiness).toBe("incomplete");
    expect(result.evidence.toolSequence).toEqual(["get_pattern_context", "draft_shoulder_spike"]);
    expect(feedback.map((item) => item.id)).toEqual(["c1", "c2"]);
    expect(feedback[1]?.response.readiness).toBe("incomplete");
    expect(reader.readPaths).toHaveBeenCalledWith(["/patterns/demo/shoulder"]);
  });

  it("refuses unsupported tools, malformed arguments, and drafting before context", async () => {
    for (const call of [
      { id: "x", name: "run_shell", args: {} },
      { id: "x", name: "draft_shoulder_spike", args: { amountMm: 10 } },
      { id: "x", name: "get_pattern_context", args: { path: "/arbitrary" } },
    ]) {
      const { model } = session([{ calls: [call] }]);
      await expect(runFitLoop(args(model))).rejects.toMatchObject({ code: "unsafe-tool" });
    }
    const { model } = session([
      { calls: [{ id: "c1", name: "get_pattern_context", args: {} }] },
      { calls: [{ id: "c2", name: "draft_shoulder_spike", args: { amountMm: "12", shell: "echo" } }] },
    ]);
    await expect(runFitLoop(args(model))).rejects.toMatchObject({ code: "unsafe-tool" });
  });

  it("does not call the model when KB evidence is absent or mismatched", async () => {
    const { model } = session([{ calls: [] }]);
    const next = vi.spyOn(model, "next");
    await expect(runFitLoop({ ...args(model), reader: { readPaths: async () => { throw new Error("404"); } } })).rejects.toMatchObject({ code: "missing-knowledge" });
    await expect(runFitLoop({ ...args(model), reader: { readPaths: async (paths) => ({ tool: "knowledge_base_read", knowledgeBaseId: "kb-other", paths, text: "text" }) } })).rejects.toMatchObject({ code: "missing-knowledge" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects repeated or parallel calls and a cancelled request", async () => {
    const repeated = Array.from({ length: 4 }, (_, index) => ({ calls: [{ id: `c${index}`, name: "get_pattern_context", args: {} }] }));
    const { model } = session(repeated);
    await expect(runFitLoop(args(model))).rejects.toBeInstanceOf(FitLoopError);
    const parallel = session([{ calls: [
      { id: "one", name: "get_pattern_context", args: {} },
      { id: "two", name: "get_pattern_context", args: {} },
    ] }]);
    await expect(runFitLoop(args(parallel.model))).rejects.toMatchObject({ code: "unsafe-tool" });
    const controller = new AbortController(); controller.abort();
    await expect(runFitLoop({ ...args(parallel.model), signal: controller.signal })).rejects.toMatchObject({ code: "cancelled" });
  });

  it("does not accept an illustrative geometry input as reviewed knowledge", async () => {
    const { model } = session([{ calls: [] }]);
    await expect(runFitLoop({ ...args(model), snapshot: { ...snapshot, mode: "reviewed" } })).rejects.toMatchObject({ code: "invalid" });
  });
});
