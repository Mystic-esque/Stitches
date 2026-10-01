import { NextRequest, NextResponse } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const identity = guestForRequest(request);
    return guestResponse(request, identity, { projects: getLocalGuestStore().listProjects(identity.ownerId) });
  } catch (error) {
    return guestErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request);
    const project = getLocalGuestStore().createProject(identity.ownerId, await request.json());
    return guestResponse(request, identity, { project }, 201);
  } catch (error) {
    return guestErrorResponse(error);
  }
}
