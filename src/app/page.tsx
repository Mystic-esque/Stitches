import { Worktable } from "@/components/studio/Worktable";
import { resolvePatternSnapshot } from "@/domain/knowledge/resolve-pattern";
import { demoContentFingerprint, getDemoProject } from "@/server/projects/demo-store";
import graph from "../../fixtures/knowledge-graph.json";

export const dynamic = "force-dynamic";

export default async function Home() {
  const project = await getDemoProject();
  const knowledge = resolvePatternSnapshot(graph.documents, "pattern-version.everyday-blouse.0-1-0", "illustrative");
  return <Worktable initialProject={project} contentFingerprint={demoContentFingerprint()} knowledge={knowledge} />;
}
