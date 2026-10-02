import { NextRequest } from "next/server";
import { agentActionSchema } from "@/domain/agent-run";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestForRequest, guestResponse } from "@/server/projects/guest-http";
import { createStitchesCompanionReader } from "@/server/agent/companion-tools";
import { advanceCompanionRun, companionFreeAuthorized } from "@/server/agent/run-controller";
import { publicAgentRun } from "@/server/agent/run-state";
import { agentErrorResponse, boundedAgentJson, loadOwnedAgentSnapshot } from "@/server/agent/run-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string; runId: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const identity = guestForRequest(request), { id, runId } = await context.params;
    return guestResponse(request, identity, { run: publicAgentRun(getLocalGuestStore().getAgentRun(identity.ownerId, id, runId)) });
  } catch (error) { return agentErrorResponse(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request), { id, runId } = await context.params, input = agentActionSchema.parse(await boundedAgentJson(request)), store = getLocalGuestStore();
    store.getAgentRun(identity.ownerId, id, runId); // Resolve ownership before Context or provider initialization.
    const run = input.action !== "advance" ? store.controlAgentRun(identity.ownerId, id, runId, input.action) :
      await advanceCompanionRun({ store, ownerId: identity.ownerId, projectId: id, runId, freeAuthorized: companionFreeAuthorized(),
        loadSnapshot: () => loadOwnedAgentSnapshot(store, identity.ownerId, id), reader: createStitchesCompanionReader() });
    return guestResponse(request, identity, { run: publicAgentRun(run) });
  } catch (error) { return agentErrorResponse(error); }
}
