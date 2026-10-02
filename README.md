# Stitches

## Current direction: Companion 2.0

**See how it’s made. Make it yours.** A project-aware sewing companion that connects an idea or pattern, technical pieces, preparation, actual making steps and contextual recovery. Sanity maintains the shared construction/diagnostic knowledge; bounded Gemini tools use it with the maker's private project context.

The October 1 direction supersedes the September 29 Studio 1.0 proposal. Start with the [comparison and research assessment](docs/DIRECTION-REVIEW.md), [Sol handoff](docs/SOL_HANDOFF.md), [product](docs/PRODUCT.md), [design](docs/DESIGN.md), [experience contracts](docs/EXPERIENCE-CONTRACTS.md), [PRD](devpost/prd.md), [technical spec](devpost/spec.md), and [checklist](devpost/checklist.md). The new [Companion visual reference](design/stitches-companion.html) is a labeled concept, not the application. The [older six-screen reference](design/stitches-studio.html) and its captures remain historical.

The full Companion 2.0 release is **not complete**. The current `/` runtime includes distinct Sandy/Tina planning starts, isolated guest projects/revisions/journals, reusable private profiles, source-derived piece education, preparation, private scrap history and durable read-only assistant controls. Sandy has a measured non-cuttable pattern study with named edges/marks, fold/grain/count and full-redraft length comparison. Two actual Sanity construction-learning graphs now drive a focused making notebook with explicit options, prerequisites, checkpoints, current-step questions and scrap checks, private pauses, transactional v4 backup/restore and a making brief. The catalog reads 19 records; construction reads 15 separate pending records. Complete source/rights/physical procedures, checked variation/layout/print, maker trials and benchmark remain open. The rebuilt seven-entry Context KB passes 14/15 current checks; planning retrieval passes for both projects, while diagnostic test/remedy IDs still need attribution repair. Historical live-agent proof remains dated evidence. Read [actual status](docs/STATUS.md), [runbook](docs/AGENT-RUNBOOK.md) and [local review package](docs/RELEASE-REVIEW.md). `/demo` retains the historical illustrative blouse. Nothing has been deployed or submitted.

Open `design/stitches-companion.html` locally to inspect the reference, or run `node scripts/check-companion-reference.mjs` for isolated browser captures and interaction checks. This is not the Next.js app and makes no API calls. The older reference can still be served with `node scripts/check-design-reference.mjs --serve`.

## Historical illustrative runtime documentation (retained for `/demo`)

See how it is made. Make it yours.

Stitches is a garment studio that connects a finished garment to its flat pattern pieces, seams, assembly order, supported changes, and the guidance needed to make a personal version. Sanity is the maintained garment-knowledge layer; deterministic tools, not model prose, own validation and geometry. The approved product direction is in [docs/PRODUCT.md](docs/PRODUCT.md), with the full build gates in [devpost/checklist.md](devpost/checklist.md).

**Current status:** the local Next.js app opens on an Explore view of one illustrative blouse: front/back, linked pieces, seam partners, and authored assembly. Fit / Fabric / Sew retain sample revisions, staleness handling, and visible unknown states. The dedicated Stitches Sanity `development` dataset has 13 illustrative records and a Stitches-only eight-entry Context Knowledge Base. A real Content Lake edit changed the explorer, and a maintained KB correction changed a source-checked assembly explanation in the browser. A bounded, opt-in Gemini tool-use rehearsal passed against that actual KB. The model preview is not a public chat experience and cannot accept a revision. Whole-pattern drafting, verified layout, isolated guest storage, print output, physical maker proof, and deployment remain open; no illustration here is cut-ready. See [docs/STATUS.md](docs/STATUS.md) and [BUILD_LOG.md](BUILD_LOG.md) for exact results and limitations.

## Run locally

The implemented private assistant has three registered preparation questions, minimized consent preview, durable run/history controls, cancellation and bounded recovery. It reads exact Sanity records and actual scoped Context entries; no model write or physical-action authority. Actual two-source Gemini receipts are recorded in STATUS; [AGENT-RUNBOOK](docs/AGENT-RUNBOOK.md) covers configuration, $0 authorization and limits. The earlier `evidence/companion-agent-read-verification.json` proves the read boundary alone. To repeat only that read check (dedicated read/Context credentials required):

```powershell
$env:STITCHES_LIVE_COMPANION_READS = 'true'
node --env-file=.env.local node_modules/vitest/vitest.mjs run --maxWorkers=1 src/server/agent/companion-live.test.ts
Remove-Item Env:STITCHES_LIVE_COMPANION_READS
```

This uses synthetic in-memory private projects and no shared writes. It does not prove live Gemini task completion, cut readiness, durable resume or physical making. After a KB rebuild, first run `node --experimental-transform-types --env-file=.env.local scripts/verify-companion-context.mjs`; a failed editorial gate must be repaired before a new live-model qualification. With the production preview running, `node scripts/check-making-workspace.mjs` rehearses the construction notebook and v4 backup using synthetic guests and actual Sanity reads, without inference or shared writes.

Current Companion production preview (dependencies already installed):

```powershell
npm test -- --testTimeout=15000 --maxWorkers=2
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3100
```

For the new zero-inference measured-board/API/browser rehearsal run `node scripts/check-pattern-board.mjs`; for durable assistant-control boundaries run `node scripts/check-agent-api.mjs`. Both use synthetic private guests and actual dedicated catalog reads, not model output or physical maker evidence. The measured board requires four saved Sandy body notes and explicit consent; it refuses unsupported sources and offers no cutting download. Latest full suite: 112 passed / three opt-in skipped. Desktop/phone captures and retained failed rehearsals are under `evidence/screenshots/pattern-board` and `evidence/pattern-board-verification.json`.

Filesystem harness note: a later separate run also exceeded 15 seconds in two restart cases (16.36 and 16.39 seconds). All three disk-backed project/profile/diagnostic restart tests now have an explicit bounded 60-second setup/I/O/cleanup allowance; their data assertions are unchanged. Other tests retain the command's 15-second bound. Both failed reports are preserved under `evidence/companion-private-verification-timeout*.json`. This verifies persistence semantics, not a 15-second recovery performance guarantee.

While the preview runs, execute `node scripts/check-diagnostic-api.mjs`, `node scripts/check-guest-api.mjs`, `node scripts/check-maker-profile-api.mjs` and `node scripts/check-companion-runtime.mjs`. These create synthetic private rehearsal records and actual local Chrome screenshots, not physical maker trials. Dedicated Sanity read credentials are required for the live catalog checks; no shared content is mutated and no Gemini inference occurs in these checks. Run disk-backed tests separately from builds on this Windows host: an overlapping run timed out three restart tests at 15 seconds; the unchanged assertions/timeouts passed with two workers after the build. Private data is in ignored `.data/`; preserve guest cookies or deliberately export private backups. v3 backups include untrusted restored scrap history, while v1/v2 remain accepted. Cleanup/multi-instance durability remain open; do not publish this local preview without separate authorization and the release gates.

With Node.js 22.18+ and pnpm 11.19.0, run `pnpm install --frozen-lockfile`, then `pnpm exec next dev --hostname 127.0.0.1` and open the URL printed by Next.js. Run `pnpm typecheck`, `pnpm test`, and `pnpm build` for local checks. No secret is required for fixture mode. Do not deploy the local single-user demo store as a public service.

For the dedicated Stitches Sanity project, `.env.example` records public project `l4eeamth`, dataset `development`, organization `o3i0aqvqq`, KB `kbkvu1vrPsLG`, and endpoint `stitches-garments`. Keep the separate project Viewer, development Editor, organization Context Viewer, and Gemini credentials only in ignored `.env.local`. `node scripts/check-local-env.mjs` reports presence and quote syntax without values. `node --env-file=.env.local scripts/probe-development.mjs` performs a read-only dataset probe; `node --env-file=.env.local scripts/probe-context-refresh.mjs` checks the real KB entry. `node --env-file=.env.local scripts/seed-development.mjs` is a dry run. Only explicit `--apply` can write, and only to guarded Stitches `development`; never substitute a Crossgrade token or dataset. Studio schema source is in `sanity/`; the local CLI schema-validation invocation remains unverified.

For a read-only Sanity inspection, set `STITCHES_KNOWLEDGE_MODE=sanity-development` with `SANITY_DATASET=development`; `sanity-reviewed` requires `SANITY_DATASET=production` and fully reviewed published records. If the selected content is missing, the app shows an explicit unavailable screen instead of substituting fixtures. Demo mutation endpoints return HTTP 403 in either Sanity mode. The current explanatory unavailable page itself returns HTTP 200, a known monitoring limitation before release.

`POST /api/agent/preview` is a local-only, development-only incomplete spike, not the Fit worktable's acceptance path. It stays HTTP 503 unless explicit enable/zero-cost flags, a 32+ character server-only preview token, the exact Stitches KB and project configuration, Sanity-development mode, and a Gemini key are present. Requests require `Authorization: Bearer <STITCHES_AGENT_PREVIEW_TOKEN>` plus the current `baseSequence`, `patternVersionId`, and `snapshotFingerprint`; stale inputs are rejected before inference. The server selects the exact KB path and illustrative geometry. Its result declares `illustrative: true`, `acceptAllowed: false`, and never saves a revision. The separately gated live rehearsal passed on the owner's confirmed Free tier, but this does not authorize paid calls or public exposure.

After `pnpm build`, run `pnpm exec next start --hostname 127.0.0.1 --port 3102`, then `node scripts/browser-check.mjs http://127.0.0.1:3102/` for fixture-mode browser checks. For a separate read-only Sanity run, set `STITCHES_KNOWLEDGE_MODE=sanity-development` before starting on another loopback port, then set `STITCHES_EXPECT_ORIGIN=sanity-development` before running the browser check. The latter checks the actual Context-backed assembly note but does not call Gemini. Actual [desktop](evidence/screenshots/explore-sanity-development-desktop-light.png) and [mobile](evidence/screenshots/explore-sanity-development-mobile-light.png) captures are local read-only Sanity evidence, not cut-ready drafting or deployment proof.

The [empty-Sanity screenshot](evidence/screenshots/sanity-development-empty.png) is an actual local rehearsal of missing published Stitches data, not a successful Knowledge Base result.

## Continue in Codex

1. Open this `stitches` folder as the local project folder in Codex. If working from the ZIP, extract it first.
2. Start with [AGENTS.md](AGENTS.md), which records the project's implementation instructions. Codex supports project instructions in this file.
3. Use the prompt in [KICKOFF.md](KICKOFF.md). It tells the next session where to begin, what to preserve, and what to verify.
4. Keep [docs/STATUS.md](docs/STATUS.md) updated after each meaningful milestone so the next session knows exactly what works.

You can also continue in the existing conversation by telling Codex to work in this folder. A new conversation should read these files; it should not assume access to the original chat.

## What is included

| File | Purpose |
| --- | --- |
| [Product brief](docs/PRODUCT.md) | Audience, scope, core journey, acceptance criteria |
| [Design specification](docs/DESIGN.md) | Visual identity, interactions, mobile behavior, accessibility |
| [Architecture](docs/ARCHITECTURE.md) | Sanity, Gemini, geometry, private data, and boundaries |
| [Content model](docs/CONTENT-MODEL.md) | Documents, relationships, provenance, and versioning |
| [Build plan](docs/BUILD-PLAN.md) | Ordered milestones with evidence of completion |
| [Sources](docs/SOURCES.md) | Primary documentation and candidate caveats checked September 28–29, 2026 |
| [Current interactive design reference](design/stitches-companion.html) | Companion 2.0 concept; no accounts or API keys needed |
| [Historical desktop reference](references/stitches-desktop.png) | Earlier visual identity; current design supersedes layout |
| [Historical mobile reference](references/stitches-mobile.png) | Earlier concept, not the current phone specification |
| [Historical dark reference](references/stitches-dark.png) | Earlier study; dark mode needs deliberate revalidation |
| [Content fixture](fixtures/knowledge-graph.json) | Illustrative Sanity-shaped linked documents |
| [Agent intent contract](contracts/adjustment-intent.schema.json) | Application-side validation contract |
| [Evaluation cases](fixtures/agent-evaluations.json) | Important reasoning, ambiguity, and failure cases |
| [.env.example](.env.example) | Configuration names; contains no credentials |

## Recommended stack

- Next.js App Router, React, and TypeScript for the application and server endpoints.
- Sanity Studio and Content Lake for the reviewed, versioned pattern knowledge. Use references and parameterized GROQ queries.
- Gemini through Google's `@google/genai` SDK for interpretation, bounded tool use, and grounded explanations. The local allowlisted candidate is `gemini-3.5-flash-lite`, with an opt-in, incomplete live rehearsal.
- A deterministic TypeScript geometry layer with SVG rendering. Evaluate FreeSewing behind an adapter after checking the exact design's license, supported adjustments, and drafting behavior.
- Guest-first transactional local storage on the Node server, isolated by an opaque session; no Supabase/Auth in Companion 2.0. The historical global demo store remains fixture-only.
- Runtime validation for external data/model output and meaningful domain/browser tests. An educational Three.js construction view may be added after technical 2D pattern literacy and Make/recovery work; it is not a release substitute.

Sanity is the knowledge layer. Gemini is the interpretation and explanation layer. The geometry engine owns numerical results. An additional vector database is not needed for the first version.

## Next working milestone

Start W01 in [Sol handoff](docs/SOL_HANDOFF.md): qualify exact source/licenses and complete patterns for two genuinely different project candidates, and map one step-specific making/recovery loop. Then continue W02–W10. Guest infrastructure and UI can progress independently of physical review. The old shoulder fragments and static references do not satisfy pattern gates.

## Configuration

Copy `.env.example` to `.env.local` only when using the live development integrations. Supply secret values locally; do not paste them into chat or commit them. Project IDs and KB names are configuration, while API tokens and service keys are secrets. Balanced quotes around values in `.env.local` are accepted and were verified by the local presence checker.

Current and historical reference HTML are design artifacts, not production application source. Drawings/layouts are illustrative, and measurements are interface demo inputs, not personal data or qualified pattern output.

