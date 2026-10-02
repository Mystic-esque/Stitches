import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { describe, it, expect, vi } from "vitest";
import { GuestStore } from "./guest-store";
import { GUEST_COOKIE, resolveGuestIdentity } from "./guest-session";

const mocked = vi.hoisted(() => ({ store: null as unknown, unavailable: false, reads: 0 }));
vi.mock("./guest-store", async (original) => ({ ...await original<typeof import("./guest-store")>(), getLocalGuestStore: () => mocked.store }));
vi.mock("../knowledge/companion-catalog", () => ({ createCompanionCatalogClient: () => ({}), loadCompanionCatalog: async () => {
  mocked.reads++;
  if (mocked.unavailable) throw new Error("explicit fixture outage");
  return [{ designKey: "sandy", fingerprint: "a".repeat(64), diagnosticStudy: { fingerprint: "b".repeat(64), sourceId: "fixture-source", testId: "fixture-test", remedyId: "fixture-remedy" } }];
} }));
import { GET, POST } from "../../app/api/projects/[id]/diagnostics/route";

describe("diagnostic HTTP boundary — explicitly mocked source", () => {
  it("replays an acknowledged save during source outage but pauses new source-dependent mutations while history remains readable", async () => {
    const store = new GuestStore(":memory:"); mocked.store = store; mocked.unavailable = false; mocked.reads = 0;
    try {
      const identity = resolveGuestIdentity();
      const project = store.createProject(identity.ownerId, { title: "Fixture route project", brief: "", source: { kind: "candidate", designId: "sandy" }, idempotencyKey: randomUUID() }, "a".repeat(64));
      const context = { params: Promise.resolve({ id: project.id }) };
      const input = { expectedProjectSequence: 1, expectedBasisHash: project.basisHash, expectedHistorySequence: 0,
        expectedDiagnosticFingerprint: "b".repeat(64), idempotencyKey: randomUUID(), event: { kind: "observation", observation: "relaxes", detail: "Fixture only" } };
      const req = (body?: unknown) => new NextRequest(`http://localhost:3100/api/projects/${project.id}/diagnostics`, { method: body ? "POST" : "GET",
        headers: { host: "localhost:3100", origin: "http://localhost:3100", "content-type": "application/json", cookie: `${GUEST_COOKIE}=${identity.token}` }, body: body ? JSON.stringify(body) : undefined });
      const saved = await POST(req(input), context); expect(saved.status).toBe(201); const record = (await saved.json()).record;
      mocked.unavailable = true;
      const replay = await POST(req(input), context); expect(replay.status).toBe(200); expect((await replay.json()).record).toEqual(record); expect(mocked.reads).toBe(1);
      const newSave = await POST(req({ ...input, expectedHistorySequence: 1, idempotencyKey: randomUUID() }), context);
      expect(newSave.status).toBe(503); expect((await newSave.json()).error).toBe("source_unavailable");
      const history = await GET(req(), context); expect(history.status).toBe(200); expect((await history.json()).diagnostics).toEqual([record]);
      expect(history.headers.get("cache-control")).toBe("no-store");
      const paused = await POST(req({ ...input, expectedHistorySequence: 1, idempotencyKey: randomUUID(), event: { kind: "paused", reason: "Stopped during source outage." } }), context);
      expect(paused.status).toBe(201); expect((await paused.json()).record.event.kind).toBe("paused"); expect(mocked.reads).toBe(2);
      expect(store.listDiagnostics(identity.ownerId, project.id)).toHaveLength(2);
    } finally { store.close(); }
  });
});
