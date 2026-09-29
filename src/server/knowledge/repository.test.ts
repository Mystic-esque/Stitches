import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SanityClient } from "@sanity/client";
import { describe, expect, it, vi } from "vitest";
import { fixtureKnowledgeRepository, PATTERN_QUERY, RELATED_QUERY, sanityKnowledgeRepository, SOURCES_QUERY, VERSION_QUERY } from "./repository";

const versionId = "pattern-version.everyday-blouse.0-1-0";
type Row = Record<string, any>;

function rows(): Row[] {
  return structuredClone(JSON.parse(readFileSync(join(process.cwd(), "fixtures/knowledge-graph.json"), "utf8")).documents);
}

describe("knowledge repository contract", () => {
  it("returns the same effects from fixture and parameterized Sanity results", async () => {
    const documents = rows();
    const fetch = vi.fn(async (query: string, params?: Record<string, string>) => {
      if (query === VERSION_QUERY) return documents.find((row) => row._id === params?.versionId);
      if (query === PATTERN_QUERY) return documents.find((row) => row._id === params?.patternId);
      if (query === RELATED_QUERY) return documents.filter((row) => row.patternVersion?._ref === params?.versionId);
      if (query === SOURCES_QUERY) return documents.filter((row) => row._type === "sourceDocument");
      throw new Error(`Unexpected query: ${query}`);
    });
    const remote = sanityKnowledgeRepository({ fetch } as unknown as Pick<SanityClient, "fetch">);
    const fixture = fixtureKnowledgeRepository(documents);
    expect(await remote.load(versionId, "illustrative")).toEqual(await fixture.load(versionId, "illustrative"));
    expect(fetch).toHaveBeenCalledWith(VERSION_QUERY, { versionId });
    expect(fetch).toHaveBeenCalledWith(RELATED_QUERY, { versionId });
  });

  it("does not leak fixture material into reviewed retrieval", async () => {
    await expect(fixtureKnowledgeRepository(rows()).load(versionId, "reviewed")).rejects.toThrow(/not reviewed/);
  });

  it("rejects identifiers before they reach GROQ", async () => {
    const fetch = vi.fn();
    const repository = sanityKnowledgeRepository({ fetch } as unknown as Pick<SanityClient, "fetch">);
    await expect(repository.load("*[_type == 'secret']", "reviewed")).rejects.toThrow(/Invalid pattern version/);
    expect(fetch).not.toHaveBeenCalled();
  });
});
