import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  createGuestProjectSchema,
  emptyProjectPlan,
  projectPlanSchema,
  updateGuestProjectSchema,
  type CreateGuestProjectInput,
  type GuestProject,
  type UpdateGuestProjectInput,
} from "../../domain/guest-project";

export type GuestStoreErrorCode = "not_found" | "stale" | "idempotency_conflict";

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

  createProject(ownerId: string, rawInput: CreateGuestProjectInput): GuestProject {
    const input = createGuestProjectSchema.parse(rawInput);
    const requestHash = hash(input);
    return this.transaction(() => {
      const duplicate = this.receipt(ownerId, input.idempotencyKey, "create", requestHash);
      if (duplicate) return duplicate;
      const now = new Date().toISOString();
      const base = {
        id: randomUUID(), title: input.title, brief: input.brief, source: input.source,
        plan: input.plan ?? emptyProjectPlan(), capability: "plan_only" as const, sequence: 1,
        knowledgeFingerprint: null, createdAt: now, updatedAt: now,
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
