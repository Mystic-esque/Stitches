import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { SanityContextKnowledgeBase, contextConfiguration } from '../src/server/knowledge/context-mcp.ts';
const config = contextConfiguration();
if (config.organizationId !== 'o3i0aqvqq' || config.mcpName !== 'stitches-garments' || config.knowledgeBaseId !== 'kbkvu1vrPsLG') throw Error('Wrong Context scope.');
const reader = new SanityContextKnowledgeBase(config), outline = await reader.initialContext();
const paths = outline.text.split(/\r?\n/).map(line => line.match(/^([a-z0-9_]+(?:\/[a-z0-9_]+)*)(?:\s+\[[^\]]+\])?\s*$/)?.[1]).filter(Boolean);
if (!paths.length || paths.length > 20) throw Error('Unrecognized or oversized outline.');
const directory = new URL('../evidence/context-construction-review/', import.meta.url); await mkdir(directory, { recursive: true });
const snapshots = [];
async function snapshot(name, text) {
  const sha256 = createHash('sha256').update(text).digest('hex'), filename = `${name.replaceAll('/', '-')}-${sha256.slice(0, 16)}.md`;
  try { await writeFile(new URL(filename, directory), text, { flag: 'wx' }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  return { path: name, sha256, file: `evidence/context-construction-review/${filename}`, characters: text.length };
}
snapshots.push(await snapshot('outline', outline.text));
for (const path of paths) { const entry = await reader.readPaths([path]); snapshots.push(await snapshot(path, entry.text)); }
const report = { capturedAt: new Date().toISOString(), liveMcpRead: true, knowledgeBaseId: config.knowledgeBaseId,
  paths, snapshots, editorialQualityNotYetQualified: true, providerRequests: 0, sanityWrites: 0 };
await writeFile(new URL('capture.json', directory), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
