import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { diagnosticBindingSchema, recordDiagnosticSchema, diagnosticTransitionError,
  type DiagnosticRecord, type DiagnosticBinding, type RecordDiagnosticInput } from "../../domain/diagnostic-history";
import { DatabaseSync } from "node:sqlite";
import { copyMakerProfileSchema, importMakerProfileSchema, profileValuesSchema, saveMakerProfileSchema, profileCopyPreview,
  type MakerProfile, type SaveMakerProfileInput, type CopyMakerProfileInput } from "../../domain/maker-profile";
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
      CREATE TABLE IF NOT EXISTS diagnostic_events (
        owner_id TEXT NOT NULL, project_id TEXT NOT NULL, sequence INTEGER NOT NULL, data_json TEXT NOT NULL,
        PRIMARY KEY (owner_id, project_id, sequence),
        FOREIGN KEY (owner_id, project_id) REFERENCES projects(owner_id, id) ON DELETE CASCADE
      ) STRICT;
      CREATE TABLE IF NOT EXISTS maker_profiles (
        owner_id TEXT PRIMARY KEY, data_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS maker_profile_revisions (
        owner_id TEXT NOT NULL, sequence INTEGER NOT NULL, snapshot_json TEXT NOT NULL,
        PRIMARY KEY (owner_id, sequence), FOREIGN KEY (owner_id) REFERENCES maker_profiles(owner_id)
      ) STRICT;
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

  private receipt<T = GuestProject>(ownerId: string, key: string, operation: string, requestHash: string, targetId?: string): T | null {
    const row = this.db.prepare("SELECT operation, target_id, request_hash, result_json FROM mutation_receipts WHERE owner_id = ? AND idempotency_key = ?")
      .get(ownerId, key) as ReceiptRow | undefined;
    if (!row) return null;
    if (row.operation !== operation || row.request_hash !== requestHash || (targetId && row.target_id !== targetId)) {
      throw new GuestStoreError("idempotency_conflict", "This request key was already used for a different change.");
    }
    return JSON.parse(row.result_json) as T;
  }

  getProfile(ownerId: string): MakerProfile | null {
    const row = this.db.prepare("SELECT data_json FROM maker_profiles WHERE owner_id = ?").get(ownerId) as StoredRow | undefined;
    return row ? JSON.parse(row.data_json) as MakerProfile : null;
  }

  listProfileRevisions(ownerId: string): MakerProfile[] {
    const rows = this.db.prepare("SELECT snapshot_json AS data_json FROM maker_profile_revisions WHERE owner_id = ? ORDER BY sequence")
      .all(ownerId) as unknown as StoredRow[];
    return rows.map((row) => JSON.parse(row.data_json) as MakerProfile);
  }

  saveProfile(ownerId: string, rawInput: SaveMakerProfileInput, operation = "profile-save"): MakerProfile {
    const input = saveMakerProfileSchema.parse(rawInput);
    const requestHash = hash(input);
    return this.transaction(() => {
      const duplicate = this.receipt<MakerProfile>(ownerId, input.idempotencyKey, operation, requestHash);
      if (duplicate) return duplicate;
      const current = this.getProfile(ownerId);
      if ((current?.sequence ?? 0) !== input.expectedSequence || (current?.basisHash ?? null) !== input.expectedBasisHash)
        throw new GuestStoreError("stale", "The maker profile changed. Reload it and review your draft before saving.");
      const now = new Date().toISOString();
      const values = profileValuesSchema.parse(input.profile);
      const profile: MakerProfile = { ...values, id: current?.id ?? randomUUID(), sequence: (current?.sequence ?? 0) + 1,
        basisHash: hash(values), createdAt: current?.createdAt ?? now, updatedAt: now };
      const json = JSON.stringify(profile);
      this.db.prepare("INSERT INTO maker_profiles (owner_id, data_json) VALUES (?, ?) ON CONFLICT(owner_id) DO UPDATE SET data_json = excluded.data_json")
        .run(ownerId, json);
      this.db.prepare("INSERT INTO maker_profile_revisions (owner_id, sequence, snapshot_json) VALUES (?, ?, ?)").run(ownerId, profile.sequence, json);
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, operation, profile.id, requestHash, json);
      return profile;
    });
  }

  importProfile(ownerId: string, rawInput: unknown): MakerProfile {
    const { backup, ...basis } = importMakerProfileSchema.parse(rawInput);
    return this.saveProfile(ownerId, { ...basis, profile: backup.profile }, "profile-import");
  }

  copyProfile(ownerId: string, projectId: string, rawInput: CopyMakerProfileInput): GuestProject {
    const input = copyMakerProfileSchema.parse(rawInput);
    const requestHash = hash({ projectId, input });
    return this.transaction(() => {
      const duplicate = this.receipt(ownerId, input.idempotencyKey, "profile-copy", requestHash, projectId);
      if (duplicate) return duplicate;
      const current = this.getProject(ownerId, projectId), profile = this.getProfile(ownerId);
      if (!current || !profile || profile.id !== input.profileId) throw new GuestStoreError("not_found", "Project or maker profile not found.");
      if (current.sequence !== input.expectedSequence || current.basisHash !== input.expectedBasisHash)
        throw new GuestStoreError("stale", "The project changed. Reload and review before copying the profile.");
      if (profile.sequence !== input.expectedProfileSequence || profile.basisHash !== input.expectedProfileBasisHash)
        throw new GuestStoreError("stale", "The maker profile changed. Reload and review before copying it.");
      const base = { ...current, plan: profileCopyPreview(current.plan, profile).plan, sequence: current.sequence + 1, updatedAt: new Date().toISOString() };
      const project: GuestProject = { ...base, basisHash: projectBasisHash(base) };
      const json = JSON.stringify(project);
      this.db.prepare("UPDATE projects SET sequence = ?, data_json = ?, updated_at = ? WHERE owner_id = ? AND id = ?")
        .run(project.sequence, json, project.updatedAt, ownerId, projectId);
      this.db.prepare("INSERT INTO project_revisions (owner_id, project_id, sequence, basis_hash, snapshot_json) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, projectId, project.sequence, project.basisHash, json);
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "profile-copy", projectId, requestHash, json);
      return project;
    });
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

  listDiagnostics(ownerId: string, projectId: string): DiagnosticRecord[] {
    if (!this.getProject(ownerId, projectId)) throw new GuestStoreError("not_found", "Project not found.");
    const rows = this.db.prepare("SELECT data_json FROM diagnostic_events WHERE owner_id = ? AND project_id = ? ORDER BY sequence")
      .all(ownerId, projectId) as unknown as StoredRow[];
    return rows.map((row) => JSON.parse(row.data_json) as DiagnosticRecord);
  }

  replayDiagnostic(ownerId: string, projectId: string, rawInput: RecordDiagnosticInput): DiagnosticRecord | null {
    const input = recordDiagnosticSchema.parse(rawInput);
    return this.receipt<DiagnosticRecord>(ownerId, input.idempotencyKey, "diagnostic", hash({ projectId, input }), projectId);
  }

  recordDiagnostic(ownerId: string, projectId: string, rawInput: RecordDiagnosticInput, trustedBinding: DiagnosticBinding): DiagnosticRecord {
    const input = recordDiagnosticSchema.parse(rawInput), binding = diagnosticBindingSchema.parse(trustedBinding);
    return this.transaction(() => {
      const duplicate = this.replayDiagnostic(ownerId, projectId, input);
      if (duplicate) return duplicate;
      const project = this.getProject(ownerId, projectId);
      if (!project) throw new GuestStoreError("not_found", "Project not found.");
      if (project.source.kind !== "candidate") throw new GuestStoreError("invalid", "This project has no applicable source-linked sample check.");
      if (project.sequence !== input.expectedProjectSequence || project.basisHash !== input.expectedBasisHash ||
        project.knowledgeFingerprint !== binding.catalogFingerprint || input.expectedDiagnosticFingerprint !== binding.diagnosticFingerprint)
        throw new GuestStoreError("stale", "Project or diagnostic source changed. Review the current basis before recording a new check.");
      const history = this.listDiagnostics(ownerId, projectId);
      if (history.length >= 2000) throw new GuestStoreError("invalid", "This notebook has reached its 2000-event limit. Keep a backup and start a separate project for further checks.");
      if (history.length !== input.expectedHistorySequence) throw new GuestStoreError("stale", "Another check was saved. Reload the history and review before continuing.");
      const transitionError = diagnosticTransitionError(history, input.event, project.basisHash, binding, project.sequence);
      if (transitionError) throw new GuestStoreError("invalid", transitionError);
      const record: DiagnosticRecord = { id: randomUUID(), projectId, sequence: history.length + 1,
        basisSequence: project.sequence, basisHash: project.basisHash, binding, event: input.event,
        createdAt: new Date().toISOString(), imported: false };
      const json = JSON.stringify(record);
      this.db.prepare("INSERT INTO diagnostic_events (owner_id, project_id, sequence, data_json) VALUES (?, ?, ?, ?)")
        .run(ownerId, projectId, record.sequence, json);
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "diagnostic", projectId, hash({ projectId, input }), json);
      return record;
    });
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
    if (input.plan?.profileBasis) throw new GuestStoreError("invalid", "Copy a saved profile through the reviewed profile action; do not supply copy provenance.");
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
    if (input.backup.source.kind === "own_idea" && input.backup.version !== 1 && input.backup.knowledgeFingerprint)
      throw new GuestStoreError("invalid", "A personal idea cannot claim a catalog knowledge binding.");
    const requestHash = hash(input);
    return this.transaction(() => {
      const duplicate = this.receipt(ownerId, input.idempotencyKey, "import", requestHash);
      if (duplicate) return duplicate;
      const now = new Date().toISOString();
      const base = {
        id: randomUUID(), title: input.backup.title, brief: input.backup.brief, source: input.backup.source,
        plan: input.backup.plan, capability: "plan_only" as const, sequence: 1,
        knowledgeFingerprint: input.backup.version !== 1 ? input.backup.knowledgeFingerprint ?? null : null,
        createdAt: now, updatedAt: now,
      };
      const project: GuestProject = { ...base, basisHash: projectBasisHash(base) };
      const json = JSON.stringify(project);
      this.db.prepare("INSERT INTO projects (owner_id, id, sequence, data_json, updated_at) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, project.id, project.sequence, json, now);
      this.db.prepare("INSERT INTO project_revisions (owner_id, project_id, sequence, basis_hash, snapshot_json) VALUES (?, ?, ?, ?, ?)")
        .run(ownerId, project.id, project.sequence, project.basisHash, json);
      if (input.backup.version !== 1) {
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
      if (input.backup.version === 3) {
        const originals = input.backup.diagnostics;
        if (new Set(originals.map((item) => item.id)).size !== originals.length || originals.some((item, index) => item.sequence !== index + 1))
          throw new GuestStoreError("invalid", "The imported diagnostic history is not a unique ordered sequence.");
        for (const original of originals) {
          // Preserve source IDs/basis and original event links, but do not trust an imported claim.
          const record: DiagnosticRecord = { ...original, projectId: project.id, imported: true };
          this.db.prepare("INSERT INTO diagnostic_events (owner_id, project_id, sequence, data_json) VALUES (?, ?, ?, ?)")
            .run(ownerId, project.id, record.sequence, JSON.stringify(record));
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
      if (canonicalJson(plan.profileBasis) !== canonicalJson(current.plan.profileBasis))
        throw new GuestStoreError("invalid", "Profile copy provenance cannot be changed by editing the plan. Use the reviewed copy action.");
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
