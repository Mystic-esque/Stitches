import { SanityContextKnowledgeBase } from "../src/server/knowledge/context-mcp.ts";

// Read-only transport check against the pre-existing authorized organization
// endpoint. It is not evidence that a Stitches Knowledge Base exists.
const endpoint = new URL(process.env.SANITY_CONTEXT_MCP_URL || "https://invalid.local/");
if (endpoint.hostname !== "api.sanity.io") throw new Error("Expected the official Sanity Context host.");
const parts = endpoint.pathname.split("/").filter(Boolean);
const organizationId = parts[parts.indexOf("organizations") + 1];
const mcpName = parts[parts.indexOf("mcp") + 1];
const knowledgeBaseId = process.env.SANITY_KNOWLEDGE_BASE_ID;
const token = process.env.SANITY_ORGANIZATION_TOKEN;
if (!organizationId || !mcpName || !knowledgeBaseId || !token) throw new Error("Existing Context endpoint or organization credential is incomplete.");
const client = new SanityContextKnowledgeBase({ organizationId, mcpName, knowledgeBaseId, token });
const tools = await client.listTools();
if (!tools.includes("initial_context") || !tools.includes("knowledge_base_read")) throw new Error("Existing endpoint did not expose Knowledge Base tools.");
const outline = await client.initialContext();
process.stdout.write(`Live existing organization Context MCP responded; KB tools: ${tools.length}; outline characters: ${outline.text.length}. This is not a Stitches KB test.\n`);
