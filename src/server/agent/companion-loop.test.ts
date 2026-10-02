import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { emptyProjectPlan } from "../../domain/guest-project";
import { resolveCompanionCatalog } from "../knowledge/companion-catalog";
import type { ContextResult } from "../knowledge/context-mcp";
import type { ModelFeedback, ModelTurn } from "./fit-loop";
import { createCompanionTools, createStitchesCompanionReader, STITCHES_KB_ID, type CompanionSnapshot } from "./companion-tools";
import { runCompanionLoop, type CompanionCheckpoint } from "./companion-loop";

const documents = ["companion-candidates", "companion-piece-studies", "companion-diagnostic"].flatMap((name) =>
  JSON.parse(readFileSync(new URL(`../../../fixtures/${name}.json`, import.meta.url), "utf8")).documents)
  .map((item: object, index: number) => ({ ...item, _rev: `synthetic-${index}` }));
const cards = resolveCompanionCatalog(documents);
const call = (name: string, id = name): ModelTurn => ({ calls: [{ name, id, args: {} }] });

function setup(design: "sandy" | "tina" = "sandy") {
  const source = cards.find((item) => item.designKey === design)!;
  const initial: CompanionSnapshot = { source, history: [], project: {
    id: "bd692072-3941-4f49-87b3-bc541049cabc", title: "PRIVATE-TITLE", brief: "PRIVATE-BRIEF",
    source: { kind: "candidate", designId: design }, capability: "plan_only", sequence: 1,
    basisHash: "b".repeat(64), knowledgeFingerprint: source.fingerprint,
    createdAt: "2026-10-02T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z",
    plan: { ...emptyProjectPlan(), measurementsMm: { waist: 743.125 },
      fabric: { description: "PRIVATE-FABRIC", widthMm: 1400, lengthMm: 2000, structure: "woven" },
      equipment: ["PRIVATE-EQUIPMENT"], openQuestions: ["PRIVATE-QUESTION"] },
  } };
  let current = structuredClone(initial);
  const reader = { readPaths: vi.fn(async (paths: string[]): Promise<ContextResult> => ({
    tool: "knowledge_base_read", knowledgeBaseId: STITCHES_KB_ID, paths, text: "Synthetic maintained explanation; pending review. Never cut from the piece studies." })) };
  const controller = new AbortController();
  const options = { snapshot: initial, loadCurrent: async () => current, reader, knowledgeBaseId: STITCHES_KB_ID,
    consent: { sharePreparationSummary: true }, signal: controller.signal };
  return { initial, reader, options, controller, change: (change: (state: CompanionSnapshot) => void) => change(current),
    reset: () => { current = structuredClone(initial); }, tools: createCompanionTools(options) };
}

function runner(state: ReturnType<typeof setup>, turns: ModelTurn[]) {
  const feedback: ModelFeedback[] = [], checkpoints: CompanionCheckpoint[] = [];
  const session = { next: vi.fn(async (value?: ModelFeedback) => { if (value) feedback.push(value); return turns.shift() ?? { calls: [], text: "Review the missing body notes before making decisions. Planning only." }; }) };
  return { input: { tools: state.tools, session, authorizeModelRequest: vi.fn(async () => true),
    checkpoint: vi.fn(async (value: CompanionCheckpoint) => { checkpoints.push(value); }), signal: state.controller.signal }, feedback, checkpoints };
}

describe("read-only companion tools and bounded loop — synthetic protocol proof, not live inference", () => {
  it.each(["sandy", "tina"] as const)("inspects the %s project, exact graph and scoped KB without disclosing private values", async (design) => {
    const state = setup(design), before = structuredClone(state.initial);
    const run = runner(state, [call("inspect_project"), call("resolve_exact_graph"), call("retrieve_context")]);
    const result = await runCompanionLoop(run.input);
    expect(run.input.session.next).toHaveBeenCalledTimes(4);
    expect(state.reader.readPaths).toHaveBeenCalledWith([design === "sandy" ? "sandy_skirt" : "tina_top", "fabric_constraints"]);
    const outbound = JSON.stringify(run.feedback);
    for (const privateValue of ["PRIVATE-TITLE", "PRIVATE-BRIEF", "PRIVATE-FABRIC", "PRIVATE-EQUIPMENT", "PRIVATE-QUESTION", "743.125"])
      expect(outbound).not.toContain(privateValue);
    expect(run.feedback[1].response.pieces).toHaveLength(design === "sandy" ? 5 : 4);
    expect(result).toMatchObject({ status: "read_only_insight", modelTextVerified: false, projectChanged: false,
      evidence: { capability: "plan_only", knowledgeHash: expect.stringMatching(/^[a-f0-9]{64}$/) } });
    expect(run.checkpoints.map((item) => item.event)).toEqual(["tool_completed", "tool_completed", "tool_completed", "completed"]);
    expect(JSON.stringify(run.checkpoints)).not.toContain("Synthetic maintained explanation");
    expect(state.initial).toEqual(before);
  });

  it("requires consent and the dedicated KB before a tool can be built", () => {
    const state = setup();
    expect(() => createCompanionTools({ ...state.options, consent: { sharePreparationSummary: false } })).toThrow(/consent/);
    expect(() => createCompanionTools({ ...state.options, knowledgeBaseId: "kb-crossgrade" })).toThrow(/dedicated/);
    expect(() => createStitchesCompanionReader({ SANITY_CONTEXT_ORG_ID: "wrongorg", SANITY_CONTEXT_MCP_NAME: "stitches-garments",
      SANITY_CONTEXT_KB_ID: STITCHES_KB_ID, SANITY_CONTEXT_TOKEN: "synthetic-not-a-secret" })).toThrow(/dedicated/);
  });

  it("rejects arbitrary queries, paths and writes rather than passing them to an adapter", async () => {
    const state = setup();
    await expect(state.tools.execute("retrieve_context", { paths: ["private"] })).rejects.toMatchObject({ code: "unsafe_tool" });
    await expect(state.tools.execute("record_observation", {})).rejects.toMatchObject({ code: "unsafe_tool" });
    await expect(state.tools.execute("resolve_exact_graph", { query: "*[]" })).rejects.toMatchObject({ code: "unsafe_tool" });
    expect(state.reader.readPaths).not.toHaveBeenCalled();
  });

  it("refuses early answers, repeated tools and multiple calls; never pretends they are completed work", async () => {
    await expect(runCompanionLoop(runner(setup(), []).input)).rejects.toMatchObject({ code: "missing_knowledge" });
    await expect(runCompanionLoop(runner(setup(), [call("inspect_project"), call("inspect_project", "again")]).input)).rejects.toMatchObject({ code: "unsafe_tool" });
    await expect(runCompanionLoop(runner(setup(), [{ calls: [...call("inspect_project").calls, ...call("resolve_exact_graph").calls] }]).input)).rejects.toMatchObject({ code: "unsafe_tool" });
  });

  it("rechecks project sequence, exact source and history around reads and inference", async () => {
    const state = setup();
    state.change((current) => { current.project.sequence++; });
    await expect(state.tools.execute("inspect_project", {})).rejects.toMatchObject({ code: "stale" });
    state.reset();
    state.reader.readPaths.mockImplementationOnce(async (paths) => {
      state.change((current) => { current.source.fingerprint = "f".repeat(64); });
      return { tool: "knowledge_base_read", knowledgeBaseId: STITCHES_KB_ID, paths, text: "Synthetic outdated prose" };
    });
    await expect(state.tools.execute("retrieve_context", {})).rejects.toMatchObject({ code: "stale" });
    state.reset();
    const run = runner(state, [call("inspect_project")]);
    run.input.session.next.mockImplementationOnce(async () => {
      state.change((current) => { current.history.push({ id: "2b13e51d-3e4e-4bb7-bdad-f0899f936f14", projectId: current.project.id,
        sequence: 1, basisSequence: 1, basisHash: current.project.basisHash, createdAt: current.project.createdAt, imported: false,
        binding: { catalogFingerprint: current.source.fingerprint, diagnosticFingerprint: current.source.diagnosticStudy.fingerprint,
          sourceId: current.source.diagnosticStudy.sourceId, testId: current.source.diagnosticStudy.testId, remedyId: current.source.diagnosticStudy.remedyId },
        event: { kind: "observation", observation: "not-tested", detail: "PRIVATE-OBSERVATION" } }); });
      return call("inspect_project");
    });
    await expect(runCompanionLoop(run.input)).rejects.toMatchObject({ code: "stale" });
    expect(run.checkpoints).toEqual([]);
  });

  it("does not replace missing or mismatched Context with fixture advice", async () => {
    const state = setup();
    state.reader.readPaths.mockRejectedValueOnce(new Error("private transport detail"));
    await expect(state.tools.execute("retrieve_context", {})).rejects.toMatchObject({ code: "missing_knowledge", message: expect.not.stringContaining("private transport detail") });
    state.reader.readPaths.mockResolvedValueOnce({ tool: "knowledge_base_read", knowledgeBaseId: "kb-other", paths: ["sandy_skirt"], text: "Wrong evidence" });
    await expect(state.tools.execute("retrieve_context", {})).rejects.toMatchObject({ code: "missing_knowledge" });
  });

  it("blocks unpaid-budget denial and cancellation before the next model request", async () => {
    const state = setup(), run = runner(state, [call("inspect_project")]);
    run.input.authorizeModelRequest.mockResolvedValue(false);
    await expect(runCompanionLoop(run.input)).rejects.toMatchObject({ code: "budget" });
    expect(run.input.session.next).not.toHaveBeenCalled();
    state.controller.abort();
    await expect(runCompanionLoop(run.input)).rejects.toMatchObject({ code: "cancelled" });
    expect(run.input.session.next).not.toHaveBeenCalled();
  });

  it("stops at four requests and fails closed if a checkpoint cannot be persisted", async () => {
    const state = setup(), run = runner(state, [call("inspect_project"), call("inspect_preparation"), call("resolve_exact_graph"), call("retrieve_context")]);
    await expect(runCompanionLoop(run.input)).rejects.toMatchObject({ code: "limit" });
    expect(run.input.session.next).toHaveBeenCalledTimes(4);
    const interrupted = runner(setup(), [call("inspect_project")]);
    interrupted.input.checkpoint.mockRejectedValueOnce(new Error("Synthetic persistence failure"));
    await expect(runCompanionLoop(interrupted.input)).rejects.toThrow("persistence failure");
    expect(interrupted.input.session.next).toHaveBeenCalledTimes(1);
  });
});
