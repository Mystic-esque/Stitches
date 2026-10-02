import { patternStudyRequestSchema, rawDraftSchema, studyImpactSchema, studyMappingSchema, type PatternStudy } from "../../domain/pattern-study";
import type { GuestProject } from "../../domain/guest-project";
import type { CompanionCatalogCard } from "../knowledge/companion-catalog";
import { draftSandy, engineIdentity, type SandyInput } from "./draft.mjs";
import { compareStudyEdges, mapStraightSandy } from "./mapping.mjs";

export class PatternStudyError extends Error {
  constructor(public readonly code: "missing_input" | "unsupported" | "stale" | "invalid_geometry", message: string, public readonly currentBasis?: PatternStudy["basis"]) { super(message); }
}
export const patternStudyBasis = (project: GuestProject, source: CompanionCatalogCard) => ({ projectId: project.id, sequence: project.sequence, basisHash: project.basisHash, sourceFingerprint: source.fingerprint });
export function createPatternStudy(project: GuestProject, source: CompanionCatalogCard, raw: unknown): PatternStudy {
  const command = patternStudyRequestSchema.parse(raw), basis = patternStudyBasis(project, source);
  if (project.source.kind !== "candidate" || project.source.designId !== "sandy" || source.designKey !== "sandy")
    throw new PatternStudyError("unsupported", "Measured pattern study is currently available only for Sandy's straight-band construction. No substitute geometry was generated.");
  if (project.sequence !== command.expectedSequence || project.basisHash !== command.expectedBasisHash || source.fingerprint !== command.expectedSourceFingerprint || project.knowledgeFingerprint !== source.fingerprint)
    throw new PatternStudyError("stale", "The saved project or exact source changed. Refresh and review before drafting.", basis);
  const keys = ["waist", "hips", "waistToFloor", "waistToHips"] as const;
  const missing = keys.filter(key => project.plan.measurementsMm[key] === undefined);
  if (missing.length) throw new PatternStudyError("missing_input", `Save these source-specific body notes first: ${missing.join(", ")}. No sample measurements are substituted.`);
  const values = project.plan.measurementsMm;
  if (source.requiredMeasurements.slice().sort().join("|") !== ["Waist circumference", "Hips circumference", "Waist to floor", "Waist to hips"].sort().join("|"))
    throw new PatternStudyError("unsupported", "The exact source measurement contract changed. This pinned adapter must be reviewed before another study.");
  for (const [key, fold] of [["skirt-default", "single"], ["waistband-straight", "none"]] as const) {
    const entry = source.pieceStudy.find(piece => piece.pieceKey === key);
    if (!entry || entry.cutCount !== 1 || entry.fold !== fold || entry.mirrored || entry.material !== "main")
      throw new PatternStudyError("unsupported", "The exact source cut/fold contract no longer matches this narrow adapter. No geometry is substituted.");
  }
  const measurements: SandyInput["measurements"] = { waist: values.waist, hips: values.hips, waistToFloor: values.waistToFloor, waistToHips: values.waistToHips };
  if (measurements.hips <= measurements.waist || measurements.waistToFloor <= measurements.waistToHips)
    throw new PatternStudyError("missing_input", "This mathematical study requires hips greater than waist and waist-to-floor greater than waist-to-hips. Review the notes; this is not a fit judgment.");
  const afterRatio = command.lengthRatio + command.deltaLengthMm / measurements.waistToFloor;
  if (afterRatio < .1 || afterRatio > 1) throw new PatternStudyError("unsupported", "The requested comparison leaves the 10–100% length-study envelope. Choose a smaller change.");
  const input: SandyInput = { measurements, lengthRatio: command.lengthRatio, seamAllowanceMm: command.seamAllowanceMm, waistbandShape: "straight" };
  try {
    const beforeRaw = draftSandy(input), afterRaw = draftSandy({ ...input, lengthRatio: afterRatio });
    const beforeMapping = mapStraightSandy(beforeRaw), afterMapping = mapStraightSandy(afterRaw);
    const before = { draft: rawDraftSchema.parse(beforeRaw), mapping: studyMappingSchema.parse(beforeMapping) };
    const after = { draft: rawDraftSchema.parse(afterRaw), mapping: studyMappingSchema.parse(afterMapping) };
    if (before.draft.measuredJoin.differenceMm > .5 || after.draft.measuredJoin.differenceMm > .5) throw new Error("Scalar waist study failed");
    // Research precision only, never a source-approved joining tolerance.
    const impact = studyImpactSchema.parse(compareStudyEdges(beforeMapping, afterMapping));
    if (impact.changedEdgeIds.some(id => id.includes("waist") || id.startsWith("sandy.waistband/"))) throw new Error("Unexpected waist/band impact");
    return { basis, engine: engineIdentity, command, before, after, impact, capability: "plan_only", projectChanged: false, cutReady: false,
      sourceUrl: source.sourceUrl, missingReceipts: [...before.mapping.missingBindings, "complete-allowance-validation", "fabric-layout", "physical-print-calibration", "independent-rights-review"] };
  } catch (error) { if (error instanceof PatternStudyError) throw error; throw new PatternStudyError("invalid_geometry", "The engine or independent semantic checks rejected this draft. No project was changed."); }
}
