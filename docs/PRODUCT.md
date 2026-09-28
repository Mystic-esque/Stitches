# Product brief

## Product and audience

Stitches helps home sewists adapt a supported pattern to their preferences, understand the consequences, plan the fabric, and follow instructions for the accepted version. The initial audience is a maker who can follow a sewing pattern but lacks confidence adjusting one. More experienced makers can inspect the same geometry and constraints in greater detail.

The product is a personal sewing studio. The pattern is the central object; the agent works beside it. The distinctive value comes from structured relationships and validated operations, not from searching sewing prose and generating generic advice.

## Signature scenario

The maker selects the Everyday blouse and asks, "Give me more room at the shoulders, but keep the neckline." Stitches identifies a supported shoulder adjustment, clarifies the amount if necessary, retrieves the correct version's rules and relationships, drafts a proposal, and highlights the affected front, back, and sleeve. The user can compare the original, inspect why each piece is affected, and keep the proposal as a new version.

The accepted change invalidates any outdated seam checks, fabric layout, and affected instruction variants. Stitches recomputes what it can and clearly identifies unresolved checks. It never uses the presence of a drawing as evidence that a pattern is ready to cut.

## Core journey

1. Worktable: pick up a project or start from a supported pattern. Show the next useful task.
2. Setup: select the exact pattern version, confirm required measurements and units, choose fit preferences, and optionally add fabric.
3. Fit: adjust manually or describe a change. Preview a proposal while preserving the original. Inspect affected pieces and the reason for each dependency.
4. Fabric: calculate a feasible placement of final pieces within usable width and available length, respecting cut counts, grain, mirrored pieces, and relevant directional restrictions. Show missing inputs.
5. Sew: use instructions tied to the accepted pattern revision. Follow prerequisite order and remember progress.
6. Export: once the required checks are satisfied, produce versioned, scale-correct print output with a calibration square and assembly markings.

## Initial release scope

- One authorized, parameterized woven-top family, selected after a drafting and licensing feasibility review.
- One carefully verified fit operation first, with neckline preservation explicitly supported or rejected by the engine.
- Metric internal coordinates with explicit unit conversion at input and display boundaries.
- Reversible proposals, immutable accepted versions, and an inspectable dependency trail.
- A finite, validated set of agent tools.
- Pattern library content in Sanity; private project data in owner-scoped storage.
- Desktop fitting and an intentionally focused mobile sewing experience.

The first application milestone uses an illustrative fixture. A verified pattern family, trustworthy fabric layout, printable output, and physical maker review are separate completion gates. Arbitrary PDF interpretation, body scanning, photorealistic drape simulation, a pattern marketplace, and industrial grading are future research areas rather than assumed launch features.

## Behavior requirements

Ambiguous requests must result in one focused question or an explicitly labeled suggested amount. No silent guess becomes an accepted edit. Unsupported requests explain the limitation and offer only supported alternatives. Conflicting rules must be surfaced with provenance. Missing source records, measurements, or seam constraints must produce an incomplete result, not a green check.

Changing measurements, pattern version, fabric assumptions, or an accepted revision must invalidate dependent results. A result should describe the revision and assumptions it applies to. A new editorial rule must not silently rewrite an already accepted user project.

The user can change ordinary controls without using the agent. A Gemini outage must leave manual editing and previously saved work usable.

## Success evidence

- A single shoulder change visibly propagates through the graph, draft, checks, layout status, and relevant instruction steps.
- Every affected-piece explanation points to actual rule and relationship records.
- A stale or invalid proposal cannot overwrite an accepted revision.
- Users can explain the proposed change and recover their original without assistance.
- The same input snapshot yields the same geometry and checks.
- A verified pattern passes numerical tests and a documented physical sewing review before being offered as ready to cut.

## Product language

Use "more room," "your preferred fit," "proposed change," and "check needed." Do not frame bodies as problems to fix. Avoid unsupported claims of perfect fit, optimization, or verification. Technical details appear when they help a maker make a decision.

