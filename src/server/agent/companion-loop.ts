import type { ModelFeedback, ModelSession } from "./fit-loop";
import { CompanionAgentError, type CompanionTool, type createCompanionTools } from "./companion-tools";

export type CompanionCheckpoint = { turn: number; event: "tool_completed" | "completed";
  tool?: CompanionTool; evidence: ReturnType<ReturnType<typeof createCompanionTools>["evidence"]> };

/** Read-only first slice. No keep, diagnostic writes, draft artifacts or inferred physical progress. */
export async function runCompanionLoop(input: {
  tools: ReturnType<typeof createCompanionTools>;
  session: ModelSession;
  authorizeModelRequest: (turn: number) => Promise<boolean>;
  checkpoint: (checkpoint: CompanionCheckpoint) => Promise<void>;
  signal?: AbortSignal;
}) {
  const completed = new Set<CompanionTool>(), callIds = new Set<string>();
  let feedback: ModelFeedback | undefined;
  for (let turn = 1; turn <= 4; turn++) {
    await input.tools.assertCurrent();
    if (input.signal?.aborted) throw new CompanionAgentError("cancelled", "The agent run was cancelled.");
    if (!await input.authorizeModelRequest(turn)) throw new CompanionAgentError("budget", "No free model request is authorized. Continue with manual preparation.");
    await input.tools.assertCurrent();
    const response = await input.session.next(feedback, input.signal);
    await input.tools.assertCurrent();
    if (!Array.isArray(response.calls) || response.calls.length > 1)
      throw new CompanionAgentError("unsafe_tool", "This first slice allows one read tool per model request.");
    if (!response.calls.length) {
      const hasBase = completed.has("inspect_project") && completed.has("retrieve_context");
      const hasEvidence = completed.has("resolve_exact_graph") || completed.has("inspect_making");
      if (!hasBase || !hasEvidence)
        throw new CompanionAgentError("missing_knowledge", "The agent did not inspect the project, exact records and actual KB. Its answer is not accepted.");
      const text = typeof response.text === "string" ? response.text.trim().slice(0, 1_600) : "";
      if (!text) throw new CompanionAgentError("invalid", "The agent returned no explanation.");
      const evidence = input.tools.evidence();
      await input.checkpoint({ turn, event: "completed", evidence });
      await input.tools.assertCurrent();
      return { status: "read_only_insight" as const, text, evidence, toolSequence: [...completed],
        modelTextVerified: false, projectChanged: false, manualPreparationAvailable: true };
    }
    const call = response.calls[0];
    if (!call || !/^[a-zA-Z0-9_-]{1,100}$/.test(call.id) || callIds.has(call.id) || completed.has(call.name as CompanionTool))
      throw new CompanionAgentError("unsafe_tool", "Repeated or invalid tool calls are refused.");
    const result = await input.tools.execute(call.name, call.args);
    callIds.add(call.id); completed.add(call.name as CompanionTool);
    await input.checkpoint({ turn, event: "tool_completed", tool: call.name as CompanionTool, evidence: input.tools.evidence() });
    await input.tools.assertCurrent();
    feedback = { id: call.id, name: call.name, response: result };
  }
  throw new CompanionAgentError("limit", "The agent reached the four-request limit. No project was changed.");
}
