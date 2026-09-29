import { NextResponse } from "next/server";
import { DemoProjectError, setDemoFabricWidth, setDemoStepComplete } from "@/domain/demo-project";
import { updateDemoProject } from "@/server/projects/demo-store";
import { assertDemoMutationAllowed } from "@/server/projects/demo-mode";
import { demoErrorResponse } from "@/server/projects/http";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    assertDemoMutationAllowed();
    const input = await request.json();
    if (!input || typeof input !== "object") throw new DemoProjectError("invalid", "A progress update body is required.");
    const project = await updateDemoProject((current) => {
      if (input.kind === "fabric-width") return setDemoFabricWidth(current, input.widthCm);
      if (input.kind === "sewing-step") return setDemoStepComplete(current, input.stepKey, input.complete);
      throw new DemoProjectError("invalid", "Unsupported demo progress update.");
    });
    return NextResponse.json({ project });
  } catch (error) {
    return demoErrorResponse(error);
  }
}
