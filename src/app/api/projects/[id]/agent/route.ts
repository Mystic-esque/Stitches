import { NextRequest } from "next/server";
import { startAgentRunSchema, sameAgentBasis } from "@/domain/agent-run";
import { getLocalGuestStore } from "@/server/projects/guest-store";
import { assertSameOriginJson, guestForRequest, guestResponse } from "@/server/projects/guest-http";
import { companionBasis, createCompanionTools, createStitchesCompanionReader, resolveAgentSelection, STITCHES_KB_ID, CompanionAgentError } from "@/server/agent/companion-tools";
import { companionFreeAuthorized } from "@/server/agent/run-controller";
import { publicAgentRun } from "@/server/agent/run-state";
import { agentErrorResponse, boundedAgentJson, loadOwnedAgentSnapshot } from "@/server/agent/run-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const identity = guestForRequest(request), { id } = await context.params, store = getLocalGuestStore();
    const runs = store.listAgentRuns(identity.ownerId, id).map(publicAgentRun);
    let preparation;
    try {
      const snapshot = await loadOwnedAgentSnapshot(store, identity.ownerId, id);
      const tools = createCompanionTools({ snapshot, loadCurrent: async () => snapshot,
        reader: createStitchesCompanionReader(), knowledgeBaseId: STITCHES_KB_ID, consent: { sharePreparationSummary: true } });
      preparation = {
        basis: companionBasis(snapshot),
        sharedSummary: await tools.execute("inspect_project", {}),
        makingSummary: snapshot.makingPlan ? await tools.execute("inspect_making", {}) : null,
      };
    } catch { /* Historical runs stay readable during source outages. No model call or fixture fallback. */ }
    return guestResponse(request, identity, { runs, preparation, enabled: companionFreeAuthorized() });
  } catch (error) { return agentErrorResponse(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    assertSameOriginJson(request);
    const identity = guestForRequest(request), { id } = await context.params, input = startAgentRunSchema.parse(await boundedAgentJson(request)), store = getLocalGuestStore();
    const replay = store.replayAgentRun(identity.ownerId, id, input);
    if (replay) return guestResponse(request, identity, { run: publicAgentRun(replay), replayed: true });
    const snapshot = await loadOwnedAgentSnapshot(store, identity.ownerId, id);
    if (!sameAgentBasis(input.expectedBasis, companionBasis(snapshot))) throw new CompanionAgentError("stale", "The saved project, exact source or history changed. Refresh the consent preview.");
    const isMakingTask = input.task === "step_guidance" || input.task === "troubleshoot_step";
    if (isMakingTask && !snapshot.makingPlan) {
      throw new CompanionAgentError("missing_knowledge", "The construction study plan is unavailable for this candidate. Manual making remains available.");
    }
    resolveAgentSelection(snapshot, input.task, input.selection);
    const run = store.startAgentRun(identity.ownerId, id, input);
    return guestResponse(request, identity, { run: publicAgentRun(run), replayed: false }, 201);
  } catch (error) { return agentErrorResponse(error); }
}
