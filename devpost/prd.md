---
doc: prd
status: approved-direction; implementation-evidence-pending
revision: companion-2.0
---
# Product requirements — Stitches Companion 2.0

The source of truth for intent is docs/PRODUCT.md. This PRD defines observable user outcomes, not proof that they are implemented.

## Core user stories and acceptance

1. As a hobby sewist, I want to begin from a garment I love or my own reference so I can turn inspiration into a project without knowing pattern vocabulary. Acceptance: the first screen offers both paths; a photo analysis produces editable visible features and explicit unknowns; an unsupported style opens a useful plan-only project, not a fabricated pattern.
2. As a maker reading a pattern, I want to see how a finished region maps to flat pieces and marks so I can cut and join the right things. Acceptance: selecting a garment region locates the qualified piece, fold/grain/cut count and joining edge/step; a missing mapping is visibly unavailable; a supported change highlights actual original/new edges and consequences.
3. As someone sewing at a machine, I want one step with relevant pieces, orientation and a check so I can act without losing my place. Acceptance: the step follows authored prerequisites, progress survives restart, and a changed project or content basis requests review of affected future advice without erasing completed work.
4. As someone whose seam is not working, I want help that knows my project and asks the right next question so I can recover safely. Acceptance: “I'm stuck” carries the active step; a recorded observation selects a source-backed diagnostic test; insufficient evidence yields an explicit safe stop; an unsuccessful attempted fix is not blindly repeated.
5. As a reviewer, I want to see why Sanity is essential so I can distinguish this from a keyword chatbot. Acceptance: one development correction to a shared method changes applicable guidance in two distinct projects, shows exact-graph impact and independently verified served KB content, and marks stale pending advice.

## E01 — Start with a real project
A maker can choose one of at least two genuinely different source-qualified examples or begin from their own idea/pattern. Each card shows garment form, what the maker will learn, material/tool/technique demand, source and capability state. Recolor/length variants belong inside a project, not as filler cards. A planning-only inspiration story is labeled as such. Starting and resuming require no sign-up.

## E02 — Confirm an idea, not hallucinate a pattern
A reference photo may be analyzed only after explicit action. It yields an editable visible-feature list and unknowns; user confirms it. Stitches may match a supported example or open a planning project. It must not infer hidden seams, numerical measurements, exact pieces or fit from a picture. The manual path works when quota or image capability is unavailable.

## E03 — Remember the maker and the project
Private reusable measurement/fabric/equipment/experience profiles can feed a project snapshot. A missing-input view asks for only the next needed fact; measurement guidance shows the body landmark and how to take it, while fabric profiles record width, amount, stretch/weight and direction only when confirmed. Project state records source and version, choices, current step, completed checks, symptoms, tests and fixes. Profile edits never silently rewrite a kept project. Backup/import, guest isolation, recovery from stale tabs and clear device-local persistence are required.

## E04 — Explain how pieces become clothing
The pattern-connected workbench displays finished garment, flat pieces and assembly in linked selection. Where qualified, show piece names, cut counts, on-fold versus mirrored, grain, right/wrong side, notches, seam/cut line, allowance, mating edges and step prerequisites. Highlight actual changed edges with original/after overlay and a consequence trail. An unqualified diagram states its limits and gives no printable cutting claim.

## E05 — Plan and prepare for this version
The maker sees the exact missing inputs, prerequisites, material/tool compatibility, cutting and sewing plan. Body measures, finished dimensions and ease are distinct. Fabric layout outputs distinguish feasible, proven impossible, bounded-search no-placement, missing input and unsupported. Exact quantities must come from checked geometry and assumptions, not language-model prose.

## E06 — Supported design decisions
A maker can request only operations that a qualified version supports. The server checks option compatibility, locks, affected pieces/joins/cut counts/instructions and version basis. The proposed revision is previewed with its changes and risks; keeping it is explicit and immutable. Unsupported wishes become alternatives or a clear limit, not a decorative preview.

## E07 — Guided making
A focused step shows why it occurs now, pieces and orientation, one or more micro-actions, source-authored numerical values, an annotated diagram and a check before "Done." The novice/concise toggle changes explanation density, not facts. Progress is bound to the exact project version; source corrections flag affected future advice while preserving history.

## E08 — Contextual recovery
"I'm stuck" carries the active step and project basis into a symptom flow. A decision tree uses issue hypotheses and discriminating tests from Sanity, asks for missing observations and records outcomes. It explains uncertainty and stops before destructive corrections if evidence is insufficient. A close-up photo can suggest observations, with explicit consent and private temporary storage. Previous unsuccessful fixes remain in project history so the same suggestion is not blindly repeated. A fit self-check is supported as a structured observation, not automatic grading or numeric redrafting.

## E09 — Agent and Sanity dependency
The agent can plan a multi-constraint project request, call bounded registered tools, read exact structured records plus served Context KB, inspect validation results and return actionable next steps or a reviewable proposal. It fails safely for quota, missing content, stale evidence, rejected operation and cancellation. A shared Sanity method/diagnostic correction must affect two genuinely distinct projects and show separate exact-graph and KB refresh verification. No fixture response satisfies a live proof.

## E10 — Useful outputs and release quality
The project exports a truthful plan/materials/step summary. A qualified cut-ready package includes calibrated full-size/tiled pattern, quantities, markings, attribution and manifest only after exact and maker gates. Desktop/mobile/keyboard/reduced-motion journeys are usable; actual screenshots and maker trials are recorded. No external deployment/submission is included in this authorization.

## Non-goals for this release
Unrestricted CAD, automatic pattern drafting from image, predictive 3D drape or fit, marketplace, accounts/cloud sync, arbitrary fabric consumption promises and unsupervised physical repairs. An educational 3D assembly view may be added only after 2D relationships are correct and accessible.
# Workspace-agent PRD addendum — October 4, 2026

The maker can enter or resume a private project without re-entering context, move among five focused work surfaces, and ask the companion about the object or operation currently in view. On desktop the companion may sit beside the technical canvas; on phone it opens as a sheet without discarding the current work. Navigation and explanation do not themselves create a saved physical result.

Acceptance for the current migration: a stable, non-sensitive URL restores the focused view; changing views leaves project revisions and maker history untouched; current Sanity source outages remain visible; conditional piece cut/fold/mirror data agree in Pattern, Make and agent reads; incomplete step bindings display an explicit gap, not a fabricated join; and the assistant is reachable with a truthful consent preview. Full selected-object runs, artifact cards, dynamic tool choice and conditional diagnosis are subsequent acceptance gates, not implied by a visual dock. Preserve the later photo, CAD/layout/print and 3D roadmap in `../docs/WORKSPACE-AGENT-DIRECTION.md`.
