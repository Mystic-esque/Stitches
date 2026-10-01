# Architecture — Stitches Companion 2.0

Target architecture. See ../devpost/spec.md C01–C10 for enforceable contracts and STATUS.md for actual implementation/evidence.

## Project is the durable unit
A guest-owned project—not an assistant conversation or a gallery card—binds idea/source, confirmed garment features, private measurement/material/tool profile, supported choices, active making step, checks, issue history, kept revisions and evidence. Both example and own-idea projects use this state model. Planning-only projects can be useful without pretending to own an exact pattern.

```text
Sanity exact graph (components → patterns/pieces/seams → methods/steps → issues/tests/remedies)
        │ fixed scoped reads and semantic fingerprints
Context KB (maintained explanations) ─── separate served verification
        │
Guest project snapshot + private profile + active step + observations
        │
Server resolver/registered deterministic tools ← bounded Gemini planner
        │
checked plan / proposal / step / diagnostic test / consequence report
        │ explicit maker confirmation
immutable revision + progress + issue history + artifact manifest
        │
2D pattern-connected board · prepare · make · recovery · qualified export
```

## Trust boundaries
Browser presents/collects and may hold provisional UI state. Server owns guest scope, fixed Sanity queries, Context retrieval, source/provenance checks, pattern geometry/layout, diagnostic selection, run checkpoints and transitions. Durable local transaction store isolates guest projects/profiles; temporary validated images have expiry and explicit deletion. Sanity development holds shared public knowledge only, not private maker data. Gemini may choose registered tools and explain checked outcomes, never execute arbitrary shell/GROQ, keep a revision, certify fit or override a validator.

Measurement notes have dimension-aware private storage: millimetre lengths and a separate optional degree map. Exact public measurement labels select the form, not its private values. Hidden/legacy measurements survive brief edits without relabelling, and unknown labels are not guessed. A future engine adapter must map and validate these inputs explicitly; recording them cannot promote a plan to a measured or cut-ready pattern. Profiles must be copied by an explicit revision-making action, never live-linked to previously kept project inputs.

## Pattern authority, not SVG authority
`PATTERN-ENGINE-DECISION.md` is the binding design for the technical workbench. Sanity owns reviewed semantic relationships, operation applicability and sources; private project state owns confirmed inputs and revisions; a deterministic drafting adapter owns exact geometry. It emits an immutable, versioned `PatternArtifact` with physical units and stable piece/edge/notch IDs. SVG/React renderers consume that artifact and expose semantic selection back to steps and knowledge; they do not store, infer or mutate the pattern. A proposed alteration is a registered bounded *sewing operation* followed by a full redraft and independent validation, not a model-generated SVG path or arbitrary point move. FreeSewing is the first engine to spike, subject to the decision document's source, rights and binding gates; SeamScape is a command-boundary reference only under the $0 budget.

## Source and capability ladder
The existing shoulder fragment and old blouse artwork remain illustrative. Exact pattern workbench layers require licensed complete source data and stable piece/edge IDs; cutting/printing also require deterministic numerical and physical review receipts. A photo or 3D mesh is not that data. `plan_only`, `guided_making`, `pattern_mapped`, `cut_checked`, `maker_reviewed` are explicit capability claims with scope and evidence.

A project basis is a canonical semantic hash of source/version, measurements, material/equipment, options, method and content fingerprints. A content correction marks affected future advice/proposals for review but does not silently rewrite completed physical work. Kept versions and diagnostic attempts remain auditable.

## Recovery loop
The active instructionStep supplies piece/edge/method context. An issuePattern supplies scoped hypotheses; diagnosticTest chooses a safe discriminating observation; remedy becomes eligible only after relevant outcomes. The maker confirms photo observations and remedy results. Missing/conflicting evidence yields a safe unresolved state. The bounded agent orchestrates this loop; deterministic server code owns applicability.

## Existing code and migration
Preserve exact Content Lake and actual Context adapters, Gemini signed tool proof, immutable state ideas and 44 historical regression tests. Replace shared demo state with guest-owned transactional state while keeping a stable illustrative demo route until parity. Build first 2D educational workbench and step-specific recovery; Three.js may consume the same versioned IDs later but is not the product's core or a drape claim.

No external deployment, paid model, production Sanity dataset write or deployed Function is authorized. Prepare adapters and local tests only. Do not confuse a reference screenshot with working production UI.

