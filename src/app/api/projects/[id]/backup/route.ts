import { NextRequest } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { guestForRequest, guestResponse, guestErrorResponse } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = guestForRequest(request), { id } = await context.params;
    return guestResponse(request, identity, { backup: getLocalGuestStore().exportBackup(identity.ownerId, id) });
  } catch (error) { return guestErrorResponse(error); }
}
