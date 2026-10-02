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
  const store = new GuestStore(join(directory, "companion-live.sqlite")), ownerId = `rehearsal-${randomUUID()}`, started = Date.now();
  const design = process.env.STITCHES_LIVE_AGENT_DESIGN === "tina" ? "tina" : "sandy";
  const injectInterruption = process.env.STITCHES_LIVE_AGENT_INTERRUPT === "true";
  let report: Record<string, unknown> = { kind: "actual-gemini-content-lake-context", checkedAt: new Date().toISOString(), paidBudgetUsd: 0,
    syntheticPrivateProject: true, sharedSanityWrites: 0, model: "gemini-3.5-flash-lite", design, injectedContextInterruption: injectInterruption, passed: false };
  try {
    const source = (await loadCompanionCatalog(createCompanionCatalogClient())).find((item) => item.designKey === design)!;
    const project = store.createProject(ownerId, { title: "Synthetic local qualification project", brief: "No personal data", source: { kind: "candidate", designId: design }, idempotencyKey: randomUUID() }, source.fingerprint);
    const loadSnapshot = () => loadOwnedAgentSnapshot(store, ownerId, project.id);
    const initial = await loadSnapshot(), run = store.startAgentRun(ownerId, project.id, { idempotencyKey: randomUUID(), task: design === "tina" ? "understand_pieces" : "next_preparation",
      expectedBasis: companionBasis(initial), consent: { version: "preparation-v1", sharePreparationSummary: true } });
    let current = run;
    const actualReader = createStitchesCompanionReader(); let interrupted = false, recovered = false;
    const reader = { readPaths: async (paths: string[]) => {
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
    if (injectInterruption) expect(recovered).toBe(true);
  } finally {
    writeFileSync(join(process.cwd(), "evidence", design === "tina" ? "companion-live-tina-recovery-verification.json" : "companion-live-run-verification.json"), JSON.stringify(report, null, 2) + "\n");
    store.close();
  }
}, 240_000);
