import { NextRequest } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse } from "@/server/projects/guest-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const guest = guestForRequest(request), store = getLocalGuestStore();
    return guestResponse(request, guest, { profile: store.getProfile(guest.ownerId), revisions: store.listProfileRevisions(guest.ownerId) });
  } catch (error) { return guestErrorResponse(error); }
}
export async function PUT(request: NextRequest) {
  try {
    assertSameOriginJson(request);
    const guest = guestForRequest(request);
    return guestResponse(request, guest, { profile: getLocalGuestStore().saveProfile(guest.ownerId, await request.json()) });
  } catch (error) { return guestErrorResponse(error); }
}
export async function POST(request: NextRequest) {
  try {
    assertSameOriginJson(request);
    const guest = guestForRequest(request);
    return guestResponse(request, guest, { profile: getLocalGuestStore().importProfile(guest.ownerId, await request.json()) });
  } catch (error) { return guestErrorResponse(error); }
}
