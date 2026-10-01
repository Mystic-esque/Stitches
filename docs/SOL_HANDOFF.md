# Stitches Companion 2.0 — implementation handoff for Sol

## Assignment and decision
The owner rejected the Studio 1.0 reference's recolored gallery and simplified garment→pieces→assembly center. Build the better product defined in PRODUCT.md: a project-aware sewing companion whose signature is **pattern literacy at the cutting table and useful help at the exact making step**. The supplied research is assessed in DIRECTION-REVIEW.md. The older dark “pattern connected” screenshot shows valuable teaching semantics, but its three-column composition and unattractive illustrative blouse are not mandatory. Improve the screen if you can serve the tasks better.

The tagline remains “See how it's made. Make it yours.” Sanity is essential shared garment/construction/diagnostic knowledge. Gemini is a bounded tool-using planner. Exact checks, private project state and source provenance—not model prose or a 3D animation—determine what the app may claim.

## Read order
1. AGENTS.md and STATUS.md for boundaries and verified starting point.
2. PRODUCT.md, DIRECTION-REVIEW.md, ../devpost/scope.md and ../devpost/prd.md for the user journey and capability ladder.
3. DESIGN.md, EXPERIENCE-CONTRACTS.md and current ../design/stitches-companion.html for visual/interaction target. September 29 stitches-studio.html is historical.
4. ../devpost/spec.md C01–C10, CONTENT-MODEL.md, ARCHITECTURE.md and ../devpost/checklist.md W01–W10.
5. PATTERN-ENGINE-DECISION.md before implementing any piece geometry, variation, SVG interaction or printable output.
6. Read installed Next.js guidance before modifying framework code and current official provider docs for each relevant integration.

Later owner instruction wins. Do not take a reference screenshot or proposed Sanity type as production proof.

## Verified baseline to preserve
Commit 84e3b54 contains the illustrative explorer/worktable, exact Sanity Content Lake and real Context KB proof, assembly conflict check, bounded opt-in Gemini preview and 44 regression tests. Commit e06535b added the prior Studio 1.0 static design reference only. The October 1 companion package changes plans and proposed Sanity schema; it has not yet implemented a new runtime journey, seeded new graph records or qualified a printable garment. Preserve that distinction in screenshots, demos and claims.

Existing useful modules: `src/domain/knowledge/resolve-pattern.ts`, `src/server/knowledge/{repository,context-mcp,assembly-evidence}.ts`, `src/server/agent/{gemini-session,fit-loop}.ts`, demo revision and browser tests. The shoulder fragment and blouse drawing remain illustrative. Replace shared demo persistence with guest-owned transactional projects rather than allowing private data into Sanity or global JSON.

## First vertical slice
W01: inspect exact source/version/licensing/output rights for two different constructions (top and skirt are candidates, not predetermined). Map all required pieces, folds, grain, counts, joining edges, steps and one common problem/recovery case; record what is unknown and which capabilities each source supports. Spike FreeSewing with one exact rights-cleared design at two measurement/option inputs; prove or reject stable semantic IDs and a measured artifact separate from SVG. A pretty garment image or library example is not a source. If a source is not complete or distributable, keep it plan-only and continue independent guest/UI/making work while looking for a qualified alternative.

Then W02/W03/W04/W06 can produce an end-to-end **project → selected pattern detail → prepare → one make step → stuck/test → continue** slice using explicitly labeled fixtures until actual development content is authored. Do not solve a missing content gate with canned model replies. Add the second distinct qualified project and shared Sanity method/diagnostic before the maintenance demo. W05 exact geometry/export can advance only when the source/physical evidence permits it.

## Execution contract
For every small coherent implementation task: state input basis, files, acceptance IDs, test command and rollback. Keep one working slice. At milestone end record actual tests/browser captures/live-vs-fixture provenance and unresolved gates in STATUS.md and BUILD_LOG.md, update DECISIONS.md, commit locally. Do not push. Do not ask about routine libraries/colors or milestone continuation.

Minimum examples:
- Pattern: piece selection reveals fold/grain/cut count and mating seam/step; a missing exact binding shows an educational-only state.
- Engine: a bounded semantic operation redrafts all pieces from confirmed inputs; generated SVG is a view, never the pattern state. Model-authored path strings or unconstrained point moves are rejected. Record deterministic geometry and rights checks before cut-ready claims.
- Making: progress is tied to kept version and step fingerprint; next eligible step follows the authored DAG, not displayed list order.
- Diagnostic: symptom → discriminatory test → result → hypothesis/remedy eligibility; uncertain or risky state stops safely.
- Agent: inspect project → exact graph + served KB → run checks → explain actionable next step; cancellation/quota resume without duplicate work.
- Sanity: correct shared reviewed method in development → two different projects affected → pending advice stale → served KB separately verified.
- Cut: complete geometry/layout/scale/rights/physical receipts required before cut-ready export.

## Visual quality bar
The reference should feel like a premium, calm maker's workbench, not a chatbot or catalog mockup. Show distinct silhouettes and real teaching details. Keep technical flat pieces prominent and readable with cut/fold/grain/notch/allowance semantics, changed-edge overlays and consequences. Make/diagnosis is step-first and phone-friendly. There is freedom to supersede the earlier three-column composition if a better task layout tests well. Three.js can be an optional educational assembly layer only after correct 2D and accessibility.

## Provider boundaries
Use existing verified separate Viewer/Editor/Context credentials. Stitches `l4eeamth/development` only for guarded writes; production untouched. Keep actual Context MCP KB retrieval and exact fixed Content Lake reads separate. Free-tier Gemini only under $0 paid budget; no unapproved paid fallback. No external Function/site deployment, organizer messages or submission. No guest photos/measurements in shared Sanity. No arbitrary model code/shell/GROQ or unreviewed destructive physical advice.

## Finish and report
A finished local candidate needs two genuinely different project journeys, useful issue recovery, real provider/Sanity traces, fair keyword baseline, deterministic failure tests, actual responsive screenshots, print and maker evidence for any cut-ready claims, and release/submission drafts. If physical review or rights are missing, keep the app useful while marking only cut-ready claims blocked. Never call a static reference, fixture response or proposed schema a shipped feature.
