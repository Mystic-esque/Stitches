import { describe, expect, it, vi } from "vitest";
import type { PatternSnapshot } from "../../domain/knowledge/resolve-pattern";
import { selectWorktableKnowledge } from "./worktable-selection";

const fakeSnapshot = { versionId: "version.test", mode: "illustrative", fingerprint: "a" } as PatternSnapshot;

describe("worktable knowledge selection", () => {
  it("defaults to a visibly illustrative fixture without credentials", async () => {
    const result = await selectWorktableKnowledge({});
    expect(result.origin).toBe("fixture");
    expect(result.canAcceptSample).toBe(true);
    expect(result.snapshot.mode).toBe("illustrative");
  });

  it("uses the dedicated development dataset and exact version with no fixture fallback", async () => {
    const load = vi.fn(async () => fakeSnapshot);
    const result = await selectWorktableKnowledge({
      STITCHES_KNOWLEDGE_MODE: "sanity-development", SANITY_PROJECT_ID: "l4eeamth",
      SANITY_DATASET: "development", STITCHES_PATTERN_VERSION_ID: "version.test",
    }, { load });
    expect(load).toHaveBeenCalledWith("version.test", "illustrative");
    expect(result.origin).toBe("sanity-development");
    expect(result.canAcceptSample).toBe(false);
    const broken = { load: async () => { throw new Error("missing live record"); } };
    await expect(selectWorktableKnowledge({ STITCHES_KNOWLEDGE_MODE: "sanity-development", SANITY_PROJECT_ID: "l4eeamth", SANITY_DATASET: "development" }, broken)).rejects.toThrow("missing live record");
  });

  it("requires reviewed mode and production dataset for the reviewed path", async () => {
    const load = vi.fn(async () => ({ ...fakeSnapshot, versionId: "pattern-version.everyday-blouse.0-1-0", mode: "reviewed" as const }));
    await selectWorktableKnowledge({ STITCHES_KNOWLEDGE_MODE: "sanity-reviewed", SANITY_PROJECT_ID: "l4eeamth", SANITY_DATASET: "production" }, { load });
    expect(load).toHaveBeenCalledWith("pattern-version.everyday-blouse.0-1-0", "reviewed");
    await expect(selectWorktableKnowledge({ STITCHES_KNOWLEDGE_MODE: "sanity-reviewed", SANITY_PROJECT_ID: "l4eeamth", SANITY_DATASET: "development" }, { load })).rejects.toThrow("dedicated project and dataset");
    await expect(selectWorktableKnowledge({ STITCHES_KNOWLEDGE_MODE: "unknown" })).rejects.toThrow("Unrecognized");
    await expect(selectWorktableKnowledge({ STITCHES_KNOWLEDGE_MODE: "sanity-reviewed", SANITY_PROJECT_ID: "l4eeamth", SANITY_DATASET: "production" }, { load: async () => fakeSnapshot })).rejects.toThrow("wrong version or review mode");
  });
});
