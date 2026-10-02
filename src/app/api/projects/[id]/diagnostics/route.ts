import { NextRequest } from "next/server";
import { recordDiagnosticSchema } from "@/domain/diagnostic-history";
import { currentMakingSession } from "@/domain/making-plan";
import { loadMakingPlan } from "@/server/knowledge/making-plan";
import { createCompanionCatalogClient, loadCompanionCatalog } from "@/server/knowledge/companion-catalog";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse, GuestHttpError, readBoundedJson } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const identity = guestForRequest(request), { id } = await context.params;
    return guestResponse(request, identity, { diagnostics: getLocalGuestStore().listDiagnostics(identity.ownerId, id) });
  } catch (error) { return guestErrorResponse(error); }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request), { id } = await context.params, input = recordDiagnosticSchema.parse(await readBoundedJson(request));
    const store = getLocalGuestStore(), replay = store.replayDiagnostic(identity.ownerId, id, input);
    if (replay) return guestResponse(request, identity, { record: replay, replayed: true });
    const project = store.getProject(identity.ownerId, id);
    if (!project) throw new GuestHttpError(404, "not_found", "Project not found.");
    if (project.source.kind !== "candidate") throw new GuestHttpError(400, "unsupported", "No applicable source-linked sample check for this project.");
    if (project.sequence !== input.expectedProjectSequence || project.basisHash !== input.expectedBasisHash)
      throw new GuestHttpError(409, "stale", "The project changed. Review the saved basis before recording a check.");
    // A maker pause is a private fact, not new knowledge-dependent advice. Preserve it during source outage.
    if (input.event.kind === "paused") {
      const last = store.listDiagnostics(identity.ownerId, id).filter((item) => !item.imported && item.basisSequence === project.sequence &&
        item.basisHash === project.basisHash && item.binding.catalogFingerprint === project.knowledgeFingerprint).at(-1);
      if (!last) throw new GuestHttpError(400, "invalid", "There is no current saved check to pause.");
      const record = store.recordDiagnostic(identity.ownerId, id, input, last.binding);
      return guestResponse(request, identity, { record, replayed: false }, 201);
    }
    let cards;
    try { cards = await loadCompanionCatalog(createCompanionCatalogClient()); }
    catch { throw new GuestHttpError(503, "source_unavailable", "Current diagnostic sources are unavailable. Saved history is retained; no new advice is approved."); }
    const designId = project.source.designId, card = cards.find((item) => item.designKey === designId);
    if (!card) throw new GuestHttpError(503, "source_unavailable", "The applicable diagnostic source is missing.");
    const study = card.diagnosticStudy;
    let makingContext;
    if (input.makingEventId) {
      let plan;
      try { plan = await loadMakingPlan(createCompanionCatalogClient(), card); }
      catch { throw new GuestHttpError(503, "source_unavailable", "Current construction knowledge is unavailable; no step context has been assumed."); }
      const history = store.listMaking(identity.ownerId, id), last = history.at(-1), session = currentMakingSession(history, project, plan);
      if (!last || last.id !== input.makingEventId || last.imported || !session || last.sessionId !== session.configured.id ||
        last.event.kind !== "help_requested" || last.event.symptom !== "seam_puckering" ||
        session.next?.id !== last.event.stepId || !session.next.diagnostic)
        throw new GuestHttpError(409, "stale", "Making context is no longer current. Review the next step and request help again.");
      makingContext = { eventId: last.id, planFingerprint: plan.fingerprint, stepId: last.event.stepId, historySequence: history.length };
    }
    const record = store.recordDiagnostic(identity.ownerId, id, input, { catalogFingerprint: card.fingerprint,
      diagnosticFingerprint: study.fingerprint, sourceId: study.sourceId, testId: study.testId, remedyId: study.remedyId,
      ...(makingContext ? { makingContext } : {}) });
    return guestResponse(request, identity, { record, replayed: false }, 201);
  } catch (error) { return guestErrorResponse(error); }
}
