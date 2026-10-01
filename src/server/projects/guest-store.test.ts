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
      try { projectId = first.createProject(owner, create()).id; }
      finally { first.close(); }
      const reopened = new GuestStore(file);
      try {
        expect(reopened.getProject(owner, projectId)?.id).toBe(projectId);
        expect(reopened.listRevisions(owner, projectId)).toHaveLength(1);
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
      const imported = store.createProject(owner, { title: backup.title, brief: backup.brief,
        source: backup.source, plan: backup.plan, idempotencyKey: randomUUID() });
      expect(imported.id).not.toBe(first.id);
      expect(imported.plan).toEqual(first.plan);
      expect(imported.sequence).toBe(1);
      expect(projectBackupSchema.safeParse({ ...backup, version: 99 }).success).toBe(false);
    } finally { store.close(); }
  });
});
