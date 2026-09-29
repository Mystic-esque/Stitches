import { Worktable } from "@/components/studio/Worktable";
import { demoContentFingerprint, getDemoProject } from "@/server/projects/demo-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const project = await getDemoProject();
  return <Worktable initialProject={project} contentFingerprint={demoContentFingerprint()} />;
}
