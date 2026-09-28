---
doc: prd
status: approved
---

# Stitches — Product Requirements

Stitches is a personal sewing studio for a home sewist who wants to change a supported pattern and understand every consequence before keeping the change. Sanity Challenge Path One is the primary entry. This document defines the first complete demonstration; the broader product remains in `docs/PRODUCT.md`.

Sources: `scope.md > The Unique Kernel`, `Who It's For`, `The Core Loop`, `What "Working" Looks Like`, and `The POC Boundary`.

## The Core Journey

1. The maker opens the worktable, selects the supported woven-top pattern and its exact version, and sees the current accepted pattern, its readiness status, and the next useful task. Sample measurements and fabric are identified as demo inputs until a private profile exists.
2. In Fit, the maker requests more shoulder room while keeping the neckline, or uses the available manual control. If the amount or required measurements are missing, Stitches asks for the one missing input or clearly labels a suggested amount before preparing a proposal.
3. Stitches shows the operation, amount, neckline constraint, applicable source and rule, changed pieces, and checks that remain open. The proposal overlays the original; the maker can select a piece to learn why it changed. A proposal is never labeled ready to cut merely because an outline appears.
4. The maker rejects the proposal or selects “Keep this version.” Acceptance creates a new revision; the original remains available. The accepted revision changes the status of dependent seam checks, fabric planning, and relevant sewing instructions.
5. In Fabric, the maker sees whether their specified width and length are sufficient, insufficient, or still unknown, with assumptions and missing inputs. In Sew, they see steps tied to the accepted revision and can mark progress.
6. For the Sanity demonstration, an editor corrects a relevant reviewed source or rule. After that correction is available to the agent, repeating the request shows a changed supported proposal or a clear refusal, with the new source reason. A proposal based on older evidence cannot be accepted. An already accepted revision remains visible and is marked for review if affected.

## Screens and Layout

The worktable opens to a project and its next action. Fit is the main workspace: pattern canvas in the center, garment/piece context beside it on wide screens, and a proposal panel next to the changed geometry. Fabric and Sew are stages of the same project and accepted revision. On small screens, the active task comes first; sewing steps have a focused reading view rather than a squeezed desktop inspector. The editorial correction happens in the content authoring surface and appears in the maker experience through a refreshed explanation or restriction.

Source: `scope.md > The Core Loop` and `Inspiration & Identity`.

## Look and Feel

The maker should feel they are at a quiet, well-organized sewing table. Use the established linen, olive, and terracotta direction, editorial serif headings, readable practical controls, and a pattern-centered workspace. Mark changed geometry with terracotta and the original with a neutral dashed outline; give both text labels so color is not the only signal. Preserve the hierarchy of `references/stitches-interactive.html` and the design decisions in `docs/DESIGN.md`, improving its smallest labels and mobile ergonomics.

Source: `scope.md > Inspiration & Identity`.

## Features and Behavior

### Pattern and Project Context

The maker selects a specific supported pattern version. The worktable distinguishes the accepted revision from an unaccepted proposal and identifies whether the current content is reviewed, illustrative, incomplete, or affected by a later correction. A first-time maker gets a guided starting action. Personal measurements and inventory never appear as shared pattern knowledge.

Observable success: changing the selected pattern version changes the applicable rules and supported options; a missing or unreviewed version cannot produce a verified proposal.

Source: `scope.md > The Unique Kernel` and `The Core Loop`.

### Fit Proposal and Explanation

The maker can request or manually select the supported shoulder adjustment. Stitches shows the interpreted amount, units, locked neckline, affected pieces, and a concise reason for each effect. Selecting a changed piece reveals the linked rule, relationship, and source. The preview keeps the original available and clearly separates a proposed outline from passed checks. Unsupported changes, missing measurements, and source conflicts return a focused next action rather than a guessed edit.

Observable success: the same supported input and content version give the same proposed change and checks; changing the rule relationship changes the computed effect trail. The maker can understand why the front, back, or sleeve was touched without reading an agent transcript.

Source: `scope.md > The Unique Kernel`, `The Core Loop`, and `What "Working" Looks Like`.

### Revision Acceptance and Dependency Status

Only an explicit maker action accepts a proposal. The result is a new revision with its original preserved. The accepted version identifies the content and assumptions used. If the project, content, or measurement basis changes while a proposal is open, acceptance refuses that stale proposal and offers a fresh preview. Fabric and instruction results that depend on the old version become visibly due for review rather than silently current.

Observable success: rejecting leaves the accepted revision unchanged; accepting advances it once; attempting to accept an old proposal after a correction is refused; reopening the project shows the accepted revision and unresolved work.

Source: `scope.md > The Core Loop` and `What "Working" Looks Like`.

### Fabric and Sewing Consequences

Fabric shows usable width and available length alongside requirements of the accepted pattern revision. The result is “feasible” only after an actual placement check; otherwise it is “insufficient” or “unknown,” with the reason. Sew shows the instructions and prerequisite order applicable to that same revision. An affected step is called out when the fit revision changes. Completed steps remain readable and can be revisited.

Observable success: after accepting a fit change, prior fabric and affected instruction results no longer appear current; the maker can identify what to recheck and which instruction applies now.

Source: `scope.md > The Unique Kernel` and `What "Working" Looks Like`.

### Maintained Knowledge Demonstration

An editor can correct a reviewed source, applicability rule, or precedence decision. Once the update is available, the maker sees the resulting change in the supported action or an explicit limitation, including the source that caused it. Previous accepted versions stay intact and affected projects show a review notice. The demonstration includes the before and after result and a fair comparison with keyword retrieval over the same source material; any claimed advantage must match the observed result.

Observable success: the same maker request yields a traceably different result after a relevant correction without changing application behavior by hand. The maker can see which source governs the updated answer.

Source: `scope.md > The Unique Kernel`, `What "Working" Looks Like`, and `Event Evidence`.

## States and Boundaries

- **First use:** clear sample project and starting action; sample measurements and illustrative geometry are labeled.
- **Waiting or incomplete:** a real calculation or knowledge refresh displays its progress; missing measurements, unknown seam constraints, unknown fabric inputs, or a pending knowledge refresh do not appear successful.
- **Unsupported or conflicting:** the maker sees the limitation and its source, with a focused question or available supported alternative.
- **Stale:** acceptance is refused if its pattern, content, or project basis changed; the maker can request a current proposal without losing the accepted version.
- **Provider unavailable:** manual controls and previously accepted work remain usable; no invented agent explanation appears.
- **Accepted:** the new revision and its exact basis are visible; dependent tasks show current or needs-review status.
- **Readiness:** “demo,” “proposal,” “geometry checked,” and “ready to cut” are distinct. Ready to cut requires the documented pattern and physical review gates.

## Product Decisions

- Sanity entry first, Devpost Basics second — the live structured knowledge journey sets the required demonstration.
- Pattern is the central object, with Fit / Fabric / Sew stages — the agent assists beside the work rather than replacing it with a chat screen.
- One supported woven-top family and one shoulder adjustment first — this is the smallest coherent example of a rule propagating through pattern, fabric, and instructions.
- Preserve original and explicit acceptance — the maker stays in control and can compare the consequence before committing.
- Keep private maker information out of shared pattern content — authored knowledge and personal measurements have different audiences.

## What We're Building

The complete journey above, live authored knowledge and agent retrieval, one verified supported adjustment, a visible editorial correction consequence, stale-proposal refusal, and a clear demonstration of incomplete and unavailable states. A fixture-only or illustrative result is an intermediate build state, not the final Sanity entry.

## Deferred From the POC

Additional garment families and edits, private account management, full fabric nesting, scale-correct export, and expanded mobile sewing guidance. Each needs its own validation; they do not prove the first connected-content journey. They remain in the product plan. Physical maker review is required before any ready-to-cut claim.

## Non-Goals

Arbitrary PDF interpretation, body scanning, photorealistic drape, a marketplace, and industrial grading. None is needed to show the first adjustment and knowledge correction responsibly.

## Open Questions

- The exact authorized pattern design and validated shoulder operation are feasibility decisions for the technical plan and build. Until reviewed, no numerical demo range is a cut-ready promise.
- Account-based persistence and full printing remain release milestones; the competition demo can use clearly labeled sample project data while preserving the accepted-version interaction.
