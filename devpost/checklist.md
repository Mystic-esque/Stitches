---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast — the owner asked to start building without routine milestone approvals. This sequence follows the approved spec and `docs/BUILD-PLAN.md`; the owner has not separately reviewed this checklist.

Rebased September 29 after the owner approved the garment-first direction. Completed slices 1–2 remain truthful foundations, not evidence that the new Explore journey is finished. Sanity Challenge Path One remains the primary bar. The first full family is the Everyday blouse; additional gallery cards are not selectable until they have a connected, supported graph. Fixture, live Content Lake, live Context, geometry-verified, and maker-reviewed evidence must remain separate.

## Slices

- [x] **1. Open a usable illustrative worktable**
  Becomes usable: A credential-free Stitches app opens to Fit, shows the pattern and piece context, and lets a maker change a sample shoulder amount and compare the original.
  Why now: Proves the first full interaction and preserves the visual standard before integrations complicate it.
  PRD ref: `prd.md > Pattern and Project Context`, `Fit Proposal and Explanation`
  Spec ref: `spec.md > Worktable and Stage Navigation`, `Pattern Canvas and Piece Inspector`, `Proposal Controls`
  Build: Scaffold pinned Next.js/React/TypeScript dependencies; load a labeled sample pattern; implement a responsive worktable, keyboard-usable bounded control, and illustrative SVG overlay. Keep sample coordinates isolated from the verified drafting engine.
  Verify (mechanical): Run typecheck, domain tests, production build, and browser checks for changing the amount, comparing outlines, 320px and desktop layout, keyboard focus, and no credentials.
  Learner check: Open the local worktable and try the Fit control and original comparison; report whether the hierarchy feels like the reference.
  Commit: `Build illustrative Stitches worktable`

- [x] **2. Keep a revision and continue into Fabric and Sew**
  Becomes usable: A maker can accept or discard a sample proposal, restore the original, switch fabric width, mark steps complete, and return to their saved demo state.
  Why now: Acceptance and dependent tasks form the product loop; they also expose staleness and persistence mistakes early.
  PRD ref: `prd.md > Revision Acceptance and Dependency Status`, `Fabric and Sewing Consequences`
  Spec ref: `spec.md > Revision Service and Local Demo Store`, `Fabric and Sewing Panels`
  Build: Add server-owned local demo revisions and progress, explicit acceptance and stale-base validation, visible unknown fabric status, and instruction review indicators. Never call an illustrative arrangement feasible.
  Verify (mechanical): Domain and API tests for acceptance, idempotency, stale refusal, discard, and restore; browser journey across all stages and reload.
  Learner check: Keep a change, revisit the original, change fabric width, complete a step, then reload.
  Commit: `Persist sample revisions and stage progress`

- [x] **3. Make one garment explorable from finished form to assembly**
  Becomes usable: A maker opens a curated garment study, turns the illustration front/back, selects a visible part, sees its corresponding flat piece and seam partners, and scrubs the authored assembly order before entering Fit.
  Why now: This is the approved product entry point and makes structured garment content visibly useful before agent inference.
  PRD ref: `prd.md > Approved garment-studio amendment`, `Garment Discovery and Dissection`
  Spec ref: `spec.md > Approved technical amendment`, `Garment Graph and Explorer`
  Build: Resolve exact-version garment, piece, seam, assembly, source, and status records into one validated snapshot; reject duplicate keys, broken links, and cycles. Build responsive, keyboard-usable visual views keyed to those IDs. Label illustrative views honestly; do not pad the gallery with unsupported garments or claim accurate drape.
  Verify (mechanical): Change a fixture piece title, join, or step prerequisite and observe the explorer change; test broken/cross-version records and assembly order; run desktop/mobile/keyboard browser checks and inspect screenshots.
  Learner check: Open the blouse, select each piece, follow one seam and advance the assembly sequence.
  Evidence: Versioned graph tests, final production build, and isolated desktop/390px/320px browser journeys passed in fixture and live Content Lake modes. The illustration remains explicitly illustrative; the hands-on learner check is separately open below.
  Commit: `Build connected garment explorer`

- [x] **4. Make Sanity's authored knowledge consequential**
  Becomes usable: The explorer, Fit consequences, and agent evidence read the same Stitches versioned Content Lake graph and actual Context Knowledge Base; an editorial correction changes an observed piece/seam/assembly or supported-operation consequence.
  Why now: This is the Sanity Challenge kernel and must be established before polishing secondary features.
  PRD ref: `prd.md > Maintained Knowledge Demonstration`, `Garment Discovery and Dissection`
  Spec ref: `spec.md > Sanity Editorial Surface`, `Sanity Snapshot Repository`, `Context Knowledge Base Adapter`
  Build: Finish versioned schemas and bounded reads; validate the Stitches development seed under both raw and published perspectives; attach only its intended document types as a KB source; build entries; create a Stitches-only MCP endpoint and viewer credential; read live entries. Demonstrate a meaningful content correction, refresh, review/apply issues, and verify the changed served entry and UI behavior. Keep production untouched and fixtures labeled.
  Verify (mechanical): Contract tests for broken/cross-version references, precedence and staleness, plus genuine Content Lake and Context before/after evidence. A seed command, empty KB, or Crossgrade endpoint is not a pass.
  Learner check: Follow one authored seam/instruction source in the explorer and compare the before/after correction.
  Evidence: The dedicated Stitches development dataset contains 13 published illustrative records; the Stitches-only KB has eight entries. A guarded correction linked the neckline step to front/back bodice and changed the live explorer. Its first KB rebuild caught a false sequence arrow; a scoped instruction and second rebuild removed it. Authenticated MCP reads verified the corrected entry. The built local browser fetched a source-checked Context explanation at 1440/390/320 px. The dashboard presented zero actionable change issues, so no issue apply was fabricated. This completes the mechanical Sanity dependency proof, while the hands-on learner check remains open.
  Commit: `Connect Stitches garment knowledge`

- [ ] **5. Verify supported customization and measurement bindings**
  Becomes usable: The maker can change a supported option directly, supply only required measurements, compare original and proposal, and see deterministic piece/seam/instruction consequences. One authorized drafting operation passes its numerical gates; unsupported combinations refuse safely.
  Why now: A drawing or attractive rendered garment is not proof of a sewable adjustment.
  PRD ref: `prd.md > Fit Proposal and Explanation`, `States and Boundaries`
  Spec ref: `spec.md > Geometry and Check Engine`
  Build: Author versioned option/measurement compatibility records, review an authorized blouse pattern family, implement or adapt one scoped operation, preserve the neckline where supported, and version the engine and constraints. Keep accepted revisions immutable and stale proposals unaccepting.
  Verify (mechanical): Option-compatibility, missing-measurement, stale-basis, measurement-envelope, determinism, finite/closed geometry, preserved-region, seam-ease, invalid-bounds, and replay tests; document maker-review limitation.
  Learner check: Try one supported and one unsupported customization; inspect the exact reason and return to the original.
  Commit: `Verify supported blouse customization`

- [ ] **6. Add a bounded garment-studio agent beside direct controls**
  Becomes usable: A natural-language question can navigate a garment's pieces and assembly or request the same supported customization as the direct controls, with actual Sanity Context evidence. Manual exploration and editing remain usable during outages.
  Why now: This completes the agentic route without giving Gemini numerical or acceptance authority.
  PRD ref: `prd.md > Fit Proposal and Explanation`, `States and Boundaries`
  Spec ref: `spec.md > Gemini Agent and Tool Dispatcher`, `Important Failure Modes`
  Build: Extend the existing server-only SDK loop with allowlisted garment-context, assembly, and supported-edit tools; validate every argument/result, bound time and turns, handle clarification/quota/cancellation, tie explanations to source IDs and revision fingerprints, and keep acceptance outside the model. Use `gemini-3.5-flash-lite` only after account-specific $0 qualification.
  Verify (mechanical): Deterministic fake-provider cases, malformed-call refusal, actual model and Stitches KB calls, and a fair same-corpus keyword comparison; distinguish replay and live evidence.
  Learner check: Ask which pieces form the sleeve join, request a supported change, inspect sources, then try manual use during provider unavailability.
  Commit: `Add grounded garment-studio assistant`

- [ ] **7. Complete the private making workflow**
  Becomes usable: Private projects and measurements, verified fabric placement, revision-specific visual sewing guidance, and scale-checked export work together for the supported garment.
  Why now: These complete the product ambition beyond the competition proof.
  PRD ref: `prd.md > What We're Building`, `prd.md > Deferred From the POC`
  Spec ref: `spec.md > Data Model`, `Fabric and Sewing Panels`, `Later private storage`
  Build: Add owner-scoped authentication/storage, measurement profiles, authorization tests, feasible placement engine, assembly/technique instruction variants tied to accepted revisions, a focused mobile sewing view, and versioned SVG/PDF output. Preserve honest incomplete states.
  Verify (mechanical): Privacy isolation, revision replay, layout constraints, instruction dependency, and print-scale tests plus browser accessibility checks.
  Learner check: Resume a private project, inspect a fabric result, follow a step, and print the calibration square.
  Commit: `Complete private maker workflow`

- [ ] **8. Review and package without publishing**
  Becomes usable: A locally verified, reviewable Sanity/Devpost candidate with screenshots, limitations, setup instructions, and draft submission material.
  Why now: Claims and demo assets must match observed behavior; deployment and submission remain owner-authorized actions.
  PRD ref: `prd.md > What We're Building`, `States and Boundaries`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `Decisions and Open Issues`
  Build: Run the whole gallery → pieces → assembly → customization → revision → fabric/sew journey, final live integration and accessibility checks, capture real desktop/mobile screenshots, document credential setup and review gates, produce drafts and a demo runbook; do not publish, deploy, or submit.
  Verify (mechanical): Fresh-install and local demo run, real Sanity/Context/Gemini versus fixture/replay distinction, editorial-correction proof, secrets audit, screenshot inspection, and complete evidence record.
  Learner check: Kick the tires locally and confirm the candidate and claims are ready for external review.
  Commit: `Package verified Stitches candidate`

## Product continuation beyond the first competition candidate

The one-blouse Sanity proof does not retire the approved product vision. After the first candidate, expand the connected wardrobe to additional genuinely supported garments and multiple meaningful style operations; add the server-owned multi-constraint design brief, measurement and technique guidance, recoverable fabric/equipment alternatives, reviewed print/cutting package, and at least one physical make. Each gallery card and option is enabled only when its Sanity graph, visual mapping, deterministic tool, and maker validation support the promised behavior. These are future product gates, not claims of current implementation or reasons to substitute a cosmetic gallery before the October entry.

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2, while later integration work continues.
- [ ] Garment-first exploration feedback completed — after slice 3.
- [ ] Final kick-the-tires exploration and feedback completed — after slice 8.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship.

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap.
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate.
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse.

Activity and evidence: Pending implementation.
Route and stops: Pending.
Edit outcome: Pending.
Reflection: Pending; personal responses remain in the ignored learner profile.
Activity mode: Fast build with early and final hands-on checkpoints.

## Revisions
