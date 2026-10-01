import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { assertSameOriginJson, guestForRequest, guestResponse, GuestHttpError } from "./guest-http";
import { resolveGuestIdentity } from "./guest-session";

describe("guest HTTP boundary", () => {
  it("sets the same bearer identity used for a direct create request", () => {
    const request = new NextRequest("http://localhost:3000/api/projects", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" } });
    const identity = guestForRequest(request);
    const response = guestResponse(request, identity, { project: { id: "new" } }, 201);
    expect(response.status).toBe(201);
    expect(response.cookies.get("stitches_guest")?.value).toBe(identity.token);
    expect(resolveGuestIdentity(identity.token).ownerId).toBe(identity.ownerId);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects cross-origin and non-JSON mutations", () => {
    const cross = new NextRequest("http://localhost:3000/api/projects", { method: "POST", headers: { origin: "https://other.example", "content-type": "application/json" } });
    expect(() => assertSameOriginJson(cross)).toThrowError(GuestHttpError);
    const wrongType = new NextRequest("http://localhost:3000/api/projects", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "text/plain" } });
    expect(() => assertSameOriginJson(wrongType)).toThrowError(GuestHttpError);
  });

  it("accepts the incoming local Host even when the framework URL host is normalized", () => {
    const request = new NextRequest("http://localhost:3000/api/projects", {
      method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json" },
    });
    expect(() => assertSameOriginJson(request)).not.toThrow();
  });
});
