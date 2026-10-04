import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { emptyProjectPlan } from "../../domain/guest-project";
import { resolveCompanionCatalog } from "../knowledge/companion-catalog";
import type { ContextResult } from "../knowledge/context-mcp";
import type { ModelFeedback, ModelTurn } from "./fit-loop";
import { createCompanionTools, createStitchesCompanionReader, STITCHES_KB_ID, type CompanionSnapshot } from "./companion-tools";
import { runCompanionLoop, type CompanionCheckpoint } from "./companion-loop";
import { constructionRecords } from "../../../scripts/content/construction-records.mjs";
import { resolveMakingPlan } from "../knowledge/making-plan";

const documents = ["companion-candidates", "companion-piece-studies", "companion-diagnostic"].flatMap((name) =>
  JSON.parse(readFileSync(new URL(`../../../fixtures/${name}.json`, import.meta.url), "utf8")).documents)
  .map((item: object, index: number) => ({ ...item, _rev: `synthetic-${index}` }));
const cards = resolveCompanionCatalog(documents);
const call = (name: string, id = name): ModelTurn => ({ calls: [{ name, id, args: {} }] });

function setup(design: "sandy" | "tina" = "sandy", customize?: (snapshot: CompanionSnapshot) => void) {
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
  customize?.(initial);
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
  it("resolves an observed rebuilt outline and fails closed on lost attribution or outline access", async () => {
    const state = setup();
    const groupedReader = { ...state.reader, initialContext: vi.fn(async (): Promise<ContextResult> => ({
      tool: "initial_context", knowledgeBaseId: STITCHES_KB_ID, paths: [],
      text: "garment_planning/sandy_circle_skirt [core]\nconstruction/sandy_circle_skirt [core]\nseam_quality [core]" })) };
    const tools = createCompanionTools({ ...state.options, reader: groupedReader });
    await tools.execute("retrieve_context", {});
    expect(groupedReader.readPaths).toHaveBeenCalledWith(["garment_planning/sandy_circle_skirt"]);
    groupedReader.readPaths.mockResolvedValueOnce({ tool: "knowledge_base_read", knowledgeBaseId: STITCHES_KB_ID,
      paths: ["garment_planning/sandy_circle_skirt"], text: "A fact with unreliable attribution [2].\n## Sources\n1. Different record" });
    await expect(tools.execute("retrieve_context", {})).rejects.toMatchObject({ code: "missing_knowledge" });
    groupedReader.initialContext.mockRejectedValueOnce(new Error("Explicit fixture outline outage"));
    const calls = groupedReader.readPaths.mock.calls.length;
    await expect(tools.execute("retrieve_context", {})).rejects.toMatchObject({ code: "missing_knowledge" });
    expect(groupedReader.readPaths.mock.calls.length).toBe(calls);
  });
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

  it("inspects the confirmed construction plan, step prerequisites, and involved pieces with privacy withholding", async () => {
    const sandyDocs = constructionRecords.filter((entry) => String(entry._id).includes("-sandy-"))
      .map((entry, index) => ({ ...entry, _rev: `fixture-construction-${index}` }));
    const card = cards.find((item) => item.designKey === "sandy")!;
    const plan = resolveMakingPlan(sandyDocs, card);
    const configuredId = "b40d7c04-583c-4ce1-807d-5cb95fc9f563";
    const state = setup("sandy", (snapshot) => {
      snapshot.makingPlan = plan;
      snapshot.makingHistory = [{
        id: configuredId,
        projectId: snapshot.project.id,
        sequence: 1,
        basisSequence: snapshot.project.sequence,
        basisHash: snapshot.project.basisHash,
        catalogFingerprint: snapshot.project.knowledgeFingerprint!,
        planFingerprint: plan.fingerprint,
        sessionId: configuredId,
        createdAt: "2026-10-02T00:00:00.000Z",
        imported: false,
        event: {
          kind: "configured",
          options: { sleeves: false, frontBottom: false, dart: false },
        },
      }];
    });

    const run = runner(state, [call("inspect_project"), call("inspect_making"), call("retrieve_context")]);
    const result = await runCompanionLoop(run.input);
    expect(run.input.session.next).toHaveBeenCalledTimes(4);
    const feedback = run.feedback[1].response as Record<string, unknown>;
    expect(feedback.configured).toBe(true);
    expect(feedback.activeStep).toMatchObject({
      title: "Understand the closure seam",
      ordinal: 1,
      prerequisitesMet: true,
      orientation: expect.any(String),
      action: expect.any(String),
      checkpoint: expect.any(String),
    });
    expect(feedback.withheld).toEqual(["personal notes", "freeform question text", "body measurements", "photos"]);
    expect(result.status).toBe("read_only_insight");
  });

  it("handles unconfigured construction study gracefully", async () => {
    const sandyDocs = constructionRecords.filter((entry) => String(entry._id).includes("-sandy-"))
      .map((entry, index) => ({ ...entry, _rev: `fixture-construction-${index}` }));
    const card = cards.find((item) => item.designKey === "sandy")!;
    const plan = resolveMakingPlan(sandyDocs, card);
    const state = setup("sandy", (snapshot) => {
      snapshot.makingPlan = plan;
      snapshot.makingHistory = [];
    });

    const run = runner(state, [call("inspect_project"), call("inspect_making"), call("retrieve_context")]);
    const result = await runCompanionLoop(run.input);
    expect(run.input.session.next).toHaveBeenCalledTimes(4);
    const feedback = run.feedback[1].response as Record<string, unknown>;
    expect(feedback.configured).toBe(false);
    expect(feedback.status).toBe("not_configured");
    expect(result.status).toBe("read_only_insight");
  });

  it("resolves active help symptoms without disclosing private user question text", async () => {
    const sandyDocs = constructionRecords.filter((entry) => String(entry._id).includes("-sandy-"))
      .map((entry, index) => ({ ...entry, _rev: `fixture-construction-${index}` }));
    const card = cards.find((item) => item.designKey === "sandy")!;
    const plan = resolveMakingPlan(sandyDocs, card);
    const configuredId = "b40d7c04-583c-4ce1-807d-5cb95fc9f563";
    const privateQuestion = "PRIVATE-HELP-QUESTION-DO-NOT-LEAK";
    const state = setup("sandy", (snapshot) => {
      snapshot.makingPlan = plan;
      snapshot.makingHistory = [
        {
          id: configuredId,
          projectId: snapshot.project.id,
          sequence: 1,
          basisSequence: snapshot.project.sequence,
          basisHash: snapshot.project.basisHash,
          catalogFingerprint: snapshot.project.knowledgeFingerprint!,
          planFingerprint: plan.fingerprint,
          sessionId: configuredId,
          createdAt: "2026-10-02T00:00:00.000Z",
          imported: false,
          event: {
            kind: "configured",
            options: { sleeves: false, frontBottom: false, dart: false },
          },
        },
        {
          id: "c40d7c04-583c-4ce1-807d-5cb95fc9f564",
          projectId: snapshot.project.id,
          sequence: 2,
          basisSequence: snapshot.project.sequence,
          basisHash: snapshot.project.basisHash,
          catalogFingerprint: snapshot.project.knowledgeFingerprint!,
          planFingerprint: plan.fingerprint,
          sessionId: configuredId,
          createdAt: "2026-10-02T00:01:00.000Z",
          imported: false,
          event: {
            kind: "help_requested",
            stepId: plan.steps[0].id,
            symptom: "seam_puckering",
            detail: privateQuestion,
          },
        },
      ];
    });

    const run = runner(state, [call("inspect_project"), call("inspect_making"), call("retrieve_context")]);
    const result = await runCompanionLoop(run.input);
    expect(run.input.session.next).toHaveBeenCalledTimes(4);
    const feedback = run.feedback[1].response as Record<string, unknown>;
    expect(feedback.activeStep).toMatchObject({
      activeHelpSymptom: "seam_puckering",
    });
    const outbound = JSON.stringify(run.feedback);
    expect(outbound).not.toContain(privateQuestion);
    expect(result.status).toBe("read_only_insight");
  });

  it("filters excluded optional pieces and includes mirroring in inspect_making for Tina without sleeves", async () => {
    const tinaDocs = constructionRecords.filter((entry) => String(entry._id).includes("-tina-"))
      .map((entry, index) => ({ ...entry, _rev: `fixture-construction-${index}` }));
    const card = cards.find((item) => item.designKey === "tina")!;
    const plan = resolveMakingPlan(tinaDocs, card);
    const configuredId = "f40d7c04-583c-4ce1-807d-5cb95fc9f565";
    const state = setup("tina", (snapshot) => {
      snapshot.makingPlan = plan;
      snapshot.makingHistory = [{
        id: configuredId,
        projectId: snapshot.project.id,
        sequence: 1,
        basisSequence: snapshot.project.sequence,
        basisHash: snapshot.project.basisHash,
        catalogFingerprint: snapshot.project.knowledgeFingerprint!,
        planFingerprint: plan.fingerprint,
        sessionId: configuredId,
        createdAt: "2026-10-02T00:00:00.000Z",
        imported: false,
        event: {
          kind: "configured",
          options: { sleeves: false, frontBottom: false, dart: false },
        },
      }];
    });

    const run = runner(state, [call("inspect_project"), call("inspect_making"), call("retrieve_context")]);
    const result = await runCompanionLoop(run.input);
    expect(result.status).toBe("read_only_insight");
    const feedback = run.feedback[1].response as Record<string, unknown>;
    expect(feedback.configured).toBe(true);
    const step = feedback.activeStep as { pieces: Array<{ pieceKey: string; title: string; mirrored: boolean }> };
    expect(step.pieces.some((p) => p.pieceKey === "sleeve")).toBe(false);
    expect(step.pieces.find((p) => p.pieceKey === "front")?.mirrored).toBe(true);
    expect(step.pieces.find((p) => p.pieceKey === "back")?.mirrored).toBe(false);
  });

  it("invalidates the loop as stale when completing a making checkpoint", async () => {
    const sandyDocs = constructionRecords.filter((entry) => String(entry._id).includes("-sandy-"))
      .map((entry, index) => ({ ...entry, _rev: `fixture-construction-${index}` }));
    const card = cards.find((item) => item.designKey === "sandy")!;
    const plan = resolveMakingPlan(sandyDocs, card);
    const configuredId = "b40d7c04-583c-4ce1-807d-5cb95fc9f563";
    const state = setup("sandy", (snapshot) => {
      snapshot.makingPlan = plan;
      snapshot.makingHistory = [{
        id: configuredId,
        projectId: snapshot.project.id,
        sequence: 1,
        basisSequence: snapshot.project.sequence,
        basisHash: snapshot.project.basisHash,
        catalogFingerprint: snapshot.project.knowledgeFingerprint!,
        planFingerprint: plan.fingerprint,
        sessionId: configuredId,
        createdAt: "2026-10-02T00:00:00.000Z",
        imported: false,
        event: { kind: "configured", options: { sleeves: false, frontBottom: false, dart: false } },
      }];
    });

    const run = runner(state, [call("inspect_project")]);
    run.input.session.next.mockImplementationOnce(async () => {
      state.change((current) => {
        current.makingHistory!.push({
          id: "d40d7c04-583c-4ce1-807d-5cb95fc9f566",
          projectId: current.project.id,
          sequence: 2,
          basisSequence: current.project.sequence,
          basisHash: current.project.basisHash,
          catalogFingerprint: current.project.knowledgeFingerprint!,
          planFingerprint: plan.fingerprint,
          sessionId: configuredId,
          createdAt: "2026-10-02T00:02:00.000Z",
          imported: false,
          event: { kind: "reviewed", stepId: plan.steps[0].id, checkpointConfirmed: true },
        });
      });
      return call("inspect_making");
    });
    await expect(runCompanionLoop(run.input)).rejects.toMatchObject({ code: "stale" });
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
