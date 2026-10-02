import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { GuestStoreError } from "./guest-store";
import { GUEST_COOKIE, guestCookieOptions, resolveGuestIdentity, type GuestIdentity } from "./guest-session";

export function guestForRequest(request: NextRequest) {
  return resolveGuestIdentity(request.cookies.get(GUEST_COOKIE)?.value);
}

export function guestResponse<T>(request: NextRequest, identity: GuestIdentity, body: T, status = 200): NextResponse<T> {
  const response = NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (identity.newSession) response.cookies.set(GUEST_COOKIE, identity.token, guestCookieOptions(request.nextUrl.protocol === "https:"));
  return response;
}

export function assertSameOriginJson(request: NextRequest): void {
  // Next may normalize request.nextUrl.host (for example 127.0.0.1 → localhost).
  // The browser's Origin must match the incoming Host and scheme, not that rewrite.
  const host = request.headers.get("host") ?? request.nextUrl.host;
  if (request.headers.get("origin") !== `${request.nextUrl.protocol}//${host}`) {
    throw new GuestHttpError(403, "same_origin_required", "Project changes must come from this site.");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new GuestHttpError(415, "json_required", "Send application/json.");
  }
}

export class GuestHttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}

export async function readBoundedJson(request: NextRequest, maxBytes = 4096): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new GuestHttpError(400, "invalid_input", "Missing JSON body.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new GuestHttpError(413, "input_too_large", "The request exceeds its byte limit."); }
    chunks.push(part.value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function guestErrorResponse(error: unknown): NextResponse {
  if (error instanceof GuestHttpError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return NextResponse.json({ error: "invalid_input", message: "Review the project fields and try again." }, { status: 400 });
  }
  if (error instanceof GuestStoreError) {
    const status = error.code === "not_found" ? 404 : error.code === "invalid" ? 400 : 409;
    return NextResponse.json({ error: error.code, message: error.message }, { status });
  }
  console.error("Guest project request failed", error);
  return NextResponse.json({ error: "storage_unavailable", message: "Projects are temporarily unavailable. Your unsaved changes remain in this browser." }, { status: 503 });
}
