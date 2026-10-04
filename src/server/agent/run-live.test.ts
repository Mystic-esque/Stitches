import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { GuestStore } from "../projects/guest-store";
import { companionBasis, createStitchesCompanionReader } from "./companion-tools";
import { companionFreeAuthorized, advanceCompanionRun } from "./run-controller";
import { loadOwnedAgentSnapshot } from "./run-http";
import { createCompanionCatalogClient, loadCompanionCatalog } from "../knowledge/companion-catalog";
import { publicAgentRun } from "./run-state";

it.skipIf(process.env.STITCHES_LIVE_AGENT_RUN !== "true")("qualifies one actual free-tier Gemini + exact Sanity + Context preparation run", async () => {
  expect(companionFreeAuthorized()).toBe(true);
  const directory = join(process.cwd(), ".data", "rehearsals"); mkdirSync(directory, { recursive: true });
  const design = process.env.STITCHES_LIVE_AGENT_DESIGN === "tina" ? "tina" : "sandy";
  const task = (process.env.STITCHES_LIVE_AGENT_TASK as "next_preparation" | "understand_pieces" | "review_gaps" | "step_guidance" | "troubleshoot_step" | undefined) ?? (design === "tina" ? "understand_pieces" : "next_preparation");
  const store = new GuestStore(join(directory, `companion-live-${design}-${task}-${randomUUID().slice(0, 8)}.sqlite`)), ownerId = `rehearsal-${randomUUID()}`, started = Date.now();
  const injectInterruption = process.env.STITCHES_LIVE_AGENT_INTERRUPT === "true";
  let report: Record<string, unknown> = { kind: "actual-gemini-content-lake-context", checkedAt: new Date().toISOString(), paidBudgetUsd: 0,
    syntheticPrivateProject: true, sharedSanityWrites: 0, model: "gemini-3.5-flash-lite", design, task, injectedContextInterruption: injectInterruption, passed: false };
  try {
    const catalogClient = createCompanionCatalogClient();
    const source = (await loadCompanionCatalog(catalogClient)).find((item) => item.designKey === design)!;
    const project = store.createProject(ownerId, { title: "Synthetic local qualification project", brief: "No personal data", source: { kind: "candidate", designId: design }, idempotencyKey: randomUUID() }, source.fingerprint);
    if (task === "step_guidance" || task === "troubleshoot_step") {
      const { loadMakingPlan } = await import("../knowledge/making-plan");
      const { currentMakingSession } = await import("../../domain/making-plan");
      const makingPlan = await loadMakingPlan(catalogClient, source);
      const options = design === "tina" ? { sleeves: true, frontBottom: true, dart: true } : { sleeves: false, frontBottom: false, dart: false };
      store.recordMaking(ownerId, project.id, {
        expectedProjectSequence: project.sequence,
        expectedBasisHash: project.basisHash,
        expectedHistorySequence: 0,
        planFingerprint: makingPlan.fingerprint,
        idempotencyKey: randomUUID(),
        event: { kind: "configured", options },
      }, makingPlan, source.fingerprint);
      if (task === "troubleshoot_step") {
        for (let index = 0; index < 20; index++) {
          const history = store.listMaking(ownerId, project.id), next = currentMakingSession(history, project, makingPlan)?.next;
          if (!next) throw new Error("No eligible source-backed diagnostic step was found.");
          const event = next.diagnostic
            ? { kind: "help_requested" as const, stepId: next.id, symptom: "seam_puckering" as const, detail: "Synthetic scrap-only question; no physical garment claim." }
            : { kind: "reviewed" as const, stepId: next.id, checkpointConfirmed: true as const };
          store.recordMaking(ownerId, project.id, { expectedProjectSequence: project.sequence, expectedBasisHash: project.basisHash,
            expectedHistorySequence: history.length, planFingerprint: makingPlan.fingerprint, idempotencyKey: randomUUID(), event }, makingPlan, source.fingerprint);
          if (next.diagnostic) break;
        }
      }
    }
    const loadSnapshot = () => loadOwnedAgentSnapshot(store, ownerId, project.id);
    const selection = task === "understand_pieces" ? { kind: "piece" as const, pieceKey: source.pieceStudy[0].pieceKey } : undefined;
    const initial = await loadSnapshot(), run = store.startAgentRun(ownerId, project.id, { idempotencyKey: randomUUID(), task,
      ...(selection ? { selection, request: `Explain the selected ${source.pieceStudy[0].title} and its source-backed preparation limits.` } : {}),
      ...(task === "troubleshoot_step" ? { request: "A seam may be puckering. What safe scrap test should I do before changing my actual garment?" } : {}),
      expectedBasis: companionBasis(initial), consent: { version: "preparation-v1", sharePreparationSummary: true } });
    let current = run;
    const actualReader = createStitchesCompanionReader(); let interrupted = false, recovered = false;
    const reader = { initialContext: () => actualReader.initialContext(), readPaths: async (paths: string[]) => {
      if (injectInterruption && !interrupted) { interrupted = true; throw new Error("Deliberate local transport interruption, not a Sanity service outage"); }
      return actualReader.readPaths(paths);
    } };
    for (let tick = 0; tick < 5 && ["ready", "response_ready"].includes(current.status); tick++) {
      current = await advanceCompanionRun({ store, ownerId, projectId: project.id, runId: run.id, freeAuthorized: companionFreeAuthorized(), loadSnapshot, reader });
      if (injectInterruption && interrupted && !recovered && current.status === "missing_knowledge") {
        const requestsBefore = current.requests;
        store.controlAgentRun(ownerId, project.id, run.id, "resume");
        current = await advanceCompanionRun({ store, ownerId, projectId: project.id, runId: run.id, freeAuthorized: companionFreeAuthorized(), loadSnapshot, reader });
        recovered = current.status === "ready" && current.requests === requestsBefore;
      }
    }
    report = { ...report, elapsedMs: Date.now() - started, run: publicAgentRun(current), acknowledgedResponseRecoveryWithoutExtraRequest: recovered,
      projectUnchanged: JSON.stringify(store.getProject(ownerId, project.id)) === JSON.stringify(project),
      passed: current.status === "completed", distinction: "Actual provider and knowledge retrieval; not a benchmark, maker trial or verified pattern." };
    expect(current.status).toBe("completed"); expect(current.requests).toBeLessThanOrEqual(4); expect(current.activeMs).toBeLessThanOrEqual(120_000);
    expect(current.knowledgeHash).toMatch(/^[a-f0-9]{64}$/); expect(store.getProject(ownerId, project.id)).toEqual(project);
    if (selection) expect(current.artifact?.subjectId).toBe(selection.pieceKey);
    if (task === "troubleshoot_step") expect(current.artifact?.kind).toBe("diagnostic_check");
    if (injectInterruption) expect(recovered).toBe(true);
  } finally {
    const evidenceName = task === "troubleshoot_step"
      ? `companion-live-diagnostic-${design}-verification.json`
      : task === "step_guidance"
      ? `companion-live-making-${design}-verification.json`
      : design === "tina" && task === "understand_pieces"
      ? "companion-live-selected-tina-verification.json"
      : design === "tina"
      ? "companion-live-tina-recovery-verification.json"
      : "companion-live-run-verification.json";
    writeFileSync(join(process.cwd(), "evidence", evidenceName), JSON.stringify(report, null, 2) + "\n");
    store.close();
  }
}, 240_000);
