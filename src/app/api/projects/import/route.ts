import { NextRequest } from "next/server";
import { importGuestProjectSchema } from "@/domain/guest-project";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestErrorResponse, guestForRequest, guestResponse, readBoundedJson } from "@/server/projects/guest-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request);
    const project = getLocalGuestStore().importBackup(identity.ownerId, importGuestProjectSchema.parse(await readBoundedJson(request, 32_000_000)));
    return guestResponse(request, identity, { project, notes: getLocalGuestStore().listNotes(identity.ownerId, project.id),
      diagnostics: getLocalGuestStore().listDiagnostics(identity.ownerId, project.id) }, 201);
  } catch (error) { return guestErrorResponse(error); }
}
