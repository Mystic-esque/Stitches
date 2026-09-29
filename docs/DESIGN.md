# Design specification

## Garment-first extension — September 29, 2026

Keep the linen/olive/terracotta atelier system, but open on a finished garment rather than an isolated flat pattern. The first screen should communicate a simple promise: see the garment, uncover its actual authored pieces and seams, follow how it is assembled, then make a supported version. Retain Fit / Fabric / Sew after Explore, so an experienced maker can still jump straight to the worktable. A selected part must have the same identity in the finished view, flat-piece map, seam trail, and revision-specific instruction. Use motion only to clarify this relationship, and honor reduced motion.

The first SVG garment is a labeled construction illustration. If a later 3D renderer is added, it needs front/back rotation, an exploded piece view, keyboard alternatives, and the same provenance labels; attractive rotation alone is not sufficient. Never use visual polish to suggest drape, graded sizes, or cut-readiness that the engine has not verified. On 320–390px screens, prioritize one current garment/step and readable direct controls. Avoid a grid of unavailable gallery cards.

## Reference and intent

The interactive reference and screenshots capture the approved direction, not an exhaustive final interface. Preserve the visual identity and interaction model. Rebuild them as maintainable application components rather than embedding the reference HTML as the app.

The experience should evoke a well-organized sewing table: quiet, tactile, precise, and welcoming. Show real garment context and useful diagrams. Leave room around the pattern. Keep adjustment explanations close to their consequences.

## Visual tokens

| Role | Light | Dark |
| --- | --- | --- |
| Paper | #F7F5EF | #242321 |
| Panel | #FFFDF8 | #2C2A27 |
| Ink | #34392F | #ECEBDF |
| Secondary text | #6D7167 | #B6B9AB |
| Dividers | #DEDFD3 | #4B4E43 |
| Olive action | #47573B | #BACBA5 |
| Soft olive surface | #EBEEE2 | #363C30 |
| Changed geometry | #A54831 | #EFA68F |
| Change background | #F7E9DF | #49352D |

Use an italic serif wordmark, "stitches." Editorial serif headings pair with practical sans-serif controls. Georgia and the system sans-serif are acceptable early defaults; choose licensed fonts later if needed. Use readable production sizes rather than copying the reference's smallest labels literally. Target body text around 14-16px, supporting text at least 12px, and touch inputs at least 16px.

Color carries meaning: olive for actions and selected context, terracotta for changed geometry, neutral dashed outlines for the original. Pair colors with labels and line styles. Do not recolor every pattern piece. Test actual foreground/background contrast in both themes.

## Main workspace

- Header: wordmark, project identity, honest save/version status.
- Left context on wide screens: garment sketch, selectable pieces, selected fabric.
- Main canvas: pattern geometry, original/proposed comparison, grain direction, notches, and clear piece labels.
- Adjustment panel: one active proposal, numeric controls, locks, consequences, explanation, and one primary accept action.
- Project stages: Fit, Fabric, Sew. These share project and revision state.

A selected piece must be identifiable without color alone. Give the production canvas keyboard-accessible controls, zoom/pan, fit-to-view, and a textual change summary. Preserve geometry scale in export; screen zoom is purely visual.

## Signature interaction

1. The maker selects a region or describes a fit preference.
2. Stitches shows the supported operation, amount, and constraints before acceptance.
3. The proposal changes visibly, while a dashed original remains available above the fill.
4. Selecting a changed piece reveals its dependency chain and source rule.
5. "Keep this version" commits a new project revision. Subsequent edits create a new proposal.

Show an explicit calculating state for real asynchronous checks. Do not imply a check has finished because an animation finished. Brief geometry transitions may help users follow a change; honor reduced motion. Keep manual controls responsive even if explanations arrive later.

## Fabric planning

Collect usable width, length, grain/direction restrictions, shrinkage allowance, and cut counts. Make missing information visible. Distinguish a verified feasible placement from an estimate; distinguish feasible from mathematically optimal. Show pieces on the cloth, overflow, mirrored cuts, and the assumptions used.

The reference's 140cm/110cm comparison is a visual demonstration. Its length formula and arrangement are fabricated and must be replaced.

## Mobile sewing

The reference currently stacks desktop sections. Evolve this into a focused sewing companion: current step, large diagram, applicable version, required pieces, previous/next action, and saved progress. Keep pattern adjustments reachable without placing a full desktop inspector above every sewing instruction.

Use effective targets near 44px. Ensure no horizontal page overflow at 320px, keyboard focus remains visible, dynamic updates are announced appropriately, and content works without hover. Completed steps must remain legible and revisitable.

## States to design deliberately

First project; missing measurement; units mismatch; unsupported adjustment; draft in progress; incomplete rule graph; conflicting source; failed seam check; insufficient fabric; stale proposal; save conflict; offline; Gemini unavailable; content loading failure; restored session; and all steps complete.

Use contextual messages with a next action. Keep the original reachable. Make "demo," "proposal," "geometry checked," and "ready to cut" visibly distinct.

## Design acceptance

Compare screenshots against the provided desktop reference at roughly 1024px. Verify the warm palette, typography hierarchy, restrained chrome, readable labels, and original/proposed overlay. Check mobile, dark appearance, keyboard use, and reduced motion. Improve any reference ergonomics that conflict with these criteria.

