import { describe, expect, it } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { createGeminiSession } from "./gemini-session";
import { illustrativeShoulderGeometry } from "./illustrative-geometry";
import { runFitLoop } from "./fit-loop";
import { contextConfiguration, SanityContextKnowledgeBase } from "../knowledge/context-mcp";
import { selectWorktableKnowledge } from "../knowledge/worktable-selection";

// Explicit one-off, zero-paid-budget integration probe. The ordinary suite skips it.
describe.skipIf(process.env.STITCHES_LIVE_AGENT_PROBE !== "true")("live Stitches Context + Gemini agent", () => {
  it("uses the actual KB, registered context and deterministic draft tools", async () => {
    process.loadEnvFile(".env.local");
    if (process.env.STITCHES_GEMINI_ZERO_COST_CONFIRMED !== "true") throw new Error("The user-confirmed Gemini Free tier flag is required for a live probe.");
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("The local Gemini key is missing.");
    const config = contextConfiguration();
    if (config.organizationId !== "o3i0aqvqq" || config.mcpName !== "stitches-garments" || config.knowledgeBaseId !== "kbkvu1vrPsLG")
      throw new Error("The live probe requires the scoped Stitches Knowledge Base.");
    const selected = await selectWorktableKnowledge({ ...process.env, STITCHES_KNOWLEDGE_MODE: "sanity-development" });
    if (selected.origin !== "sanity-development" || selected.snapshot.mode !== "illustrative") throw new Error("The live development graph was not selected.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100_000);
    const client = new GoogleGenAI({ apiKey: key });
    let modelTurn = 0;
    const generate: Parameters<typeof createGeminiSession>[0]["generate"] = async (parameters) => {
      modelTurn += 1;
      const started = Date.now();
      try {
        const response = await client.models.generateContent(parameters);
        console.log(JSON.stringify({ modelTurn, succeeded: true, functionCalls: response.functionCalls?.map((call) => call.name) ?? [], elapsedMs: Date.now() - started }));
        return response;
      }
      catch (error) {
        const problem = error as { status?: unknown; name?: unknown; message?: unknown };
        const safeMessage = typeof problem.message === "string" ? problem.message.replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]").slice(0, 240) : "unavailable";
        console.log(JSON.stringify({ modelTurn, providerStatus: problem.status ?? null, providerName: problem.name ?? null, providerMessage: safeMessage, elapsedMs: Date.now() - started }));
        throw error;
      }
    };
    try {
      const result = await runFitLoop({
        request: "For the Everyday blouse, please preview adding 10 millimeters to each shoulder and explain the affected pieces. Do not claim it is ready to cut.",
        snapshot: selected.snapshot,
        geometry: illustrativeShoulderGeometry(selected.snapshot.versionId),
        knowledgeBaseId: config.knowledgeBaseId,
        knowledgePaths: ["fit_style_operations"],
        reader: new SanityContextKnowledgeBase(config),
        session: createGeminiSession({ apiKey: key, model: "gemini-3.5-flash-lite", request: "For the Everyday blouse, please preview adding 10 millimeters to each shoulder and explain the affected pieces. Do not claim it is ready to cut.", generate }),
        signal: controller.signal,
      });
      console.log(JSON.stringify({ live: true, status: result.status, tools: result.evidence.toolSequence, readiness: result.draft?.readiness ?? "none", contextPath: result.evidence.paths[0] }));
      expect(result.evidence.paths).toEqual(["fit_style_operations"]);
      expect(result.evidence.toolSequence).toContain("get_pattern_context");
      expect(result.evidence.toolSequence).toContain("draft_shoulder_spike");
      expect(result.status).toBe("incomplete");
      expect(result.draft?.readiness).toBe("incomplete");
    } finally {
      clearTimeout(timeout);
    }
  }, 120_000);
});
