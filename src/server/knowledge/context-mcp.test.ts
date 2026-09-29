import { describe, expect, it, vi } from "vitest";
import { contextConfiguration, ContextError, SanityContextKnowledgeBase } from "./context-mcp";

const configuration = { organizationId: "o3i0aqvqq", mcpName: "stitches-kb", knowledgeBaseId: "kb123", token: "test-token" };

function response(id: number, result: unknown, status = 200): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { status, headers: { "content-type": "application/json" } });
}

describe("Sanity Context Knowledge Base adapter", () => {
  it("requires a separate organization credential and real KB identifiers", () => {
    expect(() => contextConfiguration({ SANITY_CONTEXT_ORG_ID: "o3i0aqvqq" })).toThrowError(ContextError);
    expect(() => contextConfiguration({ SANITY_CONTEXT_ORG_ID: "o3i0aqvqq", SANITY_CONTEXT_MCP_NAME: "invalid name", SANITY_CONTEXT_KB_ID: "kb123", SANITY_CONTEXT_TOKEN: "secret" })).toThrow(/invalid formats/);
  });

  it("lists tools and reads actual returned text with bounded calls", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body));
      if (request.method === "tools/list") return response(request.id, { tools: [{ name: "initial_context" }, { name: "knowledge_base_read" }] });
      if (request.params.name === "initial_context") return response(request.id, { content: [{ type: "text", text: "Knowledge base id: kb123\n- fit/shoulder [core]" }] });
      if (request.params.name === "knowledge_base_read") return response(request.id, { content: [{ type: "text", text: "Shoulder source content" }] });
      throw new Error("Unexpected tool");
    });
    const client = new SanityContextKnowledgeBase(configuration, fetcher as typeof fetch);
    expect(await client.listTools()).toEqual(["initial_context", "knowledge_base_read"]);
    expect((await client.initialContext()).text).toContain("fit/shoulder");
    expect(await client.readPaths(["fit/shoulder"])).toEqual({ tool: "knowledge_base_read", knowledgeBaseId: "kb123", paths: ["fit/shoulder"], text: "Shoulder source content" });
    expect(fetcher).toHaveBeenCalledTimes(3);
    const options = fetcher.mock.calls[2][1] as RequestInit;
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-token" });
    expect(JSON.parse(String(options.body)).params.arguments).toEqual({ knowledgeBase: "kb123", paths: ["fit/shoulder"] });
  });

  it("refuses out-of-bounds reads and tool errors rather than inventing retrieval", async () => {
    const fetcher = vi.fn(async () => response(1, { isError: true, content: [{ type: "text", text: "entry missing" }] }));
    const client = new SanityContextKnowledgeBase(configuration, fetcher as typeof fetch);
    await expect(client.readPaths([])).rejects.toThrow(/1–20/);
    await expect(client.readPaths(Array.from({ length: 21 }, (_, index) => `entry-${index}`))).rejects.toThrow(/1–20/);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(client.readPaths(["missing"])).rejects.toThrow(/tool error/);
  });
});
