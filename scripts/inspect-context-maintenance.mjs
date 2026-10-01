// Read-only inspection through the documented Sanity Context CLI.
// Credentials stay in the child environment; only selected metadata is emitted.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const kbId = 'kbkvu1vrPsLG';
if (process.env.SANITY_CONTEXT_ORG_ID !== 'o3i0aqvqq' ||
    process.env.SANITY_CONTEXT_KB_ID !== kbId ||
    process.env.SANITY_CONTEXT_MCP_NAME !== 'stitches-garments' ||
    !process.env.SANITY_CONTEXT_TOKEN) throw new Error('Expected scoped Stitches Context configuration.');

const secretValues = Object.entries(process.env)
  .filter(([key, value]) => /TOKEN|API_KEY/.test(key) && value)
  .map(([, value]) => value);
function redact(text) {
  for (const value of secretValues) text = text.replaceAll(value, '[redacted]');
  return text;
}
function select(value, keys) {
  return Object.fromEntries(keys.filter((key) => value?.[key] !== undefined).map((key) => [key, value[key]]));
}

async function cli(args) {
  const result = await new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve('node_modules/sanity/bin/sanity'), ...args], {
      env: { ...process.env, SANITY_AUTH_TOKEN: process.env.SANITY_CONTEXT_TOKEN, NO_COLOR: '1' },
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      cwd: tmpdir(),
    });
    let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, 180_000);
    child.stdout.on('data', (data) => { stdout += data; if (stdout.length > 1_000_000) child.kill(); });
    child.stderr.on('data', (data) => { stderr += data; if (stderr.length > 100_000) child.kill(); });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); done({ code, timedOut, stdout, stderr }); });
  });
  if (result.code !== 0 || result.timedOut) {
    return { ok: false, exitCode: result.code, timedOut: result.timedOut,
      error: redact(result.stderr).replace(/\x1b\[[0-9;]*m/g, '').slice(0, 1800) };
  }
  try { return { ok: true, value: JSON.parse(result.stdout) }; }
  catch { return { ok: false, error: 'CLI output was not JSON; no raw response emitted.' }; }
}

const [kb, imports] = await Promise.all([
  cli(['context', 'get', kbId, '--json']),
  cli(['context', 'imports', 'list', kbId, '--json']),
]);
const report = {
  observedAt: new Date().toISOString(), readOnly: true,
  knowledgeBase: kb.ok ? select(kb.value, ['publicId', 'title', 'organizationId', 'state', 'activeJobId',
    'pendingChanges', 'refreshEnabled', 'refreshFrequency', 'openIssueCount', 'instructionCount', 'updatedAt']) : kb,
  imports: imports.ok && Array.isArray(imports.value) ? imports.value.map((entry) => select(entry,
    ['id', 'name', 'sourceKind', 'status', 'sourceCount', 'createdAt'])) : imports,
};
console.log(redact(JSON.stringify(report, null, 2)));
if (!kb.ok || !imports.ok) process.exitCode = 1;
