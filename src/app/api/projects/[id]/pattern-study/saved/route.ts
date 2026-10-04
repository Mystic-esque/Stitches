import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getLocalGuestStore, GuestStoreError } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestForRequest, guestResponse, GuestHttpError } from "@/server/projects/guest-http";
import { boundedAgentJson, loadOwnedAgentSnapshot } from "@/server/agent/run-http";
import { createPatternStudy, PatternStudyError, patternStudyBasis } from "@/server/patterns/pattern-study";
import { saveStudyRequestSchema } from "@/domain/pattern-study";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const identity = guestForRequest(request), { id } = await context.params;
    return guestResponse(request, identity, { studies: getLocalGuestStore().listPatternStudies(identity.ownerId, id) });
  } catch (error) {
    return NextResponse.json({ error: { code: error instanceof GuestStoreError ? error.code : "unavailable", message: "Saved studies could not be loaded." } },
      { status: error instanceof GuestStoreError && error.code === "not_found" ? 404 : 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request), { id } = await context.params, store = getLocalGuestStore();
    if (!store.getProject(identity.ownerId, id)) throw new GuestHttpError(404, "not_found", "Project not found.");
    const input = saveStudyRequestSchema.parse(await boundedAgentJson(request));
    const initial = await loadOwnedAgentSnapshot(store, identity.ownerId, id);
    const study = createPatternStudy(initial.project, initial.source, input.study.command);
    if (JSON.stringify(study.basis) !== JSON.stringify(input.study.basis) ||
      study.before.mapping.artifactHash !== input.study.beforeHash || study.after.mapping.artifactHash !== input.study.afterHash)
      throw new PatternStudyError("stale", "The comparison no longer matches the checked engine result. Generate it again.", study.basis);
    const current = await loadOwnedAgentSnapshot(store, identity.ownerId, id);
    if (JSON.stringify(patternStudyBasis(current.project, current.source)) !== JSON.stringify(study.basis))
      throw new PatternStudyError("stale", "The source changed before this study could be saved.", patternStudyBasis(current.project, current.source));
    const saved = store.savePatternStudy(identity.ownerId, id, study, input.idempotencyKey);
    return guestResponse(request, identity, { saved }, 201);
  } catch (error) {
    const code = error instanceof PatternStudyError || error instanceof GuestStoreError || error instanceof GuestHttpError ? error.code :
      error instanceof ZodError || error instanceof SyntaxError ? "invalid_input" : "unavailable";
    return NextResponse.json({ error: { code, message: error instanceof PatternStudyError || error instanceof GuestStoreError || error instanceof GuestHttpError ? error.message :
      "The study could not be saved. Your pattern and plan are unchanged.", requestId: randomUUID() } },
      { status: error instanceof GuestHttpError ? error.status : code === "stale" || code === "idempotency_conflict" ? 409 : code === "not_found" ? 404 :
        ["invalid_input", "missing_input", "unsupported", "invalid"].includes(code) ? 400 : 503, headers: { "Cache-Control": "no-store" } });
  }
}
