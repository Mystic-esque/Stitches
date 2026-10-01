import { NextRequest, NextResponse } from "next/server";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { createGuestProjectSchema } from "@/domain/guest-project";
import { createCompanionCatalogClient, loadCompanionCatalog } from "@/server/knowledge/companion-catalog";
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
    const input = createGuestProjectSchema.parse(await request.json());
    let fingerprint: string | null = null;
    if (input.source.kind === "candidate") {
      const designId = input.source.designId;
      try {
        const cards = await loadCompanionCatalog(createCompanionCatalogClient());
        fingerprint = cards.find((item) => item.designKey === designId)?.fingerprint ?? null;
      } catch { /* A planning-only project may start unbound; source advice stays unavailable. */ }
    }
    const project = getLocalGuestStore().createProject(identity.ownerId, input, fingerprint);
    return guestResponse(request, identity, { project }, 201);
  } catch (error) {
    return guestErrorResponse(error);
  }
}
