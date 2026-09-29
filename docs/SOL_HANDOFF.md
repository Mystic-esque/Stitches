# Stitches Studio 1.0 — implementation handoff for Sol

## Your assignment

Build the full local application described here. This is an upgrade of the existing Stitches repository, not a fresh scaffold and not Crossgrade. The owner asked Astra for product/design leadership and intends Sol to implement. This package is that design handoff; it does not claim the new app is already built.

The product is **a personal garment studio that keeps an idea, its pieces, its constraints and its making steps connected**. The tagline is **See how it’s made. Make it yours.** Sanity is the shared, maintained garment knowledge system; Gemini operates bounded tools over it. The visitor comes to make something, not to inspect our backend.

## Read order and authority

1. AGENTS.md and docs/STATUS.md: constraints and actual state.
2. docs/PRODUCT.md and devpost/scope.md: ambition and release boundary.
3. devpost/prd.md: E01–E10 user outcomes and acceptance IDs.
4. docs/DESIGN.md and docs/EXPERIENCE-CONTRACTS.md: visual and interaction contracts.
5. Open design/stitches-studio.html; inspect design/screenshots/ at original size. Try Pieces, length, pocket, phone sheets, collection filtering and Make steps.
6. devpost/spec.md and docs/CONTENT-MODEL.md: C01–C10 engineering contracts.
7. devpost/checklist.md: work packages W01–W12; docs/BUILD-PLAN.md is their dependency map.
8. Read installed Next.js docs before framework changes. Read task-specific primary vendor docs at the point of use.

Later explicit owner direction wins. Historical reference assets and old STATUS entries explain the past, not the current target. The static design reference specifies appearance and interaction intent; the PRD/spec govern correctness. If a visual sample contradicts a domain rule, fix the sample adaptation rather than weaken the rule.

## Actual starting point

Local commit 84e3b54 contains an illustrative worktable/explorer, guarded Sanity Content Lake and Context adapters, an assembly-evidence check, a bounded illustrative Gemini loop, and sample immutable revisions. Historical build/44-test/browser/live results are in STATUS and BUILD_LOG. They do not qualify a complete garment, a new agent workflow, or print output.

The new design package adds no production runtime feature, hosted resource, model call or Sanity mutation. It provides a tested static reference, proposed contracts and an executable plan. Keep that distinction in all reports.

## Preserve, extend, replace

| Existing location | Action |
| --- | --- |
| src/domain/knowledge/resolve-pattern.ts | Preserve graph validation/fingerprinting; extend for new typed content and semantic dependencies |
| src/server/knowledge/repository.ts | Extend parameterized projections; retain exact project/dataset/version guards |
| src/server/knowledge/context-mcp.ts | Preserve real MCP discovery/read behavior; never hardcode invented paths |
| src/server/knowledge/assembly-evidence.ts | Preserve stale/conflicting-KB rejection and actual wrong-arrow regression |
| src/server/agent/gemini-session.ts | Preserve exact signed tool-call content, SDK boundary, bounded request/error classification |
| src/server/agent/fit-loop.ts, preview-fit.ts | Extract reusable loop mechanics into durable run dispatcher; do not promote two-tool spike into full agent |
| src/domain/geometry/shoulder-spike.ts, src/server/agent/illustrative-geometry.ts | Keep explicit historical/demo status; replace production draft path with qualified full-pattern adapter |
| src/server/projects/demo-store.ts | Keep fixture-only; add transactional guest repository rather than widening global sample storage |
| src/components/studio/Worktable.tsx, GarmentExplorer.tsx | Reuse tested graph selections where useful; refactor into new shell/viewer/inspector, avoiding a growing monolith |
| src/app/page.tsx, globals.css | Migrate carefully to landing/routes/shared tokens; retain a local demo route during parity checks |
| sanity/schemaTypes/index.ts | Split by content responsibility while preserving existing IDs during guarded development migration |
| scripts/browser-check.mjs and historical tests | Retain proof provenance; add actual new journeys rather than only changing snapshot expectations |
| design/studio-reference.* | Visual examples only. Never import sample geometry, fake assistant replies or layout numbers into production tools |

## First executable task

Start W01 now: qualify complete top and skirt candidates. Produce evidence/pattern-qualification.md with exact source/version/rights, supported measurements/options/fabric, complete draft artifacts and known gaps; implement only a narrow adapter spike sufficient to test those facts. Do not spend days polishing a garment whose patterns cannot be generated or distributed.

FreeSewing is preferred where a design qualifies. Current research identified knit-only caveats for Tamiko/Tina and a separate knit T-shirt candidate in Teagan; none establishes our proposed relaxed woven top. Sandy is a skirt candidate, not a prequalified dependency. An original woven design needs authored drafting authority and maker evidence. If blocked on that authority, qualify the other family and continue W02/W04; preserve both-family release ambition and report the exact limitation.

Do not ask the owner to choose colors, frameworks or routine files. Do not ask for an approval after every W package. Physical expert/owner work and newly required external authority are different; make one consolidated actionable request when needed.

## Small-task execution contract

Before each coherent task, write in STATUS: outcome, input basis, files in scope, relevant acceptance IDs, command(s) to prove it, and rollback/recovery. Prefer one tested vertical slice over a batch of disconnected placeholder pages.

Examples:

- Draft contract: one supported option → complete PatternArtifact → deterministic checks → inspectable 2D pieces. Proof includes a broken seam input that is rejected.
- Revision contract: two browser tabs attempt keep → one advances sequence → stale one receives review state → no data loss.
- Viewer contract: select sleeve in 3D → matching 2D piece and step highlight → WebGL disabled still supports selection.
- Agent contract: too little fabric → calculate → try supported alternative → explain actual outcomes → user keeps manually. No free-text claim of success without a receipt.
- Maintenance contract: change shared method in development → two looks affected → old proposal stale → served KB checked independently → maker chooses updated guidance.

After the task: real test outcomes, actual images, failure notes, next task, local commit. Keep docs synchronized at milestones rather than reporting dozens of tiny file edits.

## Visual translation rules

The premium feel comes from proportion, typography, useful garment detail, focused tasks and responsive behavior. It does not require a new UI library or elaborate animation. Keep the deep forest, warm paper, quiet olive and terracotta deltas. Do not restore the old narrow text column, enormous empty canvas, debug-first sidebar or all-panels-stacked phone.

The reference has six navigable screen concepts and a top-focused interactive walkthrough. Its drawings are authored SVG studies, **not Three.js or valid patterns**; the skirt cards deliberately do not expose top controls. Production must implement both qualified families with real manifests. Reference mobile uses native dialog sheets; production must keep equivalent focus/escape behavior and no hidden required action.

Ship a strong immediate 2D view, then lazy-load real educational 3D. Every optional component and meaningful dimensional change must remain tied to the same artifact. If a preview adapter is missing, show an explicit 2D view, not unrelated AI-generated garment art.

## Product decisions already made

- Guest-first, no signup/authentication UI; isolated private session storage, backup/import and recovery are still required.
- At least six structural presets across two qualified families. One-family slice is a milestone, not the final application.
- Photo intake suggests supported starting points from visible features. It does not infer exact hidden patterns or body dimensions.
- Design, fabric and making are coordinated; measurements, cut counts, method choices and instruction dependencies travel with the revision.
- Supported direct controls remain useful when the model is slow/unavailable.
- Keep version is not Ready to cut. Source rights, numerical checks and actual maker evidence determine the latter.
- No arbitrary model code/GROQ/shell, no implicit keep, no credentials in browser.
- No cloth/fit physics claim; three-dimensional construction preview is sufficient for this release.

## Provider and Sanity boundaries

Use Stitches .env.local. Inspect presence/format without printing values. Do not copy credentials into docs or logs. Existing separate Viewer/Editor/Context tokens must remain separate. Model is gemini-3.5-flash-lite within the owner-confirmed free tier; paid budget remains $0. Discover availability and use bounded requests; no silent fallback or billing enablement.

Sanity writes only to l4eeamth/development with guarded ID scope and revision preconditions. The actual Stitches KB is kbkvu1vrPsLG with a KB-only stitches-garments endpoint. Exact queries remain a separate Content Lake adapter. Existing source/outline IDs are not permission to invent undocumented maintenance endpoints. Compare fingerprints even if a Function is not deployed.

Sanity Functions can be authored and locally rehearsed. Deploying a Function, website or public endpoint beyond existing authorized setup requires explicit publication approval. Production dataset, paid resources, messages and final submissions remain out of scope.

## Commands and evidence

Run from C:\\Users\\USER\\Desktop\\Stitches. Confirm package scripts before assuming an old command still exists.

Current local commands:

```powershell
pnpm install --frozen-lockfile
pnpm exec next dev --hostname 127.0.0.1
pnpm exec tsc --noEmit --incremental false
pnpm exec vitest run --maxWorkers=1 --testTimeout 15000
pnpm build
node scripts/check-local-env.mjs
node scripts/check-design-reference.mjs
node scripts/check-design-reference.mjs --serve
```

The reference server binds only 127.0.0.1:4175. It is independent of Next.js and APIs. Historical app browser checks require a separately started app and explicit expected fixture/live mode; inspect their script before use. Do not count reference checks as app regression tests. On Windows some builds need permission for .next/TypeScript outputs; request the narrow tool escalation, not a different project.

Evidence categories: design reference; deterministic fixture; actual live read; actual live model+tool execution; numerical geometry; real printed calibration; physical maker review. Do not collapse them into a single “verified” label.

## Reviewable finish

W12 yields a complete locally working journey, measured failures/recovery, actual app screenshots, source/license ledger, maker evidence, fair benchmark, and deployment/submission drafts. Public deployment and final submissions remain pending authorization. If an essential gate is blocked, report the actual finished functionality and exact missing proof—never announce the full app is complete.
