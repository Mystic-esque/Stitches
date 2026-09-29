# Product brief

## Approved product direction — September 29, 2026

Stitches is now a **garment-first creative sewing studio**, not chiefly a shoulder-adjustment demo. A maker should be able to discover a supported finished garment, turn it over, inspect its linked flat pieces and seams, understand the assembly order, make a supported change with ordinary controls or natural language, and see revision-specific consequences across the garment, fabric questions, and sewing guide. The agent is a knowledgeable studio assistant beside this direct-manipulation workflow; it is not the whole product.

The first complete family is the Everyday blouse. A one-garment release is honest only if the journey from garment to pieces to assembly to safe customization genuinely works. More garment cards may be authored later through Sanity; do not pad the gallery with fake selectable patterns. Sanity is essential to the garment/piece/seam/instruction graph, the compatibility rules, editorial provenance, and the Context Knowledge Base that grounds the assistant. A published content correction must change an observed decision or explanation. Gemini interprets requests and narrates verified tool output, but does not draft freehand geometry or infer cut-readiness.

The visual experience may use an attractive rotatable or exploded illustration, with a future Three.js viewer if useful. Until true graded geometry and fabric simulation are verified, label rendered garments and flat shapes as construction illustrations, not accurate drape or body fit. User measurements should shape only operations supported by a reviewed pattern adapter; missing measurements lead to a focused question, not invented coordinates. This approved direction supersedes any reading of the older signature scenario below as the whole product scope.

The full product ambition is a maker's design-to-making partner, not a lookup assistant with one slider. A brief such as “make this top longer, keep its neckline, use my available fabric, and guide me through a sleeve I have never sewn” should become a coordinated plan: identify supported design options, request only necessary measurements, run deterministic pattern and fabric tools, expose tradeoffs and unknowns, retain a revision, then teach the exact construction sequence for that version. The agent may choose, sequence, and inspect allowed tools, while the maker can perform the same supported actions directly. A failed constraint should lead to a specific recoverable alternative, never an invented feasible result.

The connected wardrobe can grow to multiple reviewed garment families and variations as their Sanity-authored piece graphs, visual mappings, compatibility rules, sources, and deterministic operations are completed. The first blouse is the competition's coherent proof slice, not a permanent one-garment product limit. A future pattern/cutting/instruction package must correspond to the same accepted revision; visual renderings alone cannot qualify it. A physically made example is needed before claiming a cut-ready garment.

Success for the refreshed MVP: a visitor can move through one visually polished garment study; select a piece and see its real authored seam links; scrub an authored, prerequisite-safe assembly story; request or directly set a supported customization; compare original/proposal; save an immutable revision; see stale fabric and sewing evidence re-evaluated; and receive a bounded, cited agent explanation from actual Context retrieval in live mode. The current fixture is only the first illustrative slice of that loop.

## Product and audience

Stitches helps home sewists adapt a supported pattern to their preferences, understand the consequences, plan the fabric, and follow instructions for the accepted version. The initial audience is a maker who can follow a sewing pattern but lacks confidence adjusting one. More experienced makers can inspect the same geometry and constraints in greater detail.

The product is a personal sewing studio. The pattern is the central object; the agent works beside it. The distinctive value comes from structured relationships and validated operations, not from searching sewing prose and generating generic advice.

## Signature scenario

The maker selects the Everyday blouse and asks, "Give me more room at the shoulders, but keep the neckline." Stitches identifies a supported shoulder adjustment, clarifies the amount if necessary, retrieves the correct version's rules and relationships, drafts a proposal, and highlights the affected front, back, and sleeve. The user can compare the original, inspect why each piece is affected, and keep the proposal as a new version.

The accepted change invalidates any outdated seam checks, fabric layout, and affected instruction variants. Stitches recomputes what it can and clearly identifies unresolved checks. It never uses the presence of a drawing as evidence that a pattern is ready to cut.

## Core journey

1. Discover and Explore: choose a genuinely supported garment, turn its finished illustration, select flat pattern pieces and seam partners, and follow an authored assembly story.
2. Worktable: pick up a project or start from that garment's exact pattern version. Show the next useful task.
3. Setup: confirm required measurements and units, choose supported fit/style preferences, and optionally add fabric and available equipment.
4. Shape: adjust manually or describe a multi-part goal. Preview only supported operations while preserving the original. Inspect affected pieces, compatibility, and the reason for each dependency.
5. Fabric: calculate a feasible placement of final pieces within usable width and available length, respecting cut counts, grain, mirrored pieces, and relevant directional restrictions. Show missing inputs and supported alternatives.
6. Sew: use instructions tied to the accepted pattern revision and selected technique. Follow prerequisite order, ask for the needed level of guidance, and remember progress.
7. Export: once the required checks are satisfied, produce a versioned, scale-correct pattern, cutting list, materials, and construction package with calibration and assembly markings.

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

