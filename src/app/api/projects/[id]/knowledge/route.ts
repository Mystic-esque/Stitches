import { NextRequest, NextResponse } from "next/server";
import { rebaseGuestKnowledgeSchema } from "@/domain/guest-project";
import { createCompanionCatalogClient, loadCompanionCatalog } from "@/server/knowledge/companion-catalog";
import { GuestStoreError, getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request);
    const { id } = await context.params;
    const input = rebaseGuestKnowledgeSchema.parse(await request.json());
    const store = getLocalGuestStore();
    const current = store.getProject(identity.ownerId, id);
    if (!current) throw new GuestStoreError("not_found", "Project not found.");
    if (current.source.kind !== "candidate") throw new GuestStoreError("invalid", "This project has no linked candidate source.");
    const designId = current.source.designId;
    const cards = await loadCompanionCatalog(createCompanionCatalogClient());
    const fingerprint = cards.find((item) => item.designKey === designId)?.fingerprint;
    if (!fingerprint) return NextResponse.json({ error: "source_unavailable", message: "The source record is unavailable; no project change was made." }, { status: 503 });
    const project = store.rebaseKnowledge(identity.ownerId, id, input, fingerprint);
    return guestResponse(request, identity, { project });
  } catch (error) { return guestErrorResponse(error); }
}
