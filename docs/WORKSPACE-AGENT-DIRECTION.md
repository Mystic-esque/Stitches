# Stitches: the agentic sewing workspace

Latest execution order: `PRODUCT-RELEASE-PLAN.md` turns this direction into one product-led R1-R4 release. Use its supported Sandy study -> saved decision -> preparation/Make -> diagnostic journey and compact-screen acceptance. The interaction and later capability contracts below remain applicable; older references to the diagnostic editorial gate are historical (15/15 now passes, runtime integration remains open).

Date: October 4, 2026. Status: owner-approved target direction; first workspace migration in progress, not a completion claim. See `STATUS.md` for actual verification.

Prepared from both supplied UI images, visual frames across the complete supplied ten-second video, the current code and Companion 2.0 contracts. The owner's later instruction explicitly retains advanced capabilities in the future roadmap.

This document defines the approved next application direction and its staged migration. Existing code, Sanity content and completed evidence remain authoritative only for their verified scopes; the approval does not turn roadmap capabilities into current behavior.

## 1. Recommended direction

Build **Stitches as a persistent sewing workspace with an agent that can work on the project in front of the maker**.

A person should be able to say, "Help me make this," select a piece, ask a question, inspect a checked change, follow a construction step and return tomorrow without rebuilding context. The agent should leave useful objects behind: an annotated diagram, a confirmed project fact, an ordered plan, a measured comparison, a diagnostic test or a saved decision.

The core interaction is:

**Tell or show -> inspect the project -> choose useful tools -> produce a visible result -> ask only where needed -> continue from the saved result.**

This is an evolution of Companion 2.0. Preserve the private store, source relationships, pattern engine boundary and recovery mechanisms. Change the application composition, agent input/output contract and how people reach the existing capabilities.

### What is causing the current experience

- `CompanionHome.tsx` composes piece study, pattern board, making, diagnostics, preparation, assistant and a large brief form into a long project page. These are useful modules, but the maker must coordinate them.
- `ProjectAssistant.tsx` offers task choices and a separate result section. The person does not have a continuous project conversation beside the object they are working on.
- The current controller forces three reads and an explanation. The model has almost no meaningful decision about what work to do next.
- The provider receives little of the actual request or observed problem. Minimization has become so restrictive that it limits relevant assistance.
- Selection, making progress and assistant context are not one shared contract. The October 4 review reproduced missing making-state invalidation and optional-piece discrepancies.
- Repeated capability/source notices take space that could teach a piece relationship or show a next action.

The redesign must improve these behaviors together. Moving the same fixed question menu into a sidebar would leave the central problem intact.

## 2. What the supplied references contribute

These are concept references. Their text, numeric examples, garment geometry and apparent results do not establish sewing correctness.

| Reference | What to adopt | What to improve |
| --- | --- | --- |
| Desktop mockup: AI_sewing_companion_UI_mockup_2K_20261004015358.jpg | Stable project header; left navigation; large technical center; companion on the right; selected piece information; fabric-change notice; action history | Consolidate duplicate Pattern/Construction/Build navigation. Reduce permanent widgets and toolbar controls. Show only implemented tools. Make each action produce a traceable result. |
| Tablet mockup: Requesting_clearer_page_scan_2K_20261004015446.jpg | Pattern beside garment; touch selection; visual correspondence between a region and a piece; companion within reach | Do not shrink a desktop cockpit onto a tablet. Make the reference pane optional and use a sheet for help. Much of the generated text is illegible, so infer composition rather than requirements from it. |
| Make_application_usage_video_20261004015410.mp4 | Immediate visible response to selection; direct manipulation; contextual actions; returning from the screen to physical work | Distinguish selecting, proposing, checking and applying. A glow on a photograph or changed rendering cannot establish a valid pattern adjustment. |

Video inspection: 10.01 seconds, 1280 x 720, 24 fps. Reviewed ten visual samples covering approximately 0.5-9.5 seconds. Audio was not transcribed. At roughly 0-3 seconds the tablet presents pattern, garment and companion together; at 3-6 seconds a point/waist-area interaction produces a highlighted garment region; at 6-8 seconds a close-up shows "Making neckline lower," "Review layout" and "Show next step"; at 8-10 seconds the maker returns toward the fabric and scissors. The exact geometry transition and underlying validation cannot be established from the concept clip.

The strongest reference lesson is continuity: selection, explanation, proposed work and the next physical task belong in the same place.

## 3. One application, one project, a small number of places

### Entry and first minute

Keep a concise marketing page at `/`. Its primary action is **Open Stitches**. Returning makers should go straight to their library or last project rather than scroll through marketing.

The workspace home at `/app` has one central composer: **What are we making?** Below it: **Use a supported project**, **Bring a pattern or reference**, **Continue a project**. Recent projects are visible immediately. No signup is required.

Typing a brief creates a private working project. The first useful response offers an artifact or asks one consequential question. Do not require a full measurement/material/equipment form first. Input collection should follow the task: explain a fold without body measurements; ask for the measurements required by a requested draft when drafting becomes relevant.

Uploads can be kept locally before analysis. Before anything is sent to Gemini, show which attachment or private fields will be shared. A new user may still choose manual project creation and all existing tools.

### Desktop workspace

```text
Project switcher | Project name / saved state / version | History / Export
----------------+--------------------------------------+------------------
Project          | Active work surface                 | Stitches
  Overview       | local toolbar and selection         | selected context
  Pattern        |                                      | conversation
  Materials      | large piece / diagram / layout       | current work
  Make           | or focused step                      | result cards
  Check          |                                      | review actions
                 | optional reference pane             | composer
Resources        |                                      | attachments
History          | collapsible selection details        |
My sewing kit    |                                      |
```

Five primary destinations:
- **Overview:** brief, references, decisions, next useful action and unresolved questions.
- **Pattern:** connected pieces, marks, measurements, supported variations and comparisons.
- **Materials:** fabric, supplies, equipment compatibility, preparation and eventual cutting layout.
- **Make:** current operation, construction diagram, authored prerequisites, checkpoint and local help.
- **Check:** observations, tests, attempts and outcomes; later fit assessment.

Resources holds original pattern pages, source links, references and generated artifacts. History is one event timeline. My sewing kit opens reusable private profile settings. Measurements are a project drawer reachable from Pattern or a missing-input request; they do not need another top-level destination. Pattern parts and assembly are related views, not a second competing global navigation.

Each destination has a stable URL, for example `/app/projects/:id/pattern?piece=skirt&edge=hem`. Browser back, refresh and a shared local bookmark restore location. URLs contain IDs and view state, never measurements, question text or signed attachment URLs. Guest access remains enforced server-side.

### Navigation and state

The project remains loaded while the central surface changes. Keep conversation draft, last viewed piece and diagram zoom within the project. Explicitly show whether the composer refers to the selected piece, a making step or the whole project. A context chip such as **Sandy / hem edge / draft 3** is inspectable and removable.

Do not silently change a sent request when the person selects another piece. Pin context at send time. A response can say "For the hem edge you asked about" and provide **Return to selection**. A mere navigation change does not invalidate an otherwise current result; a changed dependency does.

The dock can be collapsed. Opening "Explain this edge" or "I'm stuck here" brings it back with the correct context and keyboard focus. Manual work remains available while the agent runs.

### Tablet and phone

At 1440 px: approximately 208 px navigation, 352 px companion and the remaining width for the work surface. Both rails resize/collapse. At 1024 px the navigation becomes a drawer; show the companion alongside only if the canvas still has useful working width. At 768 px, default to a full canvas and an assistant sheet. At 390/320 px use one surface at a time with bottom navigation and a Help action; use a compact menu for destinations that do not fit.

Make Mode prioritizes the diagram, one action and its checkpoint on a phone. A trouble flow opens a sheet without losing the step. No tiny desktop toolbar, hidden hover-only facts or forced two-column diagram at phone width.

Keep the aspirational features: lower neckline, dart/curve editing, automatic layout updates, garment previews, camera-assisted fit checks and richer autonomy. Section 12 assigns their delivery stages and technical dependencies.

## 4. Visual direction and interaction quality

Use the warm precision of the supplied desktop mockup. The working surface should feel like a well-made creative tool: quiet borders, clear type, large useful diagrams, limited accent color and consistent control placement.

Proposed tokens: warm canvas #F5F2EB; raised surface #FFFCF6; ink #252B28; muted ink #616962; divider #D8D2C8; deep green #284B3B; terracotta #A9543C for primary change actions; amber warning treatment with a dark text/icon. Verify actual combinations for contrast before adoption. Keep the existing serif for marketing and occasional project titles; use the existing readable sans for workspace controls and instructions. Controls/body 14-16 px, secondary labels at least 13 px, numeric dimensions in tabular figures. Retain 44 px touch targets.

Default the technical canvas to warm paper with crisp contrasting lines. Offer a dark technical view for preference and long sessions; do not make the dark/light split a product requirement. Use dashed original edges, solid proposed edges, paired seam labels and shape-coded marks. Color alone cannot communicate a match or a change.

The canvas toolbar initially needs Select, Pan, Zoom, Fit, Measure and Layers, plus supported variation actions. Add controls as their operations become real. The reference's Point/Curve/Notch/Dart/Allowance tools stay on the roadmap; a nonfunctional CAD toolbar should not appear in the shipped workspace.

The companion has four parts: a small context header, useful conversation, expandable activity, and an anchored composer. Result cards contain the answer and the object/action it concerns. Technical source receipts live under **Why this?** or **Sources and checks**. Ordinary makers should not need to read MCP names, hashes or request counters to proceed.

Show one project capability summary, with precise local restrictions near affected actions. Avoid repeating "planning only" in every component. When cutting is unavailable, show the concrete missing check and useful next action. Do not hide a material limitation behind an information icon.

Replace the mockup's ambiguous "35% complete" with meaningful progress: **3 of 8 preparation checks confirmed** or **Step 4 of 12 reported sewn**. Learning checkpoints and maker-reported physical actions are different records. Estimated times need authored estimates and visible scope; leave them absent until available.

Animation explains selection, assembly or differences. It must be interruptible, work with reduced motion and have a static equivalent. Keep focus, captions and labels legible. A qualified artifact, an educational schematic and a reference photograph each need an unmistakable presentation.

## 5. What happens in each work surface

### Pattern: technical literacy and supported creative work

Selecting a piece reveals cut count, fold/mirroring, grain, seam and cutting lines, known marks and its place in the construction. Selecting a join reveals both partners together with orientation. The agent can highlight the exact objects and explain their relationship.

A supported change creates a compare view: original/proposed, numeric differences, preserved constraints, affected pieces and steps, and unresolved checks. **Keep this version** commits only an eligible proposal; **Discard** removes the draft. The existing Sandy length study is the first useful measured comparison and retains its current non-cuttable status.

Reference imagery can be pinned alongside. An image region can link to a known piece when the mapping is authored and verified. An AI-suggested region remains a candidate mapping until reviewed. A photograph of a dress does not become an exact preview of Sandy or Tina.

### Materials: a working preparation surface

Show the currently relevant fabric, amount, width, direction/stretch observations and available equipment. Separate reported facts from measured/check results. Editing width must produce a specific impact card: "The previous layout used 150 cm. Your saved width is now 145 cm."

If a layout engine and qualified artifact exist, the agent requests a new layout and presents the result. Until then it can identify the stale assumption and required check; it cannot announce that the pieces fit. Keep the layout workspace location in the architecture now and implement it when the dependencies in the roadmap are satisfied.

### Make: show how to perform this operation

One operation occupies the center: exact involved pieces, which sides face, matching marks, start/end, authored allowance where supplied, short actions, and a checkpoint. The illustration changes with the confirmed version, including omitted sleeves or other options.

Use authored SVG/diagram assets bound to piece and edge IDs. A text-only card cannot close the visual teaching gate. The local mode offers **Explain**, **Show on pattern**, **I'm stuck**, **Save a note**, and an appropriately labeled progress action.

### Check: investigation with memory

"I'm stuck" starts an issue tied to the selected operation and version. The agent considers recorded observations and earlier attempts, chooses an applicable discriminating check, waits for a reported result, and changes its recommendation accordingly. It should not repeatedly suggest a failed test without an explained change in circumstances.

Optional close-up photos help identify observations. The maker confirms consequential observations before they become accepted test results. **Fit Check** becomes a later tab within this surface, beginning with structured front/side/back self-observations and source-backed adjustment candidates.

### Resources and history

Resources unifies pattern pages, photos, source notes, diagrams and generated artifacts. Open a cited page or diagram beside the relevant result. Page reading and annotation are useful even where geometry is unavailable.

History records who requested a change, its prior basis, checked effects, acceptance and later invalidation. **Undo** restores editable digital state through a new revision. It never claims to undo a seam someone has physically sewn.

## 6. The agent: a bounded work partner

“Agentic” should mean the maker gives Stitches a project task and relevant selected context; Stitches inspects the project and sources, chooses registered tools, observes their results, asks a focused question when needed, and leaves a visible result. It can resume a short task from saved checkpoints. It cannot authorize itself to change a kept pattern or claim it performed physical work.

A future supported request might be: “Shorten this hem by 8 cm, preserve the vent, check my saved fabric assumptions, and show me what changes before I decide.” The agent checks whether the operation is supported, requests a deterministic draft, inspects affected pieces and a qualified layout if available, then presents a review card. If the vent or layout cannot be verified, it stops at that boundary and names the missing evidence.

At a sewing step, “This sleeve is twisting at the underarm. What should I check?” should bind to the active sleeve step, selected sleeve and armhole edges, confirmed version, relevant fabric/equipment and prior attempts. The agent loads the applicable Sanity method, asks the authored check, and conditions the next step on the maker’s result. If exact edge bindings or reviewed diagnostic records are missing, it asks for an observation or gives a safe stop.

### Registered tool families

These names describe Stitches application contracts, not vendor APIs. Keep each tool typed, narrow and independently checked.

| Family | Examples | Authority |
| --- | --- | --- |
| Project/context | inspect project, selection, version, material, equipment and progress | Read only the owner’s task-relevant snapshot. |
| Shared knowledge | resolve exact graph, step dependencies, Context entry, applicable diagnostic | Server chooses fixed Content Lake queries and current KB paths; keep source and review status. |
| Deterministic checks | missing inputs, option compatibility, piece relationship, staleness, later fabric layout | Exact records and validators decide; Gemini cannot write the check result. |
| Teaching | explain selection, prepare annotated view, compare piece roles, prepare step card | Create a navigable artifact from authored IDs with sources and gaps. |
| Troubleshooting | select diagnostic test, record maker-reported result, compare prior attempts, later propose remedy | Maker supplies observation/result; deterministic rules govern applicability and risk. |
| Pattern work | draft registered operation, inspect proposal, validate artifact, later compare layouts | Qualified engine and independent checks return a versioned proposal. No arbitrary shell, GROQ, SVG or point editing. |
| Confirmed changes | later keep proposal, record maker progress, confirm observation | Require explicit maker action, idempotency, current basis and immutable event. Gemini may prepare the confirmation card, never silently commit it. |

Do not expose every tool to every request. Server context and task route narrow the allowed set; Gemini chooses only among eligible operations. The server validates each call independently. “The agent planned this” and “the action completed” are separate states.

### Interaction and memory

1. Maker writes/speaks a request or invokes a contextual action on a selected object.
2. UI pins the project revision, mode, piece/edge/step, confirmed options and any private fields the maker approved for this request.
3. Server loads owner-scoped project state, exact current Sanity records, construction plan/history and actual Context entry; it computes a basis fingerprint.
4. Gemini requests one eligible read, check or draft at a time. Server runs it, saves provenance and rechecks the basis. Retrieved prose/images are data, never instructions.
5. The agent may request another allowed tool, ask one focused question or prepare a result. Validators reject unsupported actions.
6. UI presents an answer/artifact card with what was checked, source and limits, and a clear next action. Keeping a proposal or reporting physical progress needs a maker confirmation.
7. Private project history stores the request, basis, tool receipts and maker response. Future work uses relevant outcomes instead of repeating a failed test blindly.

Show honest activity, for example: **Checking the selected seam → Reading the construction note → Comparing marked edges → Ready for review**. Each activity item opens its evidence. Do not animate fabricated tool work.

Separate actions into read/explain, draft/validate, and maker-confirmed changes. Preserve the free-tier cap, explicit inference consent, active-time/request limits, cancellation, exact acknowledged resume and cautious handling of ambiguous provider outcomes. Bind each run to the source/engine fingerprint, options, relevant material/equipment, exact graph, served KB hash, making plan and history head, active step, selected piece/edge and consented inputs. A dependency change makes the result historical before it can appear current. Include only facts this task uses; preview those facts before sending.

## 7. Sanity and private project data

Sanity is shared, maintained sewing knowledge. The guest project is the maker’s private working memory. Gemini coordinates approved work. This separation makes Stitches more than a general chat and keeps personal measurements and problem history out of shared content.

The current content model already includes most public concepts needed: source documents; patterns and versions; pieces and seams; fabric requirements/classes; operations; construction procedures, techniques and equipment; steps; issue patterns, tests, remedies and review evidence. The workspace redesign does not justify an immediate schema rewrite or another Knowledge Base rebuild.

Keep two separate Sanity paths:

- Fixed, parameterized Content Lake queries supply typed piece, edge, option, prerequisite, applicability and version relationships for checks.
- The actual scoped Context Knowledge Base supplies maintained prose and source reconciliation. Its current diagnostic source-identity gate remains visible; planning content must not satisfy a construction request.

Sanity Context is read-only and does not run the application’s agent loop. Knowledge Base mode serves rebuilt entries; structured dataset access can serve schema-aware data. See [Sanity Context](https://www.sanity.io/docs/ai/sanity-context) and [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases). Context cannot execute pattern edits or save maker decisions.

First audit existing records: Tina/Sandy conditions and option-specific pieces; cut/mirror marks; construction-source identities; exact edge partners; diagram references; diagnostic outcome branches. Add a field only when an implemented capability needs it: reviewed diagram asset, exact orientation/mate, operation compatibility and impacted IDs, or typed diagnostic outcomes/risk. Version the record and its fingerprints.

A public instructional diagram may live in Sanity only with author, source, rights, revision and applicable options. User photos, measurements, project questions, private outcomes and generated geometry stay private. A later teaching model can reference reviewed semantic piece IDs; avatar data and simulation remain separate and cannot confer cut or fit readiness.

The Sanity proof moment remains a source-backed method correction affecting two distinct project graphs. Refresh the KB independently, check the served entry, identify which future steps are stale and preserve physical history.

**No Sanity write or rebuild is needed to approve this workspace proposal.** Existing data supports initial navigation and read/explain guidance after the current basis and piece-projection gaps are fixed. Any future content change stays in Stitches development with a dry run, exact-ID validation, backup, guarded write, read-back and separate served-KB verification.

## 8. What this changes in the application

| Area | Current state | Proposed change |
| --- | --- | --- |
| Entry | `CompanionHome.tsx` combines landing, gallery, library, intake and a large form. | Keep a concise public landing; add a direct workspace home, composer and recent projects. |
| Project navigation | One long page stacks independent tools. | Add project shell and five routed destinations: Overview, Pattern, Materials, Make and Check. Reuse existing modules as views while migrating. |
| Pattern | `PatternBoard`, `PieceStudy`, Worktable and `/demo` have different scopes. | Share selected piece/edge/step context and source receipts. Preserve demonstrational geometry as illustrative until qualified. |
| Making/recovery | `MakeWorkspace`, `DiagnosticStudy`, `DiagnosticHistory` are separate page areas. | Center the active step. Open Check and assistant in context, with exact prior attempts and the right option-specific pieces. |
| Assistant | `ProjectAssistant.tsx` uses a task picker and final prose card. | Add a collapsible project dock with task thread, activity receipts, structured artifact cards, focused questions and proposal review. |
| Agent state | `agent-run.ts`, `companion-tools.ts`, controller and guest store bind incomplete making context. | Add canonical workspace context and task-specific basis/consent; persist tool/artifact receipts and stale status. |
| Materials | Brief and preparation components collect notes but are not a dedicated workspace. | Add a Materials destination and concrete stale-assumption cards. Build layout only when geometry and validation qualify it. |
| Sanity | Exact catalog and Context readers exist; the diagnostic KB has an unresolved source identity check. | Show graph facts and KB prose separately. Audit existing content first; correct only observed source gaps in development. |
| Quality/evidence | Existing tests and receipts cover earlier surfaces and preparation runs. | Add selected-context live task evidence, real workspace screenshots, keyboard/mobile flows, stale/failed tool states and maker observation. Preserve all earlier receipts with their original scope. |

Private project database impact is more immediate than public Sanity impact. Resolve one server-owned workspace snapshot containing project revision, selected source/object, active making session/options/history, relevant private facts, graph/KB fingerprints and explicit consent. The selected piece can stay transient until the user sends a request; then pin it in the private run record. Cursor movement should not create project revisions or Sanity writes.

The client can maintain a small view state (destination, selected object, diagram zoom, open dock). The server resolves and validates all authority-bearing state. Never trust client-supplied selection IDs without checking them against the current exact graph/artifact.

## 9. Delivery sequence

### A. Make agent context trustworthy

- Bind each run to construction plan version, confirmed options, making history head/hash, active and selected step, selected piece/edge, project/source, exact graph and served KB hash.
- Share the same condition-aware involved-piece resolver between Make and the agent; preserve cut count, fold and mirroring.
- Stop construction retrieval when its construction entry is absent. Do not accept planning prose as construction evidence.
- Make task-specific consent preview show the actual selected item, progress and symptom category sent to Gemini; keep freeform/private values withheld unless explicitly necessary and consented.
- Add tests for an option/checkpoint/source/KB change during a run, and ensure old insights become historical and cannot resume as current.

**Exit:** no changed option, step or source can leave a current-looking answer with mixed state; disabled optional pieces never appear in agent context.

### B. Build the project workspace shell

- Split stable project navigation from the long overview page. Reuse the existing modules in the new routes before replacing their internals.
- Implement Overview, Pattern, Materials, Make and Check destinations, stable deep links, saved state and browser back.
- Keep a compact collapsible assistant dock with pinned context chips and activity. On narrow screens it becomes a help sheet; preserve manual controls.
- Show one useful source-backed object: select a real piece/edge or active step, ask for help, see its source and linked highlight, and return to the selection.
- Keep empty, stale, source-unavailable and no-provider states useful.

**Exit:** a person starts/resumes one project, selects an applicable object or step, gets a grounded result about that exact context, and completes the same journey on desktop and phone.

### C. Prove an actual agent action

- Add only eligible project-context reads, prerequisite/option/material checks and currently qualified knowledge lookups.
- Let Gemini choose among the relevant bounded tools; validate each call independently, save its result and source, and recheck the run basis.
- Support a focused missing-fact question and resume from a safe saved checkpoint.
- Return at least one inspectable artifact such as an annotated piece/edge view or a sourced step card; model prose alone is not an action.
- Add deterministic draft/validate/Keep only after a real engine and operation pass their separate gates.

**Exit:** a live run chooses a relevant tool based on the maker’s task, uses its real result in the next decision, handles a missing fact or failed check, and leaves a reviewable result. Record real provider, Context and Content Lake evidence separately from fixtures.

### D. Complete source-backed troubleshooting

- Repair the actual test/remedy source identity gate before enabling diagnosis.
- Bind the active step, selected pieces/edges, version, maker-confirmed observation and prior attempts.
- Ask one applicable discriminating test, wait for the reported result, then narrow possibilities. Stop when evidence conflicts or is missing.
- Test stale method, uncertain outcome, unsuccessful attempt, source outage, quota and cancellation.

**Exit:** two distinct project scenarios exercise a reviewed shared method with exact graph and separately checked served KB; an unavailable or conflicting source causes a clear stop.

### E. Add design operations and outputs

Qualify rights and a semantic pattern artifact for one real design at two materially different inputs. Add registered domain commands, complete redraft, independent checks and a proposal preview. Stale only the facts/artifacts that depend on changed source or options, preserving earlier sewing history.

**Exit:** accepted proposals reproduce from their inputs and engine version; unsupported/rejected proposals leave the project untouched. Layout/print claims still require separate checks and physical review.

Across every phase, verify 1440/1024/768/390/320 widths, keyboard/focus, screen-reader canvas labels, reduced motion, backups, stale tabs, guest isolation and screenshots. Freeze benchmark tasks before comparing with keyword search. Observe makers before claiming teaching clarity.

## 10. Keep the larger ambition in the roadmap

These are later product capabilities, not dropped ideas. The workspace can reserve a clearly labeled place for a future capability, but omit nonfunctional controls until they can produce a useful result.

| Later capability | Value and prerequisites |
| --- | --- |
| Neckline/dart/curve/notch/seam-allowance editor | Direct supported design work. Requires rights-cleared pattern, semantic artifact, stable IDs, registered operations, full redraft and independent checks. No arbitrary curve handles. |
| Fabric layout and cutting workspace | Check exact pieces against actual fabric and prepare layout. Requires complete geometry, fold/grain/nap/selvage facts, tested layout algorithm, print calibration and physical review. |
| Reference garment photo analysis | Create editable visible-feature observations and unknowns. Requires private temporary upload, explicit per-image consent, bounded vision request and maker correction. Image understanding can observe appearance but cannot reveal hidden construction or draft a pattern ([Gemini guide](https://ai.google.dev/gemini-api/docs/image-understanding)). |
| Garment-to-piece visual mapping | Select a garment region to focus exact semantic pieces/edges. Requires rights-cleared photos and reviewed region-to-piece bindings; ambiguous AI suggestions need human confirmation. |
| Camera-assisted fit review | Help compare sewn outcome with measurements/observations. Start with private self-report; any camera-derived measurements require validated scale/body assumptions and physical maker studies. Never infer fit from a fashion image. |
| 3D assembly explainer | Rotate or animate parts joining. Requires qualified 2D topology, shared piece IDs, authored/rights-cleared models, accessible 2D equivalent and device performance. Three.js can display model animation; it is not itself a validated cloth or fit solver ([manual](https://threejs.org/manual/pages/animation-system.html)). |
| Physical drape simulation | Explore fabric behavior. Requires a validated avatar, fabric properties, sewing constraints, simulation and comparison against real garments; remains experimental and cannot establish cut readiness. |
| Fabric stash and sewing kit reasoning | Match projects to privately saved materials/tools. Requires maker-confirmed inventory and sourced compatibility; never guess fiber or stretch from a photo. |
| Voice/hands-free guidance | Help at the machine. Requires reliable speech, read-back of selected step, captions, explicit confirmation for consequential actions and manual fallback. |
| More pattern families, creator collections, cloud collaboration | Each family needs independent source, rights, graph, instruction and maker qualification. Collaboration requires explicit account, authorization and private asset model. Recolors do not count as breadth. |

## 11. Documents and implementation contracts affected

This direction is approved. The linked artifacts are being aligned incrementally; each records implemented versus future gates separately:

| Document or area | Required alignment |
| --- | --- |
| `docs/PRODUCT.md`, `docs/DIRECTION-REVIEW.md` | Preserve project-first sewing companion; add the persistent workspace and result-producing agent as the signature; summarize this image/video assessment and retain the future roadmap. |
| `docs/DESIGN.md` | Replace the rule that the assistant must never be a prominent conversation column with a collapsible contextual dock. Specify project shell, five destinations, selection chips, result/activity cards, toolbar truth and responsive behavior. |
| `docs/EXPERIENCE-CONTRACTS.md` | Add stable workspace routes, pinned request context, task-specific consent, structured result artifacts, dynamic tool loop, stale state and explicit maker confirmation. |
| `devpost/scope.md`, `devpost/prd.md` | Reframe outcomes around one persistent workspace and useful agent actions; add workspace and result artifacts as observable acceptance; keep image/CAD/fit/layout/3D in later scope. |
| `devpost/spec.md` | Define canonical WorkspaceContext, result/artifact receipt, extended basis, eligible tool stages, approvals and state transitions. Retain privacy, source, engine and Sanity contracts. |
| `docs/ARCHITECTURE.md`, `docs/AGENT-RUNBOOK.md` | Add shell/client view state, server context resolver, bounded planner, private tool receipts, task consent, dependency invalidation and dynamic step recovery. No model-controlled database or Sanity writes. |
| `docs/CONTENT-MODEL.md`, `sanity/schemaTypes` | Audit before adding types. Add only evidenced diagram, orientation/mate, operation-impact or diagnostic fields. Keep maker facts private. |
| `devpost/checklist.md`, `docs/BUILD-PLAN.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `BUILD_LOG.md`, `docs/SOL_HANDOFF.md` | Re-sequence context fixes, shell, one live task and recovery proof. Preserve completed receipts and distinguish this proposal from implementation. Carry later roadmap gates forward. |
| `src/components/studio/*`, `src/app/*`, `src/server/agent/*`, `src/domain/agent-run.ts`, `src/server/projects/guest-store.ts` | Refactor incrementally for shell/routes/selection, run basis/consent, result cards and history. Retain the guest store and valid existing evidence. |
| `src/server/knowledge/*`, Sanity development and Context KB | Audit source/diagram/operation/diagnostic facts. Guarded development-only content corrections need read-back and separate served-entry verification. |
| Screenshots, tests, evidence and maker review | Capture the actual revised app and complete journeys; label reference, fixture, live Gemini/Context/Content Lake and physical evidence separately. |

### First implementation package

Start with current context correctness and the workspace shell, without changing Sanity's schema: shared option-aware piece projection; making/selection/KB run basis; construction-missing state; truthful consent preview; Overview/Pattern/Materials/Make/Check routes; persistent collapsible companion; stable object context; and one explain-selected-piece or current-step artifact.

Expand agent permissions only after this slice is stable. Keep the actual diagnostic KB limitation visible. Do not use 3D, camera fit scoring, layout claims or arbitrary CAD controls as substitutes for the unpassed source and physical gates.

For the first proof, ask the agent to explain the selected piece or current sourced step. It must inspect exactly that context, use current Sanity and served KB evidence where applicable, show its result beside the highlighted object, and mark it historical if the project/source basis changes mid-run. A live task, a deterministic test and a maker-observed outcome are three different receipts.

The owner approved this direction. Routine implementation choices remain within the existing local/free/development-only authorization. The current five-view shell is only the first tranche; selected-object agent runs and qualified outputs still require their separate verification gates.
