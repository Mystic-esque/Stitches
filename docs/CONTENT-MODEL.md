# Structured content model

## Garment-first additions — approved September 29, 2026

The browser's garment study is not a second content store. For an exact `patternVersion`, the validated snapshot now derives `garmentPieces` from `patternPiece`, `garmentConnections` from `seamConnection`, and prerequisite-ordered `assemblySteps` from `instructionStep`. Duplicate piece/step keys, broken or cross-version references, and prerequisite cycles fail resolution. The initial illustration is tied to the one demo blouse; titles, cut counts, joins, assembly order, and content fingerprint must come from the resolved content, not visual constants.

Before expanding the catalog, author explicit display assets keyed to stable piece and garment IDs: front/back (and optional exploded/3D) views, visible regions, attribution/license, and an `illustrative`/`geometry-verified`/`maker-reviewed` status. Add style options with allowed pattern versions, incompatible combinations, required measurements, affected piece/connection IDs, and instruction variants. A UI option is enabled only when a deterministic operation registry can implement it for the selected version. Measurements and personal designs remain owner-private. The Knowledge Base purpose includes garment construction and editorial sources; its prose does not override exact numeric constraints from reviewed structured records.

Acceptance demonstration: change an authored seam or instruction relationship in the dedicated Stitches development dataset, refresh and apply Knowledge Base issues, then show the changed served entry and a changed explorer/agent consequence. A fixture edit and a KB creation with zero entries do not satisfy this live gate.

## Why this model matters

A shoulder adjustment touches a shoulder point, an armhole, a sleeve relationship, one or more sewing steps, and a fabric placement. These are explicit, versioned links. Gemini retrieves them and explains the consequences; deterministic code executes approved operations and validates the result.

The sample fixture illustrates this structure. Its rules and ranges are original demonstration data, not validated pattern-making advice. Do not import them as reviewed or cut-ready content.

## Sanity document types

| Type | Important fields and references |
| --- | --- |
| `pattern` | Title, slug, garment category, creator, license metadata, available versions |
| `patternVersion` | Pattern reference, semantic version, engine adapter/version, required measurements, supported operation IDs, review status, source references |
| `patternPiece` | Pattern-version reference, stable piece key, title, role, edge definitions, cut count/mirroring/fold rules, grain metadata, source references |
| `seamConnection` | Pattern-version reference, first and second piece references with edge IDs, intended ease relation, tolerance, notch rules, review status, source references |
| `adjustmentRule` | Pattern-version reference, operation ID, input units and reviewed bounds, supported locks, directly affected piece references, related seam references, dependent rule references, instruction references, source references |
| `instructionStep` | Pattern-version reference, stable step key, body/diagram, piece references, prerequisite step references, affected-by rule references, revision applicability |
| `fabricRequirement` | Pattern-version reference, construction class, required fabric behavior, grain/direction constraints, source references; no user's personal inventory |
| `sourceDocument` | Title, URL or authorized asset, author/publisher, version/date, locator, permission/license notes, review date and status, supersedes/conflicts references |

Use Sanity `reference` values for links and `_key` values for array objects. Keep stable domain identifiers separate from display titles. Restrict published runtime content to reviewed versions; retain draft/illustrative content only for explicitly labeled development workflows.

Numeric fields need units. Unknown measurements, tolerances, or evidence must remain unknown; zero is not a substitute. Store prose explanations alongside structured conditions and effect links so editors can maintain both. Do not put an executable JavaScript expression into a content field.

## Pattern edges and joins

Edges require stable IDs, such as `front.shoulder`, `front.armhole`, `back.armhole`, and `sleeve.cap`. A join may connect a sleeve cap to a composite front/back armhole. Represent composite joins as a list of endpoints with orientation and segment metadata rather than forcing every relationship into a two-edge equality.

For each relationship record, define the intended relation (equal, eased, gathered, or another supported construction), the allowed difference or ratio where applicable, and the evidence for that constraint. Leave unreviewed constraints unresolved. The engine must reject a ready-to-cut claim when required relation information is missing.

## Retrieval contract

Given an allowed `patternVersionId`, retrieve the exact pattern, pieces, related joins, supported rules, prerequisites, and provenance. Expand linked data into one bounded, validated context object. Derive the dependency closure server-side; detect cycles in instruction prerequisites and broken or cross-version references.

Rules can depend on other rules, but effect traversal must be cycle-safe. A discovered dependency is not automatically an edit: the operation registry decides whether to redraft, recheck, invalidate, or request input for each dependent object.

Every explanatory statement about an effect should carry source/rule IDs. Show a concise reason in the interface, with details available on request. A direct link alone does not prove an operation is geometrically valid.

## Version and conflict policy

- Select a specific pattern version before adjustment. Do not mix rules from incompatible versions.
- Editorial publication should validate outgoing references, units, operation registry compatibility, supported ranges, and applicable source review.
- Store resolved content snapshots and hashes with accepted project versions.
- Later content corrections mark potentially affected projects for review without rewriting them silently.
- Record explicit source precedence where an authored erratum supersedes a rule. If a conflict has no documented precedence, surface the conflict and withhold the affected operation.
- A sample source saying "illustrative" never becomes manufacturing authority through a model's explanation.

## Personal project data

Keep user measurements, fit preferences, project inputs, actual fabric inventory, notes, proposal state, and instruction progress in private application storage. A measurement profile has an owner, unit system, measured-at date, source/method where relevant, and explicit values. Collect only the fields required by the selected pattern.

## Structured-content demonstration

Use the fixture to show the sequence: select the shoulder rule, traverse to the front and back shoulder records, find the armhole/sleeve relationship, identify steps requiring review, and invalidate the old layout. Then modify the relationship or applicable version and show that the explanation and pending checks change.

The production acceptance test requires this result to be computed from retrieved structured content, rather than embedding a hardcoded "three pieces changed" string in the UI.

