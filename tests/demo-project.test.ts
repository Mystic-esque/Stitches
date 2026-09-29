import { describe, expect, it } from "vitest";
import { acceptDemoProposal, createDemoProject, currentRevision, DemoProjectError, setDemoStepComplete } from "../src/domain/demo-project";

const input = { baseSequence: 0, amountMm: 10, contentFingerprint: "fixture-hash", requestId: "request-01" };

describe("server-owned demo revision rules", () => {
  it("preserves the original and accepts one immutable revision", () => {
    const original = createDemoProject("fixture-hash");
    const accepted = acceptDemoProposal(original, input, "fixture-hash", "2026-09-28T00:00:00Z");
    expect(original.currentSequence).toBe(0);
    expect(accepted.revisions.map((revision) => revision.amountMm)).toEqual([0, 10]);
    expect(currentRevision(accepted).id).toBe("demo-r1");
    expect(acceptDemoProposal(accepted, input, "fixture-hash", "later")).toBe(accepted);
  });

  it("rejects a stale project or changed content basis", () => {
    const original = createDemoProject("fixture-hash");
    const accepted = acceptDemoProposal(original, input, "fixture-hash", "now");
    expect(() => acceptDemoProposal(accepted, { ...input, requestId: "request-02" }, "fixture-hash", "later")).toThrowError(DemoProjectError);
    expect(() => acceptDemoProposal(original, input, "corrected-hash", "later")).toThrow(/knowledge changed/);
  });

  it("keeps old sewing completion as review-needed after a new revision", () => {
    const original = setDemoStepComplete(createDemoProject("fixture-hash"), "join-shoulders", true);
    const accepted = acceptDemoProposal(original, input, "fixture-hash", "now");
    expect(accepted.completedStepRevision["join-shoulders"]).toBe(0);
    expect(accepted.currentSequence).toBe(1);
    expect(() => setDemoStepComplete(accepted, "prepare-sleeves", true)).toThrow(/prerequisite/);
  });
});
