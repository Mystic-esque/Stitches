import { NextRequest } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse, GuestHttpError } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const identity = guestForRequest(request);
    const { id } = await context.params;
    const project = getLocalGuestStore().getProject(identity.ownerId, id);
    if (!project) throw new GuestHttpError(404, "not_found", "Project not found.");
    return guestResponse(request, identity, {
      project,
      revisions: getLocalGuestStore().listRevisions(identity.ownerId, id),
      notes: getLocalGuestStore().listNotes(identity.ownerId, id),
    });
  } catch (error) {
    return guestErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request);
    const { id } = await context.params;
    const project = getLocalGuestStore().updateProject(identity.ownerId, id, await request.json());
    return guestResponse(request, identity, { project });
  } catch (error) {
    return guestErrorResponse(error);
  }
}
