// A narrow adapter for Sanity's documented, read-only Knowledge Base MCP tools.
// It does not accept arbitrary tool names, URLs, or model-generated API requests.
export class ContextError extends Error {
  readonly code: "config" | "transport" | "protocol" | "tool";
  constructor(code: "config" | "transport" | "protocol" | "tool", message: string) {
    super(message);
    this.name = "ContextError";
    this.code = code;
  }
}

export type ContextConfiguration = { organizationId: string; mcpName: string; knowledgeBaseId: string; token: string };
export type ContextResult = { text: string; tool: "initial_context" | "knowledge_base_read"; knowledgeBaseId: string; paths: string[] };
type RpcEnvelope = { jsonrpc?: string; id?: number; error?: { code?: number; message?: string }; result?: unknown };
type Fetcher = typeof fetch;

export function contextConfiguration(env: Record<string, string | undefined> = process.env): ContextConfiguration {
  const organizationId = env.SANITY_CONTEXT_ORG_ID;
  const mcpName = env.SANITY_CONTEXT_MCP_NAME;
  const knowledgeBaseId = env.SANITY_CONTEXT_KB_ID;
  const token = env.SANITY_CONTEXT_TOKEN;
  if (!organizationId || !mcpName || !knowledgeBaseId || !token) {
    throw new ContextError("config", "Sanity Context organization, MCP name, Knowledge Base ID, and organization token are required.");
  }
  if (!/^[a-z0-9-]{1,64}$/.test(mcpName) || !/^[a-zA-Z0-9]+$/.test(organizationId) || !/^kb[a-zA-Z0-9-]+$/.test(knowledgeBaseId)) {
    throw new ContextError("config", "Sanity Context identifiers have invalid formats.");
  }
  return { organizationId, mcpName, knowledgeBaseId, token };
}

export class SanityContextKnowledgeBase {
  private nextId = 0;
  private readonly config: ContextConfiguration;
  private readonly fetcher: Fetcher;
  constructor(config: ContextConfiguration, fetcher: Fetcher = fetch) {
    this.config = config;
    this.fetcher = fetcher;
  }

  private async rpc(method: "tools/list" | "tools/call", params?: Record<string, unknown>): Promise<unknown> {
    const id = ++this.nextId;
    const url = `https://api.sanity.io/v1/context/organizations/${this.config.organizationId}/mcp/${this.config.mcpName}`;
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }),
        signal: AbortSignal.timeout(12_000),
        cache: "no-store",
      });
    } catch (error) {
      throw new ContextError("transport", `Sanity Context request failed: ${error instanceof Error ? error.message : "network error"}`);
    }
    if (!response.ok) throw new ContextError("transport", `Sanity Context returned HTTP ${response.status}.`);
    const body = await response.text();
    if (body.length > 1_000_000) throw new ContextError("protocol", "Sanity Context response exceeded the size limit.");
    let envelope: RpcEnvelope;
    try {
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const messages = body.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => JSON.parse(line.slice(5)) as RpcEnvelope);
        envelope = messages.find((item) => item.id === id) ?? {};
      } else {
        envelope = JSON.parse(body) as RpcEnvelope;
      }
    } catch {
      throw new ContextError("protocol", "Sanity Context returned an invalid JSON-RPC response.");
    }
    if (envelope.id !== id || envelope.jsonrpc !== "2.0") throw new ContextError("protocol", "Sanity Context response ID or version did not match.");
    if (envelope.error) throw new ContextError("tool", `Sanity Context error ${envelope.error.code ?? "unknown"}: ${envelope.error.message ?? "unknown"}`);
    return envelope.result;
  }

  async listTools(): Promise<string[]> {
    const result = await this.rpc("tools/list") as { tools?: { name?: unknown }[] };
    if (!Array.isArray(result?.tools)) throw new ContextError("protocol", "Sanity Context did not return a tool list.");
    return result.tools.map((tool) => tool.name).filter((name): name is string => typeof name === "string");
  }

  private async call(name: ContextResult["tool"], args: Record<string, unknown>): Promise<string> {
    const result = await this.rpc("tools/call", { name, arguments: args }) as { isError?: boolean; content?: { type?: string; text?: unknown }[] };
    if (result?.isError) throw new ContextError("tool", `Sanity Context ${name} returned a tool error.`);
    const text = result?.content?.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text as string).join("\n");
    if (!text) throw new ContextError("protocol", `Sanity Context ${name} returned no text content.`);
    return text;
  }

  async initialContext(): Promise<ContextResult> {
    return { tool: "initial_context", knowledgeBaseId: this.config.knowledgeBaseId, paths: [], text: await this.call("initial_context", {}) };
  }

  async readPaths(paths: string[]): Promise<ContextResult> {
    if (paths.length < 1 || paths.length > 20 || paths.some((path) => !path || path.length > 300)) {
      throw new ContextError("config", "Knowledge Base reads require 1–20 nonempty entry paths.");
    }
    return { tool: "knowledge_base_read", knowledgeBaseId: this.config.knowledgeBaseId, paths, text: await this.call("knowledge_base_read", { knowledgeBase: this.config.knowledgeBaseId, paths }) };
  }
}
