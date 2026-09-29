# Content model — shared garment intelligence

Studio 1.0 target. See spec C01/C02/C08/C10. The currently seeded 13 records are illustrative; a schema document does not qualify sewing content.

## Existing core and extensions

Keep existing stable references/version checks while adding the following semantic structure. Names below are proposed app/schema contracts, not claims that these document types are already deployed.

| Record | Important fields and relationships |
| --- | --- |
| garmentDesign | Public title/slug, family, creator/rights, supported pattern versions, cover and view assets |
| garmentPreset | Exact version, authored option values, distinct silhouette/components, suitable fabric classes, required techniques, readiness |
| patternVersion | Immutable semantic version, engine adapter/version/hash, measurement definitions, pieces, joins, options, methods, review evidence |
| patternPiece | Stable piece role/ID, named edges, cut-instance rule, fold/grain/notch semantics; numerical generated paths come from engine |
| seamConnection | Version-bound edge endpoints, join relation, intended ease, source-backed tolerance and method |
| measurementDefinition | Body landmark, how-to diagram/text, units, requiredness, reviewed range, relation to ease; never a user's value |
| styleOperation | Registered tool/operation ID, typed bounds/options, affected/locked roles, prerequisites, compatibility and invalidation dependencies |
| compatibilityRule | Declarative typed predicates over known options/material/method IDs; reason and source; no executable JS or free-form model code |
| fabricRequirement | Qualified fabric classes/behavior, direction/nap/fold limitations, layout assumptions and source |
| constructionMethod | Reusable technique, supported equipment/material classes, ordered micro-actions, authored numerical references, diagrams, prerequisites, sources |
| instructionStep | Piece/edge and method refs, prerequisites, conditions, side/orientation, action/checkpoint, diagram binding and semantic version |
| garmentView / previewBinding | View assets, named panel/edge bindings, topology hash, supported parameter mapping, authored exploded/step poses, limitations |
| sourceReference | Author, title, locator/date, license/attribution, applicable version/method, review status and curated excerpt |
| reviewEvidence | Reviewer consent/role, exact family/version/options/material, digital checks vs physical trial, evidence locations, limitations |

Do not store private measurements, guest designs or uploaded inspiration photographs in this shared graph. A public review excerpt may be authored with consent, never implicitly extracted from a guest project.

## Separate authorship from computation

Sanity authors meaning, relationships and qualified operating envelopes. The deterministic adapter produces exact curves, dimensions and check results from those inputs. Store adapter identity and reproducible source definitions, not giant per-person generated paths in Content Lake. Preview assets identify the same pieces and edges; art alone cannot establish readiness.

Each capability manifest must resolve to installed engine, option and renderer adapters. Publishing unsupported IDs fails runtime validation even if Studio permits it.

## Validation at the server boundary

Required checks include unique IDs, version ownership, no dangling/cross-family edges, closed dependency graph, DAG acyclicity, valid conditional references, typed option constraints, compatible fabric/method combinations, source-backed bounds, asset rights and complete adapter bindings. Sanity authoring validation helps editors; it does not replace server checks.

Hash canonically sorted semantic fields, not query time. Keep geometry semantics, instruction semantics, and editorial-only presentation changes identifiable so precise invalidation is possible. An accepted revision records the exact relevant snapshot rather than a mutable reference alone.

## Sanity as a core dependency

A pocket is not a keyword in a paragraph. It refers to a real optional piece, placement constraints, changed cutting instances, a method, a sequence before closing its supporting seams, and applicable sources. The same method may serve several presets. Exact graph traversal determines consequences; Context provides maintained explanation.

First maintenance demonstration: a source-backed correction to a shared pocket/edge method affects at least two looks, invalidates relevant pending proposals and prompts review of specific making steps. Keep previous versions available. Refresh/rebuild/review the KB and read the actual served entry before claiming the explanation has caught up.

## Knowledge Base compilation guidance

Include garment identity/version, piece/seam vocabulary, option constraints, material/equipment methods, prerequisites and curated sources. Keep instructions concise and source-scoped. Require generated assembly descriptions/diagrams to preserve the exact DAG; parallel steps must not be rewritten as sequential dependency claims. Do not include secrets, private project state or arbitrary visitor prompts.

The endpoint remains KB-only. Fixed parameterized Content Lake queries are a separate adapter. Record statuses for source change, graph verification, KB update requested, entry reviewed and served entry verified.

## Development migration safety

Target only project l4eeamth / dataset development. Produce an exact dry-run ID/type list, snapshot old documents, apply revision preconditions, then validate the entire relevant graph and read it back. Use separate read/editor tokens. Preserve current fixture IDs/history until new resolved catalog parity is proven. Production stays untouched. A schema extract or dry run does not count as a successful migration.

## Content required for the full application

Two qualified families; six genuinely distinct presets; all mandatory measurements; complete physical pieces including allowances/notches/grain/counts; supported options and combinations; material/equipment constraints; every making prerequisite and method; all display/diagram bindings; source/license metadata; and separate numerical/physical review evidence. Missing content must surface as an authoring issue or explicit unsupported state, not be improvised by Gemini.

