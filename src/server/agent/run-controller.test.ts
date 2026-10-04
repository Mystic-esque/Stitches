import { randomUUID } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { startAgentRunSchema, type AgentTask } from "../../domain/agent-run";
import { GuestStore } from "../projects/guest-store";
import { resolveCompanionCatalog } from "../knowledge/companion-catalog";
import { companionBasis, STITCHES_KB_ID } from "./companion-tools";
import { advanceCompanionRun } from "./run-controller";
import { createGeminiSession } from "./gemini-session";
import { publicAgentRun } from "./run-state";
import { constructionRecords } from "../../../scripts/content/construction-records.mjs";
import { resolveMakingPlan } from "../knowledge/making-plan";
import type { MakingRecord } from "../../domain/making-plan";

const documents = ["companion-candidates", "companion-piece-studies", "companion-diagnostic"].flatMap((name) =>
  JSON.parse(readFileSync(new URL(`../../../fixtures/${name}.json`, import.meta.url), "utf8")).documents)
  .map((item: object, index: number) => ({ ...item, _rev: `synthetic-${index}` }));
const cards = resolveCompanionCatalog(documents);
function makingPlanFor(card: typeof cards[number]) {
  const docs = constructionRecords
    .filter((entry) => String(entry._id).includes(`-${card.designKey}-`))
    .map((entry, index) => ({ ...entry, _rev: `fixture-construction-${index}` }));
  return resolveMakingPlan(docs, card);
}
function setup(databasePath = ":memory:", task: AgentTask = "next_preparation", includeMakingPlan?: boolean) {
  const store = new GuestStore(databasePath), source = cards[0], ownerId = "synthetic-owner";
  const project = store.createProject(ownerId, { title: "PRIVATE TITLE", brief: "PRIVATE BRIEF", source: { kind: "candidate", designId: source.designKey }, idempotencyKey: randomUUID() }, source.fingerprint);
  const isMaking = task === "step_guidance" || task === "troubleshoot_step";
  const makingPlan = (includeMakingPlan ?? isMaking) ? makingPlanFor(source) : null;
  let snapshot = { project, source, history: store.listDiagnostics(ownerId, project.id), makingPlan, makingHistory: [] as MakingRecord[] };
  const start = { idempotencyKey: randomUUID(), task, expectedBasis: companionBasis(snapshot), consent: { version: "preparation-v1" as const, sharePreparationSummary: true as const } };
  const run = store.startAgentRun(ownerId, project.id, start);
  const requests: GenerateContentParameters[] = [];
  const expectedTools = task === "step_guidance" || task === "troubleshoot_step"
    ? ["inspect_project", "inspect_making", "retrieve_context"]
    : ["inspect_project", "resolve_exact_graph", "retrieve_context"];
  const generate = vi.fn(async (request: GenerateContentParameters) => {
    requests.push(request);
    const turn = (request.contents as unknown[]).length / 2 + 0.5;
    const tool = expectedTools[turn - 1];
    const call = tool ? { id: `call-${turn}`, name: tool, args: {} } : undefined;
    return { candidates: [{ content: { role: "model", parts: call ? [{ functionCall: call, thoughtSignature: `opaque-${turn}` }] : [{ text: "Record the missing source-listed notes. Pending review; do not cut from these studies." }] } }],
      functionCalls: call ? [call] : [], text: call ? undefined : "Record the missing source-listed notes. Pending review; do not cut from these studies." } as unknown as GenerateContentResponse;
  });
  const reader = { readPaths: vi.fn(async (paths: string[]) => ({ tool: "knowledge_base_read" as const, knowledgeBaseId: STITCHES_KB_ID, paths, text: "SYNTHETIC maintained explanation; not live proof." })) };
  const input = { store, ownerId, projectId: project.id, runId: run.id, freeAuthorized: true,
    loadSnapshot: async () => snapshot, reader, createSession: (options: Parameters<typeof createGeminiSession>[0]) => createGeminiSession({ ...options, apiKey: "test-key", model: "gemini-3.5-flash-lite", purpose: "companion", generate }) };
  // The factory supplied to the controller needs only its request/state contract.
  const advance = () => advanceCompanionRun({ ...input, createSession: (options) => input.createSession({ ...options, apiKey: "test-key", model: "gemini-3.5-flash-lite" }) });
  return { store, source, project, ownerId, start, run, input, advance, requests, generate, reader, change: (value: typeof snapshot) => { snapshot = value; } };
}

describe("durable private agent — synthetic deterministic proof", () => {
  it("requires an exact consent/task envelope; rejects private text and arbitrary tools", () => {
    const s = setup();
    try {
      expect(startAgentRunSchema.safeParse({ ...s.start, consent: { ...s.start.consent, sharePreparationSummary: false } }).success).toBe(false);
      expect(startAgentRunSchema.safeParse({ ...s.start, request: "private note" }).success).toBe(false);
      expect(startAgentRunSchema.safeParse({ ...s.start, task: "keep_pattern" }).success).toBe(false);
    } finally { s.store.close(); }
  });
  it("checkpoints four requests, restores signatures between ticks and exposes no private transcript", async () => {
    const s = setup();
    try {
      for (let i = 0; i < 4; i++) await s.advance();
      const saved = s.store.getAgentRun(s.ownerId, s.project.id, s.run.id), visible = publicAgentRun(saved);
      expect(saved.status).toBe("completed"); expect(saved.requests).toBe(4);
      expect(saved.tools).toEqual(["inspect_project", "resolve_exact_graph", "retrieve_context"]);
      expect(s.requests.slice(0, 3).map((request) => request.config?.toolConfig?.functionCallingConfig?.allowedFunctionNames))
        .toEqual([["inspect_project"], ["resolve_exact_graph"], ["retrieve_context"]]);
      expect(s.requests[3].config?.toolConfig?.functionCallingConfig?.mode).toBe("NONE");
      expect((s.requests[1].contents as { parts: { thoughtSignature?: string }[] }[])[1].parts[0].thoughtSignature).toBe("opaque-1");
      expect(s.reader.readPaths).toHaveBeenCalledTimes(2); // Retrieval plus final served-evidence freshness check.
      expect(JSON.stringify(visible)).not.toMatch(/opaque-|SYNTHETIC maintained|functionResponse|PRIVATE/);
      expect(saved.checkpoints.map((item) => item.sequence)).toEqual(saved.checkpoints.map((_, i) => i + 1));
      expect(s.store.getProject(s.ownerId, s.project.id)).toEqual(s.project);
      await s.advance(); expect(s.generate).toHaveBeenCalledTimes(4);
    } finally { s.store.close(); }
  });
  it("enforces inspect_making tool sequence for construction study tasks", async () => {
    const s = setup(":memory:", "step_guidance");
    try {
      for (let i = 0; i < 4; i++) await s.advance();
      const saved = s.store.getAgentRun(s.ownerId, s.project.id, s.run.id);
      expect(saved.status).toBe("completed");
      expect(saved.tools).toEqual(["inspect_project", "inspect_making", "retrieve_context"]);
      expect(s.requests.slice(0, 3).map((request) => request.config?.toolConfig?.functionCallingConfig?.allowedFunctionNames))
        .toEqual([["inspect_project"], ["inspect_making"], ["retrieve_context"]]);
    } finally { s.store.close(); }
  });
  it("stops a making task with missing_knowledge if the construction plan is absent", async () => {
    const s = setup(":memory:", "step_guidance", false);
    try {
      await s.advance();
      const saved = s.store.getAgentRun(s.ownerId, s.project.id, s.run.id);
      expect(saved.status).toBe("missing_knowledge");
      expect(saved.message).toMatch(/construction study plan is unavailable/i);
    } finally { s.store.close(); }
  });
  it("invalidates an ongoing run as stale when making history or configuration changes", async () => {
    const s = setup(":memory:", "step_guidance");
    try {
      await s.advance();
      s.change({
        project: s.project,
        source: s.source,
        history: [],
        makingPlan: makingPlanFor(s.source),
        makingHistory: [{
          id: randomUUID(),
          projectId: s.project.id,
          sequence: 1,
          basisSequence: 1,
          basisHash: s.project.basisHash,
          catalogFingerprint: s.source.fingerprint,
          planFingerprint: makingPlanFor(s.source).fingerprint,
          sessionId: randomUUID(),
          event: { kind: "configured", options: { sleeves: false, frontBottom: false, dart: false } },
          createdAt: new Date().toISOString(),
          imported: false,
        }],
      });
      await s.advance();
      const saved = s.store.getAgentRun(s.ownerId, s.project.id, s.run.id);
      expect(saved.status).toBe("stale");
    } finally { s.store.close(); }
  });
  it("isolates owners, replays a start before network work, and rejects key reuse", () => {
    const s = setup();
    try {
      expect(s.store.startAgentRun(s.ownerId, s.project.id, s.start).id).toBe(s.run.id);
      expect(() => s.store.getAgentRun("other", s.project.id, s.run.id)).toThrow("not found");
      expect(() => s.store.listAgentRuns("other", s.project.id)).toThrow("not found");
      expect(() => s.store.startAgentRun(s.ownerId, s.project.id, { ...s.start, task: "review_gaps" })).toThrow("different change");
    } finally { s.store.close(); }
  });
  it("reserves once under overlapping advances and gives cancellation precedence over a late answer", async () => {
    const s = setup();
    try {
      let release!: (response: GenerateContentResponse) => void;
      s.generate.mockImplementationOnce(() => new Promise((done) => { release = done; }));
      const first = s.advance(); await vi.waitFor(() => expect(release).toBeTypeOf("function"));
      expect((await s.advance()).status).toBe("requesting");
      s.store.controlAgentRun(s.ownerId, s.project.id, s.run.id, "cancel");
      release({ candidates: [{ content: { role: "model", parts: [{ text: "Late, unsafe answer" }] } }], functionCalls: [], text: "Late, unsafe answer" } as unknown as GenerateContentResponse);
      expect((await first).status).toBe("cancelled");
      expect(s.generate).toHaveBeenCalledOnce(); expect(s.store.getAgentRun(s.ownerId, s.project.id, s.run.id).text).toBeUndefined();
    } finally { s.store.close(); }
  });
  it("marks lost in-flight work unknown and refuses implicit resume or repeated calls", () => {
    const s = setup();
    try {
      const at = Date.now(), claimed = s.store.claimAgentRun(s.ownerId, s.project.id, s.run.id, true, at);
      expect(claimed.requests).toBe(1);
      const lost = s.store.getAgentRun(s.ownerId, s.project.id, s.run.id, at + 40_001);
      expect(lost.status).toBe("unknown_outcome"); expect(lost.activeMs).toBe(40_000);
      expect(s.store.controlAgentRun(s.ownerId, s.project.id, s.run.id, "resume").status).toBe("unknown_outcome");
      expect(s.store.claimAgentRun(s.ownerId, s.project.id, s.run.id, true).requests).toBe(1);
    } finally { s.store.close(); }
  });
  it("recovers an acknowledged KB response after a source outage without recharging the model", async () => {
    const s = setup();
    try {
      await s.advance(); await s.advance();
      s.reader.readPaths.mockRejectedValueOnce(new Error("SECRET transport detail"));
      expect((await s.advance()).status).toBe("missing_knowledge"); expect(s.generate).toHaveBeenCalledTimes(3);
      s.store.controlAgentRun(s.ownerId, s.project.id, s.run.id, "resume");
      expect((await s.advance()).status).toBe("ready"); expect(s.generate).toHaveBeenCalledTimes(3);
      expect((await s.advance()).status).toBe("completed"); expect(s.generate).toHaveBeenCalledTimes(4);
      expect(s.reader.readPaths).toHaveBeenCalledTimes(3);
    } finally { s.store.close(); }
  });
  it("distinguishes known quota rejection from unknown transport outcome and requires explicit resume", async () => {
    const s = setup();
    try {
      s.generate.mockRejectedValueOnce({ status: 429, message: "SECRET provider detail" });
      const quota = await s.advance(); expect(quota.status).toBe("quota"); expect(quota.message).not.toContain("SECRET");
      await s.advance(); expect(s.generate).toHaveBeenCalledOnce();
      s.store.controlAgentRun(s.ownerId, s.project.id, s.run.id, "resume");
      s.generate.mockRejectedValueOnce(new Error("SECRET provider detail"));
      expect((await s.advance()).status).toBe("unknown_outcome");
    } finally { s.store.close(); }
  });
  it("refuses stale saved revisions and changed exact sources even during execution", async () => {
    const s = setup();
    try {
      s.change({ project: s.project, source: { ...s.source, fingerprint: "f".repeat(64) }, history: [], makingPlan: null, makingHistory: [] });
      expect((await s.advance()).status).toBe("stale"); expect(s.generate).not.toHaveBeenCalled();
      const other = setup();
      try {
        other.store.updateProject(other.ownerId, other.project.id, { expectedSequence: 1, expectedBasisHash: other.project.basisHash, idempotencyKey: randomUUID(), brief: "Changed" });
        expect(other.store.getAgentRun(other.ownerId, other.project.id, other.run.id).status).toBe("stale");
      } finally { other.store.close(); }
    } finally { s.store.close(); }
  });
  it("fails closed on a premature answer or model-selected write", async () => {
    const s = setup();
    try {
      s.generate.mockResolvedValueOnce({ candidates: [{ content: { role: "model", parts: [{ text: "Cut now" }] } }], functionCalls: [], text: "Cut now" } as unknown as GenerateContentResponse);
      expect((await s.advance()).status).toBe("failed");
      expect(s.store.getAgentRun(s.ownerId, s.project.id, s.run.id).text).toBeUndefined();
    } finally { s.store.close(); }
  });
  it("enforces the free gate before initializing a provider and keeps daily caps across runs", async () => {
    const s = setup();
    try {
      const factory = vi.fn();
      const gated = await advanceCompanionRun({ ...s.input, freeAuthorized: false, createSession: factory });
      expect(gated.status).toBe("budget"); expect(gated.requests).toBe(0); expect(factory).not.toHaveBeenCalled();
      // Reserved attempts, including failures, consume the conservative guest quota.
      for (let i = 0; i < 9; i++) {
        const next = s.store.startAgentRun(s.ownerId, s.project.id, { ...s.start, idempotencyKey: randomUUID() });
        const claimed = s.store.claimAgentRun(s.ownerId, s.project.id, next.id, true);
        expect(claimed.status).toBe(i < 8 ? "requesting" : "budget");
        s.store.controlAgentRun(s.ownerId, s.project.id, next.id, "cancel");
      }
    } finally { s.store.close(); }
  });
  it("rejects a newly rewritten served KB at final acceptance instead of blessing stale prose", async () => {
    const s = setup();
    try {
      for (let i = 0; i < 3; i++) await s.advance();
      s.reader.readPaths.mockImplementationOnce(async (paths) => ({ tool: "knowledge_base_read", knowledgeBaseId: STITCHES_KB_ID, paths, text: "SYNTHETIC changed explanation." }));
      const final = await s.advance(); expect(final.status).toBe("stale"); expect(final.text).toBeUndefined();
    } finally { s.store.close(); }
  });
  it("persists an acknowledged signed checkpoint across a genuine database restart", async () => {
    const directory = mkdtempSync(join(tmpdir(), "stitches-agent-test-")), file = join(directory, "private.sqlite"), s = setup(file);
    try {
      await s.advance(); s.store.close();
      const reopened = new GuestStore(file);
      try {
        const persisted = reopened.getAgentRun(s.ownerId, s.project.id, s.run.id);
        expect(persisted.status).toBe("ready"); expect(persisted.session?.lastModelContent?.parts?.[0]?.thoughtSignature).toBe("opaque-1");
        const continued = await advanceCompanionRun({ ...s.input, store: reopened, createSession: (options) => createGeminiSession({ ...options, apiKey: "test-key", model: "gemini-3.5-flash-lite", purpose: "companion", generate: s.generate }) });
        expect(continued.tools).toEqual(["inspect_project", "resolve_exact_graph"]); expect(s.requests).toHaveLength(2);
      } finally { reopened.close(); }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  }, 60_000);
});
