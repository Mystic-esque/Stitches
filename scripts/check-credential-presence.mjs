const names = [
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_READ_TOKEN",
  "SANITY_WRITE_TOKEN",
  "SANITY_CONTEXT_ORG_ID",
  "SANITY_CONTEXT_MCP_NAME",
  "SANITY_CONTEXT_KB_ID",
  "SANITY_CONTEXT_TOKEN",
  "SANITY_ORGANIZATION_TOKEN",
  "SANITY_API_WRITE_TOKEN",
  "SANITY_CONTEXT_MCP_URL",
  "SANITY_KNOWLEDGE_BASE_ID",
];
for (const name of names) process.stdout.write(`${name}: ${Boolean(process.env[name]) ? "present" : "missing"}\n`);
