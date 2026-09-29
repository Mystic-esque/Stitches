// Key-presence and syntax check only. Never displays values or lengths.
import { readFileSync } from "node:fs";

process.loadEnvFile(".env.local");

const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
const keys = [
  "SANITY_PROJECT_ID", "SANITY_DATASET", "SANITY_READ_TOKEN", "SANITY_WRITE_TOKEN",
  "SANITY_CONTEXT_ORG_ID", "SANITY_CONTEXT_MCP_NAME", "SANITY_CONTEXT_KB_ID", "SANITY_CONTEXT_TOKEN",
  "GEMINI_API_KEY",
];
for (const key of keys) {
  const line = lines.find((entry) => entry.startsWith(`${key}=`));
  const value = process.env[key];
  const raw = line?.slice(key.length + 1).trim();
  const quoteSyntax = raw?.startsWith('"') ? (raw.endsWith('"') ? "balanced-double" : "unbalanced")
    : raw?.startsWith("'") ? (raw.endsWith("'") ? "balanced-single" : "unbalanced")
    : raw?.endsWith('"') || raw?.endsWith("'") ? "unbalanced" : "unquoted";
  const parsedCleanly = Boolean(value && value.trim() === value && !/^['"]|['"]$/.test(value));
  console.log(`${key}: ${line ? "line found" : "line missing"}; ${value ? "parsed present" : "parsed missing"}; ${quoteSyntax ?? "n/a"}; ${parsedCleanly ? "clean" : "check needed"}`);
}
