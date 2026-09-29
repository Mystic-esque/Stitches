import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createGeminiSession, GeminiAdapterError } from "@/server/agent/gemini-session";
import { FitLoopError } from "@/server/agent/fit-loop";
import { FitPreviewError, previewDevelopmentFit } from "@/server/agent/preview-fit";
import { contextConfiguration, SanityContextKnowledgeBase } from "@/server/knowledge/context-mcp";
import { selectWorktableKnowledge } from "@/server/knowledge/worktable-selection";
import { getDemoProject } from "@/server/projects/demo-store";

export const runtime = "nodejs";

function matchesToken(given: string, expected: string): boolean {
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  // Deliberately off by default, including in a local production build.
  if (process.env.STITCHES_AGENT_PREVIEW_ENABLED !== "true" || process.env.STITCHES_GEMINI_ZERO_COST_CONFIRMED !== "true" ||
    process.env.STITCHES_KNOWLEDGE_MODE !== "sanity-development")
    return NextResponse.json({ error: { code: "disabled", message: "The development agent preview is not enabled." } }, { status: 503 });
  const token = process.env.STITCHES_AGENT_PREVIEW_TOKEN;
  if (!token || token.length < 32)
    return NextResponse.json({ error: { code: "disabled", message: "The development preview needs a server-only access token." } }, { status: 503 });
  if (!["127.0.0.1", "localhost"].includes(new URL(request.url).hostname))
    return NextResponse.json({ error: { code: "local-only", message: "The development preview is local-only." } }, { status: 403 });
  if (!matchesToken(request.headers.get("authorization") ?? "", `Bearer ${token}`))
    return NextResponse.json({ error: { code: "unauthorized", message: "A development preview token is required." } }, { status: 401 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  const cancel = () => controller.abort();
  request.signal.addEventListener("abort", cancel, { once: true });
  try {
    const config = contextConfiguration();
    const path = process.env.STITCHES_CONTEXT_SHOULDER_PATH;
    const key = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    if (!path || !path.startsWith("/") || path.length > 300 || !key || (model !== "gemini-3.8-flash" && model !== "gemini-3.7-flash"))
      throw new FitPreviewError("disabled", "A server-selected Knowledge Base path and permitted Gemini model are required.");
    const raw: unknown = await request.json().catch(() => null);
    const result = await previewDevelopmentFit(raw, {
      enabled: true,
      project: getDemoProject,
      knowledge: selectWorktableKnowledge,
      reader: new SanityContextKnowledgeBase(config),
      session: (makerRequest) => createGeminiSession({ apiKey: key, model, request: makerRequest }),
      knowledgeBaseId: config.knowledgeBaseId,
      knowledgePaths: [path],
      signal: controller.signal,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof FitPreviewError) {
      const status = error.code === "invalid" ? 400 : error.code === "stale" ? 409 : 503;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    if (error instanceof FitLoopError) {
      const status = error.code === "invalid" || error.code === "unsafe-tool" ? 422 : error.code === "cancelled" ? 408 : 503;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    if (error instanceof GeminiAdapterError) {
      const status = error.code === "cancelled" ? 408 : 503;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    return NextResponse.json({ error: { code: "unavailable", message: "The development preview could not be completed; no revision was changed." } }, { status: 503 });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", cancel);
  }
}
