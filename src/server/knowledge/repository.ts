import { createClient, type SanityClient } from "@sanity/client";
import { KnowledgeError, resolvePatternSnapshot, type KnowledgeMode, type PatternSnapshot } from "../../domain/knowledge/resolve-pattern";

// Queries are fixed and parameterized. No caller or model can supply GROQ text.
export const VERSION_QUERY = '*[_type == "patternVersion" && _id == $versionId][0]';
export const RELATED_QUERY = '*[_type in ["patternPiece", "seamConnection", "adjustmentRule", "instructionStep", "fabricRequirement"] && patternVersion._ref == $versionId][0...300]';
export const PATTERN_QUERY = '*[_type == "pattern" && _id == $patternId][0]';
export const SOURCES_QUERY = '*[_type == "sourceDocument"][0...195]';

export type KnowledgeRepository = {
  load(versionId: string, mode: KnowledgeMode): Promise<PatternSnapshot>;
};

export function fixtureKnowledgeRepository(documents: unknown): KnowledgeRepository {
  return { async load(versionId, mode) { return resolvePatternSnapshot(documents, versionId, mode); } };
}

type QueryClient = Pick<SanityClient, "fetch">;

export function sanityKnowledgeRepository(client: QueryClient): KnowledgeRepository {
  return {
    async load(versionId, mode) {
      if (!/^[a-zA-Z0-9._-]{1,120}$/.test(versionId)) throw new KnowledgeError("invalid", "Invalid pattern version identifier.");
      const version = await client.fetch<Record<string, unknown> | null>(VERSION_QUERY, { versionId });
      if (!version) throw new KnowledgeError("missing", `Pattern version ${versionId} was not found.`);
      const patternId = (version.pattern as { _ref?: unknown } | undefined)?._ref;
      if (typeof patternId !== "string") throw new KnowledgeError("invalid", "Pattern version has no pattern reference.");
      const [pattern, related, sources] = await Promise.all([
        client.fetch<Record<string, unknown> | null>(PATTERN_QUERY, { patternId }),
        client.fetch<unknown[]>(RELATED_QUERY, { versionId }),
        client.fetch<unknown[]>(SOURCES_QUERY),
      ]);
      if (!pattern) throw new KnowledgeError("missing", `Pattern ${patternId} was not found.`);
      if (!Array.isArray(related) || !Array.isArray(sources)) throw new KnowledgeError("invalid", "Sanity returned a malformed knowledge response.");
      if (related.length >= 300 || sources.length >= 195) throw new KnowledgeError("invalid", "Knowledge query hit its safety limit; narrow this pattern version before use.");
      return resolvePatternSnapshot([version, pattern, ...related, ...sources], versionId, mode);
    },
  };
}

export function createSanityKnowledgeRepository(env: NodeJS.ProcessEnv = process.env): KnowledgeRepository {
  const projectId = env.SANITY_PROJECT_ID;
  const dataset = env.SANITY_DATASET;
  if (!projectId || !dataset) throw new KnowledgeError("missing", "SANITY_PROJECT_ID and SANITY_DATASET are required for live knowledge retrieval.");
  const client = createClient({
    projectId,
    dataset,
    apiVersion: env.SANITY_API_VERSION || "2026-09-28",
    useCdn: false,
    perspective: "published",
    token: env.SANITY_READ_TOKEN || undefined,
  });
  return sanityKnowledgeRepository(client);
}
