---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast — the owner asked to start building without routine milestone approvals. This sequence follows the approved spec and `docs/BUILD-PLAN.md`; the owner has not separately reviewed this checklist.

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

- [ ] **2. Keep a revision and continue into Fabric and Sew**
  Becomes usable: A maker can accept or discard a sample proposal, restore the original, switch fabric width, mark steps complete, and return to their saved demo state.
  Why now: Acceptance and dependent tasks form the product loop; they also expose staleness and persistence mistakes early.
  PRD ref: `prd.md > Revision Acceptance and Dependency Status`, `Fabric and Sewing Consequences`
  Spec ref: `spec.md > Revision Service and Local Demo Store`, `Fabric and Sewing Panels`
  Build: Add server-owned local demo revisions and progress, explicit acceptance and stale-base validation, visible unknown fabric status, and instruction review indicators. Never call an illustrative arrangement feasible.
  Verify (mechanical): Domain and API tests for acceptance, idempotency, stale refusal, discard, and restore; browser journey across all stages and reload.
  Learner check: Keep a change, revisit the original, change fabric width, complete a step, then reload.
  Commit: `Persist sample revisions and stage progress`

- [ ] **3. Make Sanity's authored knowledge consequential**
  Becomes usable: The same worktable can explain an adjustment from linked reviewed Sanity records and actual Context Knowledge Base entries; an editorial correction changes the allowed result or explanation.
  Why now: This is the Sanity Challenge kernel and must be established before polishing secondary features.
  PRD ref: `prd.md > Maintained Knowledge Demonstration`, `Fit Proposal and Explanation`
  Spec ref: `spec.md > Sanity Editorial Surface`, `Sanity Snapshot Repository`, `Context Knowledge Base Adapter`
  Build: Add schemas, bounded parameterized reads, runtime graph validation, fingerprints, server-only Context MCP adapter, curated authorized sources, and a correction/review/apply/served-entry demonstration. Keep a fixture adapter for offline work.
  Verify (mechanical): Contract tests for broken and cross-version references, precedence, changed effect trail, missing KB, and stale evidence; record real before/after Context calls separately from fixtures.
  Learner check: Follow one source/rule link and compare the before/after correction in the worktable.
  Commit: `Connect reviewed Sanity pattern knowledge`

- [ ] **4. Verify one real drafting operation**
  Becomes usable: A supported, licensed pattern operation produces deterministic geometry and explicit seam/lock checks; unsupported or incomplete cases refuse a verified result.
  Why now: A drawing is not proof of a sewable adjustment.
  PRD ref: `prd.md > Fit Proposal and Explanation`, `States and Boundaries`
  Spec ref: `spec.md > Geometry and Check Engine`
  Build: Review an authorized pattern family, implement or adapt one scoped operation, preserve the neckline where supported, and version the engine and constraints.
  Verify (mechanical): Measurement-envelope and property tests for determinism, finite/closed geometry, preserved regions, seam-ease relations, invalid bounds, and replay; document maker-review limitation.
  Learner check: Try supported and unsupported cases and inspect the check reasons.
  Commit: `Verify scoped shoulder drafting operation`

- [ ] **5. Add bounded Gemini editing beside manual controls**
  Becomes usable: A natural-language shoulder request can produce the same checked proposal through actual Sanity Context retrieval and a validated Gemini tool-use loop; manual controls remain usable during outages.
  Why now: This completes the agentic route without giving the model numerical or acceptance authority.
  PRD ref: `prd.md > Fit Proposal and Explanation`, `States and Boundaries`
  Spec ref: `spec.md > Gemini Agent and Tool Dispatcher`, `Important Failure Modes`
  Build: Implement server-only SDK adapter, allowlisted tool dispatcher, limits, clarification, quota/timeout/cancellation states, source-bound explanation, and stale proposal refusal.
  Verify (mechanical): Deterministic fake-provider cases, malformed-call rejection, actual accessible model and KB calls, and fair same-corpus keyword comparison; distinguish replay and live evidence.
  Learner check: Ask for shoulder room, inspect sources, then retry with the provider unavailable.
  Commit: `Add bounded grounded fit assistant`

- [ ] **6. Prepare the broader release candidate**
  Becomes usable: Private projects, full verified fabric placement, revision-specific sewing guidance, and scale-checked export work together for the supported pattern.
  Why now: These complete the product ambition beyond the competition proof.
  PRD ref: `prd.md > What We're Building`, `prd.md > Deferred From the POC`
  Spec ref: `spec.md > Data Model`, `Fabric and Sewing Panels`, `Later private storage`
  Build: Add owner-scoped authentication/storage, authorization tests, feasible placement engine, relevant instruction variants, mobile sewing view, and versioned SVG/PDF output. Preserve honest incomplete states.
  Verify (mechanical): Privacy isolation, revision replay, layout constraints, instruction dependency, and print-scale tests plus browser accessibility checks.
  Learner check: Resume a private project, inspect a fabric result, follow a step, and print the calibration square.
  Commit: `Complete private maker workflow`

- [ ] **7. Review and package without publishing**
  Becomes usable: A locally verified, reviewable Sanity/Devpost candidate with screenshots, limitations, setup instructions, and draft submission material.
  Why now: Claims and demo assets must match observed behavior; deployment and submission remain owner-authorized actions.
  PRD ref: `prd.md > What We're Building`, `States and Boundaries`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `Decisions and Open Issues`
  Build: Run final integration and accessibility checks, capture real screenshots, document credential setup and review gates, produce drafts and a demo runbook; do not publish, deploy, or submit.
  Verify (mechanical): Fresh-install and local demo run, live/replay distinction, secrets audit, screenshot inspection, and complete evidence record.
  Learner check: Kick the tires locally and confirm the candidate and claims are ready for external review.
  Commit: `Package verified Stitches candidate`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2, while later integration work continues.
- [ ] Final kick-the-tires exploration and feedback completed — after slice 7.

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
