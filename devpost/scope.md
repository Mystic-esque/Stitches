---
doc: scope
status: approved-direction; implementation-evidence-pending
revision: companion-2.0
---
# Stitches — project-aware sewing companion

## One-line scope
Stitches helps a maker carry a garment from idea or pattern through preparation, cutting where qualified, sewing, checking and recovery. It understands how pieces become clothing through Sanity-authored relationships and bounded deterministic tools.

## Audience and task
Primary: home sewists with basic machine operation who need pattern literacy and step-specific help. Secondary: beginners exploring an example and designers planning construction. A successful maker can start or resume a project, identify what they know and do not know, understand relevant flat pieces and cutting marks, choose an applicable next action, and recover from a real making problem.

## Core product
- Project-first home: two genuinely different, source-qualified example projects plus "my idea/pattern." Variants are not counted as new garments.
- A private guest project remembers references, confirmed features, measurements, fabric, equipment, pattern/version, decisions, current step, checkpoints and attempted fixes. No account required.
- The pattern-connected workbench ties finished appearance to technical flat pieces, joining edges, fold/grain/cut-count/markings, change overlays, consequence trail and the active construction step. Exact cutting detail appears only for qualified versions.
- Preparation checks source, measurements, material, tools, layout assumptions and unresolved risks.
- Make mode teaches a single operation with orientation, parts, authored measurements, checkpoint and context-specific help.
- "I'm stuck" narrows symptoms with authored diagnostic tests, explains possible causes and offers a checked next step. Optional close-up image supplies observations, never a definitive diagnosis.
- A bounded Gemini tool loop reads exact Sanity graph records and actual Stitches Context KB guidance, performs deterministic validations, asks for missing facts and proposes reviewable changes. It never silently keeps a change.
- An editor correction in development changes applicable guidance for two different projects, with exact and served-KB evidence recorded separately.

## Capability boundary
Planning projects can use photos or a user's externally authored pattern to organize work; a garment image is not an exact pattern. Exact pattern/cutting/export operations need licensed complete source/engine, piece/edge mapping, numerical checks and physical maker review for the claimed scope. No universal CAD, automatic photo-to-pattern, drape prediction or fit guarantee. Educational diagrams are clearly labeled.

## Release gate
Two distinct project journeys, useful context-aware troubleshooting, project persistence, qualified 2D teaching/pattern details, real Sanity maintenance, real bounded model calls, meaningful benchmarks, recoverable failures, responsive accessible UI and actual maker/print evidence. If a physical/source gate fails, preserve the planning and education workflow but do not call the affected output cut-ready.

## Constraints
Sanity challenge is primary; Devpost is secondary. $0 paid providers, free available quota, Stitches development dataset only, no production changes, no public deployment or submission without separate authority. Existing illustrative proof and September 29 visual reference are historical, not completion evidence.
# Approved workspace-agent scope update — October 4, 2026

The primary product is a persistent, project-aware sewing workspace. Overview, Pattern, Materials, Make and Check share one private project and a collapsible contextual companion. The short-term implementation reuses existing planning-only modules; it is not a cut-ready pattern editor. The next demonstrable agent capability is a source-backed action on an explicitly selected real piece or step, with a server-validated basis, visible tool evidence and a reviewable result. A fixed question menu plus final prose is transitional, not the target proof.

Retain rather than silently drop the larger application: two genuinely distinct source-qualified garments, measured supported edits, checked layouts and print, conditional diagnosis, optional private images, teaching diagrams, physical maker review, and later 3D/fit simulation. Each remains gated by its own source, rights, geometry, privacy and/or physical evidence. `../docs/WORKSPACE-AGENT-DIRECTION.md` is the design authority for this migration; `../docs/STATUS.md` is the implementation truth.
