import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMPANION_CATALOG_QUERY, createCompanionCatalogClient, loadCompanionCatalog, resolveCompanionCatalog } from "./companion-catalog";

const fixture = JSON.parse(readFileSync(new URL("../../../fixtures/companion-candidates.json", import.meta.url), "utf8"));
const published = fixture.documents.map((item: Record<string, unknown>, index: number) => ({ ...item, _rev: `published-${index}` }));

describe("Sanity-backed planning catalog", () => {
  it("requires both distinct source/candidate pairs and keeps every card plan-only", () => {
    const cards = resolveCompanionCatalog([...published].reverse());
    expect(cards.map((item) => item.designKey)).toEqual(["sandy", "tina"]);
    expect(cards.map((item) => item.materialStructure)).toEqual(["woven", "knit"]);
    expect(cards.every((item) => item.capability === "plan_only" && item.reviewStatus === "pending")).toBe(true);
    expect(cards[0].requiredMeasurements).toHaveLength(4);
    expect(cards[1].requiredMeasurements).toHaveLength(14);
    const corrected = published.map((item: Record<string, unknown>) => item._type === "planningCandidate" && item.designKey === "sandy"
      ? { ...item, cuttingCaveat: `${item.cuttingCaveat} Check a sample first.`, _rev: "new-editorial-revision" } : item);
    expect(resolveCompanionCatalog(corrected)[0].fingerprint).not.toBe(cards[0].fingerprint);
    expect(resolveCompanionCatalog(corrected)[1].fingerprint).toBe(cards[1].fingerprint);
  });

  it("fails closed on missing, duplicated, dangling or rejected Sanity content", () => {
    expect(() => resolveCompanionCatalog(published.slice(1))).toThrow(/incomplete/);
    expect(() => resolveCompanionCatalog([...published.slice(0, 3), published[0]])).toThrow(/repeated/);
    const dangling = published.map((item: Record<string, unknown>) => item.designKey === "tina" ? { ...item, source: { _ref: "wrong" } } : item);
    expect(() => resolveCompanionCatalog(dangling)).toThrow(/binding/);
    const rejected = published.map((item: Record<string, unknown>) => item._type === "sourceDocument" && item._id === "companion-source-tina-20261001"
      ? { ...item, reviewStatus: "rejected" } : item);
    expect(() => resolveCompanionCatalog(rejected)).toThrow(/malformed/);
  });

  it("uses only a fixed parameterized query and refuses a wrong project/dataset", async () => {
    let actualQuery = "";
    const cards = await loadCompanionCatalog({ fetch: async (query: string, params: Record<string, unknown>) => {
      actualQuery = query;
      expect(params.ids).toHaveLength(4);
      return published;
    } } as never);
    expect(actualQuery).toBe(COMPANION_CATALOG_QUERY);
    expect(cards).toHaveLength(2);
    expect(() => createCompanionCatalogClient({ SANITY_PROJECT_ID: "crossgrade", SANITY_DATASET: "development", SANITY_READ_TOKEN: "x" }))
      .toThrow(/Dedicated Stitches/);
    expect(() => createCompanionCatalogClient({ SANITY_PROJECT_ID: "l4eeamth", SANITY_DATASET: "production", SANITY_READ_TOKEN: "x" }))
      .toThrow(/Dedicated Stitches/);
  });
});
