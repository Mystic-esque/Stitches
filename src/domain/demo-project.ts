import { normalizeDemoAmount } from "./demo-pattern";

export const stepKeys = ["join-shoulders", "finish-neckline", "prepare-sleeves"] as const;
export type StepKey = typeof stepKeys[number];

export type DemoRevision = {
  id: string;
  sequence: number;
  amountMm: number;
  contentFingerprint: string;
  requestId: string;
  acceptedAt: string;
};

export type DemoProject = {
  id: "demo-project-01";
  patternVersionId: "pattern-version.everyday-blouse.0-1-0";
  currentSequence: number;
  revisions: DemoRevision[];
  fabricWidthCm: 110 | 140;
  completedStepRevision: Partial<Record<StepKey, number>>;
};

export type AcceptInput = {
  baseSequence: number;
  amountMm: number;
  contentFingerprint: string;
  requestId: string;
};

export class DemoProjectError extends Error {
  constructor(public readonly code: "invalid" | "stale" | "content-stale" | "prerequisite", message: string) {
    super(message);
    this.name = "DemoProjectError";
  }
}

export function createDemoProject(contentFingerprint: string): DemoProject {
  return {
    id: "demo-project-01",
    patternVersionId: "pattern-version.everyday-blouse.0-1-0",
    currentSequence: 0,
    revisions: [{ id: "original", sequence: 0, amountMm: 0, contentFingerprint, requestId: "seed", acceptedAt: "Original sample" }],
    fabricWidthCm: 140,
    completedStepRevision: {},
  };
}

export function currentRevision(project: DemoProject): DemoRevision {
  const revision = project.revisions.find((item) => item.sequence === project.currentSequence);
  if (!revision) throw new DemoProjectError("invalid", "The demo revision history is incomplete.");
  return revision;
}

export function acceptDemoProposal(project: DemoProject, input: AcceptInput, currentFingerprint: string, acceptedAt: string): DemoProject {
  if (!Number.isInteger(input.baseSequence) || !Number.isInteger(input.amountMm) || input.amountMm !== normalizeDemoAmount(input.amountMm) || !/^[A-Za-z0-9_-]{8,80}$/.test(input.requestId)) {
    throw new DemoProjectError("invalid", "The sample proposal is outside its allowed range or has an invalid request ID.");
  }
  const prior = project.revisions.find((item) => item.requestId === input.requestId);
  if (prior) {
    if (prior.amountMm !== input.amountMm || prior.contentFingerprint !== input.contentFingerprint || prior.sequence !== input.baseSequence + 1) {
      throw new DemoProjectError("invalid", "This request ID was already used for a different proposal.");
    }
    return project;
  }
  if (input.baseSequence !== project.currentSequence) throw new DemoProjectError("stale", "The accepted version changed while this proposal was open. Preview again.");
  if (input.contentFingerprint !== currentFingerprint) throw new DemoProjectError("content-stale", "The sample pattern knowledge changed. Preview against the current content.");
  const sequence = project.currentSequence + 1;
  return {
    ...project,
    currentSequence: sequence,
    revisions: [...project.revisions, { id: `demo-r${sequence}`, sequence, amountMm: input.amountMm, contentFingerprint: currentFingerprint, requestId: input.requestId, acceptedAt }],
  };
}

export function setDemoFabricWidth(project: DemoProject, width: number): DemoProject {
  if (width !== 110 && width !== 140) throw new DemoProjectError("invalid", "Choose one of the two sample fabric widths.");
  return { ...project, fabricWidthCm: width };
}

const prerequisites: Record<StepKey, StepKey[]> = {
  "join-shoulders": [],
  "finish-neckline": ["join-shoulders"],
  "prepare-sleeves": ["join-shoulders"],
};

export function setDemoStepComplete(project: DemoProject, step: string, complete: boolean): DemoProject {
  if (!stepKeys.includes(step as StepKey) || typeof complete !== "boolean") throw new DemoProjectError("invalid", "Choose a sample sewing step and completion state.");
  const key = step as StepKey;
  const completedStepRevision = { ...project.completedStepRevision };
  if (complete) {
    if (prerequisites[key].some((prerequisite) => completedStepRevision[prerequisite] !== project.currentSequence)) {
      throw new DemoProjectError("prerequisite", "Finish the current revision's prerequisite step first.");
    }
    completedStepRevision[key] = project.currentSequence;
  } else {
    delete completedStepRevision[key];
    for (const dependent of stepKeys) if (prerequisites[dependent].includes(key)) delete completedStepRevision[dependent];
  }
  return { ...project, completedStepRevision };
}
