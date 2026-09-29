import { NextResponse } from "next/server";
import { acceptDemoProposal, DemoProjectError } from "@/domain/demo-project";
import { demoContentFingerprint, updateDemoProject } from "@/server/projects/demo-store";
import { demoErrorResponse } from "@/server/projects/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input || typeof input !== "object") throw new DemoProjectError("invalid", "A proposal body is required.");
    const project = await updateDemoProject((current) => acceptDemoProposal(current, input, demoContentFingerprint(), new Date().toISOString()));
    return NextResponse.json({ project });
  } catch (error) {
    return demoErrorResponse(error);
  }
}
