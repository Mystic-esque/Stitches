import { z } from "zod";

const fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
export const agentBasisSchema = z.object({ projectId: z.uuid(), projectSequence: z.number().int().positive(), projectHash: fingerprint,
  catalogFingerprint: fingerprint, diagnosticFingerprint: fingerprint, historySequence: z.number().int().min(0), historyHash: fingerprint }).strict();
// No free text: the initial consent envelope cannot accidentally send private notes.
export const agentTasks = ["next_preparation", "understand_pieces", "review_gaps"] as const;
export type AgentTask = typeof agentTasks[number];
export const agentTaskText: Record<AgentTask, string> = {
  next_preparation: "What should I prepare next for this saved project, and why?",
  understand_pieces: "Explain the source-listed pieces and one useful thing to check before cutting.",
  review_gaps: "Review what is missing or unqualified in this project and suggest one safe next preparation action.",
};
export const startAgentRunSchema = z.object({ idempotencyKey: z.uuid(), expectedBasis: agentBasisSchema,
  task: z.enum(agentTasks), consent: z.object({ version: z.literal("preparation-v1"), sharePreparationSummary: z.literal(true) }).strict() }).strict();
export const agentActionSchema = z.object({ action: z.enum(["advance", "resume", "cancel"]) }).strict();
export type AgentBasis = z.infer<typeof agentBasisSchema>;
export type StartAgentRunInput = z.infer<typeof startAgentRunSchema>;
export type AgentRunStatus = "ready" | "requesting" | "response_ready" | "processing" | "completed" | "quota" |
  "missing_knowledge" | "unknown_outcome" | "cancelled" | "stale" | "failed" | "limit" | "budget";
export type AgentCheckpoint = { sequence: number; event: "request_reserved" | "response_saved" | "tool_completed" | "completed" | "stopped" | "resumed";
  at: string; request: number; tool?: string };
export type AgentRun = { id: string; projectId: string; basis: AgentBasis; task: AgentTask; consentVersion: "preparation-v1";
  model: "gemini-3.5-flash-lite"; status: AgentRunStatus; requests: number; activeMs: number; checkpoints: AgentCheckpoint[];
  tools: string[]; knowledgeHash?: string; text?: string; message?: string; createdAt: string; updatedAt: string;
  modelTextVerified: false; projectChanged: false; capability: "plan_only" };
export const agentRunIsActive = (status: AgentRunStatus) => ["ready", "requesting", "response_ready", "processing"].includes(status);
export const agentRunCanResume = (run: AgentRun) => ["quota", "missing_knowledge"].includes(run.status) &&
  (run.requests < 4 || run.status === "missing_knowledge") && run.activeMs < 120_000;
export const sameAgentBasis = (a: AgentBasis, b: AgentBasis) => Object.keys(agentBasisSchema.shape).every((key) => a[key as keyof AgentBasis] === b[key as keyof AgentBasis]);
