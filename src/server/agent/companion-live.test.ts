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
        results.push({ design: source.designKey, evidence: tools.evidence(), toolSequence: ["inspect_project", "resolve_exact_graph", "retrieve_context"] });
      }
      mkdirSync("evidence", { recursive: true });
      writeFileSync("evidence/companion-agent-read-verification.json", JSON.stringify({ capturedAt: new Date().toISOString(), passed: true,
        provenance: "Actual development Content Lake + actual dedicated Context KB; synthetic private projects; no model inference", providerRequests: 0, results }, null, 2));
    } finally { store.close(); }
  }, 120_000);
});
