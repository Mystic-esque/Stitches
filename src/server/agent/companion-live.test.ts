import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GuestStore } from "../projects/guest-store";
import { createCompanionCatalogClient, loadCompanionCatalog } from "../knowledge/companion-catalog";
import { createCompanionTools, createStitchesCompanionReader, STITCHES_KB_ID } from "./companion-tools";

describe("opt-in live Stitches read tools — no Gemini request", () => {
  it.skipIf(process.env.STITCHES_LIVE_COMPANION_READS !== "true")("reads actual scoped catalog and Context for both distinct private project bases", async () => {
    const store = new GuestStore(":memory:"), owner = "synthetic-live-agent-reader", reader = createStitchesCompanionReader();
    const client = createCompanionCatalogClient(), cards = await loadCompanionCatalog(client);
    const results = [];
    try {
      for (const source of cards) {
        const created = store.createProject(owner, { title: "Synthetic private preparation rehearsal", brief: "", source: { kind: "candidate", designId: source.designKey }, idempotencyKey: randomUUID() });
        const project = store.rebaseKnowledge(owner, created.id, { expectedSequence: created.sequence, expectedBasisHash: created.basisHash, idempotencyKey: randomUUID() }, source.fingerprint);
        const tools = createCompanionTools({ snapshot: { project, source, history: [] }, knowledgeBaseId: STITCHES_KB_ID,
          consent: { sharePreparationSummary: true }, reader,
          loadCurrent: async () => ({ project: store.getProject(owner, project.id)!, history: store.listDiagnostics(owner, project.id),
            source: (await loadCompanionCatalog(client)).find((item) => item.designKey === source.designKey)! }) });
        const inspected = await tools.execute("inspect_project", {}), exact = await tools.execute("resolve_exact_graph", {});
        const context = await tools.execute("retrieve_context", {});
        expect(inspected.capability).toBe("plan_only");
        expect(exact.pieces).toHaveLength(source.designKey === "sandy" ? 5 : 4);
        expect(context.knowledgeHash).toMatch(/^[a-f0-9]{64}$/);
        expect(store.getProject(owner, project.id)).toEqual(project);

        const { loadMakingPlan } = await import("../knowledge/making-plan");
        const makingPlan = await loadMakingPlan(client, source);
        const options = source.designKey === "tina" ? { sleeves: true, frontBottom: true, dart: true } : { sleeves: false, frontBottom: false, dart: false };
        store.recordMaking(owner, project.id, {
          expectedProjectSequence: project.sequence,
          expectedBasisHash: project.basisHash,
          expectedHistorySequence: 0,
          planFingerprint: makingPlan.fingerprint,
          idempotencyKey: randomUUID(),
          event: { kind: "configured", options },
        }, makingPlan, source.fingerprint);
        const makingHistory = store.listMaking(owner, project.id);
        const makingTools = createCompanionTools({
          snapshot: { project, source, history: [], makingPlan, makingHistory },
          knowledgeBaseId: STITCHES_KB_ID,
          consent: { sharePreparationSummary: true },
          topic: "construction",
          reader,
          loadCurrent: async () => ({
            project: store.getProject(owner, project.id)!,
            history: store.listDiagnostics(owner, project.id),
            makingHistory: store.listMaking(owner, project.id),
            makingPlan,
            source: (await loadCompanionCatalog(client)).find((item) => item.designKey === source.designKey)!
          })
        });
        const makingResult = await makingTools.execute("inspect_making", {});
        const makingContext = await makingTools.execute("retrieve_context", {});
        expect(makingResult.configured).toBe(true);
        expect(makingResult.activeStep).toBeDefined();

        results.push({
          design: source.designKey,
          planningEvidence: tools.evidence(),
          makingEvidence: makingTools.evidence(),
          makingActiveStep: (makingResult.activeStep as { title: string; ordinal: number }).title,
          toolSequences: [
            ["inspect_project", "resolve_exact_graph", "retrieve_context"],
            ["inspect_project", "inspect_making", "retrieve_context"]
          ]
        });
      }
      mkdirSync("evidence", { recursive: true });
      writeFileSync("evidence/companion-agent-read-verification.json", JSON.stringify({ capturedAt: new Date().toISOString(), passed: true,
        provenance: "Actual development Content Lake + actual dedicated Context KB; synthetic private projects; no model inference", providerRequests: 0, results }, null, 2));
    } finally { store.close(); }
  }, 120_000);
});
