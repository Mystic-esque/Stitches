# Stitches shared content model — Companion 2.0

Target authoring contract, not a claim that these types or records are deployed. Existing 13 development records and the 8-entry Context KB are illustrative proofs. Schema changes require guarded development migration and live read-back.

## Exact graph in Sanity Content Lake
| Record | Purpose and mandatory relationships |
| --- | --- |
| sourceDocument | Origin, locator, rights, review status, version, supersedes/conflicts; every actionable claim needs applicable source evidence. |
| pattern / patternVersion | A genuinely distinct garment project and immutable qualified version, engine/rights/capability envelope. Color/length variants remain options. |
| patternPiece / seamConnection | Stable piece/edge IDs; physical cut count, mirrored/on-fold, grain, notches, stitch/cut/allowance and joining relation where qualified. |
| adjustmentRule / fabricRequirement | Typed, reviewed operation scope and affected graph; fabric behavior/direction/width prerequisites. |
| instructionStep | Version-bound prerequisite DAG, pieces/edges, orientation, method, diagram and checkpoint. |
| garmentComponent | Garment concept (bodice, sleeve, pocket, waistband), public explanation and compatible pattern roles. |
| sewingTechnique | Reusable technique with skill demand, prerequisites, equipment/material compatibility, source/review. |
| equipmentClass / fabricClass | Machine/tool capabilities and material properties; no brand inference or user-owned item stored here. |
| constructionProcedure | Shared source-backed action sequence binding technique, components, pieces/edges and steps, with alternatives and conditions. |
| issuePattern | Possible mistake/symptom scoped to procedure/step/component/material/tool and risk. A hypothesis, never diagnosis alone. |
| diagnosticTest | Discriminating maker-observable question/check, expected outcomes, prerequisites, source and safety caveat. |
| remedy | Applicable response to supported test results, risk level, reversible/irreversible flag, confirmation checkpoint and alternative. |
| reviewEvidence | Exact authored scope, digital/physical reviewer status and limitations; no implicit promotion. |

An instructive example: a sleeve insertion issue binds the active instructionStep, sleeve and armhole piece edges and notches, method, possible mismatch hypotheses, a notch/stitch-line check, fabric behavior and qualified remedies. Stitches asks the test before recommending a risky physical change. Two different garment projects can share that method and diagnostic without duplicating prose. A correction propagates to both only where applicability matches.

## Private project state is not shared content

Implemented scrap history is held only in private SQLite `diagnostic_events`, never seeded into Content Lake/Context. It references the existing exact source/test/remedy IDs and semantic fingerprints. No new public Sanity record or KB rebuild is needed for this persistence/preparation slice. A local pause during source outage is a maker fact, not a source-reviewed instruction. Restored histories cannot satisfy reviewed content or action eligibility.
Guest profiles/projects hold personal measurements, materials/equipment on hand, photos, pattern ownership, decisions, step progress, symptoms/tests/fixes, revisions and consent. Never seed that into shared Content Lake or KB. A public pattern can reference a license; a user's purchased PDF stays private and is not redistributable.

## Geometry ownership
Sanity records a qualified pattern/engine version, semantic part and seam relationships, supported operation IDs, source rights and educational meaning. It is **not** the primary store for a guest's coordinate graph, SVG path data or made-to-measure draft. The versioned drafting adapter produces exact geometry from private inputs, and its immutable artifact maps stable piece/edge/notch IDs back to Sanity records. A source editor can change an instruction or operation applicability without silently modifying previously kept geometry. The adapter must reject a semantic ID that has no exact generated counterpart; a decorative SVG label cannot satisfy the pattern-mapped gate. See PATTERN-ENGINE-DECISION.md.

## Validation and readiness
Schema validation helps editors, but server resolver independently enforces unique and version-matching IDs; no dangling refs; prerequisite DAG; condition and compatibility semantics; supported installed operation IDs; source applicability; rights; numeric envelopes and complete piece/edge/cut bindings. Canonically hash semantic fields; distinguish geometry, procedure and editorial changes. A beautiful asset has no readiness authority.

Capability receipts: plan_only → guided_making → pattern_mapped → cut_checked → maker_reviewed. Each step requires explicit source, adapter and check evidence. Keep digital and physical review separate. No photo, KB prose, model answer or 3D view may bypass a gate.

## KB and Context
The dedicated Stitches Knowledge Base maintains explanations of components, techniques, sources, procedures, issue tests and resolutions. It does not replace exact graph constraints. Compile from reviewed, scoped source material; preserve step prerequisite DAG and avoid misleading sequential arrows. Exact and served KB versions are checked independently. If a new source/rule corrects a method, record source update → graph impact → KB rebuild requested → entry reviewed → served entry verified. Do not claim a deployed Function when only local event rehearsal exists.

## Development-only migration
Target exactly project l4eeamth / development with separate read/editor tokens, dry-run IDs/types, backup, revision preconditions, graph validation and read-back. Never write Stitches production. Existing illustrative IDs/history remain until migration parity and tests pass. Adding schema types in this repository alone does not create or publish documents in Sanity.

## Release content floor
Two different source-qualified project examples with rights, complete piece/edge/step graph and actual educational assets; one useful shared method/diagnostic affecting both; planning-only own-idea route; source and review status visible. No arbitrary six-look count and no fabricated technical guidance to fill an empty gallery.

