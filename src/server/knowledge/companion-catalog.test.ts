import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { COMPANION_CATALOG_QUERY, createCompanionCatalogClient, loadCompanionCatalog, resolveCompanionCatalog } from "./companion-catalog";

const fixture = JSON.parse(readFileSync(new URL("../../../fixtures/companion-candidates.json", import.meta.url), "utf8"));
const pieceFixture = JSON.parse(readFileSync(new URL("../../../fixtures/companion-piece-studies.json", import.meta.url), "utf8"));
const diagnosticFixture = JSON.parse(readFileSync(new URL("../../../fixtures/companion-diagnostic.json", import.meta.url), "utf8"));
const published = [...fixture.documents, ...pieceFixture.documents, ...diagnosticFixture.documents]
  .map((item: Record<string, unknown>, index: number) => ({ ...item, _rev: `published-${index}` }));

describe("Sanity-backed planning catalog", () => {
  it("requires both distinct source/candidate pairs and keeps every card plan-only", () => {
    const cards = resolveCompanionCatalog([...published].reverse());
    expect(cards.map((item) => item.designKey)).toEqual(["sandy", "tina"]);
    expect(cards.map((item) => item.materialStructure)).toEqual(["woven", "knit"]);
    expect(cards.every((item) => item.capability === "plan_only" && item.reviewStatus === "pending")).toBe(true);
    expect(cards[0].requiredMeasurements).toHaveLength(4);
    expect(cards[1].requiredMeasurements).toHaveLength(14);
    expect(cards.map((item) => item.pieceStudy.length)).toEqual([5, 4]);
    expect(cards.every((item) => item.diagnosticStudy.capability === "sample_check_only" && item.diagnosticStudy.reviewStatus === "pending")).toBe(true);
    expect(cards[0].diagnosticStudy.fingerprint).toBe(cards[1].diagnosticStudy.fingerprint);
    const corrected = published.map((item: Record<string, unknown>) => item._type === "planningCandidate" && item.designKey === "sandy"
      ? { ...item, cuttingCaveat: `${item.cuttingCaveat} Check a sample first.`, _rev: "new-editorial-revision" } : item);
    expect(resolveCompanionCatalog(corrected)[0].fingerprint).not.toBe(cards[0].fingerprint);
    expect(resolveCompanionCatalog(corrected)[1].fingerprint).toBe(cards[1].fingerprint);
    const pieceCorrection = published.map((item: Record<string, unknown>) => item._id === "companion-piece-sandy-skirt-default-20261001"
      ? { ...item, _rev: "editor-piece-correction" } : item);
    expect(resolveCompanionCatalog(pieceCorrection)[0].fingerprint).not.toBe(cards[0].fingerprint);
    expect(resolveCompanionCatalog(pieceCorrection)[1].fingerprint).toBe(cards[1].fingerprint);
    const sharedCorrection = published.map((item: Record<string, unknown>) => item._id === "companion-remedy-sample-lower-tension-20261001"
      ? { ...item, _rev: "new-method-revision" } : item);
    expect(resolveCompanionCatalog(sharedCorrection).every((item, index) => item.fingerprint !== cards[index].fingerprint)).toBe(true);
  });

  it("fails closed on missing, duplicated, dangling or rejected Sanity content", () => {
    expect(() => resolveCompanionCatalog(published.slice(1))).toThrow(/incomplete/);
    expect(() => resolveCompanionCatalog(published.map((item: Record<string, unknown>, index: number) => index === 3 ? published[0] : item))).toThrow(/repeated/);
    const dangling = published.map((item: Record<string, unknown>) => item.designKey === "tina" ? { ...item, source: { _ref: "wrong" } } : item);
    expect(() => resolveCompanionCatalog(dangling)).toThrow(/binding/);
    const wrongPiece = published.map((item: Record<string, unknown>) => item._id === "companion-piece-tina-back-20261001"
      ? { ...item, candidate: { _ref: "companion-candidate-sandy-20261001" } } : item);
    expect(() => resolveCompanionCatalog(wrongPiece)).toThrow(/binding/);
    const badCount = published.map((item: Record<string, unknown>) => item._id === "companion-piece-tina-front-20261001"
      ? { ...item, cutCount: 0 } : item);
    expect(() => resolveCompanionCatalog(badCount)).toThrow(/malformed/);
    const wrongRemedy = published.map((item: Record<string, unknown>) => item._type === "remedy" ? { ...item, requiredTests: [{ _ref: "wrong" }] } : item);
    expect(() => resolveCompanionCatalog(wrongRemedy)).toThrow(/diagnostic references/);
    const rejected = published.map((item: Record<string, unknown>) => item._type === "sourceDocument" && item._id === "companion-source-tina-20261001"
      ? { ...item, reviewStatus: "rejected" } : item);
    expect(() => resolveCompanionCatalog(rejected)).toThrow(/malformed/);
  });

  it("uses only a fixed parameterized query and refuses a wrong project/dataset", async () => {
    let actualQuery = "";
    const cards = await loadCompanionCatalog({ fetch: async (query: string, params: Record<string, unknown>, options: { signal: AbortSignal }) => {
      actualQuery = query;
      expect(params.ids).toHaveLength(19);
      expect(options.signal).toBeInstanceOf(AbortSignal);
      return published;
    } } as never);
    expect(actualQuery).toBe(COMPANION_CATALOG_QUERY);
    expect(cards).toHaveLength(2);
    expect(() => createCompanionCatalogClient({ SANITY_PROJECT_ID: "crossgrade", SANITY_DATASET: "development", SANITY_READ_TOKEN: "x" }))
      .toThrow(/Dedicated Stitches/);
    expect(() => createCompanionCatalogClient({ SANITY_PROJECT_ID: "l4eeamth", SANITY_DATASET: "production", SANITY_READ_TOKEN: "x" }))
      .toThrow(/Dedicated Stitches/);
  });

  it("passes a bounded abort to the transport and rejects an outage without a fixture fallback", async () => {
    // Synthetic accelerated deadline: verify the configured real bound without waiting 12 seconds.
    const controller = new AbortController();
    const deadline = vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => {
      expect(ms).toBe(12000);
      setTimeout(() => controller.abort(new DOMException("Synthetic source deadline", "TimeoutError")), 20);
      return controller.signal;
    });
    let calls = 0;
    try {
      await expect(loadCompanionCatalog({ fetch: async (_query: string, _params: unknown, options: { signal: AbortSignal }) => {
        ++calls;
        return await new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true }));
      } } as never)).rejects.toMatchObject({ name: "TimeoutError", message: "Synthetic source deadline" });
      expect(calls).toBe(1);
      expect(deadline).toHaveBeenCalledOnce();
    } finally { deadline.mockRestore(); }
  });
});
