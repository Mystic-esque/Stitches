---
doc: checklist
status: ready-for-implementation
revision: studio-1.0
---

# Stitches Studio 1.0 — executable build checklist

This replaces the earlier eight-slice proof checklist. The release target is the complete gallery → design → fabric → make journey in PRODUCT.md and PRD E01–E10. A completed proof is not a completed product. Use the visual reference and SOL_HANDOFF.md. Keep one next executable task in STATUS; continue independent work if a credential, maker, or provider is unavailable.

## Preserved evidence, not release completion

- [x] Local Next.js foundation, illustrative immutable revisions and SVG garment explorer.
- [x] Actual dedicated Stitches development Content Lake and actual Context KB retrieval.
- [x] Observed content-correction/KB-conflict/recovery proof; one bounded live illustrative Gemini tool loop.
- [x] Historical production build + 44 regression tests + fixture/live desktop/mobile screenshots at commit 84e3b54.
- [x] Product-lead upgrade: scope, PRD, technical spec, design contract and interactive visual reference authored September 29.
- [ ] Production geometry, full agent, full guest project isolation, fabric verification, export and physical maker gates.
- [ ] New UI implemented in Next.js. The design/ reference is not that implementation.

## Working contract

Each W package ends in a working slice, meaningful tests, inspected browser output where applicable, updated STATUS/BUILD_LOG/DECISIONS, and a coherent local commit. Never push automatically. Do not stop for routine approval; do stop a specific gated claim when its evidence is absent. Do not change expected answers to accommodate a failing algorithm. Current commands are listed in SOL_HANDOFF; introduce new scripts only when implemented. A separate learning/owner reflection is not a mechanical acceptance test and must not be fabricated.

### W01 — Qualify the two garment foundations (PRD E03/E04/E08; spec C02)

- [ ] Inspect exact source designs/packages and licenses, including generated-output rights; record attribution and redistribution limits.
- [ ] Evaluate relaxed top and simple skirt on complete pieces, measurements, options, joins, markings, instruction availability and fabric compatibility.
- [ ] Draft at least minimum/typical/maximum supported inputs and inspect all pieces, not just attractive front/back panels.
- [ ] Choose versioned adapters and author capability manifests with explicit unknown/review states.
- [ ] Record rejected candidates. Never use a knit-only design as a woven blouse.
- [ ] Define three meaningful top changes and at least two skirt changes supported by the chosen sources.
- [ ] Establish a numerical envelope and a concrete maker-review plan for each family.
- [ ] Keep the illustrative spike available in demo mode; do not make it the production engine.

Exit: reproducible complete-piece candidate artifacts, rights/source ledger, truthful readiness, and a decision. If appropriate top authority is missing, qualify the skirt and build independent UI/services; report the exact missing drafting/maker evidence once. No silent reduction to one family.

### W02 — Guest workspace and immutable state (E04/E08; C03/C04)

- [ ] Add session-scoped repository interfaces, SQLite migration and Windows compatibility smoke test.
- [ ] Generate opaque guest cookie; hash server-side; scope every project, proposal, run and artifact.
- [ ] Create/list/rename/duplicate/delete local projects; distinguish autosaved draft from kept version.
- [ ] Transactional keep with sequence + semantic basis + idempotency; retain stale drafts without allowing overwrite.
- [ ] Local backup/import with strict version validation, size limits, safe IDs and no executable fields.
- [ ] Cross-tab stale notice and recovery; exclude measurements/photos from shared Sanity and normal logs.

Exit checks: two guest sessions cannot read/write each other's records; restart persistence; duplicate request creates one revision; tampered/stale keep refused; restore round-trip.

### W03 — Sanity catalog, methods and graph (E01/E03/E09; C01/C10)

- [ ] Extend existing schemas per CONTENT-MODEL; qualified measurement/option/method/source/preview bindings.
- [ ] Versioned six-preset catalog across two qualified families; no six-color duplicates or fake buildable cards.
- [ ] Parameterized projections for list/detail; strict graph/compatibility/prerequisite validation.
- [ ] Safe development migration: dry-run exact IDs, revision preconditions, backup/rollback, production guard.
- [ ] Keep Context KB-only; verify exact tool names/paths from live outline. Add newly relevant sources through documented workflow.
- [ ] Source rights, illustrative/engine-checked/maker-reviewed states and unavailable-content screens.

Exit checks: forbidden/cross-version reference, cycle, removed option, malformed bounds, stale fingerprint, exact structured versus KB disagreement. No live fallback to fixture.

### W04 — Premium public experience and guest shell (E01/E10; DESIGN sections 1–6)

- [ ] Translate design/stitches-studio.html into production components and tokens; do not paste its sample domain logic.
- [ ] Landing with real supported garment hero, clear promise, collection and no signup.
- [ ] Collection filters, responsive visual cards, empty state, detail pages with fabrics/techniques/changes/readiness/rights.
- [ ] Guest project library with resume and recovery. URL-addressable screens and safe navigation.
- [ ] Studio shell: Explore / Design / Fabric / Make; central canvas; one active inspector; contextual assistant.
- [ ] 320/390/768/1024/1440 layouts, readable type, focus, native controls and reduced motion.
- [ ] Export professional local screenshots after the main journey works.

Exit: first actual browse → start project → reopen journey; no fake numerical capabilities; visually compare reference and new browser screenshots.

### W05 — Real customization and measurements (E04; C02/C03/C04)

- [ ] Guided body measurements with unit conversion and source-based min/max; distinguish body size, finished measurements and ease.
- [ ] Full deterministic drafting adapter; server checks paths, joins, allowance offsets, notches, grain and physical cut instances.
- [ ] Source-qualified top length, sleeve and pocket; skirt length and qualified second option.
- [ ] Stable piece/edge IDs; locked feature invariants; no successive distortion; redraft from inputs.
- [ ] Unified proposal updates 2D pieces, preview state, material requirements and instruction dependencies.
- [ ] Compare original/proposed, missing-input/error states, manual controls and deliberate keep.

Exit: envelope/property/regression tests and actual browser request → changed complete artifact → checks → kept revision → reload. Unknown fit cannot become ready-to-cut.

### W06 — Garment understanding and educational 3D (E03/E04; C03)

- [ ] Immediately useful SVG view, piece list and front/back technical representation.
- [ ] Lazy Three.js viewer, versioned mesh mapping to actual piece/edge IDs, orbit/reset and selection.
- [ ] Explode/assemble transitions and timeline driven by instruction prerequisites; visible matching seam labels.
- [ ] Supported parameter changes update the preview and 2D artifact from the same basis.
- [ ] Clear construction-preview label; no drape/fit simulation claim.
- [ ] WebGL loss/reduced-motion/low-power fallback; accessible piece buttons; dispose scene resources.

Exit: click sleeve in garment, flat view and instruction and observe same IDs; changed length/pocket visible everywhere; no WebGL still usable; measured interaction/frame performance.

### W07 — Fabric and constraints (E06; C07)

- [ ] Fabric width/length/units, shrinkage/selvage, directional print/nap and fold assumptions.
- [ ] Expand all cut counts, mirrored pairs and on-fold pieces including optional pocket/facing.
- [ ] Deterministic bounded placement plus independent containment/overlap/grain validation.
- [ ] Separate feasible, proven impossible, search not found, missing input and unsupported cases.
- [ ] Compare up to three supported alternatives without breaking locks; link to new proposals.
- [ ] Visual plan with scale, piece labels, grain/fold and assumptions; never claim minimum yardage from a heuristic.

Exit: known feasible layout, geometric impossibility, bounded-search exhaustion, nap/mirror/fold failures and stale-basis refusal; actual constraint-recovery browser journey.

### W08 — Useful bounded agent, not a chat facade (E05; C05)

- [ ] Extend existing Gemini/Context adapters behind typed registry and durable run checkpoints.
- [ ] Implement only documented tool contracts; validate arguments and stage prerequisites outside prompts.
- [ ] Brief → inspect → retrieve → preview → check → compare → proposal explanation; no automatic keep.
- [ ] ≤4 requests, ≤10 tools, ≤3 alternatives, ≤120s active/run; budget/cancel check before every unit.
- [ ] Explicit missing-measurement question, unsupported request, no-overlocker alternative where authored.
- [ ] Resume/cancel/timeout/429 recover without duplicate artifacts; manual controls remain usable.
- [ ] Ground compact explanations in actual receipt/source IDs; refuse conflicting/stale KB.

Exit: deterministic mocked failure suite plus at least six meaningful new live runs within free quotas; record calls/timing/outcomes, including two real interruptions/recoveries where attainable. Old single live spike is not this gate.

### W09 — Photo to supported starting point (E02; C06)

- [ ] Privacy notice and explicit Analyze; local preview/crop/remove; safe re-encode/size limits/temporary cleanup.
- [ ] One bounded multimodal call, strict vocabulary, unknown/occluded attributes.
- [ ] User confirms observed features before deterministic template matching.
- [ ] Up to three matches with similarity/differences and no-match state; no fake confidence percentage.
- [ ] No hidden measurements, invented exact cut pieces, or storage in shared Sanity.
- [ ] Degraded quota/offline path: manually choose features and browse collection.

Exit: licensed test photos across supported/unsupported/occluded cases; malicious/oversize files rejected; retained data limited to explicit choice; photos never called exact pattern reconstructions.

### W10 — Complete making and export (E07/E08; C08/C09)

- [ ] Resolve variant-specific instruction DAG, equipment methods, prerequisites and diagrams.
- [ ] Focused step with correct pieces/sides/seam, authored allowance, checkpoint, slower/concise detail.
- [ ] Persistent revision-bound progress; content/geometry changes flag affected steps, not silently reset history.
- [ ] Cutting preparation, bill of materials, sewing sequence and tailor-friendly design summary.
- [ ] Full-size vector SVG/PDF + tiled A4/Letter + page map/calibration + materials/attribution/manifest/backup.
- [ ] Export gate distinguishes review package from qualified cut-ready package; watermark unresolved output.
- [ ] Test PDF geometry, piece counts, page joins, calibration and matching manifest hashes.

Exit: real package from an accepted revision, independent parsing/dimension checks, print trial and physical family/option review. If no maker yet, review export works and cut-ready remains blocked.

### W11 — Sanity maintenance, differentiation and recovery (E09; C01/C10)

- [ ] Author one useful constructionMethod shared by at least two looks.
- [ ] Pure impact resolver + local document-event rehearsal; prepare Function wrapper/Blueprint, do not deploy.
- [ ] In development, correct method/rule, verify graph change, affected proposals stale, and user sees impacted steps.
- [ ] Separately refresh/rebuild/apply/review/verify actual served Context entry; preserve wrong-arrow regression.
- [ ] Freeze 24 expected-answer tasks and same licensed corpus; compare keyword baseline vs graph+Context/tools fairly.
- [ ] Separate retrieval metrics from end-to-end task success; log failures, latency, call counts and source applicability.
- [ ] Rehearse database backup/recovery, provider outage, content loss, stale KB, cancelled/continued run.

Exit: recorded before/after effect across two looks, honest benchmark table, failure/recovery receipts. No superiority claim unless measured.

### W12 — Release-quality application and review package (E10; all contracts)

- [ ] Real maker review per family plus critical supported variants; notes/photos/materials/measurements kept with consent.
- [ ] At least three intended-user task sessions; record completion/friction, fix major usability issues.
- [ ] All actual tests/build/browser journeys; relevant security checks, cross-guest isolation, no secrets.
- [ ] Final real desktop/mobile screenshots, keyboard/screen-reader review, reduced-motion/WebGL fallback and measured performance.
- [ ] Local clean-install/run/backup/restore rehearsal; migrations, provider quota recovery and token-rotation runbook.
- [ ] Deployment config drafted with persistent-store/retention/security requirements; no externally deployed Function/site.
- [ ] Sanity-first demo and separate truthful Devpost write-up, feature matrix, asset/license ledger and unedited evidence.
- [ ] Final STATUS separates implemented/verified/review-required/blocked; explicit owner approval needed before publishing or submitting.

Definition of done: the complete two-family journey is genuinely useful and reviewable, not simply a nice gallery with an old shoulder tool behind it. External physical validation is not replaceable with generated screenshots.

## First next task

W01: source/license/complete-pattern qualification and capability manifest for the two proposed families. In parallel in the ordinary sense of independent work, W02/W04 can progress if W01 needs external maker evidence; this checklist does not require spawning multiple agents.
