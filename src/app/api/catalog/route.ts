import { NextResponse } from "next/server";
import { CatalogError, createCompanionCatalogClient, loadCompanionCatalog } from "@/server/knowledge/companion-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cards = await loadCompanionCatalog(createCompanionCatalogClient());
    return NextResponse.json({ provenance: "sanity-development-content-lake", cards }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof CatalogError ? error.code : "unavailable";
    return NextResponse.json({ code, message: "The source-linked planning catalog is unavailable. Your private projects remain accessible." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
