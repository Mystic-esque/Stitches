import { NextRequest } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse } from "@/server/projects/guest-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOriginJson(request);
    const guest = guestForRequest(request), { id } = await context.params;
    return guestResponse(request, guest, { project: getLocalGuestStore().copyProfile(guest.ownerId, id, await request.json()) });
  } catch (error) { return guestErrorResponse(error); }
}
