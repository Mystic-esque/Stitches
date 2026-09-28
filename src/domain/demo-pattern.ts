import graph from "../../fixtures/knowledge-graph.json";

export type PieceKey = "front" | "back" | "sleeve";

export const demoPattern = {
  title: "The everyday blouse",
  version: "0.1.0",
  sourceId: "source.stitches-demo",
  ruleId: "rule.shoulder-width",
  pieces: [
    { key: "front" as const, code: "A", title: "Front bodice", cut: "Cut 1 on fold", reason: "The shoulder point moves; its armhole edge needs review." },
    { key: "back" as const, code: "B", title: "Back bodice", cut: "Cut 1 on fold", reason: "The back shoulder follows the front shoulder relationship." },
    { key: "sleeve" as const, code: "C", title: "Sleeve", cut: "Cut 2 mirrored", reason: "The sleeve cap joins the changed armhole; its seam and ease need review." },
  ],
};

if (graph.fixtureStatus !== "illustrative-not-for-cutting") {
  throw new Error("Unexpected demo fixture status");
}

export function normalizeDemoAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(20, Math.round(value)));
}

// These paths reproduce the concept image only. They are not drafting calculations.
export function demoPiecePath(piece: PieceKey, amount: number): string {
  const shift = normalizeDemoAmount(amount) * 0.45;
  if (piece === "sleeve") {
    return `M0 90 C15 50 24 5 ${70 + shift} 0 C${105 + shift} 4 ${126 + shift} 53 ${146 + shift * 2} 90 L136 175 Q73 183 10 175 Z`;
  }
  return `M0 45 Q28 48 44 0 L${108 + shift} 22 C${100 + shift} 49 ${110 + shift} 80 140 95 L134 219 Q69 226 0 219 Z`;
}
