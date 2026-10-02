import type { GuestProject } from "./guest-project";
import { measurementFields } from "./measurement-plan";
import { diagnosticEventLabel, type DiagnosticRecord } from "./diagnostic-history";

type PlanningSource = { fingerprint: string; title: string; sourceTitle: string; sourceUrl: string;
  requiredMeasurements: string[]; materialStructure: "woven" | "knit"; reviewStatus: "pending" | "reviewed" };
export type PreparationItem = { id: "source" | "measurements" | "material" | "fabric" | "equipment" | "questions" | "cutting";
  title: string; state: "recorded" | "missing" | "review" | "blocked"; detail: string };

export function preparationPlan(project: GuestProject, source?: PlanningSource): { items: PreparationItem[]; missingMeasurements: string[]; next: string; sourceCurrent: boolean } {
  const linked = project.source.kind === "candidate", current = linked && !!source && project.knowledgeFingerprint === source.fingerprint;
  const { fields, unmappedLabels } = current ? measurementFields(source.requiredMeasurements) : { fields: [], unmappedLabels: [] };
  const missing = fields.filter((field) => field.unit === "degrees" ? project.plan.measurementsDegrees?.shoulderSlope === undefined : project.plan.measurementsMm[field.key] === undefined);
  const items: PreparationItem[] = [
    { id: "source", title: "Know your pattern source", state: current ? "review" : "missing",
      detail: current ? `Current ${source.title} source binding; ${source.reviewStatus} review. Exact pattern, instructions and rights still need qualification.` : linked ? "Current source is unavailable, changed or unbound. Review and bind it before using its requirements." : "Your own idea needs an identified pattern/version or a qualified draft before exact making guidance." },
    { id: "measurements", title: "Record the relevant body notes", state: !current || unmappedLabels.length ? "review" : missing.length ? "missing" : "recorded",
      detail: !current ? "No current source-specific requirement list. Your private notes remain saved; no required size is inferred." : unmappedLabels.length ? `Units or keys need review for: ${unmappedLabels.join(", ")}. Nothing is guessed.` : missing.length ? `Still to record: ${missing.map((field) => field.label).join(", ")}.` : `${fields.length} source-listed body notes recorded. Finished measurements, ease and fit are not verified.` },
    { id: "material", title: "Check the material direction", state: !current || project.plan.fabric.structure === "unknown" ? "missing" : project.plan.fabric.structure !== source.materialStructure ? "review" : "recorded",
      detail: !current ? "Source material requirements cannot be checked yet." : project.plan.fabric.structure === "unknown" ? `This source lists ${source.materialStructure}. Confirm your material structure.` : project.plan.fabric.structure !== source.materialStructure ? `Your ${project.plan.fabric.structure} note differs from the source's ${source.materialStructure} requirement. Resolve this before choosing a method.` : `Recorded structure matches the source (${source.materialStructure}); stretch amount, grain, direction and behavior still need their own checks.` },
    { id: "fabric", title: "Measure what you have", state: project.plan.fabric.widthMm !== null && project.plan.fabric.lengthMm !== null && !!project.plan.fabric.description ? "recorded" : "missing",
      detail: "Record fabric description, usable width and length. Recorded dimensions do not prove yardage or that pieces fit; a checked layout is still required." },
    { id: "equipment", title: "Keep your tools in view", state: project.plan.equipment.length ? "recorded" : "missing",
      detail: project.plan.equipment.length ? `${project.plan.equipment.length} tool notes recorded. No equipment-compatible sewing method has been qualified yet.` : "List your tools so later method checks have an explicit basis. Stitches does not assume an overlocker or machine capability." },
    { id: "questions", title: "Resolve the design decisions", state: project.plan.openQuestions.length ? "review" : "recorded",
      detail: project.plan.openQuestions.length ? `${project.plan.openQuestions.length} questions remain in your brief. Recording a feature does not establish that the source supports it.` : "No questions recorded. This is not proof that every design option is supported." },
    { id: "cutting", title: "Wait for a qualified cutting basis", state: "blocked",
      detail: "Do not cut from these editorial images or piece studies. Exact geometry, counts, joins, rights, layout, print calibration and physical review are separate open gates." },
  ];
  const actionable = items.find((item) => item.id !== "source" && item.id !== "cutting" && item.state === "missing");
  return { items, missingMeasurements: missing.map((field) => field.label), sourceCurrent: current,
    next: !current ? items[0].detail : actionable?.detail ?? "Review unresolved design/material questions and source qualification. Complete notes alone do not enable cutting." };
}

export function planningBrief(project: GuestProject, history: DiagnosticRecord[], source?: PlanningSource): string {
  const readiness = preparationPlan(project, source);
  return ["STITCHES — PRIVATE PLANNING BRIEF", "Planning only. This is NOT a sewing pattern, cutting layout, verified fit or set of making instructions.",
    "Share deliberately: this file contains private body notes and observations.", "", project.title, project.brief,
    `Saved revision: ${project.sequence}`, `Project basis: ${project.basisHash}`, `Saved source fingerprint: ${project.knowledgeFingerprint ?? "none"}`,
    `Source: ${readiness.sourceCurrent && source ? `${source.sourceTitle} — ${source.sourceUrl} (${source.reviewStatus} review)` : "Not currently verified; historical binding only."}`,
    "", "DESIGN FEATURES (maker requested; not automatically supported)", ...project.plan.features.map((item) => `- ${item}`),
    "", "BODY NOTES — millimetres (not finished garment dimensions or ease)", ...Object.entries(project.plan.measurementsMm).map(([key, value]) => `${key}: ${value} mm`),
    "ANGLES — degrees", ...Object.entries(project.plan.measurementsDegrees ?? {}).map(([key, value]) => `${key}: ${value} degrees`),
    `Copied profile basis: ${project.plan.profileBasis ? `${project.plan.profileBasis.name} revision ${project.plan.profileBasis.sequence} (${project.plan.profileBasis.basisHash})` : "none"}`,
    "", "FABRIC AND TOOLS (maker notes; compatibility and yardage not verified)", project.plan.fabric.description || "Fabric not described",
    `Structure: ${project.plan.fabric.structure}; width: ${project.plan.fabric.widthMm ?? "unknown"} mm; length: ${project.plan.fabric.lengthMm ?? "unknown"} mm`, ...project.plan.equipment.map((item) => `- ${item}`),
    "", "QUESTIONS", ...project.plan.openQuestions.map((item) => `- ${item}`), "", "PREPARATION REVIEW", ...readiness.items.map((item) => `${item.title} [${item.state}]: ${item.detail}`),
    "", "SCRAP CHECK HISTORY — user reports, not confirmed diagnosis or garment remedy", ...history.map((item) =>
      `#${item.sequence}: ${diagnosticEventLabel(item.event)}; ${item.imported ? "unverified import" : "maker report"}; project basis #${item.basisSequence} ${item.basisHash}; source ${item.binding.sourceId}; diagnostic ${item.binding.diagnosticFingerprint}\n${"detail" in item.event ? item.event.detail : item.event.kind === "paused" ? item.event.reason : ""}`),
    "", "NEXT USEFUL ACTION", readiness.next, "", "Cut-ready, guided-making, pattern-mapped and maker-reviewed capabilities have not been awarded by this brief.",
  ].join("\n");
}
