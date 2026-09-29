// Read-only verification of the served Stitches Context entry after an editorial correction.
// Run with Node 22+ type stripping and server-only environment variables. Never logs tokens or full entry text.
import { SanityContextKnowledgeBase } from "../src/server/knowledge/context-mcp.ts";

const config = {
  organizationId: process.env.SANITY_CONTEXT_ORG_ID,
  mcpName: process.env.SANITY_CONTEXT_MCP_NAME,
  knowledgeBaseId: process.env.SANITY_CONTEXT_KB_ID,
  token: process.env.SANITY_CONTEXT_TOKEN || process.env.SANITY_ORGANIZATION_TOKEN,
};

if (config.organizationId !== "o3i0aqvqq" || config.mcpName !== "stitches-garments" || config.knowledgeBaseId !== "kbkvu1vrPsLG" || !config.token) {
  throw new Error("Expected scoped Stitches Context configuration and an organization Viewer token.");
}

const context = new SanityContextKnowledgeBase(config);
const outline = await context.initialContext();
const relevantOutlineLines = outline.text.split(/\r?\n/).filter((line) => /fit|style|assembly|construction/i.test(line)).slice(0, 12);
console.log(JSON.stringify({ relevantOutlineLines }));
const result = await context.readPaths(["construction_sequence"]);
const hasNewRelation = /Finish the neckline[\s\S]{0,500}(?:piece\.front[\s\S]{0,150}piece\.back|Front bodice[\s\S]{0,150}Back bodice)/i.test(result.text);
const hasOldNoPieces = /Has no listed pattern pieces of its own/i.test(result.text);
const hasSequenceConflict = /step\.shoulders\s*[─-]+[►>]+\s*step\.neckline\s*[─-]+[►>]+\s*step\.sleeves/.test(result.text)
  && /no stated dependency on each other/i.test(result.text);

console.log(JSON.stringify({
  liveMcpRead: true,
  knowledgeBaseId: result.knowledgeBaseId,
  path: result.paths[0],
  hasNewRelation,
  hasOldNoPieces,
  hasSequenceConflict,
}));

if (!hasNewRelation || hasOldNoPieces) process.exitCode = 1;
