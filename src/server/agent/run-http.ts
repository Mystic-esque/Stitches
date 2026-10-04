import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCompanionCatalogClient, loadCompanionCatalog } from "../knowledge/companion-catalog";
import { GuestStoreError, type GuestStore } from "../projects/guest-store";
import { GuestHttpError } from "../projects/guest-http";
import { CompanionAgentError, type CompanionSnapshot } from "./companion-tools";

export async function loadOwnedAgentSnapshot(store: GuestStore, ownerId: string, projectId: string): Promise<CompanionSnapshot> {
  const project = store.getProject(ownerId, projectId); // Deny guest access before network activity.
  if (!project) throw new GuestHttpError(404, "not_found", "Project not found.");
  if (project.source.kind !== "candidate") throw new GuestHttpError(400, "unsupported", "This source-linked preparation assistant needs a supported example. Your private own-idea plan remains available.");
  let cards;
  const client = createCompanionCatalogClient();
  try { cards = await loadCompanionCatalog(client); }
  catch { throw new GuestHttpError(503, "source_unavailable", "Current exact Sanity sources are unavailable. Use your saved manual preparation plan."); }
  const designId = project.source.designId, source = cards.find((item) => item.designKey === designId);
  if (!source) throw new GuestHttpError(503, "source_unavailable", "The applicable exact source is missing.");
  const history = store.listDiagnostics(ownerId, projectId);
  const makingHistory = store.listMaking(ownerId, projectId);
  let makingPlan = null;
  try {
    const { loadMakingPlan } = await import("../knowledge/making-plan");
    makingPlan = await loadMakingPlan(client, source);
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("fetch") || error.message.includes("network"))) {
      throw new GuestHttpError(503, "source_unavailable", "Current exact Sanity construction plan is unavailable. Use your saved manual preparation plan.");
    }
  }
  return { project, source, history, makingHistory, makingPlan };
}

export async function boundedAgentJson(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > 4096) throw new GuestHttpError(413, "invalid_input", "Agent control input is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new GuestHttpError(400, "invalid_input", "Agent control input is missing.");
  const decoder = new TextDecoder(); let bytes = 0, text = "";
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 4096) { await reader.cancel(); throw new GuestHttpError(413, "invalid_input", "Agent control input is too large."); }
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}

export function agentErrorResponse(error: unknown): NextResponse {
  const known = error instanceof GuestStoreError || error instanceof GuestHttpError || error instanceof CompanionAgentError;
  const code = known ? error.code : error instanceof ZodError || error instanceof SyntaxError ? "invalid_input" : "unavailable";
  const status = error instanceof GuestHttpError ? error.status : code === "not_found" ? 404 : ["stale", "idempotency_conflict"].includes(code) ? 409 : ["invalid", "invalid_input", "consent", "unsupported"].includes(code) ? 400 : 503;
  return NextResponse.json({ error: { code, message: known ? error.message : "The assistant request could not be completed. Manual preparation remains available.",
    retryable: ["source_unavailable", "missing_knowledge"].includes(code), requestId: randomUUID() } }, { status, headers: { "Cache-Control": "no-store" } });
}
