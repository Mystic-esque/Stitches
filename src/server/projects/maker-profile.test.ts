import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GuestStore } from "./guest-store";
import { emptyProjectPlan, projectBackupSchema } from "../../domain/guest-project";
import { profileBackupSchema, profileCopyPreview, profileValuesSchema, type MakerProfile } from "../../domain/maker-profile";

const values = { name: "Alex’s notebook", experience: "comfortable" as const,
  measurementsMm: { waist: 720, chest: 900, specialist: 100.3 }, measurementsDegrees: { shoulderSlope: 14 }, equipment: ["Machine", "Iron"] };
const saveInput = () => ({ profile: values, expectedSequence: 0, expectedBasisHash: null, idempotencyKey: randomUUID() });
const createInput = () => ({ title: "Private idea", brief: "No cutting claim", source: { kind: "own_idea" as const }, idempotencyKey: randomUUID() });
function copyInput(profile: MakerProfile, project: { sequence: number; basisHash: string }) {
  return { expectedSequence: project.sequence, expectedBasisHash: project.basisHash, profileId: profile.id,
    expectedProfileSequence: profile.sequence, expectedProfileBasisHash: profile.basisHash, idempotencyKey: randomUUID() };
}
describe("private maker profiles", () => {
  it("isolates profiles and revisions, enforces optimistic saves, and replays exact requests", () => {
    const store = new GuestStore(":memory:");
    try {
      const request = saveInput(), first = store.saveProfile("alice", request);
      expect(store.saveProfile("alice", request)).toEqual(first);
      expect(store.getProfile("bob")).toBeNull(); expect(store.listProfileRevisions("bob")).toEqual([]);
      expect(() => store.saveProfile("alice", { ...request, profile: { ...values, name: "Other" } })).toThrow(/already used/);
      expect(() => store.saveProfile("alice", saveInput())).toThrow(/changed/);
      const next = store.saveProfile("alice", { ...saveInput(), expectedSequence: first.sequence, expectedBasisHash: first.basisHash,
        profile: { ...values, measurementsMm: { waist: 800 } } });
      expect(next.id).toBe(first.id); expect(next.basisHash).not.toBe(first.basisHash);
      expect(store.listProfileRevisions("alice")).toEqual([first, next]);
      expect(store.saveProfile("alice", request)).toEqual(first);
      expect(store.getProfile("alice")).toEqual(next);
    } finally { store.close(); }
  });
  it("fills missing values without aliasing, keeps zero/conflicts and binds a copied immutable snapshot", () => {
    const store = new GuestStore(":memory:");
    try {
      const profile = store.saveProfile("alice", saveInput());
      const plan = { ...emptyProjectPlan(), measurementsMm: { waist: 780, bust: 930 }, measurementsDegrees: { shoulderSlope: 0 }, equipment: ["Iron"], experience: "beginner" as const };
      const first = store.createProject("alice", { ...createInput(), plan });
      const note = store.recordNote("alice", first.id, { kind: "journal", stage: "plan", text: "Original notes", expectedProjectSequence: 1, expectedBasisHash: first.basisHash, idempotencyKey: randomUUID() });
      const preview = profileCopyPreview(plan, profile);
      expect(preview.retained).toContain("waist: kept 78 cm"); expect(preview.retained).toContain("shoulderSlope: kept 0 degrees");
      const request = copyInput(profile, first), copied = store.copyProfile("alice", first.id, request);
      expect(copied.sequence).toBe(2); expect(copied.basisHash).not.toBe(first.basisHash);
      expect(copied.plan.measurementsMm).toEqual({ waist: 780, bust: 930, chest: 900, specialist: 100.3 });
      expect(copied.plan.measurementsDegrees).toEqual({ shoulderSlope: 0 }); expect(copied.plan.experience).toBe("beginner");
      expect(copied.plan.equipment).toEqual(["Iron", "Machine"]); expect(copied.plan.profileBasis?.basisHash).toBe(profile.basisHash);
      expect(copied.capability).toBe("plan_only"); expect(store.copyProfile("alice", first.id, request)).toEqual(copied);
      expect(() => store.createProject("alice", { ...createInput(), plan: copied.plan })).toThrow(/provenance/);
      expect(() => store.updateProject("alice", first.id, { expectedSequence: 2, expectedBasisHash: copied.basisHash,
        idempotencyKey: randomUUID(), plan: { ...copied.plan, profileBasis: { ...copied.plan.profileBasis!, sequence: 99 } } })).toThrow(/provenance/);
      store.saveProfile("alice", { ...saveInput(), expectedSequence: profile.sequence, expectedBasisHash: profile.basisHash, profile: { ...values, name: "Changed", measurementsMm: { waist: 800 } } });
      expect(store.getProject("alice", first.id)).toEqual(copied); expect(store.listRevisions("alice", first.id)[0]).toEqual(first);
      expect(store.listNotes("alice", first.id)).toEqual([note]);
      expect(store.copyProfile("alice", first.id, request)).toEqual(copied);
      expect(() => store.copyProfile("alice", first.id, { ...copyInput(profile, copied) })).toThrow(/profile changed/);
      const foreign = store.createProject("bob", createInput());
      expect(() => store.copyProfile("bob", foreign.id, copyInput(profile, foreign))).toThrow(/not found/);
      expect(() => store.copyProfile("bob", first.id, request)).toThrow(/not found/);
    } finally { store.close(); }
  });
  it("rejects changed project bases and too many merged tools without inserting a revision", () => {
    const store = new GuestStore(":memory:");
    try {
      const profile = store.saveProfile("alice", saveInput()), first = store.createProject("alice", createInput());
      const next = store.updateProject("alice", first.id, { expectedSequence: 1, expectedBasisHash: first.basisHash, idempotencyKey: randomUUID(),
        plan: { ...first.plan, equipment: Array.from({ length: 24 }, (_, i) => `Tool ${i}`) } });
      expect(() => store.copyProfile("alice", first.id, copyInput(profile, first))).toThrow(/project changed/);
      expect(() => store.copyProfile("alice", first.id, copyInput(profile, next))).toThrow();
      expect(store.getProject("alice", first.id)).toEqual(next); expect(store.listRevisions("alice", first.id)).toHaveLength(2);
    } finally { store.close(); }
  });
  it("restores private profiles after restart and imports strict backups as reviewed new revisions", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "stitches-profile-test-")), file = path.join(directory, "private.sqlite");
    let store = new GuestStore(file);
    try {
      const first = store.saveProfile("alice", saveInput()); store.close(); store = new GuestStore(file);
      expect(store.getProfile("alice")).toEqual(first);
      const backup = profileBackupSchema.parse({ format: "stitches-maker-backup", version: 1, profile: values });
      const request = { backup, expectedSequence: 1, expectedBasisHash: first.basisHash, idempotencyKey: randomUUID() };
      const imported = store.importProfile("alice", request);
      expect(imported.sequence).toBe(2); expect(store.importProfile("alice", request)).toEqual(imported);
      expect(store.listProfileRevisions("alice")[0]).toEqual(first);
      const copied = store.copyProfile("alice", store.createProject("alice", createInput()).id,
        copyInput(imported, store.listProjects("alice")[0]));
      const projectBackup = projectBackupSchema.parse({ format: "stitches-project-backup", version: 2, title: copied.title, brief: copied.brief, source: copied.source, plan: copied.plan, notes: [] });
      const restored = store.importBackup("bob", { backup: projectBackup, idempotencyKey: randomUUID() });
      expect(restored.plan).toEqual(copied.plan); expect(store.getProfile("bob")).toBeNull();
      expect(() => store.copyProfile("bob", restored.id, copyInput(imported, restored))).toThrow(/not found/);
      expect(() => store.importProfile("alice", { ...request, backup: { ...backup, version: 2 } })).toThrow();
    } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
  });
  it("refuses unit confusion and private metadata in profile backups", () => {
    expect(profileValuesSchema.safeParse({ ...values, measurementsMm: { shoulderSlope: 14 } }).success).toBe(false);
    expect(profileValuesSchema.safeParse({ ...values, measurementsDegrees: { shoulderSlope: 91 } }).success).toBe(false);
    expect(profileValuesSchema.safeParse({ ...values, measurementsMm: { waist: -1 } }).success).toBe(false);
    expect(profileBackupSchema.safeParse({ format: "stitches-maker-backup", version: 1, profile: { ...values, ownerId: "alice" } }).success).toBe(false);
    expect(profileValuesSchema.parse({ ...values, measurementsDegrees: { shoulderSlope: 0 } }).measurementsDegrees?.shoulderSlope).toBe(0);
  });
});
