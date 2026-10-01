// Read-only check: exact Content Lake records do not imply maintained/served KB entries.
// This probe prints only brief outline matches, never credentials or complete KB text.
import { SanityContextKnowledgeBase } from '../src/server/knowledge/context-mcp.ts';

const config = {
  organizationId: process.env.SANITY_CONTEXT_ORG_ID,
  mcpName: process.env.SANITY_CONTEXT_MCP_NAME,
  knowledgeBaseId: process.env.SANITY_CONTEXT_KB_ID,
  token: process.env.SANITY_CONTEXT_TOKEN,
};
if (config.organizationId !== 'o3i0aqvqq' || config.mcpName !== 'stitches-garments' ||
    config.knowledgeBaseId !== 'kbkvu1vrPsLG' || !config.token) throw new Error('Expected scoped Stitches Context configuration.');
const context = new SanityContextKnowledgeBase(config);
const tools = await context.listTools();
if (!tools.includes('initial_context') || !tools.includes('knowledge_base_read')) throw new Error('Required KB tools are unavailable.');
const outline = await context.initialContext();
const matching = outline.text.split(/\r?\n/).filter((line) => /pucker|coats|seam|scrap|sandy|tina/i.test(line)).slice(0, 16);
console.log(JSON.stringify({ liveMcpRead: true, knowledgeBaseId: outline.knowledgeBaseId,
  outlineCharacters: outline.text.length, matchingOutlineLines: matching,
  containsNewDiagnosticMarker: /pucker|coats|scrap/i.test(outline.text),
  fullEntryAndKbMaintenanceNotVerified: true }));
