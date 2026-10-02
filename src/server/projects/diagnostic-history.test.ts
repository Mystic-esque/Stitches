import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { GuestStore } from "./guest-store";
import { diagnosticTransitionError, type DiagnosticBinding, type DiagnosticEvent, type DiagnosticRecord } from "../../domain/diagnostic-history";
import { emptyProjectPlan, projectBackupSchema, type GuestProject } from "../../domain/guest-project";

const owner = "synthetic-owner", other = "another-owner";
const binding: DiagnosticBinding = { catalogFingerprint: "a".repeat(64), diagnosticFingerprint: "b".repeat(64), sourceId: "source-coats", testId: "test-release", remedyId: "remedy-scrap-comparison" };
function setup(store: GuestStore) { return store.createProject(owner, { title: "Synthetic skirt check", brief: "Sample only.", source: { kind: "candidate", designId: "sandy" }, idempotencyKey: randomUUID() }, binding.catalogFingerprint); }
function request(project: GuestProject, sequence: number, event: DiagnosticEvent) { return { expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash,
  expectedHistorySequence: sequence, expectedDiagnosticFingerprint: binding.diagnosticFingerprint, idempotencyKey: randomUUID(), event }; }

describe("private source-bound scrap history", () => {
  it("requires a current discriminating observation, keeps separate attempts/results, and stops failed repetition", () => {
    const store = new GuestStore(":memory:");
    try {
      const project = setup(store);
      expect(() => store.recordDiagnostic(owner, project.id, request(project, 0, { kind: "comparison_result", attemptId: randomUUID(), outcome: "helped", detail: "" }), binding)).toThrow(/active/);
      const unknown = store.recordDiagnostic(owner, project.id, request(project, 0, { kind: "observation", observation: "not-tested", detail: "I have not cut a sample." }), binding);
      expect(() => store.recordDiagnostic(owner, project.id, request(project, 1, { kind: "comparison_started", observationId: unknown.id }), binding)).toThrow(/relaxed/);
      const seen = store.recordDiagnostic(owner, project.id, request(project, 1, { kind: "observation", observation: "relaxes", detail: "Scrap flattened." }), binding);
      const attempt = store.recordDiagnostic(owner, project.id, request(project, 2, { kind: "comparison_started", observationId: seen.id }), binding);
      expect(() => store.recordDiagnostic(owner, project.id, request(project, 3, { kind: "observation", observation: "unchanged", detail: "" }), binding)).toThrow(/result or pause/);
      const result = store.recordDiagnostic(owner, project.id, request(project, 3, { kind: "comparison_result", attemptId: attempt.id, outcome: "worse", detail: "Scrap got worse; stopped." }), binding);
      expect(result.event.kind).toBe("comparison_result");
      const fresh = store.recordDiagnostic(owner, project.id, request(project, 4, { kind: "observation", observation: "relaxes", detail: "" }), binding);
      expect(() => store.recordDiagnostic(owner, project.id, request(project, 5, { kind: "comparison_started", observationId: fresh.id }), binding)).toThrow(/unsuccessful/);
      expect(store.listDiagnostics(owner, project.id).map((item) => item.sequence)).toEqual([1, 2, 3, 4, 5]);
      expect(store.getProject(owner, project.id)).toEqual(project); // No capability promotion or project rewrite.
    } finally { store.close(); }
  });
  it("isolates guests, checks both source/project and concurrent history, and replays exact receipts without source reads", () => {
    const store = new GuestStore(":memory:");
    try {
      const project = setup(store), input = request(project, 0, { kind: "observation", observation: "unchanged", detail: "No release." });
      const first = store.recordDiagnostic(owner, project.id, input, binding);
      expect(store.replayDiagnostic(owner, project.id, input)).toEqual(first);
      expect(() => store.listDiagnostics(other, project.id)).toThrow(/not found/);
      expect(() => store.recordDiagnostic(other, project.id, input, binding)).toThrow(/not found/);
      expect(() => store.replayDiagnostic(owner, project.id, { ...input, event: { kind: "observation", observation: "relaxes", detail: "" } })).toThrow(/already used/);
      expect(() => store.recordDiagnostic(owner, project.id, { ...input, idempotencyKey: randomUUID() }, binding)).toThrow(/Another check/);
      expect(() => store.recordDiagnostic(owner, project.id, request(project, 1, { kind: "paused", reason: "Review" }), { ...binding, diagnosticFingerprint: "c".repeat(64) })).toThrow(/source changed/);
      const next = store.updateProject(owner, project.id, { expectedSequence: 1, expectedBasisHash: project.basisHash, brief: "Changed material notes", idempotencyKey: randomUUID() });
      expect(() => store.recordDiagnostic(owner, project.id, request(project, 1, { kind: "paused", reason: "Review" }), binding)).toThrow(/changed/);
      expect(store.recordDiagnostic(owner, project.id, input, binding)).toEqual(first);
      expect(store.listDiagnostics(owner, project.id)[0].basisHash).not.toBe(next.basisHash);
      expect(() => store.recordDiagnostic(owner, project.id, request(next, 1, { kind: "comparison_started", observationId: first.id }), binding)).toThrow(/current/);
    } finally { store.close(); }
  });
  it("persists across restart, restores only untrusted history, and atomically rejects an invalid import", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "stitches-diagnostic-test-")), database = path.join(directory, "guest.sqlite");
    let store = new GuestStore(database);
    try {
      const project = setup(store);
      const seen = store.recordDiagnostic(owner, project.id, request(project, 0, { kind: "observation", observation: "relaxes", detail: "Synthetic sample" }), binding);
      store.close(); store = new GuestStore(database);
      expect(store.listDiagnostics(owner, project.id)).toEqual([seen]);
      const backup = projectBackupSchema.parse({ format: "stitches-project-backup", version: 3, title: project.title, brief: project.brief,
        source: project.source, plan: project.plan, knowledgeFingerprint: project.knowledgeFingerprint, notes: [], diagnostics: [seen] });
      const restored = store.importBackup(owner, { backup, idempotencyKey: randomUUID() });
      const history = store.listDiagnostics(owner, restored.id);
      expect(history[0]).toEqual({ ...seen, projectId: restored.id, imported: true });
      expect(() => store.recordDiagnostic(owner, restored.id, request(restored, 1, { kind: "comparison_started", observationId: seen.id }), binding)).toThrow(/current/);
      const count = store.listProjects(owner).length;
      if (backup.version !== 3) throw new Error("test backup version");
      expect(() => store.importBackup(owner, { backup: { ...backup, diagnostics: [seen, seen] }, idempotencyKey: randomUUID() })).toThrow(/unique ordered/);
      expect(store.listProjects(owner)).toHaveLength(count);
      expect(store.listDiagnostics(owner, project.id)).toEqual([seen]);
    } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
  }, 60_000); // Bounded Windows disk/setup/cleanup allowance; no recovery-latency claim.
  it("does not resume an old attempt on a later identical-semantic revision or infer confirmation", () => {
    const record: DiagnosticRecord = { id: randomUUID(), projectId: randomUUID(), sequence: 1, basisSequence: 1, basisHash: "d".repeat(64), binding,
      event: { kind: "observation", observation: "relaxes", detail: "" }, createdAt: new Date().toISOString(), imported: false };
    expect(diagnosticTransitionError([record], { kind: "comparison_started", observationId: record.id }, record.basisHash, binding, 2)).toContain("current");
    expect(diagnosticTransitionError([record], { kind: "comparison_started", observationId: record.id }, record.basisHash, binding, 1)).toBeNull();
    expect(() => projectBackupSchema.parse({ format: "stitches-project-backup", version: 3, title: "X", brief: "", source: { kind: "own_idea" }, plan: emptyProjectPlan(), notes: [], knowledgeFingerprint: null, diagnostics: [{ ...record, confirmedCause: true }] })).toThrow();
  });
});
