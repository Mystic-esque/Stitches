# Stitches — project-aware sewing companion

Revision: Companion 2.0, October 1, 2026. This supersedes Studio 1.0 as the product target. See DIRECTION-REVIEW.md for the comparison that led here and STATUS.md for what is actually implemented.

## Promise

**See how it's made. Make it yours.**

Show Stitches what you want to make, tell it what you have, and it helps you plan, understand, cut where qualified, sew, check and recover. It stays with the same project across visits. Its intelligence comes from the relationship between a garment's pieces, seams, techniques, materials, tools, ordered operations and likely mistakes—not from a chat transcript alone.

Primary user: a home sewist who knows basic machine operation but needs help reading a pattern, making safe supported changes and working through unfamiliar steps. Beginners can explore with more explanation; experienced makers can open concise technical details. Fashion designers can use the construction map and project planning, but unrestricted professional drafting is not promised.

## The object at the center: a sewing project

A project has a brief/reference, chosen pattern source (if any), a confirmed garment specification, private measurements, fabric/materials, equipment, experience preference, piece/step bindings, proposed and kept choices, progress, checkpoints, observed problems, attempted fixes and a versioned evidence trail. Reusable personal profiles stay in private guest storage and are copied into a project basis when used. Changing a profile later does not silently alter a kept version.

The first choice is **Start from a supported project** or **Start with my idea/pattern**. An uploaded garment photo becomes an editable list of visible features and unknowns. It can match a qualified example or create a planning project. It does not create a cutting pattern. A person with their own pattern can identify its maker/version and map pieces and steps; generic help remains available, while exact cutting claims require validated geometry and rights.

## Core journey

1. **Inspire and understand.** Browse genuinely different project examples or bring a reference. Confirm components and techniques. The agent names uncertain or hidden construction rather than inventing it.
2. **Plan.** Sanity's graph connects each chosen component to techniques, tools, fabric compatibility, measurements, procedures, dependencies, common mistakes and diagnostic tests. The agent asks only for missing information needed for the next decision. The project becomes an actionable plan with capability limits.
3. **Read the pattern.** The “pattern connected” workbench links the finished garment to flat pieces, named edges and step diagrams. It shows cut count, fold, grain, right/wrong side, notches, seam versus cut line, seam allowance and joining partners where the qualified source provides them. A selected change highlights the actual old/new edges and shows the knock-on pieces, cutting and steps. Educational diagrams with no exact source remain clearly labeled.
4. **Prepare.** Check measurements, fabric width/amount/direction, equipment, materials, pattern version and cutting prerequisites. A source-qualified pattern can generate or display a checked layout and print/export package. A planning project instead shows the missing pattern information and a safe preparation checklist.
5. **Make.** One focused operation at a time: pieces, orientation, authored allowance, micro-actions, diagram, reason, checkpoint and “Done.” The app remembers where the maker stopped. “Explain,” “Show on pattern,” and “I'm stuck” are always local to the active step.
6. **Check and correct.** The maker records a symptom, test result and optionally a close-up photo. Stitches proposes source-backed possible causes and the next discriminating check, not an unearned diagnosis. Confirmed fixes update the plan/progress; supported alterations become reviewable proposals, never automatic pattern mutations.
7. **Continue.** A resumed project shows what happened, what changed and the next eligible step. Corrections to shared Sanity knowledge trigger specific review notices without rewriting historical instructions or marking physical work undone.

## Content and patterns

The collection is a set of **distinct projects**, not a grid of recolored templates. Release requires at least two source-qualified example projects from different construction families (a woven top and a skirt are candidates, not prequalified choices), with real garment visuals, complete piece/step relationships, rights and maker evidence. A third editorial/inspiration story can demonstrate the planning path but must say it needs a pattern before cutting. More examples may be added when qualified; arbitrary numbers of near-identical variants are not a quality metric.

A supported example may offer a small number of truly connected changes—such as hem length or adding a pocket—only if its engine/source yields the updated complete pieces, joins, cut plan and instructions. We are not building an unrestricted professional CAD system in this release. Three.js may add an educational construction view after the 2D pattern/cut/step link is correct; 3D is not the primary proof.

The pattern itself is a versioned semantic definition drafted from confirmed measurements and supported options, not a collection of SVG files. The generated SVG/interactive vector is the readable view of a measured, checked artifact. The agent requests named, bounded sewing changes and reports their downstream effects; it never edits an anonymous curve directly. Engine selection and source rights must pass `PATTERN-ENGINE-DECISION.md` before Stitches calls any output cut-ready.

Pattern files or garment photos belonging to a user remain private. Stitches cannot redistribute an externally authored pattern unless its rights allow it. An exported project plan can reference that source; exact pattern pages are included only when generation or redistribution is authorized and their geometry is checked.

## Sanity and agent

Sanity Content Lake authors public garment examples, component taxonomy, pattern bindings, fabric classes, equipment, techniques, procedures, step prerequisites, common mistakes, issue hypotheses, diagnostic tests, corrections and source/review status. The existing dedicated Stitches Context Knowledge Base supplies maintained explanations. Exact graph traversal and deterministic checks govern eligibility; Gemini chooses bounded registered tools, asks questions and explains checked outcomes.

The proof moment is a maker asking, “Why won't this sleeve meet the armhole?” during their own sleeve step. Stitches knows the selected pattern, sleeve and armhole edges, notches, fabric, equipment and prior actions. It checks authored relationships, asks the maker to compare the relevant marks or stitch lines, then recommends a supported next action. Where no exact pattern binding exists, it gives educational checks and requests the missing data.

A second proof is editorial maintenance: correcting a shared method in Stitches development changes the applicable steps/troubleshooting for two different projects. The served Context entry is checked separately and stale proposals are not silently accepted. Both roles of Sanity must be visible to reviewers.

## Readiness and language

- **Plan only:** components and techniques with unknowns; no cut, yardage or fit guarantee.
- **Guided making:** source-bound procedure and confirmed project sequence; step applicability is inspectable.
- **Pattern mapped:** exact piece/edge/fold/grain binding to a qualified version.
- **Cut checked:** deterministic geometry, counts, fabric layout and print calibration checks passed.
- **Maker reviewed:** a physical make is recorded for this exact design/options/material scope.

A reviewed design is not a promise of personal fit. The UI says what it knows and what the maker must check. No source, model or visual illustration can skip a gate.

## Release target and later work

The complete first application includes project creation and memory, distinct qualified example projects plus personal planning, private reusable profiles, visible pattern literacy, supported changes, step-focused making, contextual troubleshooting with optional photo, Sanity-backed maintenance, actual bounded Gemini tool use, responsive accessible UI, locally reviewable evidence and recovery. Physical print/maker trials gate cut-ready claims.

Later: arbitrary pattern CAD/import, automatic photo-to-pattern drafting, simulated drape/fit, account sync and collaboration, large marketplace and fully automated garment diagnosis. Preserve extension points without making these prerequisites to a useful first companion.

No signup, paid provider use, external deployment, production Sanity mutation or submission is authorized in this work. Scope and implementation details are in ../devpost/scope.md, ../devpost/prd.md and ../devpost/spec.md.

