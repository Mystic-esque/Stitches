import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestForRequest, guestResponse, GuestHttpError } from "@/server/projects/guest-http";
import { boundedAgentJson, loadOwnedAgentSnapshot } from "@/server/agent/run-http";
import { createPatternStudy, PatternStudyError, patternStudyBasis } from "@/server/patterns/pattern-study";
import { patternStudyRequestSchema } from "@/domain/pattern-study";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOriginJson(request); const identity = guestForRequest(request), { id } = await context.params;
    const store = getLocalGuestStore();
    // Owner lookup precedes both network and expensive geometry work.
    if (!store.getProject(identity.ownerId, id)) throw new GuestHttpError(404, "not_found", "Project not found.");
    const input = patternStudyRequestSchema.parse(await boundedAgentJson(request));
    const initial = await loadOwnedAgentSnapshot(store, identity.ownerId, id);
    const study = createPatternStudy(initial.project, initial.source, input);
    const current = await loadOwnedAgentSnapshot(store, identity.ownerId, id);
    if (JSON.stringify(patternStudyBasis(current.project, current.source)) !== JSON.stringify(study.basis))
      throw new PatternStudyError("stale", "The basis changed while drafting. Review the new saved plan.", patternStudyBasis(current.project, current.source));
    return guestResponse(request, identity, { study });
  } catch (error) {
    const code = error instanceof PatternStudyError || error instanceof GuestHttpError ? error.code : error instanceof ZodError || error instanceof SyntaxError ? "invalid_input" : "unavailable";
    return NextResponse.json({ error: { code, message: error instanceof PatternStudyError || error instanceof GuestHttpError ? error.message : "The measured study is unavailable. Your saved plan is unchanged.",
      currentBasis: error instanceof PatternStudyError ? error.currentBasis : undefined, retryable: code === "source_unavailable", requestId: randomUUID() } },
      { status: error instanceof GuestHttpError ? error.status : code === "stale" ? 409 : ["invalid_input", "missing_input", "unsupported"].includes(code) ? 400 : 503, headers: { "Cache-Control": "no-store" } });
  }
}
