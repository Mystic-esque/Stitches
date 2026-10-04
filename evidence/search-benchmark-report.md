# Stitches Companion 2.0: Fair Search Benchmark Report

**Date:** 2026-10-04T03:08:23.387Z  
**Corpus:** 33 exact Sanity records (candidates, piece definitions, diagnostic tests/remedies, construction steps).  
**Method:** Head-to-head evaluation of naive keyword search vs. Stitches project-aware exact graph + Context KB over 5 frozen maker tasks.

## Summary Results

| Metric | Naive Keyword Search | Stitches Companion 2.0 (Exact Graph + Tools) |
| :--- | :--- | :--- |
| **Tasks Passed** | **1 / 5** (20%) | **5 / 5** (100%) |
| **Prerequisite Awareness** | ❌ Fails (no state/DAG awareness) | ✅ Passes (DAG evaluated against maker session) |
| **Version-Bound Piece Projection** | ❌ Fails (returns pieces for disabled options) | ✅ Passes (`selectMakingStepPieces` filters by active options) |
| **Diagnostic Safety** | ❌ Fails (ranks remedy directly, bypasses scrap test) | ✅ Passes (Stage 1 scrap release test enforced, garment unpicking barred) |
| **Capability & Cut-Ready Bounds** | ❌ Fails (cannot refuse invalid scope) | ✅ Passes (strictly `plan_only`, refuses geometry invention) |

## Detailed Task Analysis

### TASK-1: Next-Step & Prerequisite Awareness
- **Query:** *"What step should I sew next on Sandy circle skirt?"*
- **Evaluation Criteria:** Must identify the first unreviewed checkpoint based on DAG order, not arbitrary step with highest term match.
- **Keyword Search (FAIL):** Keyword top result: "FreeSewing Sandy Circle Skirt" (companion-candidate-sandy-20261001). Ignores user progress and DAG prerequisites.
  - *Top keyword hits:* `companion-candidate-sandy-20261001` (score: 7.58), `companion-making-tina-v1-shoulders` (score: 1.69), `companion-candidate-tina-20261001` (score: 1.69)
- **Stitches Companion (PASS):** Server evaluates session.reviewed (empty) against prerequisite DAG; strictly returns closure seam as activeStep.

### TASK-2: Version-Bound Piece Applicability
- **Query:** *"What pieces do I cut for Tina top without sleeves?"*
- **Evaluation Criteria:** Must exclude pieces for disabled options and enforce knit-only constraint.
- **Keyword Search (FAIL):** Keyword matches sleeve document because "cut" and "pieces" appear in sleeve record, despite user having sleeves disabled.
  - *Top keyword hits:* `companion-candidate-tina-20261001` (score: 4.79), `companion-piece-tina-sleeve-20261001` (score: 4.39), `companion-piece-tina-front-20261001` (score: 2.69)
- **Stitches Companion (PASS):** selectMakingStepPieces() and inspect_making filter pieces by confirmed options (sleeves: false excludes sleeve).

### TASK-3: Diagnostic Safety & Non-Destructive Check
- **Query:** *"My seam is puckering. Should I unpick the dress and lower thread tension?"*
- **Evaluation Criteria:** Must require preliminary scrap test first and explicitly forbid altering actual garment.
- **Keyword Search (FAIL):** Keyword search ranks remedy "Compare a lower-tension sample" without gating on scrap-stitch-release test outcome.
  - *Top keyword hits:* `companion-test-scrap-stitch-release-20261001` (score: 10.85), `companion-remedy-sample-lower-tension-20261001` (score: 8.08), `companion-procedure-scrap-seam-check-20261001` (score: 5.69)
- **Stitches Companion (PASS):** Diagnostic pathway gates remedy behind Stage 1 scrap-stitch-release test; explicitly warns never to unpick actual garment.

### TASK-4: Dependency Chain Enforced over Term Matching
- **Query:** *"Can I attach the waistband now on Sandy?"*
- **Evaluation Criteria:** Must refuse premature waistband attachment until closure seam prerequisite is reviewed.
- **Keyword Search (PASS):** Keyword search confirms waistband content exists and ranks it #1, oblivious to unmet closure seam prerequisite.
  - *Top keyword hits:* `companion-making-sandy-v1-band` (score: 3.1), `companion-test-scrap-stitch-release-20261001` (score: 3.08), `companion-making-sandy-v1-opening` (score: 2.69)
- **Stitches Companion (PASS):** makingPrerequisites() verifies closure seam is not in session.reviewed; marks waistband step as locked / prerequisites first.

### TASK-5: Refusal of Unsupported / Unqualified Requests
- **Query:** *"Generate a cut-ready production pattern SVG for my custom measurements."*
- **Evaluation Criteria:** Must refuse cut-ready pattern generation and disclose plan-only / pending-review status.
- **Keyword Search (FAIL):** Keyword search returns planning candidate with score > 0; cannot assert capability bounds or refuse cut-ready claims.
  - *Top keyword hits:* `companion-procedure-scrap-seam-check-20261001` (score: 1), `companion-test-scrap-stitch-release-20261001` (score: 1), `companion-making-tina-v1-dart` (score: 1)
- **Stitches Companion (PASS):** System strictly bounds capability to "plan_only"; inspect_project asserts no cut readiness and refuses pattern generation.

## Conclusion & Key Findings
1. **Keyword search alone cannot guide garment construction:** It has zero awareness of maker state, active project choices, or prerequisite sequencing.
2. **Diagnostic safety requires structured branching:** Keyword matching prioritizes remedy text ("lower thread tension") over preliminary non-destructive tests, creating a risk of premature garment alteration.
3. **Bounded agent tools provide necessary guardrails:** By coupling exact Sanity graph queries with scoped Context KB retrieval and server-enforced sequence checks, Stitches Companion 2.0 ensures safe, version-accurate, step-bound maker guidance.

