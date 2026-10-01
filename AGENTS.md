# Stitches project instructions

## Authority and read order
This is the existing Stitches application, not Crossgrade and not an empty scaffold. The owner's latest direction is Companion 2.0. Read docs/STATUS.md for actual evidence, docs/PRODUCT.md and docs/DIRECTION-REVIEW.md for product judgment, docs/SOL_HANDOFF.md for implementation, devpost/{scope,prd,spec,checklist}.md for contracts, docs/DESIGN.md and docs/EXPERIENCE-CONTRACTS.md for visual/experience, and docs/CONTENT-MODEL.md for Sanity. The September 29 Studio 1.0 reference is superseded; historical screenshot semantics may inspire but do not dictate layout.

## Product intent
Build a premium **project-aware sewing companion**: distinct example projects or a personal idea/pattern; private project memory; technical pattern literacy (pieces, cut/fold/grain/count/markings, joins, changed edges); preparation; step-focused making; contextual “I'm stuck” recovery; and bounded Gemini tools over Sanity exact graph plus actual maintained Context KB. A gallery or 3D preview is not the product. Two different qualified project sources and a shared cross-project method/diagnostic are release goals. Educational and planning paths remain valuable when exact cutting is not qualified.

## Implementation and truth
- Preserve existing tested code and evidence. Extend the pinned Next.js/React/TypeScript repository rather than restart.
- Server validates source applicability, rights, graph references, operation bounds, geometry/layout, progress and diagnostic transitions. Gemini never bypasses checks or silently keeps a proposal.
- Illustrative diagrams, photo observations, Context prose and 3D previews cannot certify pattern geometry, yardage, fit or cut readiness. Readiness receipts are plan_only, guided_making, pattern_mapped, cut_checked and maker_reviewed.
- A semantic pattern definition and confirmed inputs produce a deterministic, measured artifact; SVG is its interactive view, not the editable pattern. Read `docs/PATTERN-ENGINE-DECISION.md` before geometry/variation work. FreeSewing is an unqualified first spike; model-authored path strings or arbitrary point edits are not sewing operations.
- Source/version/profile/material/equipment/method/progress bindings are versioned. Keep immutable revisions and stale-evidence review; never rewrite already completed physical work.
- Personal measurements, photos, projects and issue history are guest-private, not in shared Sanity. Test isolation, backups and stale-tab recovery.
- Use fixed parameterized exact Content Lake queries plus server-scoped actual KB-only Context MCP; no model-authored shell/GROQ. No fixture may be called live proof.
- Do not fabricate maker trials, benchmarks, screenshot provenance, implementation status or API capabilities. A missing source/readiness gate is explicit.
- Visual work is judged by maker outcomes: can someone identify how to cut/join, what changed, and what to do at an uncertain step? The older pattern screenshot is a teaching reference, not a mandatory UI template.

## Authorized resource boundaries
Local architecture, dependencies, code, tests and disposable rehearsals are authorized. Gemini within free available quota and $0 paid budget. Separate Sanity Viewer/Editor/Context credentials; guarded writes only to Stitches l4eeamth / development, never production. No billing, paid resources, external site/Function deployment, organizer messages or final submission without separate approval.

## Workflow and verification
Follow W01–W10 in devpost/checklist.md. One agent is the default. Continue independent work when one gate is blocked and consolidate truly necessary owner requests. Read installed framework docs before Next.js changes and official provider docs at point of use. At each milestone update STATUS, DECISIONS and BUILD_LOG with commands, results, files, limitations and one next task; commit coherent local changes, never push automatically. Final gates include live provider/KB, Sanity correction across two different projects, benchmark, meaningful recovery, actual responsive screenshots, source rights and physical maker/print evidence for cut-ready claims.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
