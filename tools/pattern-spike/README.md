# Exact FreeSewing engine qualification spike

This is an isolated local research workspace, **not a production app integration or a cut-ready export**. The main app's dependencies/lock remain unchanged. Install from this directory, not with npm's prefix form from the root:

```
npm ci --ignore-scripts --no-audit --no-fund --maxsockets=1
node verify.mjs
node verify-mapping.mjs
node preview.mjs
node check-preview.mjs
```

The checker launches only its own disposable headless Chrome profile; it does not use the owner's browser session. It closes its Chrome/server afterward. Generated evidence is in `../../evidence/pattern-engine/`.

## Actual dependency findings

Core, Sandy and Tina are pinned at 4.10.2. Source inspection found omitted runtime dependencies: core-plugins imports plugin-transform without declaring it; annotations imports config without declaring it; Tina imports Toni without declaring it. The first Sandy import failed on plugin-transform, then on config. Explicit pinned dependencies fix the Sandy load without editing vendor source. Tina is installed for subsequent investigation but has **not been drafted**; its further Brian/library/plugin imports still need audit. The initial root pnpm installation was stopped before it changed the package/lock; a prefix-form npm invocation added an unwanted local root dependency to this isolated package, which was removed before the successful directory-local install. One TLS bad-record-MAC fetch failed; a bounded, single-socket retry succeeded without disabling TLS verification.

## What the spike establishes

- Two actual Sandy straight-waistband drafts from synthetic millimetre measurements, repeat-identical measured hashes and canonical input identity.
- Real typed move/line/cubic/close operations, named source points, seam/allowance layers, engine cut/fold/grain and source notch IDs. SVG is a projection of those measured data, never the editable pattern definition.
- Independent de Casteljau curve-length calculation and an overlap-adjusted straight-waistband scalar comparison. The 0.5 mm check is a **research threshold**, not a source-approved sewing tolerance or fit qualification.
- Five invalid-input refusals, including path/point injection, and a correctly absent allowance layer when allowance is zero.
- A local technical preview of actual drafts with selectable piece facts and two-input switching. No illustrative photograph or old shoulder fragment supplies its geometry.

## Failed/open gates

The curved-waistband engine returns a main-fabric count of **1**, while current published Sandy instructions and the pending Stitches planning record specify **2**. The spike reports that source/version conflict; it does not rewrite either source to pass. Only the straight-waistband scalar comparison is qualified by the experiment.

Complete mating edge/notch counterpart semantics and step DAG, independent allowance validation, fabric layout, physical print calibration and maker review remain open. `qualification_spike_only` cannot become `pattern_mapped` or `cut_checked` just because the preview renders. Personal inputs and public API integration are not enabled here.

The subsequent exact-edge study names all stitch-outline segments plus the band fold, validates named marking anchors, and binds them to a six-step **local, pending-review educational DAG**. It is not a published Sanity step graph and enables no physical actions. A length-only redraft changes the hem/opening/fold while preserving the waist edges; impact follows actual geometry, not painted highlights. Invalid prerequisites and tampered point/fold/notch data are rejected. The first comparison failed on object key ordering (fixed with structural equality); a 100.00000000000006 mm delta required a floating-point precision assertion, not a changed target.

A second actual issue remains: the band center mark is 10.800786/13.200961 mm from the proposed unfolded skirt midpoint at the two inputs. There is no source-approved counterpart assignment or tolerance. These marks are **not** declared a mating pair and no automatic recut/shift is suggested. The source documentation also leaves opening/closure techniques and variants to the maker; those must be authored/reviewed before an executable guide is qualified. See mapping-verification.json.

## Rights evidence and notices

Official package metadata and READMEs identify MIT. The npm packages omit their LICENSE file. The registry's exact gitHead for all three 4.10.2 packages is `3d290d25d0b6a65852dd31aec125c97bc8ca6e2c`; its [upstream LICENSE](https://codeberg.org/freesewing/freesewing/raw/commit/3d290d25d0b6a65852dd31aec125c97bc8ca6e2c/LICENSE) was actually fetched successfully on October 1, 2026. Its copyright/permission notice is retained in FREESEWING-LICENSE.txt. Sandy's design/code credits remain Erica Alcusa Sáez and Joost De Cock. This is evidence for use of the exact engine/design code, not a grant to copy unrelated photographs.

FreeSewing's [commercial-use FAQ](https://freesewing.eu/docs/about/faq/commercial-use/) permits commercial pattern use. Independent rights review and carrying all notices into any eventual distribution remain release gates. No generated page is being publicly redistributed by this local spike.

Primary API references: [Pattern](https://freesewing.dev/reference/api/pattern/), [Design](https://freesewing.dev/reference/api/design/), [Sandy source instructions](https://freesewing.eu/docs/designs/sandy/).
