---
doc: spec
status: implementation-ready-design
revision: studio-1.0
---

# Stitches — technical specification

## Overview and authority

Implements PRD E01–E10. This replaces the earlier narrow technical spec. The current code at local commit 84e3b54 is an illustrative, tested foundation. Do not restart the repository or relabel that evidence. See ../docs/SOL_HANDOFF.md for exact module migration and ../docs/DESIGN.md for the visual contract.

No signup/accounts in Studio 1.0. Introduce isolated guest sessions; defer Supabase/Auth. Keep the current Next.js/React/TypeScript app, Sanity Content Lake and actual Context KB, and Gemini 3.5 Flash-Lite. Add Three.js as a progressive renderer and deterministic geometry/layout/export tools. Public deployment remains a prepared artifact requiring later authorization.

## Stack and dependency policy

Existing pins: Next.js 16.3.5, React 19.3.0, TypeScript 5.9.3, Sanity 6.15.0, @sanity/client 8.6.2, @google/genai 2.24.0, zod 4.6.5, Vitest 5.0.1, pnpm 11.19.0. Verify installed files/lock before use. Read the installed Next.js guides before writing routes or changing framework behavior.

Use plain Three.js with a small React lifecycle wrapper; avoid adding a second scene state system. Dynamically load the viewer. Use existing React reducers/context until concrete shared-state pressure warrants a small store. Use SVG for exact 2D paths and technical diagrams. A versioned FreeSewing adapter is preferred if an appropriate design qualifies; otherwise an original scoped drafting adapter requires authored construction authority and maker review. Select and pin a maintained PDF library during export work, validating vector output rather than taking canvas screenshots.

Guest persistence uses a repository contract with transactional SQLite on the local Node server. Choose a supported binding against installed Node at implementation; native package compatibility must be smoke-tested on Windows before committing. The existing JSON demo store remains isolated for historical fixture rehearsals. Do not deploy either local store to a stateless hosting runtime.

No new hosted service, vector database, paid provider, or cloud job queue is required for the local application.

## Architecture and responsibilities

Browser routes → typed server application services → exact Sanity snapshot + Context evidence → registered deterministic tools → immutable project revisions → renderer/layout/instructions/export.

- Browser owns selection, camera, expanded panels, transient drag state, and an optional local backup mirror.
- Server owns guest session isolation, canonical project state, input validation, operation eligibility, authoritative draft/checks, acceptance, provider access, and artifact generation.
- Sanity owns shared catalog, pattern metadata, relationships, qualified bounds, methods, instructions, assets, and sources. It never owns guest measurements.
- Engine owns numerical pattern geometry and check results. Renderer consumes it; Gemini never creates coordinates.
- Context supplies maintained explanations and sources. It does not execute tools, write projects, or replace structured constraints.

## C01 — Catalog and exact knowledge graph

Implements E01, E03, E09. Extend the existing resolver/repository, preserving validation of duplicates, references, versions, prerequisite cycles, and fingerprints. Return a CatalogCard projection separately from a full GarmentSnapshot to avoid fetching all geometry for the collection.

CatalogCard: id, slug, familyId, versionId, title, presetId, cover asset, techniqueIds, fabricClassIds, optionSummary, readiness, creator/license summary. Only publish buildable presets when their capability manifest resolves to installed engine and preview adapters.

GarmentSnapshot contains catalog metadata, measurement definitions, piece/edge roles, join constraints, operation definitions, compatibility rules, method choices, instruction DAG, preview bindings, sources, review evidence, and canonical fingerprint. Sort canonically; include semantics and relevant authored revisions, not volatile query timestamps.

Keep the Stitches Context MCP endpoint Knowledge Base-only. Exact reads use fixed parameterized GROQ through @sanity/client. Adding a dataset source to the same MCP can change its retrieval mode; do not mix sources to simulate both roles. Initial Context paths are discovered from the actual outline and selected server-side.

## C02 — Pattern qualification and engine

Implements E04, E06, E08. Start here before building more pretend operations.

Evaluate the exact design package, version, code license, generated-pattern rights, attribution, documented fabric requirements, measurements, option envelope, seams, markings, and instructions. Record the selected commit/package and all licenses. FreeSewing is a toolkit, not proof that any chosen garment meets our brief. Tamiko and Tina documentation currently describes knit-oriented garments; they must not be relabeled as the woven lead top. Teagan is a useful separate knit candidate. Sandy is a circle-skirt candidate to evaluate. An original relaxed woven top remains a legitimate path only with explicit source/review evidence.

Create a capability manifest for each family:
- engineId/version; patternDefinitionHash; source/license IDs;
- measurement definition IDs and reviewed bounds;
- registered operations, options, lock support, compatible fabrics/methods;
- piece/edge topology, cut counts, seam allowances and intended ease;
- numeric regression envelope and physical-review status;
- preview adapter and instruction resolver versions.

PatternAdapter.draft(snapshot, normalizedMeasurements, options) returns PatternArtifact:
- id/hash, basis, units:mm, engine/version;
- pieces with stable IDs, closed stitch/cut paths, named edges, grain, notches, fold lines, labels and cut-instance rules;
- joins with intended relation, measured lengths/ease, source tolerance, pass/fail/unknown;
- changes, locked-region checks, added/removed pieces and instruction dependencies;
- readiness components, not one opaque boolean.

Do not invent manufacturing tolerances. Curve integration/offset approximation error is a computational property with separate tests; seam fit/ease tolerances come from qualified content. Validate finite values, dimensional plausibility, closure, intersections, offset joins, notch correspondence, counts, orientation and lock preservation. Inspect all generated pieces, including facing/binding/pocket, not only front/back.

Operations redraft from canonical inputs, never successively distort previous output. Target IDs: top.length, top.sleeve, top.patchPocket, skirt.length and a source-supported skirt shape/waist option. UI derives supported values from the manifest; never hardcode the old 0–20 shoulder range into a production operation.

## C03 — Shared design state and preview

Implements E03/E04. A DesignBasis includes projectId, baseRevision, patternVersionId, knowledgeFingerprint, measurementHash, optionHash, fabricHash, methodHash, engineVersion, previewAdapterVersion. Each tool declares which inputs it depends on. Changing an input invalidates only dependent results, but stale acceptance compares the complete proposal basis.

Scene generation consumes PatternArtifact + PreviewBinding. A binding maps piece/edge IDs to panel mesh/UV/assembled pose/explode vector/step pose. Variable dimensions regenerate the mesh through a versioned preview adapter; optional pockets introduce real identified panels. No scaling a whole glTF blindly while the cutting pattern stays unchanged.

Three.js handles rendering, raycasting, orbit and authored assembly animation. Prefer generated low-poly panel meshes or a glTF with stable named submeshes and explicit parameter mapping. No cloth simulation in this release. Show Construction preview. Render 2D/SVG immediately, load 3D on demand, cap pixel ratio, dispose resources, suspend on hidden tabs, and recover from context loss. All selectable objects also exist as accessible buttons/list items.

Geometry is immutable server output. Local drag may use a worker for responsive provisional visualization, but acceptance and export require server recomputation/checks with matching hashes.

## C04 — Guest project and revisions

Implements E08 and E04. No identity provider or signup. Issue an opaque random guest-session secret in an HttpOnly SameSite=Lax cookie (Secure outside loopback). Store only its hash server-side. Every project/run/artifact query scopes by that session; never accept a caller-supplied owner ID. Same-origin checks and CSRF protection apply to mutations.

SQLite tables: guest_sessions, projects, revisions, proposals, measurement_sets, fabric_inputs, instruction_progress, agent_runs, agent_steps, artifacts, knowledge_impacts. Use transactions, unique idempotency keys, optimistic revision sequence comparison, and an explicit migration version. Keep raw measurements/photos out of ordinary logs. Database files are ignored. Local guest projects persist until explicit deletion; before any public release define and implement its retention policy in the UI and deployment package. Browser backup/import provides portability when cookies are cleared.

Proposal states: created → calculating → needs_input | invalid | reviewable → kept | discarded | stale. A reviewable design can be kept with unresolved physical review, retaining its status. Cut readiness is a separate derived gate. Accept atomically: check session, basis/current source, operation results, idempotency; save immutable snapshot and artifact; advance sequence; mark dependent progress/layout for review.

A subsequent content correction never overwrites a kept artifact. It records affected source IDs and offers Review updated guidance / Redraft with current rules. Cross-tab updates broadcast a revision notice; stale local drafts remain recoverable but cannot overwrite.

## C05 — Bounded studio assistant

Implements E05. Extend the existing fit-loop and Gemini adapter behind a generic dispatcher; keep the old spike test as historical regression. AgentRun is durable and resumable: request, normalized brief, basis, pending clarification, step receipts, provider cursor/history, status, budgets and last error. Never persist or expose private model reasoning as a user explanation.

Tool registry:
| Tool | Validated result |
| --- | --- |
| find_templates | bounded catalog matches with supported capability IDs |
| inspect_design | current exact snapshot, choices, missing measurements |
| read_construction_notes | actual selected Context paths + evidence receipt |
| preview_design | registered operations → server proposal |
| check_pattern | deterministic geometry/join/lock report |
| plan_cutting | physical instances and bounded placement result |
| compare_alternatives | <=3 authored supported option sets with checked outcomes |
| resolve_making_steps | exact revision + equipment → instruction DAG |
| explain_piece_or_step | known IDs + scoped notes + UI selection hint |

No arbitrary query, URL fetch, file path, shell, code execution, coordinate tool, Sanity mutation, or keep_revision tool. Explicit user interface acceptance is separate. Unknown operation IDs fail before execution.

Budgets: at most 4 model requests and 10 tool executions per run, at most 3 alternatives, <=120s active computation across resumable steps. Each model request gets a <=30s timeout (also bounded by remaining run time, preserving the existing successful provider timeout), no automatic paid retry, bounded input/outputs, and exact provider call identity/signature preservation. Tune only from measured live evidence. One HTTP advance processes one bounded unit and returns a checkpoint; cancellation and budget checks happen before every subsequent unit. Tool receipts are keyed by canonical input hash to avoid duplicate deterministic work. Retry of a timed-out provider request is explicit and counts against the run budget.

Prefer one intent/plan request, deterministic tool execution, then one explanation/correction request. The model may ask for a missing field. The server determines feasibility and readiness. Keep the free-tier model allowlist and global/session request limits; a rate-limit response supplies a retry time and leaves manual tools usable. Never silently switch providers/models.

Expose compact action status and verifiable output, not chain-of-thought. Explanations cite resolved source records and receipt IDs. If KB conflicts with structured constraints, use the exact graph for safe navigation and withhold the unsupported reasoning/action.

## C06 — Inspiration analysis

Implements E02. Separate typed service from the tool loop. Browser validates type/size, previews and optionally crops; explicit Analyze sends a downscaled re-encoded image. Defaults: one JPEG/PNG/WebP, <=8MB original, <=25 megapixels decoded, <=1600px long edge for inference. Strip EXIF; validate actual decoded format server-side; reject SVG/URLs/archives.

Use the selected model's documented image input plus structured output, with one bounded call. Output schema: visible category, silhouette enum, neckline enum, sleeve enum, length class, visible component list, occluded/unknown fields, concise observations. Every attribute permits unknown; model values must map to app vocabulary. Do not infer body measurements or nonvisible construction.

Maker confirms/corrects attributes. Deterministic filters/weighted feature matching operate over published Sanity capabilities and return <=3 templates with reasoned differences. Candidate scores are internal ranking values, not calibrated confidence. No match is a first-class result.

Keep uploaded bytes in private temporary storage with <=15min TTL and deletion on cancel/complete; if a maker explicitly retains a reference in their guest project, record that choice. Do not send original bytes to Sanity. Before public use verify current provider data-use terms and show the concise notice; free-tier availability does not imply private model processing.

## C07 — Fabric placement

Implements E06. Expand cut instances from the artifact, with named piece IDs, mirrored orientation, on-fold constraints, grain angle, nap restrictions and allowances. Layout includes cut lines, not only stitch lines. Normalize usable cloth after explicit shrinkage/selvage assumptions.

Begin with deterministic bounded strip/skyline search over allowed orientations, with conservative polygon bounds for candidates and exact/conservatively error-bounded polygon intersection/containment verification. Bias to a feasible readable plan rather than dense packing. A conservative bounding-box placement can prove feasibility if full shapes are contained; failure of that search does not prove insufficiency.

Result union: feasible(placements,usedLength,checks,basis); impossible(necessaryConstraint,evidence); not_found(searchBudget,unplaced); missing_inputs(keys); invalid(reason). A piece wider than every allowed orientation can prove a necessary impossibility; a heuristic timeout cannot. Flat-fold and mirrored-pair semantics must be explicit. Unsupported defects/pattern matching return missing/unsupported, never ignored.

An alternative design repeats engine and layout checks and retains locked features. Deterministic inputs produce deterministic candidate order and recorded seeds.

## C08 — Instruction resolver and making mode

Implements E07. Resolve an instruction DAG from the accepted artifact, enabled components, selected equipment/method and current retained content snapshot. Each step has stable ID, prerequisites, piece/edge IDs, action, allowance reference, orientation, diagram binding, checkpoint, technique references, and optional detail. Add pocket steps before closing their supporting seams. Detect cycles and dangling optional references.

Progress binds to revision + step semantic hash; unrelated editorial copy changes need not reset unrelated work, while changed method/geometry/prerequisites require review. Preserve previous completion history. A source correction offers explicit updated guidance without silently replacing an in-progress step.

Diagrams are SVG or 3D poses from the same IDs. Use authored micro-actions and numerical values; model-generated explanations cannot replace missing construction instructions.

## C09 — Export

Implements E08. Generate vector pattern.svg in mm with viewBox and explicit dimensions. Produce tiled A4 and US Letter with safe margins, registration marks, page labels/map, calibration, and source/revision footer; full-size PDF from exact dimensions. Retain curves if the library supports them; otherwise test approximation error. Do not screenshot the 3D canvas.

Making package: manifest.json, pattern.svg, pattern-a4.pdf, pattern-letter.pdf, full-size-pattern.pdf, cutting-plan.pdf, making-guide.pdf, materials.csv, attribution.txt, project-backup.json. Manifest hashes every artifact and binds pattern/engine/content/measurement/options/method/fabric basis. Export never includes tokens or original reference images by default.

Readiness is derived from required numerical checks, instruction completeness, fabric inputs/layout where applicable, rights, and family/variant maker evidence. Review exports watermark pages with the unresolved status; ready-to-cut export is unavailable until qualified. Test 100mm calibration geometry, page joins, real print scale, and labels/counts from the exact artifact.

## C10 — Sanity editorial maintenance and Functions

Implements E09. Extend existing development schemas per CONTENT-MODEL.md. Keep the runtime read token separate from the editor token. All writes guard project l4eeamth and dataset development. A migration has dry run, explicit ID list, revision preconditions and a rollback snapshot. Current live records remain illustrative.

Editorial impact service accepts a trusted document-change event, finds affected versions/presets/operations/steps, computes new semantic fingerprints, and marks pending proposals stale. Implement as a pure function with a local event fixture first. Prepare a Sanity Document Function/Blueprint wrapper and local test using the documented SDK/CLI when compatible; deploying it is an external publication and is not authorized. The app can compare fingerprints on request without requiring a deployed Function.

Separate statuses: source changed; graph validated; KB refresh/rebuild requested; generated entry reviewed; served entry verified; applicable. Never equate source publication or refresh detection with a successful KB update. The existing real wrong-arrow recovery is a regression case. Use documented Context CLI/dashboard operations only, verifying installed CLI support before any call; no invented control-plane URLs. Expose editorial diagnostics in Studio/development review tools, not the maker's main interface.

## Application API contracts

These are proposed Stitches application routes, not vendor API names. Validate every request with strict schemas; forbid unexpected fields. Error envelope: {error:{code,message,retryable,fieldErrors?,currentBasis?},requestId}. No raw provider errors/secrets. Use 400 invalid, 403 guest/scope failure, 409 stale, 413 image limit, 422 unsupported/failed check, 429 quota, 503 unavailable. Long operations return 202 with a local run ID.

| Method/path | Request | Result |
| --- | --- | --- |
| GET /api/catalog | filter enums/query, bounded page | cards/cursor |
| GET /api/garments/[versionId] | authorized public version | validated snapshot/projection |
| POST /api/guest | same-origin initiation | opaque cookie, workspace metadata |
| GET/POST /api/projects | session / template+preset | list / project |
| GET/PATCH/DELETE /api/projects/[id] | session; expected sequence for edit | project / result |
| POST /api/projects/[id]/proposals | basis, normalized measurements/options/locks | proposal or needs_input |
| POST /api/projects/[id]/proposals/[proposalId]/keep | base sequence, idempotency key | new immutable revision |
| POST /api/projects/[id]/layout | revisionId, fabric input | typed layout result |
| PATCH /api/projects/[id]/progress | revisionId, stepId, expected hash, complete | progress |
| POST /api/agent/runs | projectId, basis, brief | runId/status |
| POST /api/agent/runs/[id]/advance | checkpoint/idempotency | next checkpoint |
| GET/DELETE /api/agent/runs/[id] | session | status / cancelled |
| POST /api/inspiration/analyze | multipart validated image + user action | editable observations |
| POST /api/inspiration/matches | confirmed attributes | supported matches |
| POST /api/projects/[id]/exports | exact revision, package type | artifact or blocked gate |
| GET /api/artifacts/[id] | owning guest session | bounded download |

The old /api/demo/* and /api/agent/preview stay isolated until replacement parity is verified, then remain development-only or are removed in a named migration. No public code path should share the global demo project.

## File structure

- src/app/(marketing)/: landing, collection, garment detail and inspiration routes.
- src/app/(studio)/: guest library and project/making routes.
- src/components/catalog/: cards, filters, detail.
- src/components/studio/: shell, controls, inspector, evidence drawer, revision review.
- src/components/viewer/: ThreeScene wrapper, panel renderer, camera controls, SVG fallback.
- src/components/making/: cutting preparation, diagram, step navigator.
- src/domain/catalog/, patterns/, geometry/, layout/, instructions/, projects/, evidence/: pure types and algorithms.
- src/server/knowledge/: extend existing resolver adapters and Context reader.
- src/server/agent/: session adapter, tool registry, run service/checkpoints.
- src/server/projects/: guest scope, repository, transactions and migration.
- src/server/inspiration/, exports/, editorial/: bounded services.
- sanity/schemaTypes/: catalog, pattern, method, asset and source documents.
- tests/domain/, integration/, browser/, evaluations/: meaningful contracts and journeys.
- evidence/: dated, labeled actual outcomes; design/ contains reference-only artifacts.

## Verification and release evidence

Meaningful tests: missing/cross-version graph references; wrong assembly arrow; option compatibility; full-envelope draft determinism; invariant locks; intentional seam ease; optional component counts; fold/mirror layout; search exhaustion distinction; stale and duplicate acceptance; cross-guest denial; expired image cleanup; quota/cancel/resume; malicious tool args; print scale; revision instruction invalidation.

Benchmark: freeze a licensed same-version corpus and 24 authored tasks before running. Include version selection, dependency closure, pocket sequencing, equipment alternatives, source correction, fabric constraint, ambiguity and unsupported requests. Compare keyword retrieval over the same corpus against structured traversal plus Context/tool execution. Give both the same available evidence; separate retrieval-only metrics from end-to-end tool outcomes. Report precision/recall of dependencies, applicable rule/source accuracy, refusal correctness, task success, latency and call counts. Do not fabricate results or tune expected answers after seeing outputs.

Live budget rehearsal: at least six representative runs spread within available free quotas, with explicit total calls/time, two interrupted/recovered cases, and manual fallback. One previous successful shoulder spike does not establish new-feature reliability.

Release evidence includes actual screenshots, keyboard/reduced-motion checks, zero overflow at required sizes, no secret leakage, numerical layouts, printed calibration, each family's physical maker record, local restore rehearsal, and runbook. Performance targets (verify on stated hardware/network): usable initial content <=2.5s, direct-control visual feedback <=100ms, 3D >=30fps on tested midrange device, no long layout work on the UI thread. Treat as targets until measured.

## Official references and limits

- Sanity exact reads: https://www.sanity.io/docs/apis-and-sdks/js-client-querying
- Context modes: https://www.sanity.io/docs/ai/sanity-context-retrieval-modes
- KB maintenance: https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base
- Functions local testing: https://www.sanity.io/docs/functions/functions-local-testing
- Context CLI: https://www.sanity.io/docs/cli-reference/cli-context
- Gemini selected model: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- Image input: https://ai.google.dev/gemini-api/docs/image-understanding
- Function calling: https://ai.google.dev/gemini-api/docs/function-calling
- Three.js picking: https://threejs.org/manual/pages/picking.html
- glTF: https://threejs.org/manual/pages/load-gltf.html
- FreeSewing: https://freesewing.dev/

Sources were checked for architectural feasibility on September 29. They do not prove our adapters, licenses, or physical results. See SOURCES.md for candidate caveats.
