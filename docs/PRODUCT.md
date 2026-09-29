# Stitches — product direction

Design revision: Studio 1.0, September 29, 2026. This describes the target application. Actual implementation evidence lives in STATUS.md. It replaces the earlier one-adjustment competition scope.

## The product

**See how it is made. Make it yours.**

Stitches is an interactive garment studio for people who can use a sewing machine but want help turning an idea into a garment they understand and can make. It connects discovery, visual construction, supported design changes, measurements, fabric planning, cutting, and sewing in one project. An assistant carries a brief through those tools and helps recover when a choice fails.

The distinctive experience is continuity: the garment, pieces, options, fabric layout, instructions, and exported package are views of the same version. A pocket is a visible object with pattern geometry, a placement rule, fabric consumption, and an instruction prerequisite. Removing it updates every relevant view. An editor's correction to its construction rule changes applicable guidance across the collection.

Sanity maintains shared design knowledge and relationships. Its actual Context Knowledge Base supplies construction evidence. Exact structured records and deterministic tools establish what is supported and what passed. Gemini interprets goals, selects tools, compares results, asks focused questions, and explains outcomes.

## The experience to deliver

1. **Discover.** A welcoming landing page leads to a collection of supported looks. Filter by type, techniques, fabric class, and options.
2. **Bring inspiration.** Optionally upload a garment photo. Review visible features, correct uncertain observations, and choose a related supported template. A single image does not establish hidden pattern pieces, scale, body measurements, or exact construction.
3. **Understand.** Orbit a construction preview; separate its panels; select a seam; move between the garment, flat pieces, and assembly. Selection follows the same object across views.
4. **Design.** Change length, a supported sleeve treatment, and patch pockets. Enter only required measurements with diagrams and units. Compare and keep a version.
5. **Solve constraints.** Give the assistant cloth, equipment, skill, and feature constraints. It tries supported alternatives, shows consequences, and asks before relaxing a goal.
6. **Prepare and cut.** Inspect actual placement, piece counts, grain, folds, calibration, and cutting preparation. Download a package for this revision.
7. **Make.** Follow one action, diagram, orientation, seam, checkpoint, and next step. Ask for help and resume progress later.

## Release composition

The full first application includes a landing page; at least six genuinely distinct supported looks across at least two qualified families; photo-to-template matching; a guest project library; 3D construction with a 2D fallback; measurements; multiple supported operations; a tool-using assistant; feasible cutting layouts; revision-specific sewing; and scale-correct exports.

The lead family is a relaxed everyday top; a simple skirt is the second family. Exact sources and options are selected by the early engine/licensing gate, not by the old shoulder drawing. Target top operations: body length, supported sleeve length/treatment, patch-pocket add/remove and allowed placement. Skirt operations: supported length and fullness/waist construction from its source. Color alone is not a distinct look. Every option requires authored compatibility and a tested engine implementation.

No accounts for this release. A guest workspace remembers projects through an isolated session, offers backup/import, and explains storage/retention. Account synchronization and collaboration come later. Public hosting, production Sanity writes, paid resources, and submissions still require separate owner authorization.

## Signature demonstration

“Make this top longer with a patch pocket. I have this fabric and a basic sewing machine. Keep the neckline, and help me with the sleeves.”

Stitches identifies compatible options, requests missing measurements, drafts and checks the candidate, finds the first cutting plan does not fit, then offers supported alternatives with recomputed results. The maker keeps one. The pocket appears in the garment, piece tray, cutting list, and assembly before the side seams close. The maker exports that revision and enters its guide. A later shared construction correction causes a pending proposal to require review; the accepted version remains reproducible.

This is the required story. The existing shoulder fragment and assembly-note proof are foundations, not substitutes for this journey.

## Quality bar

- A precise creative tool: generous garment imagery, readable controls, restrained chrome, responsive manipulation, and an assistant that acts on the work.
- Direct controls and assistant use the same operations. Provider failure preserves manual capabilities and saved work.
- Catalog, preview, pieces, and instructions identify the same version. An independently generated beauty image cannot represent an engine result.
- Pattern checks, a sewn sample, and ready-to-cut status have separate evidence. Physical maker trials are required before cut-ready claims; personal fit is never guaranteed.
- New makers can explore without terminology. Experienced makers reach measurements, seam values, sources, and export quickly.
- Sanity's value is visible in behavior; debug identifiers belong in an evidence drawer.

## Boundaries

Photo-to-exact-pattern reconstruction, body scanning, arbitrary PDF conversion, cloth-physics fit prediction, industrial grading, marketplaces, accounts, and social features are outside Studio 1.0. Inspiration analysis and useful 3D construction views are in scope now.

## Canonical documents

- ../devpost/scope.md: release boundary.
- ../devpost/prd.md: observable behavior and acceptance IDs.
- DESIGN.md: screen, interaction, copy, responsive, and visual contracts.
- ../devpost/spec.md: implementation contracts.
- CONTENT-MODEL.md: Sanity authoring and maintenance.
- ../devpost/checklist.md: executable work packages.
- SOL_HANDOFF.md: starting instructions and implementation discipline.
- ../design/stitches-studio.html: interactive visual reference, with illustrative reference data.

