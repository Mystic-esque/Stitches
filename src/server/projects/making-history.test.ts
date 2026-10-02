import { randomUUID } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { constructionRecords } from "../../../scripts/content/construction-records.mjs";
import { currentMakingSession, makingPrerequisites, activeMakingSteps, type RecordMakingInput } from "../../domain/making-plan";
import { resolveMakingPlan, loadMakingPlan, MAKING_PLAN_QUERY } from "../knowledge/making-plan";
import { resolveCompanionCatalog } from "../knowledge/companion-catalog";
import { GuestStore } from "./guest-store";

const catalogDocs = ["companion-candidates", "companion-piece-studies", "companion-diagnostic"].flatMap((file) =>
  JSON.parse(readFileSync(new URL(`../../../fixtures/${file}.json`, import.meta.url), "utf8")).documents)
  .map((entry: Record<string, unknown>, index: number) => ({ ...entry, _rev: `fixture-${index}` }));
const cards = resolveCompanionCatalog(catalogDocs);
const documents = (design: string): Record<string, unknown>[] => constructionRecords.filter((entry) => String(entry._id).includes(`-${design}-`))
  .map((entry, index) => ({ ...entry, _rev: `fixture-construction-${index}` }));
const plans = cards.map((card) => resolveMakingPlan(documents(card.designKey), card));
const owner = "synthetic-maker";

describe("authored construction learning graphs", () => {
  it("has distinct Sandy and Tina relationships and explicitly collapses disabled optional prerequisites", () => {
    expect(plans.map((plan) => plan.steps.length)).toEqual([5, 8]);
    const tina = plans[1], options = { sleeves: false, frontBottom: false, dart: false };
    expect(activeMakingSteps(tina, options).map((step) => step.id.split("-v1-")[1])).toEqual(["marks", "shoulders", "neck", "sides", "finishes"]);
    expect(makingPrerequisites(tina, options, `${tina.id}-sides`)).toEqual([`${tina.id}-neck`]);
    expect(makingPrerequisites(tina, { sleeves: true, frontBottom: false, dart: false }, `${tina.id}-sides`)).toEqual([`${tina.id}-sleeves`]);
    expect(tina.steps.find((step) => step.id.endsWith("-sleeves"))?.orientation).toContain("neck opening");
    expect(plans.every((plan) => plan.capability === "plan_only" && plan.reviewStatus === "pending")).toBe(true);
  });
  it("rejects missing, duplicate, cross-project, cyclic, unknown-edge and wrong-branch records", () => {
    const card = cards[1], docs = documents("tina");
    expect(() => resolveMakingPlan(docs.slice(1), card)).toThrow(/Incomplete/);
    expect(() => resolveMakingPlan(docs.map((doc, i) => i === 2 ? docs[1] : doc), card)).toThrow(/Unexpected/);
    expect(() => resolveMakingPlan(docs.map((doc) => ({ ...doc, source: { _ref: "other-source" } })), card)).toThrow(/binding/);
    for (const replacement of [{ prerequisites: [{ _ref: `${plans[1].id}-finishes` }] },
      { edgeIds: ["invented-armhole"] }, { condition: "always" }, { pieceKeys: ["unmapped-pocket"] }]) {
      expect(() => resolveMakingPlan(docs.map((doc) => String(doc._id).endsWith("-sleeves") ? { ...doc, ...replacement } : doc), card)).toThrow();
    }
    const correction = docs.map((doc) => String(doc._id).endsWith("-neck") ? { ...doc, _rev: "new-editorial-revision" } : doc);
    expect(resolveMakingPlan(correction, card).fingerprint).not.toBe(plans[1].fingerprint);
  });
  it("uses a fixed bounded source query with cancellation", async () => {
    let querySeen = "";
    await loadMakingPlan({ fetch: async (query: string, params: { ids: string[] }, options: { signal: AbortSignal }) => {
      querySeen = query; expect(params.ids).toHaveLength(6); expect(options.signal).toBeInstanceOf(AbortSignal); return documents("sandy");
    } } as never, cards[0]);
    expect(querySeen).toBe(MAKING_PLAN_QUERY);
  });
});

describe("private revision-bound making notebook", () => {
  function setup(store: GuestStore, design = 1) {
    return store.createProject(owner, { title: "Synthetic making study", brief: "Not a physical maker trial.",
      source: { kind: "candidate", designId: cards[design].designKey }, idempotencyKey: randomUUID() }, cards[design].fingerprint);
  }
  it("requires explicit configuration, enforces prerequisites, saves help separately and replays exact retries", () => {
    const store = new GuestStore(":memory:");
    try {
      const project = setup(store), plan = plans[1];
      const input = (event: RecordMakingInput["event"], sequence = store.listMaking(owner, project.id).length): RecordMakingInput => ({
        expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash, expectedHistorySequence: sequence,
        planFingerprint: plan.fingerprint, idempotencyKey: randomUUID(), event });
      const record = (event: RecordMakingInput["event"]) => store.recordMaking(owner, project.id, input(event), plan, cards[1].fingerprint);
      expect(() => record({ kind: "reviewed", stepId: `${plan.id}-marks`, checkpointConfirmed: true })).toThrow(/explicitly confirm/);
      record({ kind: "configured", options: { sleeves: false, frontBottom: false, dart: false } });
      expect(() => record({ kind: "reviewed", stepId: `${plan.id}-sides`, checkpointConfirmed: true })).toThrow(/prerequisites/);
      expect(() => record({ kind: "help_requested", stepId: `${plan.id}-marks`, symptom: "seam_puckering", detail: "Sample question" })).toThrow(/does not apply/);
      record({ kind: "reviewed", stepId: `${plan.id}-marks`, checkpointConfirmed: true });
      const help = input({ kind: "help_requested", stepId: `${plan.id}-shoulders`, symptom: "alignment", detail: "Which side is inside?" });
      const saved = store.recordMaking(owner, project.id, help, plan, cards[1].fingerprint);
      expect(store.replayMaking(owner, project.id, help)).toEqual(saved);
      expect(() => store.replayMaking(owner, project.id, { ...help, event: { kind: "paused", reason: "different" } })).toThrow(/already used/);
      expect(() => store.recordMaking(owner, project.id, input({ kind: "paused", reason: "reload" }, 0), plan, cards[1].fingerprint)).toThrow(/Another making/);
      expect(() => store.listMaking("other-owner", project.id)).toThrow(/not found/);
      store.recordMaking(owner, project.id, input({ kind: "paused", reason: "Knowledge is offline; seek source review." }), null, cards[1].fingerprint);
      expect(store.getProject(owner, project.id)).toEqual(project);
      expect(currentMakingSession(store.listMaking(owner, project.id), project, plan)?.next?.id).toBe(`${plan.id}-shoulders`);
      const revised = store.updateProject(owner, project.id, { expectedSequence: project.sequence, expectedBasisHash: project.basisHash,
        brief: "A new version", idempotencyKey: randomUUID() });
      expect(currentMakingSession(store.listMaking(owner, project.id), revised, plan)).toBeNull();
      expect(() => record({ kind: "paused", reason: "Old tab" })).toThrow(/changed/);
      expect(currentMakingSession(store.listMaking(owner, project.id), project, { ...plan, fingerprint: "e".repeat(64) })).toBeNull();
    } finally { store.close(); }
  });
  it("restarts configuration without rewriting history and accepts only the supported Sandy envelope", () => {
    const store = new GuestStore(":memory:");
    try {
      const project = setup(store, 0), plan = plans[0];
      const input = (options: { sleeves: boolean; frontBottom: boolean; dart: boolean }): RecordMakingInput => ({
        expectedProjectSequence: 1, expectedBasisHash: project.basisHash, expectedHistorySequence: store.listMaking(owner, project.id).length,
        planFingerprint: plan.fingerprint, idempotencyKey: randomUUID(), event: { kind: "configured", options } });
      expect(() => store.recordMaking(owner, project.id, input({ sleeves: true, frontBottom: false, dart: false }), plan, cards[0].fingerprint)).toThrow(/no sleeve/);
      const first = store.recordMaking(owner, project.id, input({ sleeves: false, frontBottom: false, dart: false }), plan, cards[0].fingerprint);
      const second = store.recordMaking(owner, project.id, input({ sleeves: false, frontBottom: false, dart: false }), plan, cards[0].fingerprint);
      expect(first.sessionId).not.toBe(second.sessionId); expect(store.listMaking(owner, project.id)[0]).toEqual(first);
      expect(currentMakingSession(store.listMaking(owner, project.id), project, plan)?.configured.id).toBe(second.id);
    } finally { store.close(); }
  });
  it("persists after restart, round-trips v4 as historical-only, and rolls back malformed history", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "stitches-making-test-")), database = path.join(directory, "guest.sqlite");
    let store = new GuestStore(database);
    try {
      const project = setup(store), plan = plans[1];
      const saved = store.recordMaking(owner, project.id, { expectedProjectSequence: 1, expectedBasisHash: project.basisHash,
        expectedHistorySequence: 0, planFingerprint: plan.fingerprint, idempotencyKey: randomUUID(),
        event: { kind: "configured", options: { sleeves: true, frontBottom: true, dart: false } } }, plan, cards[1].fingerprint);
      store.close(); store = new GuestStore(database);
      expect(store.listMaking(owner, project.id)).toEqual([saved]);
      const backup = { format: "stitches-project-backup" as const, version: 4 as const, title: project.title, brief: project.brief,
        source: project.source, plan: project.plan, knowledgeFingerprint: project.knowledgeFingerprint, notes: [], diagnostics: [], making: [saved] };
      const restored = store.importBackup(owner, { backup, idempotencyKey: randomUUID() });
      expect(store.listMaking(owner, restored.id)[0]).toMatchObject({ imported: true, planFingerprint: plan.fingerprint });
      expect(currentMakingSession(store.listMaking(owner, restored.id), restored, plan)).toBeNull();
      const count = store.listProjects(owner).length;
      expect(() => store.importBackup(owner, { backup: { ...backup, making: [saved, { ...saved, sequence: 2 }] }, idempotencyKey: randomUUID() })).toThrow(/unique ordered/);
      expect(store.listProjects(owner)).toHaveLength(count);
    } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
  }, 20000); // Real Windows temp-directory/WAL I/O may exceed the CPU-only five-second default.
});
