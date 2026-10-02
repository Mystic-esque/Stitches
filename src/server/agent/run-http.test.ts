import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GuestStore } from "../projects/guest-store";
import { loadOwnedAgentSnapshot, boundedAgentJson, agentErrorResponse } from "./run-http";
import { GuestHttpError } from "../projects/guest-http";
import { loadCompanionCatalog } from "../knowledge/companion-catalog";

vi.mock("../knowledge/companion-catalog", async (original) => ({ ...await original<object>(), loadCompanionCatalog: vi.fn() }));
describe("private agent HTTP boundaries", () => {
  it("denies another guest before issuing any exact source request", async () => {
    const store = new GuestStore(":memory:");
    try { await expect(loadOwnedAgentSnapshot(store, "other-guest", "known-id")).rejects.toMatchObject({ status: 404 }); expect(loadCompanionCatalog).not.toHaveBeenCalled(); }
    finally { store.close(); }
  });
  it("limits actual streamed bytes, not only a caller-supplied content length", async () => {
    const request = new NextRequest("http://localhost/api", { method: "POST", body: JSON.stringify({ data: "x".repeat(5000) }) });
    await expect(boundedAgentJson(request)).rejects.toMatchObject({ status: 413 });
    expect(await boundedAgentJson(new NextRequest("http://localhost/api", { method: "POST", body: '{"action":"cancel"}' }))).toEqual({ action: "cancel" });
  });
  it("returns a non-secret error envelope and request ID for unknown failures", async () => {
    const response = agentErrorResponse(new Error("SECRET provider trace"));
    expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ error: { code: "unavailable", retryable: false, requestId: expect.any(String), message: expect.not.stringContaining("SECRET") } });
    const stale = agentErrorResponse(new GuestHttpError(409, "stale", "Review the current basis.")); expect(stale.status).toBe(409);
  });
});
