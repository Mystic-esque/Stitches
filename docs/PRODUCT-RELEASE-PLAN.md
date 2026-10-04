# Stitches — the next product release

Date: October 4, 2026. Status: active execution. R1 has selected-object input, bounded text, source-bound artifacts and one actual selected Tina Gemini/Context run; it does not yet have open-ended tool choice or a confirmed-facts conversation summary. R2 has private Sandy study save/reopen and v5 backup in code; final browser verification is running. The owner reports a successful local production build. R3's diagnostic KB guard is implemented but its new agent path lacks live proof. R4's reviewer draft is prepared; final screenshots, judge access and publication authorization remain open. See `STATUS.md` for real results. This plan is not an assertion that its exit gates all pass.

Read this for the next delivery order, `WORKSPACE-AGENT-DIRECTION.md` for the durable interaction design, and `STATUS.md` for actual capability. This consolidates the existing Companion 2.0/workspace direction. It does not restart the project or replace the later cutting, photo, fit and 3D ambitions.

## 1. The product to build

**Stitches — See how it's made. Make it yours.**

A personal sewing workspace that helps a maker turn a garment idea into understandable pieces, supported design decisions and a project they can return to. The agent works on the same project the maker can see. It asks for missing information, uses tools, shows the result, and remembers confirmed decisions and observations.

The first release serves a home sewist who can operate a machine but cannot confidently interpret or modify every pattern. Beginners can explore with explanations; experienced makers can use concise views. Professional drafting, exact reconstruction from any photo and predictive fit are future capabilities.

The signature is **ask -> see -> decide -> continue**. The maker should see a useful object change or appear: a selected edge explained, a measured comparison, a version-specific piece list, an ordered preparation card, or a diagnostic check. A transcript alone is insufficient.

Sanity underpins correct relationships and maintained explanations. The everyday interface leads with the garment and the maker's task. Competition evidence is a view of actual product behavior, not a separate competition-only feature.

## 2. The silent first-minute demonstration

Use one continuous real project, not a montage of unrelated feature screens. The timing below is an editing target, not a promise about provider latency.

1. Open a supported skirt project from an attractive, honest garment card. Show a compact project shell, garment reference, real measured pattern surface and companion together. A demonstration may use explicitly labeled example measurements; a user's project never receives invented body measurements.
2. Ask: **"Show me this skirt 8 cm shorter and explain what changes."** If required measurements are absent, ask for those inputs in one compact inline form. Otherwise invoke the existing bounded Sandy length-study engine through a registered agent tool.
3. Show original and proposed outlines, changed hem/opening edges, numeric length difference and preserved waist/band. Return a concise consequence card. The preview is a measured pattern study; do not label the photograph as an exact result or claim a fabric layout has been checked.
4. Choose **Save this study**. Retain the comparison and desired design choice in private project history. This does not accept a cut-ready pattern, mark an adjustment qualified or complete any physical work.
5. Ask: **"What should I prepare next?"** Display the specific missing inputs, source-dependent pieces and relevant preparation checks. Unsupported material quantities remain unresolved, not guessed.
6. Enter Make at the source-backed study step. Explain the involved pieces and orientation beside a teaching diagram. Open **I'm stuck here**, report an applicable seam-puckering observation and receive one scrap-test card. A recorded observation determines the next eligible branch.
7. Reload or return later. The saved study, decision, selected project, conversation and diagnostic history remain available with current/historical status.

The Tina project proves breadth through its different source pieces, optional construction path and markings. It must not inherit Sandy geometry or advertise the skirt's draft operation. Test both real journeys; do not count recolors as separate projects.

## 3. Experience and visual contract

### Entry

Separate the concise public invitation from active work. Headline: **From the garment you imagine to your next stitch.** Primary action: **Start making**. Returning makers see **Continue your project** immediately. Use actual in-app demonstrations, not fabricated chat transcripts or fake capability statistics.

Workspace home asks **What would you like to make?** Provide two genuinely distinct supported starts, recent projects, and a clear own-idea planning path. A written idea can create a private brief without pretending to match an exact pattern. Attachment analysis is a later increment; do not ship an inert upload button.

Keep rights-cleared garment imagery alongside technical detail. Existing generated editorial images are inspiration references, not photos of completed patterns. For exact photo-to-piece mapping, require an appropriate image and authored region bindings. A simple accurate technical flat is preferable to a misleading photograph that appears to update with geometry.

### Working screen

- Compact 56-64 px header: project switcher/name, saved state, history and export. Move the global marketing navigation and maker-profile banner out of the open project.
- Approximately 176-208 px navigation rail, flexible central work surface and 320-360 px companion at wide desktop sizes. Collapse rails before shrinking the technical drawing below useful size. Preserve the existing warm paper, forest and terracotta identity.
- Five destinations remain: Overview, Pattern, Materials, Make and Check. No second competing row of global modes. The center opens directly onto the selected task; avoid a new hero heading inside each view.
- Pattern gives the geometry most of the space, with an optional garment reference inset, selection details, clear cut/fold/grain/count/mark layers where supported, and original/proposed overlay. Keep decorative cards out of the canvas.
- The companion contains an anchored composer, explicit selection chip, conversation, real activity and useful result cards. Suggested questions are shortcuts, not the only allowed input.
- Show a single visible capability summary and concrete limits beside restricted actions. Sources and detailed receipts are expandable. Keep hashes, MCP names and request budgets out of ordinary maker instructions.
- Make places the current operation and diagram first, including pieces, orientation, known marks, the check and one next action. Learning review and user-reported physical sewing remain distinct.
- Tablet defaults to a large work surface with an assistant sheet when two panes would be cramped. Phone uses one task surface at a time and reachable help. Preserve keyboard selection, focus, reduced motion and 44 px touch targets.

Visual acceptance: at 1440x900, the initial project viewport contains a meaningful diagram and usable companion input without scrolling past setup. At 390 px, the first screen makes the current task and next action obvious. These are proposed checks, not completed screenshots.

## 4. Agent behavior and tools

Extend the existing durable run controller rather than introduce another agent framework. Keep bounded requests, owner isolation, checkpoints, cancellation, quota handling and acknowledged-response recovery. Replace its universal fixed three-read script with task-specific eligible tools and explicit dependency requirements.

### Input and conversation

Accept a bounded natural-language request plus a server-resolved selection: project revision, source, piece/edge/artifact/step IDs, current options and relevant observations. Pin context when sent. Navigation afterwards does not redirect the run. A changed underlying project/source makes the result historical before acceptance.

Use a private project conversation with a compact, versioned summary of confirmed facts, decisions, unresolved questions and prior attempts. Retain raw messages privately; do not equate model summaries with confirmed measurements or observations. Send only relevant history and explicitly consented private fields. Ordinary follow-up messages should not require repetitive consent to an unchanged sharing scope; new attachments or sensitive fields require an appropriate preview.

### First registered tool set

These are application-level contracts; reuse current implementations and choose final names during coding.

| Tool capability | Visible result | Deterministic responsibility |
| --- | --- | --- |
| Inspect project and selection | Relevant context and missing inputs | Resolve owner, IDs, revision and supported capabilities |
| Read exact source graph and applicable Context entry | Sourced explanation or construction facts | Fixed queries, KB-only paths, record identity, version and applicability |
| Explain selected piece/edge/step | Highlighted object plus annotated card | Only existing semantic IDs; no invented mates, dimensions or marks |
| Draft supported length study | Before/after measured comparison | Invoke Sandy engine with validated inputs/bounds; recheck saved basis |
| Check preparation and dependencies | Actionable checklist | Exact options, prerequisites and recorded inputs; distinguish unknown from incompatible |
| Prepare current step | Piece/step teaching card | Source DAG and confirmed options, not generated assembly order |
| Inspect issue and choose eligible test | One diagnostic check with prior attempts | Exact source/test/remedy graph and observed state determine eligibility |
| Save requested study or prepare a fact update | Reviewable private artifact or change preview | Idempotency, expected revision, provenance and explicit maker intent |

The server can load the mandatory project context once without making the model spend a turn requesting every obvious prerequisite. The model chooses useful eligible work, inspects its actual result, then answers, asks for missing information or proposes the next action. No tool outcome is inferred from a fluent response.

Retain the existing four-model-request and 120-active-second defaults initially. Reuse current request reservations and timeout rules. Expose only relevant tools per task, keep work resumable, and split a larger goal into user-visible completed stages if it cannot fit. No paid provider fallback. Tune limits only from measured free-tier evidence, not an assumption that more calls means a better agent.

### Result artifacts and permission

Define a common artifact envelope: ID/kind, project and run, requested selection, input/dependency fingerprints, exact source IDs and served KB hash where used, tool receipt, content, timestamp and current/historical status. Initial kinds: annotated explanation, pattern study, preparation checklist, step card and diagnostic check.

Separate computed facts, sourced teaching and model interpretation inside the artifact. Saving an explanation or study is an ordinary reversible workspace action. Confirm changes to accepted project facts/options and maker-reported observations; never silently record a physical test or sewn seam. An explicit "save this study" authorizes that save without another approval loop. A future keep-pattern operation has its own qualification and current-basis checks.

Unsupported requests still produce useful work when possible. For "add pockets" without an eligible operation, record the design wish, explain which source compatibility is missing and offer supported next work. Do not draw plausible pocket pieces and present the wish as implemented.

## 5. Creative preview without false precision

The measurable creative interaction in this release is the supported Sandy length comparison, exposed through language and direct controls. Both must invoke the same operation and produce the same artifact. The existing flat pattern provides the first real preview.

A later simplified assembled technical outline may reflect supported dimensions if its mapping is deterministic and clearly educational. Keep a garment photograph visibly labeled as a reference when it does not derive from the changed artifact. Do not imply validated fit, drape, yardage or an exact future sewn appearance.

Saving a study stores a design exploration with dependencies. It does not alter the user's actual cutting pattern or erase completed making history. Preparation may reference the chosen study as intent; source construction instructions remain explicitly tied to the pattern/version they support. If the edit's construction effects are unqualified, that is a named remaining check, not an automatic instruction rewrite.

## 6. Sanity's product role

Use the existing dedicated development dataset and actual Context KB. Audit existing exact records before adding fields. No schema proliferation or whole-KB rebuild solely to make the entry appear more integrated.

Needed content work follows specific product gaps: diagram source and piece/edge binding, option applicability, supported-operation impacts, construction prerequisites and diagnostic outcomes. Content Lake determines exact relationships and eligibility; Context provides maintained source-linked explanation. Private requests, measurements, photos, studies and issue history stay in the private project store.

Record one product-visible maintenance demonstration: a legitimate shared source correction changes future guidance in Sandy and Tina, stale advice is identified, the served KB is separately verified and saved historical observations remain intact. The maker sees "This guidance changed" with a useful explanation. Judges can expand the trace to see Sanity's role.

## 7. One implementation run, delivered in coherent batches

This is the next priority order across the existing W01-W10 ledger. It does not mark unfinished gates done. Complete connected outcomes before adding a new garment family or framework.

| Batch | Concrete work | Exit evidence |
| --- | --- | --- |
| R1 — Workspace and working conversation | Compact shell; pin selection; bounded free text; project conversation; task-specific consent; shared artifact contract; first selected-piece explanation | Real selected-object Gemini/Context result beside the correct object; reload, changed-selection and stale-project checks; actual desktop/phone screenshots |
| R2 — A visible creative action | Register current Sandy length engine; ask for missing inputs; render before/after and consequences; save/reopen a private study | Language and direct controls yield equivalent measured outputs at two inputs; invalid bounds and stale saves rejected; no cut-ready promotion |
| R3 — Continue and recover | Preparation/step artifacts; option-aware diagrams; wire actual diagnostic KB to exact test flow and history; continue based on maker observation | Sandy and Tina source-specific step guidance; untested/unchanged/relaxes/uncertain branches; no repeat failed remedy without new evidence; cancel/outage/reload recovery |
| R4 — Product finish and review package | First-minute entry, imagery/provenance, compact useful exports, empty/loading/error states, accessibility, source-impact demonstration, real recording and submission drafts | Complete journey on final build; actual five-width captures; source/capability matrix; usable reproduction path; live-vs-replay labels |

Start R1 with the same selected-context contract needed by R2/R3. Integrate the existing PatternBoard, MakeWorkspace and diagnostic engine; avoid separate "agent versions" of their computations. Route changes are implementation details and must preserve existing private projects and bookmarks. Migrate SQLite additively and keep old run history readable. Update backup version/validation before newly persistent conversations/artifacts are advertised as recoverable.

Use `src/components/studio/{CompanionHome,ProjectAssistant,PatternBoard,MakeWorkspace,DiagnosticStudy}.tsx`, `src/domain/agent-run.ts`, `src/server/agent/*`, `src/server/projects/guest-store.ts`, current pattern adapters and knowledge readers as the primary integration points. Extract shell/selection/artifact components when needed; do not replace the tested application.

## 8. Release checks that matter

- A first-time reviewer can identify the purpose and start a supported project without a spoken explanation. Validate with real users; until then report this as a design objective, not a passed study.
- A selected-object question resolves the intended piece/step even if the user navigates while the agent works.
- A supported design request returns an actual measured comparison, can be saved, and is recoverable on reload with its limitations intact.
- A changed option visibly changes relevant pieces/prerequisites; a changed source invalidates dependent current advice.
- A diagnostic result depends on the recorded test outcome and current context, including prior failed attempts.
- Existing guest isolation, body-note privacy, transactional replay, stale saves, cancel/quota/outage behavior and usable manual paths remain tested.
- Live Gemini + actual Context reads on the final supported flows are recorded separately from deterministic fixtures. Build/test counts alone do not establish usefulness or truthful model narration.
- Actual screenshots and an actual app recording show the first-minute and return-later journeys. Concept video and generated imagery cannot stand in for these receipts.

A fair same-corpus comparison strengthens a differentiation claim; it is not a substitute for the user journey. If unfinished, omit superiority rates. Source credits and license/output rights review apply to whatever is distributed. Print calibration and physical maker review apply to cut-ready claims, not to every learning interaction.

## 9. Event snapshot and later product

The Sanity entry should be a truthful snapshot of this same product. Its compact story is a maker request, actual tools/Context, a visible result, one recovery or content-change consequence and saved continuity. Include the required project identifier, source credits and reviewer instructions. Do not create a throwaway Sanity-only mode. No external deployment, publication or submission is authorized by this plan.

A later Devpost/product demonstration uses the same core journey with broader polish and the actual capabilities delivered by then. Check that event's current requirements before preparing its submission. A deadline may determine which verified snapshot is entered; it does not make unfinished features complete or justify rebuilding the product for each judge.

Preserve the next expansion order after R1-R4: private reference image/page attachment and bounded visible-feature assistance; additional source-qualified design operations and garment-to-piece mapping; qualified layout/scale-correct exports with physical trials; richer garment families; 3D educational assembly; validated fit/drape research; voice and cloud collaboration. Each adds to the same project, conversation and artifact model. They are not erased from the ambition and are not advertised as working now.

## 10. Documentation and next action

This plan defines the release narrative and R1-R4 order. PRODUCT/scope/PRD link its outcomes; DESIGN and EXPERIENCE-CONTRACTS link its working-screen requirements; spec/ARCHITECTURE/RUNBOOK link its conversation/artifact/tool boundaries; CONTENT-MODEL links the limited source audit; checklist/BUILD-PLAN/SOL_HANDOFF point implementers here. STATUS and BUILD_LOG continue to record only actual results.

**Next executable task:** implement R1's selected-context conversation and first annotated explanation in the compact workspace, including an additive private-store migration and a real source-bound run. Then proceed directly through R2-R4 within the existing authorized local/free scope. Do not stop at the shell or report the product release complete because one response looks good.
