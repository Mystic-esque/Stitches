import { Worktable } from "@/components/studio/Worktable";
import { demoContentFingerprint, getDemoProject } from "@/server/projects/demo-store";
import { selectWorktableKnowledge } from "@/server/knowledge/worktable-selection";

export const dynamic = "force-dynamic";

export default async function Home() {
  let selected;
  try {
    selected = await selectWorktableKnowledge();
  } catch {
    return <main className="knowledge-unavailable"><div className="wordmark">stitches.</div>
      <p className="eyebrow">Knowledge unavailable</p>
      <h1>The pattern needs its source.</h1>
      <p>The selected Sanity knowledge mode could not load a valid pattern version. No illustrative fixture was substituted and no proposal was changed. Check this environment’s Stitches project, dataset, published records, and read access; then reload.</p>
      <a className="retry-link" href="/">Try again →</a>
    </main>;
  }
  const project = await getDemoProject();
  return <Worktable initialProject={project} contentFingerprint={demoContentFingerprint()} knowledge={selected.snapshot} knowledgeOrigin={selected.origin} canAcceptSample={selected.canAcceptSample} />;
}
