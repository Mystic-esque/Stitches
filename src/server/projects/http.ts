import { NextResponse } from "next/server";
import { DemoProjectError } from "@/domain/demo-project";

export function demoErrorResponse(error: unknown): NextResponse {
  if (error instanceof DemoProjectError) {
    const status = error.code === "mode" ? 403 : error.code === "stale" || error.code === "content-stale" ? 409 : 400;
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
  }
  return NextResponse.json({ error: { code: "unavailable", message: "The local demo project could not be saved. Your accepted version was not changed." } }, { status: 500 });
}
