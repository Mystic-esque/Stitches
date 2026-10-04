import { agentTaskText, sameAgentBasis } from "../../domain/agent-run";
import type { GuestStore } from "../projects/guest-store";
import { CompanionAgentError, companionBasis, createCompanionTools, STITCHES_KB_ID, type CompanionSnapshot } from "./companion-tools";
import { GeminiAdapterError, createGeminiSession, type DurableGeminiSession, type GeminiSessionOptions } from "./gemini-session";
import type { PrivateAgentRun } from "./run-state";
import type { ContextResult } from "../knowledge/context-mcp";

export function companionFreeAuthorized(env: Record<string, string | undefined> = process.env): boolean {
  return env.STITCHES_COMPANION_AGENT_ENABLED === "true" && env.STITCHES_GEMINI_ZERO_COST_CONFIRMED === "true" &&
    env.STITCHES_KNOWLEDGE_MODE === "sanity-development" && env.GEMINI_MODEL === "gemini-3.5-flash-lite" && Boolean(env.GEMINI_API_KEY);
}

/** One durable continuation per HTTP request. No background promises, automatic retries or model writes. */
export async function advanceCompanionRun(input: {
  store: GuestStore; ownerId: string; projectId: string; runId: string; freeAuthorized: boolean;
  loadSnapshot: () => Promise<CompanionSnapshot>; reader: { initialContext?: () => Promise<ContextResult>; readPaths: (paths: string[]) => Promise<ContextResult> };
  createSession?: (options: Pick<GeminiSessionOptions, "request" | "state">) => DurableGeminiSession;
  env?: Record<string, string | undefined>; now?: () => number;
}): Promise<PrivateAgentRun> {
  const now = input.now ?? Date.now;
  let run = input.store.getAgentRun(input.ownerId, input.projectId, input.runId, now());
  if (!["ready", "response_ready"].includes(run.status)) return run;
  if (run.status === "ready" && !input.freeAuthorized) return input.store.claimAgentRun(input.ownerId, input.projectId, input.runId, false, now());
  run = input.store.claimAgentRun(input.ownerId, input.projectId, input.runId, input.freeAuthorized, now());
  if (!run.leaseId) return run;
  const leaseId = run.leaseId;
  const signal = AbortSignal.timeout(Math.max(1, (run.leaseUntil ?? now()) - now()));
  async function bounded<T>(promise: Promise<T>): Promise<T> {
    if (signal.aborted) throw new CompanionAgentError("limit", "The active-time limit expired. Manual preparation remains available.");
    let onAbort!: () => void;
    const aborted = new Promise<never>((_, reject) => { onAbort = () => reject(new CompanionAgentError("limit", "The active-time limit expired. Manual preparation remains available.")); signal.addEventListener("abort", onAbort, { once: true }); });
    try { return await Promise.race([promise, aborted]); }
    finally { signal.removeEventListener("abort", onAbort); }
  }
  async function current() {
    const value = input.store.getAgentRun(input.ownerId, input.projectId, input.runId, now());
    if (value.leaseId !== leaseId) throw new CompanionAgentError(value.status === "stale" ? "stale" : "cancelled", "The saved run no longer permits this operation.");
    const snapshot = await bounded(input.loadSnapshot());
    if (!sameAgentBasis(run.basis, companionBasis(snapshot))) throw new CompanionAgentError("stale", "The exact source, saved project or history changed. Review before a new run.");
    return snapshot;
  }
  try {
    const isMakingTask = run.task === "step_guidance" || run.task === "troubleshoot_step";
    const snapshot = await current();
    if (isMakingTask && !snapshot.makingPlan) {
      throw new CompanionAgentError("missing_knowledge", "The construction study plan is unavailable for this candidate. Manual making remains available.");
    }
    const tools = createCompanionTools({ snapshot, loadCurrent: current, reader: input.reader,
      knowledgeBaseId: STITCHES_KB_ID, consent: { sharePreparationSummary: true },
      topic: isMakingTask ? "construction" : "planning", signal });
    if (!run.pendingResponse) {
      const session = (input.createSession ?? ((options) => createGeminiSession({ ...options, purpose: "companion",
        task: run.task,
        model: "gemini-3.5-flash-lite", apiKey: (input.env ?? process.env).GEMINI_API_KEY ?? "" })))(
        { request: agentTaskText[run.task], state: run.session });
      const response = await session.next(run.feedback, signal);
      const state = session.exportState();
      if (JSON.stringify(state).length > 128_000 || JSON.stringify(response).length > 16_000)
        throw new CompanionAgentError("invalid", "The provider response exceeded its checkpoint bound.");
      run.pendingResponse = response; run.session = state; run.status = "processing";
      run = input.store.checkpointAgentRun(input.ownerId, run, "response_saved", false, now());
      if (run.leaseId !== leaseId) return run;
    }
    await tools.assertCurrent();
    const response = run.pendingResponse!;
    if (!Array.isArray(response.calls) || response.calls.length > 1) throw new CompanionAgentError("unsafe_tool", "Only one registered read tool is allowed per request.");
    const expectedSequence = isMakingTask
      ? ["inspect_project", "inspect_making", "retrieve_context"]
      : ["inspect_project", "resolve_exact_graph", "retrieve_context"];
    if (response.calls.length) {
      const call = response.calls[0], expected = expectedSequence[run.tools.length];
      if (!call || typeof call.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(call.id) || run.callIds.includes(call.id) || call.name !== expected)
        throw new CompanionAgentError("unsafe_tool", "Repeated, out-of-order or unregistered tool calls are refused.");
      const result = await bounded(tools.execute(call.name, call.args));
      run.feedback = { id: call.id, name: call.name, response: result };
      run.callIds.push(call.id); run.tools.push(call.name);
      if (call.name === "retrieve_context") run.knowledgeHash = String(result.knowledgeHash);
      delete run.pendingResponse; run.status = run.requests >= 4 ? "limit" : "ready";
      if (run.status === "limit") run.message = "The model used its four requests without completing an explanation. No project was changed.";
      return input.store.checkpointAgentRun(input.ownerId, run, "tool_completed", true, now(), call.name);
    }
    if (run.tools.join(",") !== expectedSequence.join(",") || !run.knowledgeHash)
      throw new CompanionAgentError("invalid", "The model answered before all three required evidence reads. That answer is not accepted.");
    const text = typeof response.text === "string" ? response.text.trim() : "";
    if (!text || text.length > 1600) throw new CompanionAgentError("invalid", "The model returned an empty or oversized insight.");
    const refreshedKnowledge = await bounded(tools.execute("retrieve_context", {}));
    if (refreshedKnowledge.knowledgeHash !== run.knowledgeHash)
      throw new CompanionAgentError("stale", "The served Knowledge Base changed after the model read it. Review the new evidence before another run.");
    await tools.assertCurrent();
    run.text = text; run.status = "completed"; delete run.pendingResponse; delete run.feedback;
    return input.store.checkpointAgentRun(input.ownerId, run, "completed", true, now());
  } catch (error) {
    const latest = input.store.getAgentRun(input.ownerId, input.projectId, input.runId, now());
    if (latest.leaseId !== leaseId) return latest;
    run = { ...latest };
    if (error instanceof GeminiAdapterError) {
      run.status = error.code === "quota" ? "quota" : ["provider", "timeout", "cancelled"].includes(error.code) ? "unknown_outcome" : "failed";
      run.message = run.status === "unknown_outcome" ? "No acknowledged provider response. Usage may have been consumed; automatic retry is prohibited. Use manual preparation." : error.message;
    } else if (error instanceof CompanionAgentError) {
      run.status = error.code === "stale" ? "stale" : error.code === "missing_knowledge" ? "missing_knowledge" : error.code === "limit" ? "limit" : "failed";
      run.message = error.message;
    } else {
      run.status = run.pendingResponse ? "missing_knowledge" : "unknown_outcome";
      run.message = run.pendingResponse ? "An acknowledged response is saved, but source inspection failed. Manual preparation remains available." : "The operation stopped without an acknowledged response; it will not be retried automatically.";
    }
    return input.store.checkpointAgentRun(input.ownerId, run, "stopped", true, now());
  }
}
