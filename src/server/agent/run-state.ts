import type { AgentRun } from "../../domain/agent-run";
import type { ModelFeedback, ModelTurn } from "./fit-loop";
import type { GeminiSessionState } from "./gemini-session";

/** Server-only. Never serialize the provider transcript through HTTP or shared Sanity. */
export type PrivateAgentRun = AgentRun & { session?: GeminiSessionState; pendingResponse?: ModelTurn;
  feedback?: ModelFeedback; callIds: string[]; leaseId?: string; leaseUntil?: number; startedMs?: number };
export function publicAgentRun(run: PrivateAgentRun): AgentRun {
  const { session, pendingResponse, feedback, callIds, leaseId, leaseUntil, startedMs, ...visible } = run;
  void session; void pendingResponse; void feedback; void callIds; void leaseId; void leaseUntil; void startedMs;
  return visible;
}
