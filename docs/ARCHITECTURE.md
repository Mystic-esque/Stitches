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

Implemented read-only preparation assistant: `companion-tools.ts` supplies argument-free project/preparation, exact catalog and server-selected dedicated KB reads. The durable `run-controller.ts` reserves attempted requests and acknowledges responses in private SQLite before continuing tools; `gemini-session.ts` hydrates exact signed provider Content and constrains eligible reads with provider-native tool controls. Three evidence reads plus explanation fit four model attempts; final actual KB hash reread rejects a rewritten served entry. Bind project sequence/hash, catalog/diagnostic and full history head/hash; re-read around operations. Provider context withholds body values/private prose/photos. Consent and historical run/control UI pass actual five-width production browser checks; strict API and deterministic recovery checks pass separately. Two actual source-linked provider tasks pass, including a labeled injected local read interruption recovered without another model request. Unknown provider outcomes cannot resume, cancellation/staleness defeats late answers, and all prose remains unverified planning insight. Full qualified making/proposal/drafting tools and maker-task/benchmark gates remain open. See AGENT-RUNBOOK.md.
Browser presents/collects and may hold provisional UI state. Server owns guest scope, fixed Sanity queries, Context retrieval, source/provenance checks, pattern geometry/layout, diagnostic selection, run checkpoints and transitions. Durable local transaction store isolates guest projects/profiles; temporary validated images have expiry and explicit deletion. Sanity development holds shared public knowledge only, not private maker data. Gemini may choose registered tools and explain checked outcomes, never execute arbitrary shell/GROQ, keep a revision, certify fit or override a validator.

Measurement notes have dimension-aware private storage: millimetre lengths and a separate optional degree map. Exact public measurement labels select the form, not its private values. Hidden/legacy measurements survive brief edits without relabelling, and unknown labels are not guessed. Engine adapters must map and validate these inputs explicitly; recording them cannot promote a plan to a measured or cut-ready pattern. Profiles must be copied by an explicit revision-making action, never live-linked to previously kept project inputs.

## Implemented private profile boundary
The implemented private-profile slice uses separate `maker_profiles`/immutable `maker_profile_revisions` tables in the existing guest SQLite database. Same-origin `/api/profile` reads/saves/reviewed imports are owner-scoped. `/api/projects/[id]/profile` performs one transaction checking both bases, filling only missing typed notes/experience, adding exact tool names, and writing a project snapshot plus receipt. Profile changes never propagate automatically. Historical copy provenance is not an authorization link; strict plain-JSON backups contain personal information and need safe storage. Multi-instance deployment, profile deletion and step-specific progress remain separate gates.

## Pattern authority, not SVG authority

Implemented initial production boundary: owner-scoped `POST /api/projects/:id/pattern-study` accepts one strict non-cuttable `study_hem_length` command. It resolves saved private measurements and the actual current dedicated Sanity catalog, checks the exact measurement/cut/fold contract, invokes the pinned server-only Sandy 4.10.2 kernel twice, validates operations and stable edge/mark/DAG bindings, and rereads source/project before returning. `src/domain/pattern-study.ts` projects finite bounded numeric geometry and study metadata; `PatternBoard` derives the interactive SVG, before/after overlay, selected-edge inspector and numerical consequence trail. No arbitrary SVG is accepted and no project/revision or approved artifact is saved. The local six-step map is pending and execution-disabled, not a reviewed Sanity making graph. Missing inputs, unsupported source contracts, stale bases, transport failure and invalid geometry leave the manual plan intact. Catalog reads have a 12-second transport abort, client timeout and zero retries; browser catalog waits have a 15-second bound. No inference or public write is needed for this slice. Complete source/rights/layout/allowance/print/maker qualification remains open.

`PATTERN-ENGINE-DECISION.md` is the binding design for the technical workbench. Sanity owns reviewed semantic relationships, operation applicability and sources; private project state owns confirmed inputs and revisions; a deterministic drafting adapter owns exact geometry. It emits an immutable, versioned `PatternArtifact` with physical units and stable piece/edge/notch IDs. SVG/React renderers consume that artifact and expose semantic selection back to steps and knowledge; they do not store, infer or mutate the pattern. A proposed alteration is a registered bounded *sewing operation* followed by a full redraft and independent validation, not a model-generated SVG path or arbitrary point move. FreeSewing is the first engine to spike, subject to the decision document's source, rights and binding gates; SeamScape is a command-boundary reference only under the $0 budget.

## Source and capability ladder
The existing shoulder fragment and old blouse artwork remain illustrative. Exact pattern workbench layers require licensed complete source data and stable piece/edge IDs; cutting/printing also require deterministic numerical and physical review receipts. A photo or 3D mesh is not that data. `plan_only`, `guided_making`, `pattern_mapped`, `cut_checked`, `maker_reviewed` are explicit capability claims with scope and evidence.

A project basis is a canonical semantic hash of source/version, measurements, material/equipment, options, method and content fingerprints. A content correction marks affected future advice/proposals for review but does not silently rewrite completed physical work. Kept versions and diagnostic attempts remain auditable.

## Recovery loop

The construction notebook now reads a separate exact Sanity learning graph through `/api/projects/:id/making`. Explicit configuration starts a source/version-bound study session. Conditional nodes recursively carry prerequisites when omitted; they are never silently completed. Immutable private configured/reviewed/help_requested/paused events use optimistic project/history checks and idempotent receipts. A correction or project revision requires a fresh session; old facts remain visible. GET can preserve private history with unavailable knowledge, and a private pause or exact acknowledged retry remains available without generating new advice.

Step-specific scrap help binds its saved question, current eligible step, construction fingerprint and making-history head. Both route and store reject stale/imported/wrong-step contexts. Comparison start/result retain that exact context; advancing a checkpoint cannot silently move the diagnostic to a different seam. This is learning plus scrap-only investigation, not a qualified physical sewing transition. The responsive notebook offers orientation, conditional pieces, source edge links, checkpoints and recorded questions.

Version-4 backups take project, notes, diagnostic and making histories from one SQLite read transaction. Strict v1–v3 imports remain accepted; all restored events are untrusted historical facts. New construction sessions require explicit confirmation. Backups omit provider transcripts, old revision snapshots and generated draft artifacts. The making brief is a private review aid, not a printable pattern. Bounded JSON reading and history caps align the API with the supported backup envelope.

Context planning paths are selected from the live outline using known observed versions only. Unknown paths or a failed outline read stop retrieval; no model-selected/fuzzy paths or silent fixture fallbacks. Inline numeric citations with unreliable source mapping cause missing_knowledge. The manual workspace uses exact Content Lake records independently, so a generated KB defect cannot rewrite its prerequisite or diagnostic rules.

The initial implemented recovery slice is pending-review and scrap-only, not a qualified garment step. `diagnostic_events` holds immutable owner/project-scoped observation, comparison-start, comparison-result and pause records. Each binds saved project sequence/hash, exact catalog/diagnostic fingerprints and source/test/remedy IDs. Server checks optimistic history sequence and applicable current sources; exact receipts replay before dependent network reads. Failed or uncertain outcomes stop the comparison path. User reports never promote capability or confirm a cause. History and private pause facts remain available without Sanity; v3 backups restore history as untrusted evidence, never an eligible action. Older v1/v2 backups remain accepted.

Preparation is a deterministic review of saved notes and currently bound exact source requirements, not a capability receipt. Exact labels/units are mapped without aliases; unavailable or stale sources suppress source-specific checks. Material conflicts and unknown layout/method/rights are exposed. A private plain-text planning brief exports notes/limitations and scrap history, but no pattern pages or cutting instructions.
The active instructionStep supplies piece/edge/method context. An issuePattern supplies scoped hypotheses; diagnosticTest chooses a safe discriminating observation; remedy becomes eligible only after relevant outcomes. The maker confirms photo observations and remedy results. Missing/conflicting evidence yields a safe unresolved state. The bounded agent orchestrates this loop; deterministic server code owns applicability.

## Existing code and migration
Preserve exact Content Lake and actual Context adapters, Gemini signed tool proof, immutable state ideas and 44 historical regression tests. Replace shared demo state with guest-owned transactional state while keeping a stable illustrative demo route until parity. Build first 2D educational workbench and step-specific recovery; Three.js may consume the same versioned IDs later but is not the product's core or a drape claim.

No external deployment, paid model, production Sanity dataset write or deployed Function is authorized. Prepare adapters and local tests only. Do not confuse a reference screenshot with working production UI.
# Approved workspace migration note — October 4, 2026

The current implementation begins the migration by composing the existing project modules into five focused client views, with a persistent collapsible assistant dock. This does not change private SQLite ownership, fixed Content Lake queries or the scoped Context MCP reader. View location is client URL state; project revisions, making history and agent runs remain server-owned. Conditional piece projection is shared by the making UI and `inspect_making`; an instructional diagram without sufficient authored piece/edge bindings shows a gap instead of a join.

Next architecture gate: resolve server-authoritative `WorkspaceContext` from an owner-scoped project, exact graph, confirmed options, active step, selected IDs and relevant private history; pin that snapshot and consent to a durable run; emit structured artifact/tool receipts; invalidate only changed dependencies. A separate diagnostic KB identity/source review gates diagnosis. No schema or whole-KB rebuild is implied by this UI migration. See `WORKSPACE-AGENT-DIRECTION.md` and current `STATUS.md`.

