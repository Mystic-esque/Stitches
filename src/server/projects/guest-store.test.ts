import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GuestStore, GuestStoreError, projectBasisHash } from "./guest-store";
import { resolveGuestIdentity } from "./guest-session";
import { projectBackupSchema } from "../../domain/guest-project";

const create = (key = randomUUID()) => ({
  title: "My wrap idea",
  brief: "A garment I want to understand before cutting.",
  source: { kind: "own_idea" as const },
  idempotencyKey: key,
});

describe("private guest projects", () => {
  it("persists angular notes separately, binds the revision, and carries them through private backup import", () => {
    const store = new GuestStore(":memory:");
    try {
      const owner = resolveGuestIdentity().ownerId;
      const other = resolveGuestIdentity().ownerId;
      const first = store.createProject(owner, create());
      const plan = { ...first.plan, measurementsMm: { waist: 720, hips: 960, waistToFloor: 1000, waistToHips: 200 },
        measurementsDegrees: { shoulderSlope: 14 } };
      const request = { expectedSequence: 1, expectedBasisHash: first.basisHash, idempotencyKey: randomUUID(), plan };
      const next = store.updateProject(owner, first.id, request);
      expect(next.basisHash).not.toBe(first.basisHash);
      expect(store.updateProject(owner, first.id, request)).toEqual(next);
      expect(store.listRevisions(owner, first.id)[0].plan).not.toHaveProperty("measurementsDegrees");
      const backup = projectBackupSchema.parse({ format: "stitches-project-backup", version: 2, title: next.title,
        brief: next.brief, source: next.source, plan: next.plan, notes: [] });
      const restored = store.importBackup(owner, { backup, idempotencyKey: randomUUID() });
      expect(restored.plan).toEqual(plan);
      expect(store.getProject(other, restored.id)).toBeNull();
      expect(restored.capability).toBe("plan_only");
    } finally { store.close(); }
  });
  it("isolates two guest identities and never grants access by knowing a project ID", () => {
    const store = new GuestStore(":memory:");
    try {
      const alice = resolveGuestIdentity();
      const bob = resolveGuestIdentity();
      expect(alice.token).not.toBe(bob.token);
      expect(alice.ownerId).not.toBe(bob.ownerId);
      expect(resolveGuestIdentity(alice.token).ownerId).toBe(alice.ownerId);
      const project = store.createProject(alice.ownerId, create());
      expect(store.getProject(alice.ownerId, project.id)?.title).toBe("My wrap idea");
      expect(store.getProject(bob.ownerId, project.id)).toBeNull();
      expect(store.listProjects(bob.ownerId)).toEqual([]);
      expect(() => store.listRevisions(bob.ownerId, project.id)).toThrow(GuestStoreError);
    } finally { store.close(); }
  });

  it("keeps revisions immutable and rejects stale or reused request keys", () => {
    const store = new GuestStore(":memory:");
    try {
      const owner = resolveGuestIdentity().ownerId;
      const key = randomUUID();
      const first = store.createProject(owner, create(key));
      expect(store.createProject(owner, create(key))).toEqual(first);
      expect(() => store.createProject(owner, { ...create(key), title: "Different" }))
        .toThrowError(/already used/);
      const change = {
        expectedSequence: first.sequence,
        expectedBasisHash: first.basisHash,
        idempotencyKey: randomUUID(),
        plan: {
          ...first.plan,
          measurementsMm: { waistCircumference: 780 },
          fabric: { description: "Confirmed woven cotton", widthMm: 1400, lengthMm: 2000, structure: "woven" as const },
        },
      };
      const second = store.updateProject(owner, first.id, change);
      expect(second.sequence).toBe(2);
      expect(second.basisHash).not.toBe(first.basisHash);
      expect(second.capability).toBe("plan_only");
      expect(store.updateProject(owner, first.id, change)).toEqual(second);
      expect(() => store.updateProject(owner, first.id, { ...change, idempotencyKey: randomUUID() }))
        .toThrowError(/changed since/);
      expect(store.listRevisions(owner, first.id)).toEqual([first, second]);
      expect(projectBasisHash({ ...second, plan: { ...second.plan, equipment: [] } })).toBe(second.basisHash);
      expect(projectBasisHash({ ...second, plan: { ...second.plan, equipment: ["basic machine"] } })).not.toBe(second.basisHash);
    } finally { store.close(); }
  });

  it("restores a committed project after closing and reopening a local database", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "stitches-guest-test-"));
    const file = path.join(directory, "projects.sqlite");
    const owner = resolveGuestIdentity().ownerId;
    let projectId = "";
    try {
      const first = new GuestStore(file);
      try {
        const project = first.createProject(owner, create());
        projectId = project.id;
        first.recordNote(owner, projectId, { kind: "journal", stage: "plan", text: "I measured the fabric.",
          expectedProjectSequence: 1, expectedBasisHash: project.basisHash, idempotencyKey: randomUUID() });
      }
      finally { first.close(); }
      const reopened = new GuestStore(file);
      try {
        expect(reopened.getProject(owner, projectId)?.id).toBe(projectId);
        expect(reopened.listRevisions(owner, projectId)).toHaveLength(1);
        expect(reopened.listNotes(owner, projectId).map((note) => note.text)).toEqual(["I measured the fabric."]);
      } finally { reopened.close(); }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("refuses invalid measurements and unsupported source IDs before writing", () => {
    const store = new GuestStore(":memory:");
    try {
      const owner = resolveGuestIdentity().ownerId;
      expect(() => store.createProject(owner, { ...create(), source: { kind: "candidate", designId: "invented" } } as never)).toThrow();
      const project = store.createProject(owner, create());
      expect(() => store.updateProject(owner, project.id, {
        expectedSequence: 1, expectedBasisHash: project.basisHash, idempotencyKey: randomUUID(),
        plan: { ...project.plan, measurementsMm: { waistCircumference: -3 } },
      })).toThrow();
      expect(store.getProject(owner, project.id)).toEqual(project);
    } finally { store.close(); }
  });

  it("imports a validated latest-state backup as a new owner-scoped project", () => {
    const store = new GuestStore(":memory:");
    try {
      const owner = resolveGuestIdentity().ownerId;
      const first = store.createProject(owner, { ...create(), plan: {
        features: ["pockets"], openQuestions: ["fabric width"], measurementsMm: { waist: 760 },
        fabric: { description: "linen", widthMm: 1400, lengthMm: 2400, structure: "woven" }, equipment: ["basic machine"],
      } });
      const backup = projectBackupSchema.parse({ format: "stitches-project-backup", version: 1,
        title: first.title, brief: first.brief, source: first.source, plan: first.plan });
      const imported = store.importBackup(owner, { backup, idempotencyKey: randomUUID() });
      expect(imported.id).not.toBe(first.id);
      expect(imported.plan).toEqual(first.plan);
      expect(imported.sequence).toBe(1);
      expect(projectBackupSchema.safeParse({ ...backup, version: 99 }).success).toBe(false);
    } finally { store.close(); }
  });

  it("imports a journal-bearing backup atomically, retaining source revision provenance", () => {
    const store = new GuestStore(":memory:");
    try {
      const owner = resolveGuestIdentity().ownerId;
      const stranger = resolveGuestIdentity().ownerId;
      const original = store.createProject(owner, { ...create(), source: { kind: "candidate", designId: "tina" } }, "a".repeat(64));
      const early = store.recordNote(owner, original.id, { kind: "journal", stage: "prepare", text: "Sample seam finished.",
        expectedProjectSequence: 1, expectedBasisHash: original.basisHash, idempotencyKey: randomUUID() });
      const revised = store.updateProject(owner, original.id, { title: "My revised idea", expectedSequence: 1,
        expectedBasisHash: original.basisHash, idempotencyKey: randomUUID() });
      const current = store.recordNote(owner, original.id, { kind: "question", stage: "make", text: "Which edge next?",
        expectedProjectSequence: 2, expectedBasisHash: revised.basisHash, idempotencyKey: randomUUID() });
      const backup = projectBackupSchema.parse({ format: "stitches-project-backup", version: 2,
        title: revised.title, brief: revised.brief, source: revised.source, plan: revised.plan,
        knowledgeFingerprint: revised.knowledgeFingerprint,
        notes: [early, current].map(({ kind, stage, text, basisSequence, basisHash, createdAt }) => ({ kind, stage, text, basisSequence, basisHash, createdAt })) });
      if (backup.version !== 2) throw new Error("Expected a v2 backup.");
      const request = { backup, idempotencyKey: randomUUID() };
      const imported = store.importBackup(owner, request);
      expect(store.importBackup(owner, request)).toEqual(imported);
      expect(imported.id).not.toBe(original.id);
      expect(imported.sequence).toBe(1);
      expect(imported.knowledgeFingerprint).toBe(revised.knowledgeFingerprint);
      const notes = store.listNotes(owner, imported.id);
      expect(notes.map((note) => note.importedFromSequence)).toEqual([1, 2]);
      expect(notes[0].basisHash).not.toBe(imported.basisHash);
      expect(notes[1].basisHash).toBe(imported.basisHash);
      expect(notes[1].basisSequence).toBe(1);
      expect(() => store.listNotes(stranger, imported.id)).toThrowError(/not found/);
      expect(() => store.importBackup(owner, { backup: { ...backup, title: "Altered" }, idempotencyKey: request.idempotencyKey }))
        .toThrowError(/already used/);
      expect(() => store.importBackup(owner, { backup: { ...backup, notes: [{ ...backup.notes[0], text: " " }] }, idempotencyKey: randomUUID() })).toThrow();
      expect(store.listProjects(owner)).toHaveLength(2);
    } finally { store.close(); }
  });

  it("keeps private maker notes bound to the project basis and preserves stale evidence", () => {
    const store = new GuestStore(":memory:");
    try {
      const owner = resolveGuestIdentity().ownerId;
      const stranger = resolveGuestIdentity().ownerId;
      const project = store.createProject(owner, create());
      const request = { kind: "question" as const, stage: "prepare" as const,
        text: "Which fabric width should I check?", expectedProjectSequence: project.sequence,
        expectedBasisHash: project.basisHash, idempotencyKey: randomUUID() };
      const note = store.recordNote(owner, project.id, request);
      expect(store.recordNote(owner, project.id, request)).toEqual(note);
      expect(store.listNotes(owner, project.id)).toEqual([note]);
      expect(() => store.listNotes(stranger, project.id)).toThrowError(/not found/);
      expect(() => store.recordNote(owner, project.id, { ...request, text: "Different", idempotencyKey: request.idempotencyKey }))
        .toThrowError(/already used/);
      const changed = store.updateProject(owner, project.id, { title: "Changed plan", expectedSequence: 1,
        expectedBasisHash: project.basisHash, idempotencyKey: randomUUID() });
      expect(changed.basisHash).not.toBe(note.basisHash);
      expect(store.listNotes(owner, project.id)).toEqual([note]);
      expect(() => store.recordNote(owner, project.id, { ...request, idempotencyKey: randomUUID() }))
        .toThrowError(/changed/);
      expect(() => store.recordNote(owner, project.id, { ...request, text: " ", idempotencyKey: randomUUID(),
        expectedProjectSequence: changed.sequence, expectedBasisHash: changed.basisHash })).toThrow();
    } finally { store.close(); }
  });

  it("pins source knowledge, rebases only with the saved basis, and leaves old observations stale", () => {
    const store = new GuestStore(":memory:");
    try {
      const owner = resolveGuestIdentity().ownerId;
      const other = resolveGuestIdentity().ownerId;
      const firstFingerprint = "a".repeat(64);
      const nextFingerprint = "b".repeat(64);
      const createInput = { ...create(), source: { kind: "candidate" as const, designId: "sandy" as const } };
      const first = store.createProject(owner, createInput, firstFingerprint);
      expect(store.createProject(owner, createInput, "c".repeat(64))).toEqual(first);
      expect(first.knowledgeFingerprint).toBe(firstFingerprint);
      const note = store.recordNote(owner, first.id, { kind: "question", stage: "plan", text: "Which version is this?",
        expectedProjectSequence: 1, expectedBasisHash: first.basisHash, idempotencyKey: randomUUID() });
      const request = { expectedSequence: first.sequence, expectedBasisHash: first.basisHash, idempotencyKey: randomUUID() };
      const second = store.rebaseKnowledge(owner, first.id, request, nextFingerprint);
      expect(second.sequence).toBe(2);
      expect(second.knowledgeFingerprint).toBe(nextFingerprint);
      expect(second.basisHash).not.toBe(first.basisHash);
      expect(store.listNotes(owner, first.id)[0]).toEqual(note);
      expect(note.basisHash).not.toBe(second.basisHash);
      expect(store.rebaseKnowledge(owner, first.id, request, nextFingerprint)).toEqual(second);
      expect(store.rebaseKnowledge(owner, first.id, request, "c".repeat(64))).toEqual(second);
      expect(() => store.rebaseKnowledge(owner, first.id, { ...request, idempotencyKey: randomUUID() }, firstFingerprint))
        .toThrowError(/changed/);
      expect(() => store.rebaseKnowledge(other, first.id, { ...request, idempotencyKey: randomUUID() }, nextFingerprint))
        .toThrowError(/not found/);
      expect(store.listRevisions(owner, first.id)).toHaveLength(2);
    } finally { store.close(); }
  });
});
