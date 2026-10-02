export type ScrapObservation = "not-tested" | "relaxes" | "unchanged";

export function pausedScrapAdvice() {
  return { state: "unresolved" as const, title: "This comparison path needs review",
    explanation: "A saved comparison was completed, unsuccessful, uncertain or paused. That does not rewrite your first observation or establish the cause.",
    nextAction: "Keep the observations and comparison result together. Do not repeat this path automatically or transfer the sample result to the garment; ask for further source-qualified review.",
    confirmation: null };
}

export function resolveScrapObservation<T extends { tensionIssue: string; tensionRiskNotes: string;
  unresolvedIssue: string; unresolvedRiskNotes: string; howToCheck: string; safeAction: string;
  confirmationCheck: string }>(study: T, result: ScrapObservation) {
  if (result === "relaxes") return { state: "possible-tension" as const, title: study.tensionIssue,
    explanation: study.tensionRiskNotes, nextAction: study.safeAction, confirmation: study.confirmationCheck };
  if (result === "unchanged") return { state: "unresolved" as const, title: study.unresolvedIssue,
    explanation: study.unresolvedRiskNotes, nextAction: "Pause this adjustment path. Compare another cause or ask an experienced maker before changing the garment.", confirmation: null };
  return { state: "not-tested" as const, title: "First, observe a sample",
    explanation: "No cause has been identified from a puckered seam alone.", nextAction: study.howToCheck, confirmation: null };
}
