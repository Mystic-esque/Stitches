import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GuestStore } from "./guest-store";
import { GUEST_COOKIE, resolveGuestIdentity } from "./guest-session";
import { readBoundedJson } from "./guest-http";
import type { MakingPlan } from "../../domain/making-plan";

const mocked = vi.hoisted(() => ({ store: null as unknown, unavailable: false, planMissing: false, reads: 0,
  fingerprint: "b".repeat(64), catalogFingerprint: "a".repeat(64) }));
vi.mock("./guest-store", async (original) => ({ ...await original<typeof import("./guest-store")>(), getLocalGuestStore: () => mocked.store }));
vi.mock("../knowledge/companion-catalog", () => ({ createCompanionCatalogClient: () => ({}), loadCompanionCatalog: async () => {
  mocked.reads++; if (mocked.unavailable) throw new Error("Explicit fixture source outage");
  return [{ designKey: "sandy", fingerprint: mocked.catalogFingerprint, diagnosticStudy: {
    fingerprint: "c".repeat(64), sourceId: "fixture-source", testId: "fixture-test", remedyId: "fixture-remedy" } }];
} }));
vi.mock("../knowledge/making-plan", () => ({ loadMakingPlan: async (): Promise<MakingPlan> => {
  if (mocked.planMissing) throw new Error("Explicit fixture missing graph");
  return { id: "fixture-plan", designKey: "sandy", title: "Fixture learning graph", fingerprint: mocked.fingerprint,
    sourceTitle: "Fixture source", sourceUrl: "https://freesewing.eu/docs/designs/sandy/instructions/", envelope: "Fixture only, not maker proof.",
    reviewStatus: "pending", capability: "plan_only", steps: [
      { id: "fixture-step-one", title: "First relationship", ordinal: 1, condition: "always", requires: [], pieceKeys: ["skirt-default"], edgeIds: [],
        orientation: "Right sides together", action: "Fixture study", checkpoint: "Review source", diagnostic: true },
      { id: "fixture-step-two", title: "Second relationship", ordinal: 2, condition: "always", requires: ["fixture-step-one"], pieceKeys: ["skirt-default"], edgeIds: [],
        orientation: "Review source", action: "Fixture study", checkpoint: "Review source", diagnostic: true },
    ] };
} }));
import { GET, POST } from "../../app/api/projects/[id]/making/route";
import { POST as diagnosticPost } from "../../app/api/projects/[id]/diagnostics/route";
import { GET as backupGet } from "../../app/api/projects/[id]/backup/route";

function setup() {
  const store = new GuestStore(":memory:"); mocked.store = store; mocked.unavailable = false; mocked.planMissing = false;
  mocked.reads = 0; mocked.fingerprint = "b".repeat(64); mocked.catalogFingerprint = "a".repeat(64);
  const identity = resolveGuestIdentity(), other = resolveGuestIdentity();
  const project = store.createProject(identity.ownerId, { title: "Fixture learning project", brief: "Not a real maker trial.",
    source: { kind: "candidate", designId: "sandy" }, idempotencyKey: randomUUID() }, mocked.catalogFingerprint);
  const context = { params: Promise.resolve({ id: project.id }) };
  const request = (body?: unknown, path = "making", token = identity.token, origin = "http://localhost:3100") => new NextRequest(`http://localhost:3100/api/projects/${project.id}/${path}`, {
    method: body === undefined ? "GET" : "POST", headers: { host: "localhost:3100", origin, "content-type": "application/json", cookie: `${GUEST_COOKIE}=${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const making = (event: unknown) => ({ expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash,
    expectedHistorySequence: store.listMaking(identity.ownerId, project.id).length,
    planFingerprint: mocked.fingerprint, event, idempotencyKey: randomUUID() });
  const diagnostic = (event: unknown, makingEventId?: string) => ({ expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash,
    expectedHistorySequence: store.listDiagnostics(identity.ownerId, project.id).length, expectedDiagnosticFingerprint: "c".repeat(64),
    event, idempotencyKey: randomUUID(), ...(makingEventId ? { makingEventId } : {}) });
  return { store, identity, other, project, context, request, making, diagnostic };
}

describe("making HTTP boundary — explicitly mocked exact sources", () => {
  it("rejects foreign/other-owner/oversized/unknown/stale requests and reads private history without source authority", async () => {
    const f = setup(); try {
      const configured = f.making({ kind: "configured", options: { sleeves: false, frontBottom: false, dart: false } });
      expect((await POST(f.request(configured, "making", f.identity.token, "https://foreign.invalid"), f.context)).status).toBe(403);
      expect((await POST(f.request(configured, "making", f.other.token), f.context)).status).toBe(404);
      expect((await POST(f.request({ ...configured, arbitraryShell: "not allowed" }), f.context)).status).toBe(400);
      expect((await POST(f.request({ ...configured, huge: "x".repeat(5000) }), f.context)).status).toBe(413);
      expect((await POST(f.request({ ...configured, expectedProjectSequence: 99 }), f.context)).status).toBe(409);
      expect(mocked.reads).toBe(0);
      const response = await POST(f.request(configured), f.context); expect(response.status).toBe(200);
      const saved = (await response.json()).record;
      mocked.unavailable = true;
      expect((await POST(f.request(configured), f.context)).status).toBe(200); expect(mocked.reads).toBe(1);
      const get = await GET(f.request(), f.context), data = await get.json();
      expect(get.headers.get("cache-control")).toBe("no-store"); expect(data.history).toEqual([saved]); expect(data.plan).toBeNull();
      expect((await POST(f.request(f.making({ kind: "reviewed", stepId: "fixture-step-one", checkpointConfirmed: true })), f.context)).status).toBe(503);
      expect((await POST(f.request(f.making({ kind: "paused", reason: "Stopped while sources are unavailable" })), f.context)).status).toBe(200);
      const backup = (await (await backupGet(f.request(undefined, "backup"), f.context)).json()).backup;
      expect(backup.version).toBe(5); expect(backup.making).toHaveLength(2); expect(backup.studies).toEqual([]);
      expect((await backupGet(f.request(undefined, "backup", f.other.token), f.context)).status).toBe(404);
    } finally { f.store.close(); }
  });
  it("makes source corrections require a new explicit study configuration without rewriting old checkpoints", async () => {
    const f = setup(); try {
      await POST(f.request(f.making({ kind: "configured", options: { sleeves: false, frontBottom: false, dart: false } })), f.context);
      const old = f.making({ kind: "reviewed", stepId: "fixture-step-one", checkpointConfirmed: true });
      mocked.fingerprint = "d".repeat(64);
      expect((await POST(f.request(old), f.context)).status).toBe(409);
      expect((await POST(f.request(f.making(old.event)), f.context)).status).toBe(400);
      const data = await (await GET(f.request(), f.context)).json();
      expect(data.history[0].planFingerprint).not.toBe(data.plan.fingerprint);
      expect(f.store.getProject(f.identity.ownerId, f.project.id)).toEqual(f.project);
    } finally { f.store.close(); }
  });
  it("binds actual step help to scrap observations and prevents changing its context mid-comparison", async () => {
    const f = setup(); try {
      await POST(f.request(f.making({ kind: "configured", options: { sleeves: false, frontBottom: false, dart: false } })), f.context);
      expect((await POST(f.request(f.making({ kind: "help_requested", stepId: "fixture-step-two", symptom: "seam_puckering", detail: "Fixture symptom" })), f.context)).status).toBe(400);
      const help = (await (await POST(f.request(f.making({ kind: "help_requested", stepId: "fixture-step-one", symptom: "seam_puckering", detail: "Fixture scrap only" })), f.context)).json()).record;
      expect((await diagnosticPost(f.request(f.diagnostic({ kind: "observation", observation: "relaxes", detail: "Fixture sample" }, randomUUID()), "diagnostics"), f.context)).status).toBe(409);
      const seen = (await (await diagnosticPost(f.request(f.diagnostic({ kind: "observation", observation: "relaxes", detail: "Fixture sample" }, help.id), "diagnostics"), f.context)).json()).record;
      expect(seen.binding.makingContext).toMatchObject({ eventId: help.id, stepId: "fixture-step-one", historySequence: 2 });
      expect((await diagnosticPost(f.request(f.diagnostic({ kind: "comparison_started", observationId: seen.id }), "diagnostics"), f.context)).status).toBe(400);
      const attempt = (await (await diagnosticPost(f.request(f.diagnostic({ kind: "comparison_started", observationId: seen.id }, help.id), "diagnostics"), f.context)).json()).record;
      const result = await diagnosticPost(f.request(f.diagnostic({ kind: "comparison_result", attemptId: attempt.id, outcome: "worse", detail: "Stopped" }, help.id), "diagnostics"), f.context);
      expect(result.status).toBe(201);
      const fresh = (await (await diagnosticPost(f.request(f.diagnostic({ kind: "observation", observation: "relaxes", detail: "No automatic repeated remedy" }, help.id), "diagnostics"), f.context)).json()).record;
      expect((await diagnosticPost(f.request(f.diagnostic({ kind: "comparison_started", observationId: fresh.id }, help.id), "diagnostics"), f.context)).status).toBe(400);
      await POST(f.request(f.making({ kind: "reviewed", stepId: "fixture-step-one", checkpointConfirmed: true })), f.context);
      expect((await diagnosticPost(f.request(f.diagnostic({ kind: "observation", observation: "unchanged", detail: "Old step" }, help.id), "diagnostics"), f.context)).status).toBe(409);
      expect(f.store.listDiagnostics(f.identity.ownerId, f.project.id)).toHaveLength(4);
    } finally { f.store.close(); }
  });
  it("counts UTF-8 bytes and refuses a chunked oversized body before JSON parsing", async () => {
    const request = new NextRequest("http://localhost:3100/api/test", { method: "POST", body: JSON.stringify({ note: "🧵".repeat(20) }) });
    await expect(readBoundedJson(request, 64)).rejects.toMatchObject({ status: 413 });
  });
});
