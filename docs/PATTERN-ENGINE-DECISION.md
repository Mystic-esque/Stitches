# Pattern authority and rendering decision — October 1, 2026

Status: **architecture accepted; a restricted Sandy 4.10.2 non-cuttable production study is implemented, full engine/source qualification remains open**. This evaluates the owner's attached SVG/parametric-pattern research, not its unresolved citation markers. Actual code/evidence remains in STATUS.md. The server-only measured study exposes exact engine edges/marks and full-redraft length comparisons without a proposal keep, model tool or cutting capability. Tina, curved-band count, notch counterpart, complete source/rights/allowance/layout/physical gates remain unresolved. Earlier prototype-first recommendations below describe the qualification target, not an absence of the current partial implementation.

## Decision

The SVG is an interactive projection and export format, **not the editable source of truth**. A versioned semantic pattern definition and confirmed project inputs drive a deterministic draft engine. The engine emits a typed, measured draft artifact; the technical SVG/React viewer, comparison overlays and any later 3D educational view consume that same artifact and its IDs.

```text
Sanity: reviewed garment/component/method/operation meaning, applicability, sources
  + private project: source version, confirmed measurements/options/material, kept revision
  + registered semantic command: e.g. change supported hem length by 20 mm
       → deterministic drafting adapter (FreeSewing candidate)
       → versioned pattern artifact with measured geometry + semantic IDs
       → independent join/cut/layout/print validators
       → technical SVG/React viewer and qualified exports
```

Gemini may propose a registered command and explain validator results. It cannot edit SVG path strings or arbitrary points, import unsupported alterations, declare a seam matched, or promote readiness. A low-level `adjustPoint(-10mm)` is **not** an acceptable public agent command by itself: moving one point could invalidate the mating edge, notches, grain, allowances or grading. Direct expert point-editing would require a separate constrained CAD workflow and its own validation, not an implicit agent tool.

## Boundary contract to implement

- `PatternDefinition`: immutable qualified design/engine package identity, version, license/output rights, stable piece/edge/notch roles, supported measurements/options/operations and source evidence. Sanity may reference this and store educational relationships; engine code or a rights-cleared pattern source defines the formulas and exact coordinates.
- `PatternInput`: confirmed private body measurements in millimetres, garment options, alteration parameters and the design version. Track body versus finished measurements and intended ease explicitly. The content fingerprint and private project revision become part of the basis hash.
- `PatternCommand`: registered semantic operation ID, typed bounded arguments, prerequisites, locks, affected IDs and maker confirmation policy. Redraft from the immutable base/input rather than repeatedly warping rendered paths.
- `PatternArtifact`: deterministic output with engine/version/input hash; piece/edge/notch stable IDs; physical units; stitch and cut outlines; fold, grain, cut count, mirror/right-side and allowance metadata; mating seam relationships; validation diagnostics; and render bindings. A renderer must never infer these facts from anonymous SVG curves. Keep an artifact immutable after a proposal is kept.
- `PatternView`: accessible, selectable SVG or React-rendered vector representation of the artifact, including source-labelled unknown/missing layers, original/proposed overlay and correspondence back to pieces, steps and Sanity concepts. Generated SVG may carry semantic `data-*` identifiers, but these are derived bindings, not geometric authority. Never trust client-supplied IDs without resolving them against the current artifact.

The exact TypeScript shape can evolve after inspecting the chosen engine. The **separation and invariants** cannot. Do not require every FreeSewing internal point/curve to be copied into our own durable schema merely to claim semantics; map only stable, validated data needed by Stitches. Conversely, an SVG-only return without piece/edge/marking access is insufficient for `pattern_mapped`.

## Engine evaluation, in order

1. **FreeSewing prototype first, not predetermined adoption.** Its developer docs describe a JavaScript parametric `Pattern` with parts/settings and `draft().render()` SVG output. Its own editor uses interactive React rendering and SVG primarily for export. Build an isolated spike against the current package and one exact, rights-cleared garment version. Verify runtime/Next.js compatibility, measurements/options, design-specific license and generated-output rights, deterministic drafts, complete piece/edge/marking metadata, stable selection bindings and before/after variants. Document any metadata that needs our adapter or an authored supplement. No source is qualified by the library name alone.
2. **SeamScape as command-safety reference, not runtime dependency.** Its documented MCP workflow separates inspection, preview, explicit apply and save, and its Pattern API supports parameter overrides. Its published pricing currently reserves full API access for Enterprise. Under the owner's $0 paid-provider budget, do not add a SeamScape API dependency or request paid access. Reuse the *principle* of preview → validate → explicit keep with our own registered commands.
3. **Seamly2D and PatternSoft as research references.** Study pattern terminology/markings and the combination of parametric drafting with a vector editor. Neither is an approved dependency. Do not copy third-party designs or visuals without rights.
4. **Fallback:** if FreeSewing cannot supply one source-qualified complete design and semantic bindings, retain the adapter interface and implement a narrow original geometry engine for an authored, reviewed garment. Do not disguise the existing shoulder fragment as that engine or swap to static SVGs. Record the failed spike and capability limitation.

## W01/W05 proof gate

For one chosen real design and two materially different measurement/option inputs, capture its exact package/design version and rights; produce complete drafts; compare stable IDs and semantic bindings; check deterministic output hashes; numerically inspect mating stitch lines, allowances, folds, grain, notches, cut counts and impacted steps; render selectable before/after and a full-size print calibration test. Record unknowns. `pattern_mapped` needs complete named relationships; `cut_checked` additionally needs independent numerical/layout/print receipts; `maker_reviewed` needs physical review for that exact scope. A pass on a headless library example or a pretty SVG is not a garment qualification.

No new engine, dependency, Sanity document, production UI or cut-ready pattern was created by this decision.
