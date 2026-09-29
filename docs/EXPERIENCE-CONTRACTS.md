# Experience contracts — screens, states and moments

Companion to DESIGN.md, PRD E01–E10 and spec C01–C10. These details cover production screens beyond the six-screen reference. Sol should implement real states, not just the happy-path layouts.

## The signature end-to-end brief

“I like this top. Make it a little longer, keep the neckline, add a pocket. I have 1.5 metres of this fabric and a basic sewing machine.”

1. The selected garment is already context; no re-entry of its name/version.
2. The assistant extracts the requested changes and locks, asks only for missing required measurements/fabric width, and names what it can support.
3. The server drafts complete pieces and checks the result. The canvas previews the proposal; the current kept version remains intact.
4. Cutting tools calculate a layout. If search finds none, say that—not “impossible” without evidence. Compare supported alternatives with actual checked outcomes.
5. A compact review shows shape/pieces/fabric/steps changed and what remains locked. The user keeps one version.
6. Make displays that version's pieces, method and prerequisites, including the pocket before the relevant closing seam.
7. Export contains the same artifact and instructions. Readiness is explicit; no physical-validation shortcut.

This is the primary demo and regression journey, not a hardcoded script. Manual control changes must traverse the same domain services.

## Screen and state map

| Surface | Primary decision/action | Required non-happy states |
| --- | --- | --- |
| Landing | Browse collection / resume project | Slow image/WebGL; no saved guest; supported collection unavailable |
| Collection | Choose a supported look | No filter matches; content unavailable; educational-only item distinctly separated |
| Garment detail | Study / make this design | Missing adapter; unreviewed family; rights limitation; unavailable view asset |
| Inspiration | Analyze then confirm features | Privacy consent/action absent; invalid file; unclear photo; no match; quota; cancel; manual feature entry |
| Projects | Resume / duplicate / backup | Empty library; browser storage warning; recoverable draft; corrupt/version-incompatible import |
| Explore | Understand piece/seam/step | Selected component removed; 3D unavailable; KB conflict; unsupported diagram |
| Design | Preview, compare, keep | Needs measurements; option conflict; lock conflict; bad join; stale proposal; concurrent edit |
| Fabric | Find checked feasible plan | Missing width/nap; unsupported assumptions; impossible; not found; unplaced pieces; stale plan |
| Make / Prepare | Check version/materials/print | Review-only output; missing supplies; scale mismatch; unsatisfied prerequisite |
| Make / Sew | Complete current step | Method not supported by equipment; missing authored detail; updated guidance needs review |
| Export | Download exact package | Unqualified source/geometry/maker; stale manifest; generation failure; retryable partial output |
| History | Compare/restore as new draft | Old engine unavailable; source retired; deleted artifact; cross-tab stale state |

## Garment detail layout

Desktop: editorial viewer on left (60%), name/promise/readiness/Make this design on right. Under the action: supported changes, fabric classes, required techniques, approximate difficulty described through techniques rather than invented hours. Lower sections expose the actual piece list, measurements to collect, source/creator/license and maker evidence. “See how it is made” enters Explore without creating a project; “Make this design” creates a guest draft.

Phone: garment first, title/action next, three short expandable sections. No forced modal before viewing the garment. A sample size is clearly a sample, not secretly the user's measurements.

## Project library

Quiet grid with garment thumbnail, project title, current stage and last saved/kept state. One action: New project. Each project menu offers Rename, Duplicate, Download backup, Delete. Delete confirms exact project and local-data scope. Empty state: “Your next make starts here.” → collection; secondary import backup.

Display “Saved in this workspace” only after server acknowledgement. Distinguish “Draft saved” from “Version kept.” If the cookie is lost, explain backup recovery; do not promise account-style cloud recovery. No fake collaborators, membership tiers or login controls.

## Revision review sheet

Header: “Review your changes.” Original/proposed selector and shared-camera preview. A short comparison groups Design / Pieces / Fabric / Making. Show only relevant differences, with units and source-backed consequences. Locks get a clear preserved/conflict state. Checks panel separates pattern checks, layout, instruction completeness and maker status.

Primary: Keep this version if valid as a review design; label review limitations before action. Secondary: Adjust / Discard. Keep succeeds atomically, closes sheet, updates the project title/status and offers Continue to Fabric. A stale response keeps inputs and offers Compare with current version / Recalculate, never silently retries acceptance.

## Measurement guide

Ask only for fields required by the chosen adapter. Each field has an anatomical landmark diagram, practical measurement instruction, numeric input, explicit unit, allowed range and error. Include “I need help measuring” and save partial progress. Never guess from uploaded clothing photos. Show ease as a separate design property; converting cm↔in does not repeatedly round the canonical mm value. Keyboard and screen reader can complete the flow.

## Assistant result patterns

Use four distinct result shapes:

- Clarification: one missing field or a small related group, with a reason.
- Explanation: short answer tied to selected piece/edge/step and source disclosure.
- Proposal: visible changed design, checks, consequences, review action.
- Constraint: compared supported alternatives, trade-offs and actual outcomes.

One status line follows observable work. The user can cancel. A resumable run shows the last completed useful result and what will happen next; no infinite spinner or invented reasoning transcript. Quota error copy: “The assistant is taking a break. Your design is safe. You can keep using the controls or retry after …” only include a real retry time when available.

## Cutting preparation and export review

Prepare checklist: selected version → readiness → materials → download → print at 100% → measure calibration square → join pages → verify marks/piece counts → prepare cloth → place/cut. Do not mark print calibration complete because the PDF contains a square; ask the maker to confirm the physical measurement.

Package sheet shows file types, paper choice, revision and ready/review status. Review-only package is watermarked and cannot use “ready to cut” copy. Show exact missing gate and where to address it. A downloadable summary for a tailor includes design/measurements/options/equipment/material assumptions and sources; keep private data out of public sharing by default.

## Making guide

At each step show: what this achieves; which pieces; right/wrong side; where to sew; authored allowance; micro-actions; check before proceeding. Use the same diagram grammar throughout. A progress click is the user's statement, not an AI verification of physical work. Back/next preserves state; branch prerequisites govern eligibility. Help receives step/project context automatically.

Equipment substitution appears only when an authored compatible method exists. “No overlocker” must never trigger invented instructions for fabric outside the method's scope. A corrected source during making flags the affected step and offers review; it does not erase prior completion.

## Evidence without technical clutter

Maker sees “Pattern notes,” “Checks,” “Updated guidance,” and “Needs review.” The drawer shows source title, author/version, applicable relationship, result time and method limitations. IDs, hashes and raw run receipts belong in a deeper diagnostic view. A green icon cannot erase an unresolved critical gate.

For the Sanity demo, open the drawer after the user outcome. Show why a method correction changes multiple looks; do not start the product tour in a content-management dashboard.

## Motion and empty-state copy

Transition the garment between meaningful states; no autoplay spin or decorative motion loop. Preserve selection/camera while opening panels. Skeletons match the target layout; errors preserve the user's entered work. Empty-state actions lead somewhere implemented. Unsupported requests explain the nearest supported alternative without pretending it is equivalent.

Copy should be calm, specific and adult. Avoid “AI magic,” “perfect fit,” “guaranteed,” fake confidence scores and “just.” Premium means clarity when something does not work as much as a beautiful first screen.

## Acceptance tour for the owner

Open the collection; choose a supported top; reveal a sleeve and its joining edge; change length/pocket; see the exact affected pieces/steps; create an inadequate-cloth case and recover; keep; export a correctly labeled package; reopen the project; walk a Make step on a phone. Then change a shared Sanity method in development and show precise impact and maintained Context verification. Repeat an abbreviated path for the skirt family. Record failures as well as success.
