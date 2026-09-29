# Stitches project instructions

## Authority and read order

This is the existing Stitches application, not Crossgrade and not an empty scaffold. The owner's latest direction is the full garment-studio product. Read docs/SOL_HANDOFF.md for the implementation assignment; read docs/STATUS.md for actual evidence, docs/PRODUCT.md and devpost/scope.md for scope, devpost/prd.md and devpost/spec.md for contracts, docs/DESIGN.md and docs/EXPERIENCE-CONTRACTS.md for experience, and devpost/checklist.md for execution order.

Inspect design/stitches-studio.html and its actual screenshots before UI work. Historical references/stitches-desktop.png and references/stitches-interactive.html remain background, not the current specification. The static reference is not production implementation.

## Product intent

Build a premium, warm personal garment studio: gallery → understand garment/pieces/seams → supported customization and measurements → checked fabric plan → cutting, export and guided making. The assistant carries a multi-constraint design brief through actual tools. At least two qualified garment families and six structurally distinct looks are required for Studio 1.0; one-family work is an intermediate slice.

Sanity is the structured shared garment knowledge and maintained Context system. Gemini is the application model. Codex is the development assistant; no OpenAI API integration, branding or affiliation is required. No signup/authentication UI; isolated guest workspace storage is still required.

## Implementation and truth

- Preserve existing user code and proof tests. Extend the current Next.js/React/TypeScript repository and pinned lockfile.
- Use the new visual contract. Garment-first, not a generic dashboard or central chatbot. Phone uses focused sheets/Make mode, not a long desktop stack.
- Never import reference SVG formulas, sample layout, or scripted assistant replies as real domain logic.
- Qualify complete pattern engines/sources/rights before advertising supported production operations. A shoulder-fragment spike is not a whole garment.
- Exact deterministic tools, not Gemini, own coordinates, join/lock checks, cut counts, fabric feasibility, readiness and export.
- Keep unknown, illustrative, digitally checked and physically reviewed states separate. Never claim a model call, maker trial, deployment, benchmark win or live integration from a fixture.
- All graph refs, allowed operations, bounds, dependencies and state transitions require server validation; authoring schemas/model output are insufficient.
- Immutable kept revisions bind source/engine/measurements/options/fabric/methods. Reject stale acceptance and preserve recoverable drafts/history.
- Personal measurements/projects/photos stay private and session-scoped, outside shared Sanity. Test guest isolation and transactional updates.
- Retrieve via server-scoped actual Context MCP and fixed parameterized exact queries. No arbitrary model code/shell/GROQ, uncontrolled writes or implicit keep.
- Keep secrets in ignored local files and server-only paths; never print values. Log status/IDs/timing, not raw personal measurements.

## Authorized scope and resource boundaries

Routine architecture decisions, local dependencies/code/tests and disposable local verification are authorized. Gemini stays within available free quota and $0 paid budget. Keep separate read/editor/Context credentials. Sanity writes only to the dedicated Stitches project l4eeamth / development dataset with guarded dry-run scope and revision preconditions.

No billing, paid resources, production dataset changes, external publication/deployment, organizer messages or submission without separate explicit approval. Preparing and locally testing a Sanity Function is allowed; deploying one is not. No new tool/control-plane endpoint may be invented.

## Workflow and verification

Follow W01–W12 in devpost/checklist.md. One implementation/planning agent is the default; routine parallel work does not require delegation. Keep one next executable task. Continue independent work when a specific gate is blocked; consolidate any truly necessary owner request. Do not stop for routine milestone re-approval.

Read current installed framework docs before framework changes. Verify proportionately: relevant domain/integration tests, typecheck/build, actual browser journeys, meaningful failure cases and screenshots. Final gates include qualified geometry, print/maker evidence, two-family experience, real bounded provider execution, actual Sanity maintenance and fair benchmark.

At milestones update docs/STATUS.md, docs/DECISIONS.md and BUILD_LOG.md with actual commands, outcomes, limitations and next work. Commit coherent local changes when appropriate; never push automatically. Keep prior evidence historical rather than rewriting its provenance.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
