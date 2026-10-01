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
