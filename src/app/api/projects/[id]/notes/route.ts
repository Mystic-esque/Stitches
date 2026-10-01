import { NextRequest } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const identity = guestForRequest(request);
    const { id } = await context.params;
    const notes = getLocalGuestStore().listNotes(identity.ownerId, id);
    return guestResponse(request, identity, { notes });
  } catch (error) { return guestErrorResponse(error); }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request);
    const { id } = await context.params;
    const note = getLocalGuestStore().recordNote(identity.ownerId, id, await request.json());
    return guestResponse(request, identity, { note }, 201);
  } catch (error) { return guestErrorResponse(error); }
}
