import { createClient } from "@sanity/client";

if (process.env.SANITY_PROJECT_ID !== "l4eeamth" || process.env.SANITY_DATASET !== "development") {
  throw new Error("Probe is restricted to the dedicated Stitches development dataset.");
}
const client = createClient({ projectId: "l4eeamth", dataset: "development", apiVersion: "2026-09-28", useCdn: false, perspective: "published", token: process.env.SANITY_READ_TOKEN || undefined });
const count = await client.fetch('count(*[_type in ["sourceDocument", "pattern", "patternVersion", "patternPiece", "seamConnection", "adjustmentRule", "instructionStep", "fabricRequirement"]])');
if (!Number.isInteger(count) || count < 0) throw new Error("Sanity returned an invalid content count.");
process.stdout.write(`Live Stitches development dataset reachable; ${count} matching published knowledge records.\n`);
if (process.env.SANITY_WRITE_TOKEN) {
  const authenticated = createClient({ projectId: "l4eeamth", dataset: "development", apiVersion: "2026-09-28", useCdn: false, perspective: "raw", token: process.env.SANITY_WRITE_TOKEN });
  const rawCount = await authenticated.fetch('count(*[_type in ["sourceDocument", "pattern", "patternVersion", "patternPiece", "seamConnection", "adjustmentRule", "instructionStep", "fabricRequirement"]])');
  const draftCount = await authenticated.fetch('count(*[_id in path("drafts.**")])');
  const authenticatedPublished = authenticated.withConfig({ perspective: "published" });
  const publishedCount = await authenticatedPublished.fetch('count(*[_type in ["sourceDocument", "pattern", "patternVersion", "patternPiece", "seamConnection", "adjustmentRule", "instructionStep", "fabricRequirement"]])');
  process.stdout.write(`Authenticated raw records: ${rawCount}; authenticated published: ${publishedCount}; drafts: ${draftCount}.\n`);
}
