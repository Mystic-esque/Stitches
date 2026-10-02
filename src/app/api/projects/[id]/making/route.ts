import { NextRequest } from "next/server";
import { z } from "zod";
import { recordMakingSchema } from "../../../../../domain/making-plan";
import { createCompanionCatalogClient, loadCompanionCatalog } from "../../../../../server/knowledge/companion-catalog";
import { loadMakingPlan } from "../../../../../server/knowledge/making-plan";
import { getLocalGuestStore, GuestStoreError } from "../../../../../server/projects/guest-store";
import { assertSameOriginJson, guestForRequest, guestResponse, guestErrorResponse, GuestHttpError, readBoundedJson } from "../../../../../server/projects/guest-http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const identity = guestForRequest(request), { id } = await context.params;
    z.string().uuid().parse(id);
    const store = getLocalGuestStore(), project = store.getProject(identity.ownerId, id);
    if (!project) throw new GuestStoreError("not_found", "Project not found.");
    const history = store.listMaking(identity.ownerId, id);
    if (project.source.kind !== "candidate") return guestResponse(request, identity, { history, plan: null, sourceCurrent: false, message: "Personal ideas need a mapped source before an authored step plan." });
    try {
      const client = createCompanionCatalogClient(), catalog = await loadCompanionCatalog(client);
      const card = catalog.find((entry) => entry.designKey === (project.source.kind === "candidate" ? project.source.designId : ""))!;
      const plan = await loadMakingPlan(client, card);
      return guestResponse(request, identity, { history, plan, sourceCurrent: project.knowledgeFingerprint === card.fingerprint,
        message: project.knowledgeFingerprint === card.fingerprint ? null : "Catalog knowledge changed. Review and refresh the project source before new checkpoints." });
    } catch {
      return guestResponse(request, identity, { history, plan: null, sourceCurrent: false,
        message: "Construction knowledge is unavailable. Your private history is preserved; no fixture has replaced it." });
    }
  } catch (error) { return guestErrorResponse(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request), { id } = await context.params;
    z.string().uuid().parse(id);
    const input = recordMakingSchema.parse(await readBoundedJson(request));
    const store = getLocalGuestStore(), replay = store.replayMaking(identity.ownerId, id, input);
    if (replay) return guestResponse(request, identity, { record: replay });
    const project = store.getProject(identity.ownerId, id);
    if (!project) throw new GuestStoreError("not_found", "Project not found.");
    if (project.source.kind !== "candidate") throw new GuestStoreError("invalid", "A candidate source is required.");
    if (project.sequence !== input.expectedProjectSequence || project.basisHash !== input.expectedBasisHash)
      throw new GuestStoreError("stale", "The project changed. Review the saved revision first.");
    if (input.event.kind === "paused") return guestResponse(request, identity,
      { record: store.recordMaking(identity.ownerId, id, input, null, project.knowledgeFingerprint ?? "") });
    let card, plan;
    try {
      const client = createCompanionCatalogClient();
      card = (await loadCompanionCatalog(client)).find((entry) => entry.designKey === (project.source.kind === "candidate" ? project.source.designId : ""))!;
      plan = await loadMakingPlan(client, card);
    } catch { throw new GuestHttpError(503, "knowledge_unavailable", "No current construction knowledge. Keep your note and retry after source access returns."); }
    return guestResponse(request, identity, { record: store.recordMaking(identity.ownerId, id, input, plan, card.fingerprint) });
  } catch (error) { return guestErrorResponse(error); }
}
