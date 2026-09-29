import graph from "../../../fixtures/knowledge-graph.json";
import type { PatternSnapshot } from "../../domain/knowledge/resolve-pattern";
import { createSanityKnowledgeRepository, fixtureKnowledgeRepository, type KnowledgeRepository } from "./repository";

export type WorktableKnowledgeSelection = {
  snapshot: PatternSnapshot;
  origin: "fixture" | "sanity-development" | "sanity-reviewed";
  canAcceptSample: boolean;
};

const FIXTURE_VERSION_ID = "pattern-version.everyday-blouse.0-1-0";

/** Live failure is never silently replaced by the fixture. */
export async function selectWorktableKnowledge(
  env: Record<string, string | undefined> = process.env,
  liveRepository?: KnowledgeRepository,
): Promise<WorktableKnowledgeSelection> {
  const selected = env.STITCHES_KNOWLEDGE_MODE || "fixture";
  if (selected === "fixture") {
    return {
      snapshot: await fixtureKnowledgeRepository(graph.documents).load(FIXTURE_VERSION_ID, "illustrative"),
      origin: "fixture",
      canAcceptSample: true,
    };
  }
  if (selected !== "sanity-development" && selected !== "sanity-reviewed")
    throw new Error("Unrecognized Stitches knowledge mode.");
  const requiredDataset = selected === "sanity-development" ? "development" : "production";
  if (env.SANITY_PROJECT_ID !== "l4eeamth" || env.SANITY_DATASET !== requiredDataset)
    throw new Error("The selected Stitches knowledge mode requires its dedicated project and dataset.");
  const versionId = env.STITCHES_PATTERN_VERSION_ID || FIXTURE_VERSION_ID;
  if (!/^[a-zA-Z0-9._-]{1,120}$/.test(versionId)) throw new Error("Invalid Stitches pattern version ID.");
  const repository = liveRepository ?? createSanityKnowledgeRepository(env);
  const mode = selected === "sanity-development" ? "illustrative" : "reviewed";
  const snapshot = await repository.load(versionId, mode);
  if (snapshot.versionId !== versionId || snapshot.mode !== mode)
    throw new Error("Sanity returned a knowledge snapshot for the wrong version or review mode.");
  return {
    snapshot,
    origin: selected,
    canAcceptSample: false,
  };
}
