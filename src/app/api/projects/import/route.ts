import { NextRequest } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request);
    const project = getLocalGuestStore().importBackup(identity.ownerId, await request.json());
    return guestResponse(request, identity, { project, notes: getLocalGuestStore().listNotes(identity.ownerId, project.id) }, 201);
  } catch (error) { return guestErrorResponse(error); }
}
