import { NextResponse } from "next/server";
import { verifyAssemblyEvidence } from "@/server/knowledge/assembly-evidence";
import { contextConfiguration, SanityContextKnowledgeBase } from "@/server/knowledge/context-mcp";
import { selectWorktableKnowledge } from "@/server/knowledge/worktable-selection";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unavailable = () => NextResponse.json({ error: { code: "knowledge-unavailable", message: "The maintained construction note is unavailable; the authored assembly steps remain visible." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (process.env.STITCHES_KNOWLEDGE_MODE !== "sanity-development") return unavailable();
  if (!["127.0.0.1", "localhost"].includes(new URL(request.url).hostname))
    return NextResponse.json({ error: { code: "local-only", message: "This illustrative knowledge view is local-only." } }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? "0") > 256) return NextResponse.json({ error: { code: "invalid", message: "Invalid knowledge request." } }, { status: 400 });
  const body: unknown = await request.json().catch(() => null);
  const fingerprint = body && typeof body === "object" && "snapshotFingerprint" in body ? body.snapshotFingerprint : undefined;
  if (typeof fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(fingerprint))
    return NextResponse.json({ error: { code: "invalid", message: "A current knowledge fingerprint is required." } }, { status: 400 });
  try {
    const config = contextConfiguration();
    if (config.organizationId !== "o3i0aqvqq" || config.mcpName !== "stitches-garments" || config.knowledgeBaseId !== "kbkvu1vrPsLG") return unavailable();
    const selected = await selectWorktableKnowledge();
    if (selected.origin !== "sanity-development") return unavailable();
    if (selected.snapshot.fingerprint !== fingerprint)
      return NextResponse.json({ error: { code: "stale", message: "The garment knowledge changed. Reload before opening its maintained note." } }, { status: 409, headers: { "Cache-Control": "no-store" } });
    const entry = await new SanityContextKnowledgeBase(config).readPaths(["construction_sequence"]);
    const note = verifyAssemblyEvidence(selected.snapshot, entry);
    return NextResponse.json({ note }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return unavailable();
  }
}
