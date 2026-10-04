import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { startAgentRunSchema, agentRunIsActive, agentRunCanResume, type StartAgentRunInput, type AgentRunStatus, type AgentCheckpoint } from "../../domain/agent-run";
import type { PrivateAgentRun } from "../agent/run-state";
import { diagnosticBindingSchema, recordDiagnosticSchema, diagnosticTransitionError,
  type DiagnosticRecord, type DiagnosticBinding, type RecordDiagnosticInput } from "../../domain/diagnostic-history";
import { DatabaseSync } from "node:sqlite";
import { savedStudySchema, type PatternStudy, type SavedStudy } from "../../domain/pattern-study";
import { recordMakingSchema, makingTransitionError, currentMakingSession,
  type MakingRecord, type MakingPlan, type RecordMakingInput } from "../../domain/making-plan";
import { copyMakerProfileSchema, importMakerProfileSchema, profileValuesSchema, saveMakerProfileSchema, profileCopyPreview,
  type MakerProfile, type SaveMakerProfileInput, type CopyMakerProfileInput } from "../../domain/maker-profile";
import {
  createGuestProjectSchema,
  emptyProjectPlan,
  importGuestProjectSchema,
  projectPlanSchema,
  projectBackupSchema,
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
      CREATE TABLE IF NOT EXISTS agent_runs (
        owner_id TEXT NOT NULL, project_id TEXT NOT NULL, id TEXT NOT NULL, data_json TEXT NOT NULL,
        PRIMARY KEY (owner_id, id),
        FOREIGN KEY (owner_id, project_id) REFERENCES projects(owner_id, id) ON DELETE CASCADE
      ) STRICT;
      CREATE TABLE IF NOT EXISTS agent_requests (
        owner_id TEXT NOT NULL, run_id TEXT NOT NULL, request INTEGER NOT NULL, day TEXT NOT NULL,
        PRIMARY KEY (owner_id, run_id, request),
        FOREIGN KEY (owner_id, run_id) REFERENCES agent_runs(owner_id, id) ON DELETE CASCADE
      ) STRICT;
      CREATE TABLE IF NOT EXISTS diagnostic_events (
        owner_id TEXT NOT NULL, project_id TEXT NOT NULL, sequence INTEGER NOT NULL, data_json TEXT NOT NULL,
        PRIMARY KEY (owner_id, project_id, sequence),
        FOREIGN KEY (owner_id, project_id) REFERENCES projects(owner_id, id) ON DELETE CASCADE
      ) STRICT;
      CREATE TABLE IF NOT EXISTS maker_profiles (
        owner_id TEXT PRIMARY KEY, data_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS making_events (
        owner_id TEXT NOT NULL, project_id TEXT NOT NULL, sequence INTEGER NOT NULL, data_json TEXT NOT NULL,
        PRIMARY KEY (owner_id, project_id, sequence),
        FOREIGN KEY (owner_id, project_id) REFERENCES projects(owner_id, id) ON DELETE CASCADE
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
      CREATE TABLE IF NOT EXISTS pattern_studies (
        owner_id TEXT NOT NULL, project_id TEXT NOT NULL, id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, data_json TEXT NOT NULL,
        created_at TEXT NOT NULL, PRIMARY KEY (owner_id, id), UNIQUE (owner_id, idempotency_key),
        FOREIGN KEY (owner_id, project_id) REFERENCES projects(owner_id, id) ON DELETE CASCADE
      ) STRICT;
    `);
  }

  close(): void { this.db.close(); }

  listPatternStudies(ownerId: string, projectId: string): SavedStudy[] {
    if (!this.getProject(ownerId, projectId)) throw new GuestStoreError("not_found", "Project not found.");
    const rows = this.db.prepare("SELECT data_json FROM pattern_studies WHERE owner_id = ? AND project_id = ? ORDER BY created_at DESC, id DESC")
      .all(ownerId, projectId) as unknown as StoredRow[];
    return rows.map(row => savedStudySchema.parse(JSON.parse(row.data_json)));
  }

  savePatternStudy(ownerId: string, projectId: string, study: PatternStudy, idempotencyKey: string): SavedStudy {
    const requestHash = hash({ projectId, basis: study.basis, command: study.command, before: study.before.mapping.artifactHash, after: study.after.mapping.artifactHash });
    return this.transaction(() => {
      const prior = this.db.prepare("SELECT data_json, request_hash, project_id FROM pattern_studies WHERE owner_id = ? AND idempotency_key = ?")
        .get(ownerId, idempotencyKey) as NoteRow | undefined;
      if (prior) {
        if (prior.request_hash !== requestHash || prior.project_id !== projectId) throw new GuestStoreError("idempotency_conflict", "This save key belongs to a different study.");
        return savedStudySchema.parse(JSON.parse(prior.data_json));
      }
      const project = this.getProject(ownerId, projectId);
      if (!project) throw new GuestStoreError("not_found", "Project not found.");
      if (project.sequence !== study.basis.sequence || project.basisHash !== study.basis.basisHash || project.knowledgeFingerprint !== study.basis.sourceFingerprint)
        throw new GuestStoreError("stale", "The saved project or source changed. Rebuild the study before saving it.");
      if (this.listPatternStudies(ownerId, projectId).length >= 200)
        throw new GuestStoreError("invalid", "This project has reached its 200-study backup limit. Export it before starting another project.");
      const saved = savedStudySchema.parse({ id: randomUUID(), projectId, createdAt: new Date().toISOString(), basis: study.basis,
        command: study.command, beforeHash: study.before.mapping.artifactHash, afterHash: study.after.mapping.artifactHash,
        impact: study.impact, capability: "plan_only", cutReady: false });
      this.db.prepare("INSERT INTO pattern_studies (owner_id, project_id, id, idempotency_key, request_hash, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(ownerId, projectId, saved.id, idempotencyKey, requestHash, JSON.stringify(saved), saved.createdAt);
      return saved;
    });
  }

  private writeRun(ownerId: string, run: PrivateAgentRun): PrivateAgentRun {
    const json = JSON.stringify(run);
    if (json.length > 192_000) throw new GuestStoreError("invalid", "Agent checkpoint exceeded its private storage bound.");
    this.db.prepare("UPDATE agent_runs SET data_json = ? WHERE owner_id = ? AND id = ?").run(json, ownerId, run.id);
    return run;
  }

  private runEvent(run: PrivateAgentRun, event: AgentCheckpoint["event"], now: number, tool?: string): void {
    run.updatedAt = new Date(now).toISOString();
    run.checkpoints.push({ sequence: run.checkpoints.length + 1, event, at: run.updatedAt, request: run.requests, ...(tool ? { tool } : {}) });
  }

  private runBasisCurrent(ownerId: string, run: PrivateAgentRun): boolean {
    const project = this.getProject(ownerId, run.projectId);
    if (!project || project.sequence !== run.basis.projectSequence || project.basisHash !== run.basis.projectHash ||
      project.knowledgeFingerprint !== run.basis.catalogFingerprint) return false;
    const history = this.listDiagnostics(ownerId, run.projectId);
    return history.length === run.basis.historySequence && createHash("sha256").update(JSON.stringify(history)).digest("hex") === run.basis.historyHash;
  }

  getAgentRun(ownerId: string, projectId: string, id: string, now = Date.now()): PrivateAgentRun {
    const row = this.db.prepare("SELECT data_json FROM agent_runs WHERE owner_id = ? AND project_id = ? AND id = ?")
      .get(ownerId, projectId, id) as StoredRow | undefined;
    if (!row) throw new GuestStoreError("not_found", "Agent run not found.");
    const run = JSON.parse(row.data_json) as PrivateAgentRun;
    if ((agentRunIsActive(run.status) || run.status === "completed" || agentRunCanResume(run)) && !this.runBasisCurrent(ownerId, run)) {
      run.status = "stale"; run.message = "The saved project or scrap history changed. This run is historical; review the new basis.";
      delete run.leaseId; delete run.leaseUntil; delete run.startedMs;
      this.runEvent(run, "stopped", now); this.writeRun(ownerId, run);
    } else if (run.leaseUntil !== undefined && now >= run.leaseUntil) {
      run.activeMs += Math.max(0, run.leaseUntil - (run.startedMs ?? run.leaseUntil));
      run.status = run.pendingResponse ? "response_ready" : "unknown_outcome";
      run.message = run.pendingResponse ? "An acknowledged response is saved. Continue without repeating that model call." : "A provider response was lost. Its usage may have been charged; this request will not be retried.";
      delete run.leaseId; delete run.leaseUntil; delete run.startedMs;
      this.runEvent(run, "stopped", now); this.writeRun(ownerId, run);
    }
    return run;
  }

  listAgentRuns(ownerId: string, projectId: string): PrivateAgentRun[] {
    if (!this.getProject(ownerId, projectId)) throw new GuestStoreError("not_found", "Project not found.");
    const rows = this.db.prepare("SELECT id FROM agent_runs WHERE owner_id = ? AND project_id = ? ORDER BY rowid DESC LIMIT 50")
      .all(ownerId, projectId) as unknown as { id: string }[];
    return rows.map((row) => this.getAgentRun(ownerId, projectId, row.id));
  }

  replayAgentRun(ownerId: string, projectId: string, raw: StartAgentRunInput): PrivateAgentRun | null {
    const input = startAgentRunSchema.parse(raw);
    const result = this.receipt<{ id: string }>(ownerId, input.idempotencyKey, "agent-start", hash({ projectId, input }), projectId);
    return result ? this.getAgentRun(ownerId, projectId, result.id) : null;
  }

  startAgentRun(ownerId: string, projectId: string, raw: StartAgentRunInput, now = Date.now()): PrivateAgentRun {
    const input = startAgentRunSchema.parse(raw);
    return this.transaction(() => {
      const duplicate = this.replayAgentRun(ownerId, projectId, input);
      if (duplicate) return duplicate;
      if (!this.getProject(ownerId, projectId)) throw new GuestStoreError("not_found", "Project not found.");
      const timestamp = new Date(now).toISOString();
      const run: PrivateAgentRun = { id: randomUUID(), projectId, basis: input.expectedBasis, task: input.task,
        ...(input.request ? { request: input.request } : {}), ...(input.selection ? { selection: input.selection } : {}), consentVersion: input.consent.version,
        model: "gemini-3.5-flash-lite", status: "ready", requests: 0, activeMs: 0, checkpoints: [], tools: [], callIds: [],
        createdAt: timestamp, updatedAt: timestamp, modelTextVerified: false, projectChanged: false, capability: "plan_only" };
      if (run.basis.projectId !== projectId || !this.runBasisCurrent(ownerId, run)) throw new GuestStoreError("stale", "Review the current saved project and history before consenting.");
      const existing = this.listAgentRuns(ownerId, projectId);
      if (existing.some((item) => agentRunIsActive(item.status))) throw new GuestStoreError("invalid", "Continue or cancel the active run first.");
      if (existing.length >= 50) throw new GuestStoreError("invalid", "This project reached its 50-run limit. Keep its notebook and use manual preparation.");
      this.db.prepare("INSERT INTO agent_runs (owner_id, project_id, id, data_json) VALUES (?, ?, ?, ?)").run(ownerId, projectId, run.id, JSON.stringify(run));
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "agent-start", projectId, hash({ projectId, input }), JSON.stringify({ id: run.id }));
      return run;
    });
  }

  claimAgentRun(ownerId: string, projectId: string, id: string, freeAuthorized: boolean, now = Date.now()): PrivateAgentRun {
    return this.transaction(() => {
      const run = this.getAgentRun(ownerId, projectId, id, now);
      if (!["ready", "response_ready"].includes(run.status)) return run;
      if (run.activeMs >= 120_000 || (run.status === "ready" && run.requests >= 4)) {
        run.status = "limit"; run.message = "The four-request or 120-second active-time limit was reached. Manual preparation remains available.";
        this.runEvent(run, "stopped", now); return this.writeRun(ownerId, run);
      }
      if (run.status === "ready") {
        const day = new Date(now).toISOString().slice(0, 10);
        const total = this.db.prepare("SELECT COUNT(*) AS n FROM agent_requests WHERE day = ?").get(day) as { n: number };
        const guest = this.db.prepare("SELECT COUNT(*) AS n FROM agent_requests WHERE day = ? AND owner_id = ?").get(day, ownerId) as { n: number };
        if (!freeAuthorized || total.n >= 16 || guest.n >= 8) {
          run.status = "budget"; run.message = "No free request is authorized or the conservative local daily cap was reached. No paid fallback is used.";
          this.runEvent(run, "stopped", now); return this.writeRun(ownerId, run);
        }
        run.requests++; run.status = "requesting";
        this.db.prepare("INSERT INTO agent_requests (owner_id, run_id, request, day) VALUES (?, ?, ?, ?)").run(ownerId, id, run.requests, day);
        this.runEvent(run, "request_reserved", now);
      } else run.status = "processing";
      run.leaseId = randomUUID(); run.startedMs = now; run.leaseUntil = now + Math.min(40_000, 120_000 - run.activeMs);
      return this.writeRun(ownerId, run);
    });
  }

  checkpointAgentRun(ownerId: string, next: PrivateAgentRun, event: AgentCheckpoint["event"], release: boolean, now = Date.now(), tool?: string): PrivateAgentRun {
    return this.transaction(() => {
      const current = this.getAgentRun(ownerId, next.projectId, next.id, now);
      if (!next.leaseId || current.leaseId !== next.leaseId) return current; // Cancellation, stale state or another worker wins.
      if (next.requests !== current.requests || JSON.stringify(next.basis) !== JSON.stringify(current.basis)) throw new GuestStoreError("invalid", "Invalid agent checkpoint binding.");
      next.checkpoints = current.checkpoints;
      this.runEvent(next, event, now, tool);
      if (release) {
        next.activeMs = current.activeMs + Math.max(0, now - (current.startedMs ?? now));
        delete next.leaseId; delete next.leaseUntil; delete next.startedMs;
      }
      return this.writeRun(ownerId, next);
    });
  }

  controlAgentRun(ownerId: string, projectId: string, id: string, action: "cancel" | "resume", now = Date.now()): PrivateAgentRun {
    return this.transaction(() => {
      const run = this.getAgentRun(ownerId, projectId, id, now);
      if (action === "cancel" && (agentRunIsActive(run.status) || agentRunCanResume(run))) {
        if (run.startedMs !== undefined) run.activeMs += Math.max(0, now - run.startedMs);
        run.status = "cancelled"; run.message = "Stopped. No project was changed; an in-flight provider call may still consume quota.";
        delete run.leaseId; delete run.leaseUntil; delete run.startedMs;
        this.runEvent(run, "stopped", now); return this.writeRun(ownerId, run);
      }
      if (action === "resume" && agentRunCanResume(run)) {
        run.status = run.pendingResponse ? "response_ready" : "ready"; delete run.message;
        this.runEvent(run, "resumed", now); return this.writeRun(ownerId, run);
      }
      return run; // Idempotent cancel/resume; never resurrect unknown, stale or completed work.
    });
  }

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

  listMaking(ownerId: string, projectId: string): MakingRecord[] {
    if (!this.getProject(ownerId, projectId)) throw new GuestStoreError("not_found", "Project not found.");
    const rows = this.db.prepare("SELECT data_json FROM making_events WHERE owner_id = ? AND project_id = ? ORDER BY sequence")
      .all(ownerId, projectId) as unknown as StoredRow[];
    return rows.map((row) => JSON.parse(row.data_json) as MakingRecord);
  }

  replayMaking(ownerId: string, projectId: string, raw: RecordMakingInput): MakingRecord | null {
    const input = recordMakingSchema.parse(raw);
    return this.receipt<MakingRecord>(ownerId, input.idempotencyKey, "making", hash({ projectId, input }), projectId);
  }

  recordMaking(ownerId: string, projectId: string, raw: RecordMakingInput, plan: MakingPlan | null, catalogFingerprint: string): MakingRecord {
    const input = recordMakingSchema.parse(raw);
    return this.transaction(() => {
      const duplicate = this.replayMaking(ownerId, projectId, input);
      if (duplicate) return duplicate;
      const project = this.getProject(ownerId, projectId);
      if (!project) throw new GuestStoreError("not_found", "Project not found.");
      if (project.source.kind !== "candidate" || (plan && project.source.designId !== plan.designKey))
        throw new GuestStoreError("invalid", "No applicable construction learning plan.");
      if (project.sequence !== input.expectedProjectSequence || project.basisHash !== input.expectedBasisHash ||
        project.knowledgeFingerprint !== catalogFingerprint || (plan && plan.fingerprint !== input.planFingerprint))
        throw new GuestStoreError("stale", "Project or construction knowledge changed. Reload and review the current source.");
      const history = this.listMaking(ownerId, projectId);
      if (history.length >= 2000) throw new GuestStoreError("invalid", "The making notebook has reached its 2000-event limit. Keep a backup.");
      if (history.length !== input.expectedHistorySequence) throw new GuestStoreError("stale", "Another making entry was saved. Reload before continuing.");
      const prior = history.findLast((record) => !record.imported && record.basisSequence === project.sequence &&
        record.basisHash === project.basisHash && record.catalogFingerprint === catalogFingerprint);
      if (!plan) {
        if (input.event.kind !== "paused" || !prior || prior.planFingerprint !== input.planFingerprint)
          throw new GuestStoreError("invalid", "Only a private pause can be recorded without current construction knowledge.");
      } else {
        const error = makingTransitionError(history, project, plan, input);
        if (error) throw new GuestStoreError("invalid", error);
      }
      const id = randomUUID();
      const sessionId = input.event.kind === "configured" ? id : plan ? currentMakingSession(history, project, plan)!.configured.id : prior!.sessionId;
      const record: MakingRecord = { id, projectId, sequence: history.length + 1, basisSequence: project.sequence,
        basisHash: project.basisHash, catalogFingerprint, planFingerprint: input.planFingerprint, sessionId,
        event: input.event, createdAt: new Date().toISOString(), imported: false };
      const json = JSON.stringify(record);
      this.db.prepare("INSERT INTO making_events (owner_id, project_id, sequence, data_json) VALUES (?, ?, ?, ?)")
        .run(ownerId, projectId, record.sequence, json);
      this.db.prepare("INSERT INTO mutation_receipts (owner_id, idempotency_key, operation, target_id, request_hash, result_json) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ownerId, input.idempotencyKey, "making", projectId, hash({ projectId, input }), json);
      return record;
    });
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
      if (input.event.kind !== "paused") {
        if (input.makingEventId !== binding.makingContext?.eventId)
          throw new GuestStoreError("invalid", "Making context must be resolved by the server.");
        if (binding.makingContext) {
          const making = this.listMaking(ownerId, projectId), context = binding.makingContext, entry = making.at(-1);
          if (making.length !== context.historySequence || !entry || entry.id !== context.eventId || entry.imported ||
            entry.basisSequence !== project.sequence || entry.basisHash !== project.basisHash ||
            entry.catalogFingerprint !== binding.catalogFingerprint || entry.planFingerprint !== context.planFingerprint ||
            entry.event.kind !== "help_requested" || entry.event.symptom !== "seam_puckering" || entry.event.stepId !== context.stepId)
            throw new GuestStoreError("stale", "The making step changed. Review the step and request contextual help again.");
        }
      }
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
      if (this.listNotes(ownerId, projectId).length >= 2000)
        throw new GuestStoreError("invalid", "The journal has reached its 2000-note backup limit. Keep a backup and start another project.");
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

  exportBackup(ownerId: string, projectId: string) {
    return this.transaction(() => {
      const project = this.getProject(ownerId, projectId);
      if (!project) throw new GuestStoreError("not_found", "Project not found.");
      return projectBackupSchema.parse({ format: "stitches-project-backup", version: 5,
        title: project.title, brief: project.brief, source: project.source, plan: project.plan, knowledgeFingerprint: project.knowledgeFingerprint,
        notes: this.listNotes(ownerId, projectId).map(({ kind, stage, text, basisSequence, basisHash, createdAt, importedFromSequence }) =>
          ({ kind, stage, text, basisSequence: importedFromSequence ?? basisSequence, basisHash, createdAt })),
        diagnostics: this.listDiagnostics(ownerId, projectId), making: this.listMaking(ownerId, projectId),
        studies: this.listPatternStudies(ownerId, projectId) });
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
      if (input.backup.version === 3 || input.backup.version === 4 || input.backup.version === 5) {
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
      if (input.backup.version === 4 || input.backup.version === 5) {
        const originals = input.backup.making;
        if (new Set(originals.map((entry) => entry.id)).size !== originals.length ||
          originals.some((entry, index) => entry.sequence !== index + 1))
          throw new GuestStoreError("invalid", "The imported making history is not a unique ordered sequence.");
        for (const original of originals) {
          const record: MakingRecord = { ...original, projectId: project.id, imported: true };
          this.db.prepare("INSERT INTO making_events (owner_id, project_id, sequence, data_json) VALUES (?, ?, ?, ?)")
            .run(ownerId, project.id, record.sequence, JSON.stringify(record));
        }
      }
      if (input.backup.version === 5) {
        if (new Set(input.backup.studies.map(study => study.id)).size !== input.backup.studies.length)
          throw new GuestStoreError("invalid", "Imported studies must have unique IDs.");
        for (const original of input.backup.studies) {
          if (original.projectId !== original.basis.projectId || original.command.expectedBasisHash !== original.basis.basisHash ||
            original.command.expectedSequence !== original.basis.sequence || original.command.expectedSourceFingerprint !== original.basis.sourceFingerprint)
            throw new GuestStoreError("invalid", "Imported study basis does not match its command.");
          const saved = savedStudySchema.parse({ ...original, id: randomUUID(), projectId: project.id, imported: true });
          this.db.prepare("INSERT INTO pattern_studies (owner_id, project_id, id, idempotency_key, request_hash, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .run(ownerId, project.id, saved.id, randomUUID(), hash({ importedStudy: saved.id }), JSON.stringify(saved), saved.createdAt);
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
