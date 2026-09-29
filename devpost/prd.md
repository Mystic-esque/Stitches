---
doc: prd
status: implementation-ready-design
revision: studio-1.0
---

# Stitches — product requirements

## Product Summary

A garment studio that lets a maker discover a design, understand its construction, shape a supported version, plan the cloth, and make it with a source-grounded assistant. This is the full application target. scope.md defines inclusion; ../docs/DESIGN.md defines presentation; spec.md defines execution. Acceptance IDs below are stable references for code and tests.

## Target User and Core Journey

Primary: a home sewist with basic machine skills and limited pattern-alteration confidence. The first visit offers Explore the collection and Start from a photo. A garment detail leads into an uncommitted guest project. Studio stages are **Explore → Design → Fabric → Make**. Measurements are contextual tasks in Design; cutting and export are the first tasks in Make. My projects resumes exact revisions and progress. No login.

## E01 — Discovery and collection

As a maker, I want to begin with something I would like to wear and understand what I can change.

- **P01.1** Landing explains garment-to-making with a product demonstration and primary collection action; no unsupported fit or instant-pattern claims.
- **P01.2** At least six distinct supported looks across two qualified families. Every card names its family, techniques/level, fabric class, supported options, and readiness. Presets differ structurally, not just by color.
- **P01.3** Filters use published catalog attributes. Empty results name active constraints, allow removing one, and offer clearly identified nearby options.
- **P01.4** Detail shows front/back or rotatable construction, pieces, measurements needed, materials, techniques, options, source/creator attribution, and Make this design. Exploration needs no project.
- **P01.5** Starting a project records the exact version/preset. Removed templates remain viewable through existing accepted snapshots.

## E02 — Inspiration photo

As a maker, I want a buildable starting point from a garment image.

- **P02.1** Accept one JPEG/PNG/WebP within the published size limit. Show local preview, crop/reselect/remove, and explicit Analyze with a concise provider/data-use notice. Choosing a file alone does not send it.
- **P02.2** Return visible category, approximate silhouette, visible neckline/sleeve/length/pockets, and uncertainty. Do not infer measurements, fabric composition, hidden seams, back construction, or cutting geometry.
- **P02.3** Maker corrects observations before matching. Return up to three supported matches with Similar, Different, and available edits. Avoid uncalibrated probability percentages.
- **P02.4** No match, multiple garments, unclear image, unsupported category, timeout, and quota offer crop, manual attributes, or collection recovery. A match never auto-accepts a design.
- **P02.5** Photos stay outside shared Sanity and routine logs, with explicit deletion. Geometry always comes from the chosen template engine.

## E03 — Construction explorer

As a maker, I want to connect visible garment parts to their pieces and seams.

- **P03.1** A 3D construction view has orbit, front/back/side presets, reset, zoom, and explode. Selecting a flat piece highlights the corresponding panel and named partners. A complete 2D/text alternative works without WebGL.
- **P03.2** Piece selection exposes cut count, role, grain/fold, seam partners, and relevant instruction. Seam selection identifies both ends, orientation, and assembly step. Labels and line styles accompany colors.
- **P03.3** Assembly follows authored prerequisites; independent branches remain independent. Animation and diagrams share stable piece/edge IDs. Show this step opens its pose/selection.
- **P03.4** Construction preview is distinct from fit simulation. Length, sleeve, and pocket choices agree between garment/piece views. Missing bindings produce an explicit unavailable state.
- **P03.5** Keyboard, reduced motion, touch, loading, and renderer failure preserve meaningful actions.

## E04 — Measurements and design

As a maker, I want meaningful changes with clear effects and control.

- **P04.1** The top supports body length, one sleeve treatment/length operation, and patch-pocket add/remove with allowed placement. The second family supports two source-qualified operations. Incompatible combinations explain why.
- **P04.2** Measurement collection comes from the selected family/operation: name, diagram, how-to, units, requirement, source-qualified envelope. Metric/imperial round-trip without silent internal changes. Sample values are explicit.
- **P04.3** Missing/implausible values are identified beside the field. Only relevant fields are requested. Body measurement, wearing ease, and finished-garment measurement are distinct.
- **P04.4** One preview updates affected paths, markings, panels, cut counts, instructions, and downstream status. Locks are verified numerically or refused.
- **P04.5** Original/proposed comparison, undo/discard, and Keep version work. A change card names changes, affected steps, and open checks. Drag feedback is immediate; authoritative validation has its own state.
- **P04.6** Keeping creates one immutable revision. Stale project/content/measurement/equipment inputs prevent acceptance. A review draft may be retained while making checks remain unresolved; it cannot become cut-ready.

## E05 — Assistant carrying a brief

As a maker, I want the assistant to use studio tools to finish a design within my constraints.

- **P05.1** Assistant beside the canvas and in Make: brief, focused clarification, compact action plan, observable tool outcomes. Never expose internal chain-of-thought.
- **P05.2** A real multi-part brief triggers actual Context retrieval, exact graph inspection, drafting/checking, fabric planning, and instruction selection as applicable. Return concrete alternatives or a reviewable proposal.
- **P05.3** After a failed first fabric candidate, compare at most three supported alternatives with recomputed results. Do not silently relax a lock. Maker chooses the tradeoff.
- **P05.4** Equipment questions use authored methods. No overlocker selects an applicable supported method or explains the gap, updating relevant steps.
- **P05.5** Sources/tool receipts are inspectable and revision-bound. Show on garment navigates only to valid piece/seam IDs.
- **P05.6** Cancel, timeout, quota, missing KB, contradictory evidence, malformed call, and interruption preserve accepted work. Resume reuses only current results. A recorded walkthrough is explicitly labeled.

## E06 — Fabric and cutting

As a maker, I want to know whether this version fits my cloth and how to cut it.

- **P06.1** Collect usable width, available length, units, shrinkage/prewash assumptions, direction/nap, fold mode, and optional exclusion zones. Missing inputs remain visible.
- **P06.2** Expand physical cut instances respecting mirror/fold/grain/clearance. A feasible result includes placement coordinates and checks. Search exhaustion means No layout found within the limit, not proof of impossibility.
- **P06.3** Cloth view includes labels, dimensions, selvage/fold, grain, and unplaced pieces. Distinguish proven necessary impossibility, feasible arrangement, incomplete inputs, and bounded search failure. No optimality claim.
- **P06.4** Changed design/fabric inputs invalidate old layouts. Width/version comparison recomputes. Area alone never proves fit.
- **P06.5** Cutting preparation includes authored cloth prep, print calibration, piece/count inventory, right/wrong-side conventions, fold/mirror reminders, and marking transfer.

## E07 — Make and learn

As a maker, I want the next action for my exact version.

- **P07.1** Focused step: revision, title, pieces, orientation diagram, authored seam/allowance, method/equipment, micro-actions, and outcome check. Brief instructions first, optional detail.
- **P07.2** Pocket variants insert steps before dependent seams; omitted components remove irrelevant work. Only affected completed steps require review after a kept change.
- **P07.3** Mark done, undo, revisit, pause, and reload work. Prerequisite conflicts explain the required step.
- **P07.4** Explain this uses current step/source scope and points to the diagram. Help preserves position; phone controls are reachable.
- **P07.5** Completion records notes/photo and offers reuse. User-marked completion is not automatically a pattern quality certification.

## E08 — Export and continuity

As a maker, I want a portable package and the ability to return.

- **P08.1** Guest projects support rename, duplicate, backup, validated import, and explicit delete. Storage/retention and session limits are explained without signup.
- **P08.2** Package includes A4/Letter tiled patterns, full-size SVG/PDF, calibration, labeled pieces/notches/grain/counts, cutting plan, materials, exact sewing guide, attribution, and version manifest.
- **P08.3** Internal millimetres and 100% print scale. Mathematical and physical calibration checks; no clipping, missing margins/tiles, duplicate pieces, or swapped labels.
- **P08.4** Geometry, instruction, placement, and maker-review evidence govern labels. With open gates, only a clearly marked review package is available.
- **P08.5** Concurrent tabs, duplicate clicks, network failure, and server restart cannot silently corrupt accepted revisions.

## E09 — Maintained Sanity knowledge

As an editor, I want one correction to improve applicable designs while preserving prior work.

- **P09.1** Catalog/options/measurements/seams/assembly/methods/sources are structured. A qualified preset added in Sanity appears without UI code changes.
- **P09.2** Retrieve actual Stitches-only Context KB evidence and reconcile with exact records. Stale/contradictory prose cannot authorize an action.
- **P09.3** A corrected shared method changes at least two looks. Pending proposals become stale; accepted snapshots remain reproducible with targeted review notices.
- **P09.4** Editorial workflow shows validation, affected records, refresh/rebuild state, and served-entry verification. Maintenance failure preserves a recoverable last-good state. Do not imply a Function was deployed or a rebuild automated unless observed.

## E10 — Quality and review

- **P10.1** Verify collection → studio → measurements → multi-operation proposal → constraint recovery → retained revision → cut plan → export → sewing in a real browser.
- **P10.2** Meet DESIGN.md at 1440/1024/768/390/320 px: no overflow, canvas-only essential action, clipped focus, or unreadable control. Keyboard and reduced-motion rehearsals required.
- **P10.3** Distinguish live Gemini/Context, fixtures, render checks, numerical checks, physical print, and physical make. Benchmark identical task/corpus versions and report failures.
- **P10.4** No secrets in browser/logs/exports. Test guest isolation. Prepare a reviewable local release before separate deployment/submission authorization.

## Edge Cases and Language

Every screen covers first use, loading, empty, partial, failure, retry, and restored state. Preserve unsaved input when recovery is possible. Use “This version needs a sleeve check,” “This piece is wider than your usable cloth,” and “I couldn't finish the calculation. Your kept version is safe.” Evidence appears behind View checks or Pattern notes. Avoid debug IDs, raw hashes, invented confidence, perfect-fit promises, and repeated technical caveats.

## What We Are Building

All E01–E10 behavior is the Studio 1.0 target. At least two families/six presets, multiple real edits, image matching, guest persistence, 3D exploration, full cutting/sewing/export, live tool use, and editorial impact are included. The previous one-slider proof remains evidence of progress only.

## What We Would Add Later

Accounts/sync, collaboration, arbitrary pattern import, physics-based drape/fit, broader garment classes, community marketplace, automatic photo-to-exact-pattern reconstruction. Do not defer the core making workflow to this list.

## Submission Proof Points and Completion

The signature brief in PRODUCT.md must complete a real tool sequence and recover from one failed constraint. Capture an editorial correction affecting multiple looks, meaningful comparison evidence, actual desktop/mobile screenshots, maker and print records, and exact local setup. Every open real-world gate remains named. Licensing/physical review gaps do not stop independent engineering, but prevent calling the whole release complete.
