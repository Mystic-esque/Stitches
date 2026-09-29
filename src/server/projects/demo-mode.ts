import { DemoProjectError } from "../../domain/demo-project";

export function assertDemoMutationAllowed(mode = process.env.STITCHES_KNOWLEDGE_MODE || "fixture"): void {
  if (mode !== "fixture") throw new DemoProjectError("mode", "Sample project writes are disabled while inspecting Sanity knowledge.");
}
