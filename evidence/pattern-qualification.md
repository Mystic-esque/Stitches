# W01 source and engine qualification ledger

Checked October 1, 2026. This is a **candidate ledger**, not permission to distribute either pattern or claim a cut-ready Stitches kit. The design photos in `design/` do not depict these verified drafts and cannot be used as proof.

## Candidate A — Sandy circle skirt

- Primary design/cutting source: [FreeSewing Sandy documentation](https://freesewing.eu/docs/designs/sandy/); [options](https://freesewing.eu/docs/designs/sandy/options/); [sewing instructions](https://freesewing.eu/docs/designs/sandy/instructions/).
- Construction distinction: circle skirt with a skirt section and waistband, compared with Tina's knit faux-wrap bodice and sleeves. Source lists waist circumference, waist-to-floor, waist-to-hips and hip circumference as required measurements.
- Source-confirmed conditional cutting: the default skirt part is cut on the fold; the seamless version uses a double fold. Straight and curved waistband options change the waistband part count. Optional lining and interfacing add further pieces. These conditions must be represented explicitly; a single generic “skirt piece” card is not enough.
- Source-confirmed making complexity: skirt seam/opening when present, lining when selected, waistband and hem have different prerequisites by option. The source warns that a seamless skirt needs fabric wide enough for twice the skirt-piece length; an actual fabric layout still has to be calculated.
- Plausible contextual problem to author and review: at waistband attachment, the maker says the skirt waist does not align with the waistband. First ask which Sandy variant and waistband they drafted and whether the skirt waist was gathered as the chosen instructions require. **No corrective cut, numeric easing or final remedy is yet qualified.** The source gives construction branches, not a verified diagnostic tree for Stitches.
- Present capability: `plan_only` in Stitches. FreeSewing's own maker instructions are not our numerical engine proof; exact package/design version, generated piece/edge/notch IDs, output rights and print/maker review remain open.

## Candidate B — Tina faux-wrap top

- Primary design/cutting source: [FreeSewing Tina documentation](https://freesewing.eu/docs/designs/tina/); [options](https://freesewing.eu/docs/designs/tina/options/); [sewing instructions](https://freesewing.eu/docs/designs/tina/instructions/).
- Construction distinction: fitted stretch-knit faux-wrap top with overlapping mirrored fronts, back on fold, optional front-bottom part and optional mirrored set-in sleeves. The published instructions separately cover front assembly, neckline/front-edge finish, sleeve insertion, side seams and hem. This is not a colorway of Sandy.
- Source-confirmed fabric/equipment: Tina is intended for knit/stretch fabric; a serger is optional and the author's instructions name a standard-machine stretch-stitch alternative. The exact machine/material compatibility and advice shown by Stitches still need authored applicability and review.
- Source-confirmed cutting for the documented variants: two mirrored fronts, one back on fold, optional front-bottom piece, and two mirrored sleeves if enabled. It also requires many body measurements; Stitches cannot guess those from a picture.
- Plausible contextual problem to author and review: at the sleeve-insertion step, the maker reports that the sleeve seems reversed. The published Tina instructions distinguish the sleeve's back `×` notch from the front round notch and ask the maker to match them to the relevant body pieces. A Stitches diagnostic should ask the maker to compare those physical marks before suggesting a remedy. **We have not established that generated drafts expose stable notch IDs or a validated numeric seam match.**
- Present capability: `plan_only` in Stitches. A different photo or attractive technical SVG will not advance it.

## Rights and exact-engine status

### Resumed real spike — October 1, 2026

Registry and tarball access recovered. An isolated `tools/pattern-spike/` npm workspace now pins core/Sandy/Tina at 4.10.2 with integrity-locked dependencies and lifecycle scripts disabled; the main app's package and pnpm lock are unchanged. The initial root pnpm attempt was stopped while rechecking the whole existing tree. Prefix-form npm added an unintended local root dependency, which was removed before a directory-local install. A TLS fetch failed once; a bounded single-socket retry recovered without weakening TLS. Installed source imports exposed undeclared plugin-transform/config/Toni runtime dependencies; the first two were explicitly pinned to enable Sandy. Tina is installed but has not been drafted.

Actual Sandy straight-waistband drafts at two synthetic measurement/length inputs passed repeat-hash determinism, canonical input ordering, stable part/path/notch IDs, finite named points, five invalid-input refusals, zero-allowance absence and an independent de Casteljau waist-edge comparison. Scalar differences were 0.001572 and 0.001922 mm against overlap-adjusted straight waistbands; the 0.5 mm threshold is a research check, not an approved sewing tolerance. JSON artifacts and `verification.json` are under `pattern-engine/`. The generated local technical preview consumes those measured artifacts, not an independent SVG illustration.

**Real failed source/version gate:** Sandy 4.10.2 curved waistband source/runtime uses `cut: 1`, while the current published cutting instructions and planning record specify two main-fabric pieces. Neither was silently changed. Curved output is excluded from any qualified cutting claim pending reconciliation. Complete join/notch counterpart/step mappings, allowances, fabric layout, physical print calibration and maker review remain open; both candidates stay plan-only in the public app.

The official registry identifies gitHead `3d290d25d0b6a65852dd31aec125c97bc8ca6e2c` for all three exact packages. Npm tarballs omit LICENSE, but the [LICENSE at that exact commit](https://codeberg.org/freesewing/freesewing/raw/commit/3d290d25d0b6a65852dd31aec125c97bc8ca6e2c/LICENSE) was actually fetched (HTTP 200); its MIT copyright/permission notice is retained in `../tools/pattern-spike/FREESEWING-LICENSE.txt`. The [official commercial-use FAQ](https://freesewing.eu/docs/about/faq/commercial-use/) permits commercial pattern use. These are primary rights evidence for the engine/design code, not rights to unrelated photographs; independent rights review and notice propagation are still release gates. Earlier network-failure paragraphs below are historical, not the present installation state.

- [FreeSewing's developer portal](https://freesewing.dev/) calls its library open-source JavaScript, and the [archived monorepo](https://github.com/freesewing/freesewing) and [current core package page](https://www.npmjs.com/package/@freesewing/core) identify MIT code. This **does not, by itself, establish the exact installed Sandy/Tina package version, the license of each design asset or documentation/photograph, or Stitches' right to redistribute generated pages**. Record the exact package `LICENSE`/notices and output terms before inclusion. Do not copy their photographs or instruction prose into the app merely because engine code is MIT.
- Read-only `npm view @freesewing/sandy` first hung; bounded retry returned `ECONNRESET` before TLS to `registry.npmjs.org`. `git ls-remote https://codeberg.org/freesewing/freesewing.git HEAD` returned `SSL_ERROR_SYSCALL`. A narrow elevated read-only npm retry was **not executed** because automatic approval review disconnected; this was not a safety rejection. No package was installed or engine draft run. Reattempt through an approved network path when available, without using an untrusted mirror or inventing a version.
- The next FreeSewing spike must use one exact design/package version and two distinct measurement/option inputs, capture complete measured outputs, stable piece/edge/notch bindings, deterministic hashes and a source/rights record. Source-authored cutting descriptions alone cannot satisfy `pattern_mapped` or `cut_checked`.
- A second-person rights review and physical print/make review remain unperformed. Do not mark either candidate qualified for cutting until those gates are actually met.

## Proposed two-project educational journey (not yet live content)

1. Choose Sandy or Tina, confirm actual version and material/equipment, then collect only required measurements. Until exact source/engine qualification, show plan-only questions and original source links.
2. Prepare through the source's conditional cut list: Sandy default versus seamless/fold and waistband choice; Tina mirrored fronts/back fold/optional sleeves. Unknown grain, notches, geometry or allowance stays visibly unknown.
3. At Sandy waistband or Tina sleeve insertion, open the authored step with its actual source/variant. A problem report asks a discriminating physical check before any correction.
4. Store the observation and attempted action in the private project. A failed attempt remains in history; returning to the project shows the next safe question rather than repeating a suggestion. No destructive action is authorized by this candidate map.

This map gives W03/W06 concrete content to author but is not yet source-reviewed diagnostic data in Sanity or a live Gemini response.
