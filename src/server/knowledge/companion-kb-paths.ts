// Observed outline versions only. A model never supplies paths, aliases or a search query.
export function companionKbPaths(outline: string, design: "sandy" | "tina", topic: "planning" | "construction" | "diagnostic" = "planning"): string[] {
  const entries = new Set(outline.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^([a-z0-9_]+(?:\/[a-z0-9_]+)*)(?:\s+\[[^\]]+\])?\s*$/);
    return match ? [match[1]] : [];
  }));
  if (topic === "diagnostic") {
    if (entries.has("seam_quality")) return ["seam_quality"];
    throw new Error("The current KB outline has no recognized diagnostic entry.");
  }
  if (topic === "construction") {
    const construction = design === "sandy" ? "construction/sandy_circle_skirt" : "construction/tina_faux_wrap_top";
    if (entries.has(construction)) return [construction];
    throw new Error("The current KB outline has no recognized applicable construction entry.");
  }
  const current = design === "sandy" ? "garment_planning/sandy_circle_skirt" : "garment_planning/tina_faux_wrap_top";
  if (entries.has(current)) return [current]; // Measurements/material/pieces are now in the same planning entry.
  const legacy = design === "sandy" ? "sandy_skirt" : "tina_top";
  if (entries.has(legacy) && entries.has("fabric_constraints")) return [legacy, "fabric_constraints"];
  throw new Error("The current KB outline has no recognized applicable planning entry.");
}

export function kbAttributionNeedsReview(text: string): boolean {
  return /\[\d+\]/.test(text.split(/^## Sources\b/m)[0]);
}
