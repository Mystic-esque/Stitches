import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Only the dedicated Stitches development dataset may receive this illustrative
// fixture. Dry-run is the default; --apply needs its own editor token.
const fixturePath = fileURLToPath(new URL("../fixtures/knowledge-graph.json", import.meta.url));
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
if (fixture.fixtureStatus !== "illustrative-not-for-cutting" || !Array.isArray(fixture.documents)) {
  throw new Error("Refusing to seed a fixture without its illustrative safety label.");
}
if (process.env.SANITY_PROJECT_ID !== "l4eeamth" || process.env.SANITY_DATASET !== "development") {
  throw new Error("Seeder is restricted to the dedicated l4eeamth/development dataset.");
}
const ids = fixture.documents.map((document) => document._id);
if (new Set(ids).size !== ids.length || ids.some((id) => typeof id !== "string" || !id)) {
  throw new Error("Seeder found duplicate or missing document IDs.");
}
if (!process.argv.includes("--apply")) {
  process.stdout.write(`Dry run: ${ids.length} illustrative records ready for l4eeamth/development. Pass --apply with SANITY_WRITE_TOKEN to create missing records.\n`);
  process.exit(0);
}
if (!process.env.SANITY_WRITE_TOKEN) throw new Error("SANITY_WRITE_TOKEN is required to seed the development dataset.");
const { createClient } = await import("@sanity/client");
const client = createClient({
  projectId: "l4eeamth", dataset: "development", apiVersion: "2026-09-28",
  token: process.env.SANITY_WRITE_TOKEN, useCdn: false,
});
for (const document of fixture.documents) {
  await client.createIfNotExists(document);
}
process.stdout.write(`Created or retained ${ids.length} illustrative records in l4eeamth/development. Nothing was written to production.\n`);
