import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  createGuestProjectSchema,
  emptyProjectPlan,
  importGuestProjectSchema,
  projectPlanSchema,
  recordProjectNoteSchema,
  rebaseGuestKnowledgeSchema,
  updateGuestProjectSchema,
  type CreateGuestProjectInput,
  type GuestProject,
  type ImportGuestProjectInput,
  type ProjectNote,
  type RecordProjectNoteInput,
  type RebaseGuestKnowledgeInput,
  type UpdateGuestProjectInput,
} from "../../domain/guest-project";

export type GuestStoreErrorCode = "not_found" | "stale" | "idempotency_conflict" | "invalid";

export class GuestStoreError extends Error {
  constructor(public readonly code: GuestStoreErrorCode, message: string) { super(message); }
}

function canonicalJson(value: unknown): string {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function projectBasisHash(project: Pick<GuestProject, "title" | "brief" | "source" | "plan" | "knowledgeFingerprint">): string {
  return hash({
    title: project.title,
    brief: project.brief,
    source: project.source,
    plan: project.plan,
    knowledgeFingerprint: project.knowledgeFingerprint,
  });
}

interface StoredRow { data_json: string }
interface ReceiptRow { operation: string; target_id: string; request_hash: string; result_json: string }
interface NoteRow { data_json: string; request_hash: string; project_id: string }

export class GuestStore {
  private readonly db: DatabaseSync;

  constructor(databasePath: string) {
    this.db = new DatabaseSync(databasePath, { timeout: 5000 });
    if (databasePath !== ":memory:") this.db.exec("PRAGMA journal_mode=WAL");
    this.db.exec(`
      PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS projects (
        owner_id TEXT NOT NULL,
        id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (owner_id, id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS project_revisions (
        owner_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        basis_hash TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        PRIMARY KEY (owner_id, project_id, sequence),
        FOREIGN KEY (owner_id, project_id) REFERENCES projects(owner_id, id) ON DELETE CASCADE
      ) STRICT;
      CREATE TABLE IF NOT EXISTS mutation_receipts (
        owner_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        operation TEXT NOT NULL,
        target_id TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        result_json TEXT NOT NULL,
        PRIMARY KEY (owner_id, idempotency_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS project_notes (
        owner_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (owner_id, id),
        UNIQUE (owner_id, idempotency_key),
        FOREIGN KEY (owner_id, project_id) REFERENCES projects(owner_id, id) ON DELETE CASCADE
      ) STRICT;
    `);
  }

  close(): void { this.db.close(); }

  private transaction<T>(work: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private receipt(ownerId: string, key: string, operation: string, requestHash: string, targetId?: string): GuestProject | null {
    const row = this.db.prepare("SELECT operation, target_id, request_hash, result_json FROM mutation_receipts WHERE owner_id = ? AND idempotency_key = ?")
      .get(ownerId, key) as ReceiptRow | undefined;
    if (!row) return null;
    if (row.operation !== operation || row.request_hash !== requestHash || (targetId && row.target_id !== targetId)) {
      throw new GuestStoreError("idempotency_conflict", "This request key was already used for a different change.");
    }
    return JSON.parse(row.result_json) as GuestProject;
  }

  listProjects(ownerId: string): GuestProject[] {
    const rows = this.db.prepare("SELECT data_json FROM projects WHERE owner_id = ? ORDER BY updated_at DESC, id ASC")
      .all(ownerId) as unknown as StoredRow[];
    return rows.map((row) => JSON.parse(row.data_json) as GuestProject);
  }

  getProject(ownerId: string, id: string): GuestProject | null {
    const row = this.db.prepare("SELECT data_json FROM projects WHERE owner_id = ? AND id = ?")
      .get(ownerId, id) as StoredRow | undefined;
    return row ? JSON.parse(row.data_json) as GuestProject : null;
  }

  listRevisions(ownerId: string, id: string): GuestProject[] {
    if (!this.getProject(ownerId, id)) throw new GuestStoreError("not_found", "Project not found.");
    const rows = this.db.prepare("SELECT snapshot_json AS data_json FROM project_revisions WHERE owner_id = ? AND project_id = ? ORDER BY sequence ASC")
      .all(ownerId, id) as unknown as StoredRow[];
    return rows.map((row) => JSON.parse(row.data_json) as GuestProject);
  }

  listNotes(ownerId: string, projectId: string): ProjectNote[] {
    if (!this.getProject(ownerId, projectId)) throw new GuestStoreError("not_found", "Project not found.");
    const rows = this.db.prepare("SELECT data_json FROM project_notes WHERE owner_id = ? AND project_id = ? ORDER BY created_at ASC, id ASC")
      .all(ownerId, projectId) as unknown as StoredRow[];
    return rows.map((row) => JSON.parse(row.data_json) as ProjectNote);
  }

  recordNote(ownerId: string, projectId: string, rawInput: RecordProjectNoteInput): ProjectNote {
    const input = recordProjectNoteSchema.parse(rawInput);
    const requestHash = hash({ projectId, input });
    return this.transaction(() => {
      const prior = this.db.prepare("SELECT data_json, request_hash, project_id FROM project_notes WHERE owner_id = ? AND idempotency_key = ?")
        .get(ownerId, input.idempotencyKey) as NoteRow | undefined;
      if (prior) {
        if (prior.project_id !== projectId || prior.request_hash !== requestHash) {
          throw new GuestStoreError("idempotency_conflict", "This request key was already used for a different note.");
        }
        return JSON.parse(prior.data_json) as ProjectNote;
      }
      const project = this.getProject(ownerId, projectId);
      if (!project) throw new GuestStoreError("not_found", "Project not found.");
      if (project.sequence !== input.expectedProjectSequence || project.basisHash !== input.expectedBasisHash) {
        throw new GuestStoreError("stale", "The project changed. Reload and review before recording this note.");
      }
      const note: ProjectNote = {
        id: randomUUID(), projectId, kind: input.kind, stage: input.stage, text: input.text,
        basisSequence: project.sequence, basisHash: project.basisHash, createdAt: new Date().toISOString(),
      };
      this.db.prepare("INSERT INTO project_notes (owner_id, project_id, id, idempotency_key, request_hash, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(ownerId, projectId, note.id, input.idempotencyKey, requestHash, JSON.stringify(note), note.createdAt);
      return note;
    });
  }

  createProject(ownerId: string, rawInput: CreateGuestProjectInput, trustedKnowledgeFingerprint: string | null = null): GuestProject {
    const input = createGuestProjectSchema.parse(rawInput);
    if (input.source.kind === "own_idea" && trustedKnowledgeFingerprint !== null)
      throw new GuestStoreError("invalid", "A personal idea cannot claim a catalog knowledge binding.");
    if (trustedKnowledgeFingerprint !== null && !/^[a-f0-9]{64}$/.test(trustedKnowledgeFingerprint)) throw new GuestStoreError("invalid", "Invalid knowledge fingerprint.");
    const requestHash = hash(input);
    return this.transaction(() => {
      const duplicate = this.receipt(ownerId, input.idempotencyKey, "create", requestHash);
      if (duplicate) return duplicate;
      const now = new Date().toISOString();
      const base = {
        id: randomUUID(), title: input.title, brief: input.brief, source: input.source,
        plan: input.plan ?? emptyProjectPlan(), capability: "plan_only" as const, sequence: 1,
        knowledgeFingerprint: trustedKnowledgeFingerprint, createdAt: now, updatedAt: now,
      };
      const project: GuestProject = { ...base, basisHash: projectBasisHash(base) };
      const json = JSON.stringify(project);
      this.db.prepare("INSERT INTO projects (owner_id, id, sequence, data_json, updated_at) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, project.id, project.sequence, json, now);
      this.db.prepare("INSERT INTO project_revisions (owner_id, project_id, sequence, basis_hash, snapshot_json) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, project.id, project.sequence, project.basisHash, json);
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "create", project.id, requestHash, json);
      return project;
    });
  }

  importBackup(ownerId: string, rawInput: ImportGuestProjectInput): GuestProject {
    const input = importGuestProjectSchema.parse(rawInput);
    if (input.backup.source.kind === "own_idea" && input.backup.version === 2 && input.backup.knowledgeFingerprint)
      throw new GuestStoreError("invalid", "A personal idea cannot claim a catalog knowledge binding.");
    const requestHash = hash(input);
    return this.transaction(() => {
      const duplicate = this.receipt(ownerId, input.idempotencyKey, "import", requestHash);
      if (duplicate) return duplicate;
      const now = new Date().toISOString();
      const base = {
        id: randomUUID(), title: input.backup.title, brief: input.backup.brief, source: input.backup.source,
        plan: input.backup.plan, capability: "plan_only" as const, sequence: 1,
        knowledgeFingerprint: input.backup.version === 2 ? input.backup.knowledgeFingerprint ?? null : null,
        createdAt: now, updatedAt: now,
      };
      const project: GuestProject = { ...base, basisHash: projectBasisHash(base) };
      const json = JSON.stringify(project);
      this.db.prepare("INSERT INTO projects (owner_id, id, sequence, data_json, updated_at) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, project.id, project.sequence, json, now);
      this.db.prepare("INSERT INTO project_revisions (owner_id, project_id, sequence, basis_hash, snapshot_json) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, project.id, project.sequence, project.basisHash, json);
      if (input.backup.version === 2) {
        for (const original of input.backup.notes) {
          const note: ProjectNote = {
            id: randomUUID(), projectId: project.id, kind: original.kind, stage: original.stage,
            text: original.text, basisSequence: original.basisHash === project.basisHash ? 1 : original.basisSequence,
            basisHash: original.basisHash, createdAt: original.createdAt, importedFromSequence: original.basisSequence,
          };
          const key = randomUUID();
          this.db.prepare("INSERT INTO project_notes (owner_id, project_id, id, idempotency_key, request_hash, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .run(ownerId, project.id, note.id, key, hash({ importKey: input.idempotencyKey, noteId: note.id }), JSON.stringify(note), note.createdAt);
        }
      }
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "import", project.id, requestHash, json);
      return project;
    });
  }

  updateProject(ownerId: string, id: string, rawInput: UpdateGuestProjectInput): GuestProject {
    const input = updateGuestProjectSchema.parse(rawInput);
    const requestHash = hash({ id, input });
    return this.transaction(() => {
      const duplicate = this.receipt(ownerId, input.idempotencyKey, "update", requestHash, id);
      if (duplicate) return duplicate;
      const current = this.getProject(ownerId, id);
      if (!current) throw new GuestStoreError("not_found", "Project not found.");
      if (current.sequence !== input.expectedSequence || current.basisHash !== input.expectedBasisHash) {
        throw new GuestStoreError("stale", "The project changed since this view loaded. Reload and review before saving.");
      }
      const plan = input.plan === undefined ? current.plan : projectPlanSchema.parse(input.plan);
      const base = {
        ...current,
        title: input.title ?? current.title,
        brief: input.brief ?? current.brief,
        plan,
        sequence: current.sequence + 1,
        updatedAt: new Date().toISOString(),
      };
      const next: GuestProject = { ...base, basisHash: projectBasisHash(base) };
      const json = JSON.stringify(next);
      this.db.prepare("UPDATE projects SET sequence = ?, data_json = ?, updated_at = ? WHERE owner_id = ? AND id = ?")
        .run(next.sequence, json, next.updatedAt, ownerId, id);
      this.db.prepare("INSERT INTO project_revisions (owner_id, project_id, sequence, basis_hash, snapshot_json) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, id, next.sequence, next.basisHash, json);
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "update", id, requestHash, json);
      return next;
    });
  }

  rebaseKnowledge(ownerId: string, id: string, rawInput: RebaseGuestKnowledgeInput, trustedFingerprint: string): GuestProject {
    const input = rebaseGuestKnowledgeSchema.parse(rawInput);
    if (!/^[a-f0-9]{64}$/.test(trustedFingerprint)) throw new GuestStoreError("invalid", "Invalid knowledge fingerprint.");
    const requestHash = hash({ id, input });
    return this.transaction(() => {
      const duplicate = this.receipt(ownerId, input.idempotencyKey, "knowledge-rebase", requestHash, id);
      if (duplicate) return duplicate;
      const current = this.getProject(ownerId, id);
      if (!current) throw new GuestStoreError("not_found", "Project not found.");
      if (current.source.kind !== "candidate") throw new GuestStoreError("invalid", "This project has no linked candidate source.");
      if (current.sequence !== input.expectedSequence || current.basisHash !== input.expectedBasisHash)
        throw new GuestStoreError("stale", "The project changed. Reload and review before refreshing its source.");
      const next = current.knowledgeFingerprint === trustedFingerprint ? current : {
        ...current, sequence: current.sequence + 1, knowledgeFingerprint: trustedFingerprint,
        updatedAt: new Date().toISOString(),
      };
      const project: GuestProject = next === current ? current : { ...next, basisHash: projectBasisHash(next) };
      const json = JSON.stringify(project);
      if (project !== current) {
        this.db.prepare("UPDATE projects SET sequence = ?, data_json = ?, updated_at = ? WHERE owner_id = ? AND id = ?")
          .run(project.sequence, json, project.updatedAt, ownerId, id);
        this.db.prepare("INSERT INTO project_revisions (owner_id, project_id, sequence, basis_hash, snapshot_json) VALUES (?, ?, ?, ?, ?)")
          .run(ownerId, id, project.sequence, project.basisHash, json);
      }
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "knowledge-rebase", id, requestHash, json);
      return project;
    });
  }
}

let localStore: GuestStore | undefined;

export function getLocalGuestStore(): GuestStore {
  if (!localStore) {
    const directory = path.join(process.cwd(), ".data");
    mkdirSync(directory, { recursive: true });
    localStore = new GuestStore(path.join(directory, "stitches-guest.sqlite"));
  }
  return localStore;
}
