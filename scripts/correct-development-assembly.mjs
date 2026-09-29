import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
if (projectId !== "l4eeamth" || dataset !== "development") {
  throw new Error("Editorial correction is restricted to Stitches l4eeamth/development.");
}
if (process.argv.some((arg) => arg.startsWith("--") && arg !== "--apply")) {
  throw new Error("Only --apply is supported.");
}
if (!process.env.SANITY_WRITE_TOKEN) throw new Error("A dedicated Stitches development write token is required.");

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.SANITY_API_VERSION || "2026-09-28",
  useCdn: false,
  perspective: "published",
  token: process.env.SANITY_WRITE_TOKEN,
});
const id = "step.neckline";
const before = await client.getDocument(id);
if (before?._type !== "instructionStep" || before.patternVersion?._ref !== "pattern-version.everyday-blouse.0-1-0" || before.stepKey !== "finish-neckline") {
  throw new Error("The expected illustrative neckline step was not found; no write was made.");
}
if (!Array.isArray(before.prerequisites) || before.prerequisites.map((item) => item._ref).join(",") !== "step.shoulders") {
  throw new Error("The expected shoulder prerequisite changed; no write was made.");
}
const desiredRefs = ["piece.front", "piece.back"];
const currentRefs = Array.isArray(before.pieces) ? before.pieces.map((item) => item._ref) : [];
if (currentRefs.length && currentRefs.join(",") !== desiredRefs.join(",")) {
  throw new Error("The neckline step has unexpected piece links; no write was made.");
}
if (currentRefs.join(",") === desiredRefs.join(",")) {
  process.stdout.write("Development correction already present: neckline step links front and back bodices. No write.\n");
} else if (!process.argv.includes("--apply")) {
  process.stdout.write("Dry run: would link the illustrative neckline step to the front and back bodice records in l4eeamth/development. No write.\n");
} else {
  await client.patch(id).ifRevisionId(before._rev).set({
    pieces: desiredRefs.map((ref, index) => ({ _key: index === 0 ? "front" : "back", _type: "reference", _ref: ref })),
  }).commit();
  const after = await client.getDocument(id);
  if (after?.pieces?.map((item) => item._ref).join(",") !== desiredRefs.join(",")) {
    throw new Error("Patch returned, but the published step did not verify with the expected piece links.");
  }
  process.stdout.write("Verified development correction: neckline step now links front and back bodices; no production write.\n");
}
