# Page-specific KB correction rules

Latest result: the owner applied all four page-specific corrections plus the narrower diagnostic correction. Actual served review at 18:19:54Z passes 14/15 checks; only diagnostic source identities remain incomplete (test and remedy IDs absent). Its branches and uncertainty are correct again. Do not repeat these rules blindly or call the full gate passed. All actual snapshots are retained; the corrected planning pages and exact construction workspace can be used within their planning/learning scope.

Prepared October 2 after the owner confirmed all five earlier instructions are active and showed the Rewrite page dialog. These are instructions to paste into its lower **Rule** field, not evidence that a rewrite passed. Leave the optional explanation blank. Save & rebuild targets the currently open page. Do not change source selection, purpose, or rebuild the whole KB. Verify the actual served text afterward.

## Sandy Circle Skirt Planning & Piece Specs

```text
For this Sandy planning page, replace every inline numeric citation such as [1] or [7] with the exact source title and document ID in plain prose. Do not use numeric citation markers in the body. Attribute required measurements, woven material structure, pending review, and cutting caveat to Sandy circle skirt (companion-candidate-sandy-20261001). Attribute original documentation and designer Erica Alcusa Sáez to FreeSewing Sandy Circle Skirt documentation (companion-source-sandy-20261001). Keep all five piece rows with their exact IDs: companion-piece-sandy-skirt-default-20261001; companion-piece-sandy-skirt-seamless-20261001; companion-piece-sandy-waistband-curved-20261001; companion-piece-sandy-waistband-straight-20261001; companion-piece-sandy-waistband-interfacing-20261001. Preserve their authored conditions, counts, folds, mirroring and materials, all four required measurements, the mutually exclusive choices, and plan-only/pending status. Do not infer stretch, grain, allowances, yardage, fit or geometry. A separate appended Sources list is fine, but its positions must never be used as body references. This corrects attribution only; it does not approve cutting or physical making.
```

## Tina Faux-Wrap Top Planning & Piece Specs

```text
For this Tina planning page, replace every inline numeric citation with the exact source title and document ID in plain prose. Do not use [n] body references. Attribute required measurements, knit material structure, pending review and cutting caveat to Tina faux-wrap top (companion-candidate-tina-20261001). Attribute designer Jonathan Haas and the original documentation to FreeSewing Tina top documentation (companion-source-tina-20261001). Keep these exact piece IDs with their own rows: Overlapping front (companion-piece-tina-front-20261001), Front bottom (companion-piece-tina-front-bottom-20261001), Back (companion-piece-tina-back-20261001), Sleeve (companion-piece-tina-sleeve-20261001). Preserve all fourteen measurement names and each row's authored condition, count, fold, material and mirroring. Preserve optional sleeve and front-bottom choices. Keep plan-only/pending status and explicitly unknown stretch, grain, yardage and layout. Do not assume the order of an appended Sources list matches the numbers in the old prose. This is an attribution correction, not pattern or making approval.
```

## Seam Puckering Diagnosis & Scrap Testing

```text
Preserve the current three-way scrap-only branch: not-tested means perform the scrap-stitch-release test first; unchanged leaves the cause unresolved with no machine-adjustment recommendation; only relaxes permits a separate lower-tension sample comparison. Include the exact title and document ID of each record beside its own explanation: Does a test seam relax when the stitches are released? (companion-test-scrap-stitch-release-20261001); Thread tension may be contributing (companion-issue-tension-pucker-20261001); Cause remains unresolved (companion-issue-unresolved-pucker-20261001); Compare a lower-tension sample (companion-remedy-sample-lower-tension-20261001). The test ID is currently missing from the entry body and must be restored. Use these stable identities in prose, not numeric [n] markers. Keep Coats technical bulletin: Eliminating Seam Puckering (companion-source-coats-pucker-20261001), pending review and both candidates' applicability. Do not remove stitches from the actual garment. A failed or unbalanced comparison stops this path; no automatic repeated attempt or confirmed diagnosis follows.
```

## Tina Faux-Wrap Top Construction Sequence

```text
Correct Step 1, Read asymmetric markings (companion-making-tina-v1-marks), to say Diagnostic: no. Its exact constructionStep record has diagnostic=false; reading markings is not an eligible seam-puckering step. This supplied standalone record must retain its own source title and ID. Its orientation is sleeve x-notch at back and round notch at front; its checkpoint is Can you distinguish the sleeve front from its back? Keep all eight constructionStep IDs and their authored conditions, prerequisites, orientations and checkpoints. Optional dart, sleeve and lower-front nodes carry prerequisites through when omitted; omitted work is neither required nor completed. Do not convert study actions to physical sewing instructions. Use exact titles and record IDs in prose, never numeric [n] citation markers. Keep the pending learning envelope, unknown geometry/allowances and absence of physical review. This corrects the generated summary to the existing records; it does not change or approve those records.
```

## Verification

## Last diagnostic correction — use only on Seam Puckering

The first page-specific diagnostic rewrite restored the test ID but omitted the tension-hypothesis ID, reintroduced incorrect numeric references, and added the unsupported statement that unchanged puckering proves tension is not the issue. The exact records leave the cause unresolved. Use this narrower correction in that page's Rule field:

```text
Correct this diagnostic entry to the following exact decision contract. An unchanged scrap-stitch-release result means the cause remains unresolved; it does NOT prove that thread tension is not the issue and does NOT rule out tension. Remove that exclusion claim. Do not recommend a machine adjustment from unchanged or not-tested. Not-tested means perform the scrap-stitch-release test first. Only relaxes makes a separate lower-tension comparison eligible, on another scrap only; an unsuccessful or unbalanced result stops that path. Never unpick or alter the actual garment. Preserve pending review and the Coats origin. Remove ALL inline [1], [2], [3], [4], [5] and other numeric citation markers from the entry body; they currently resolve to different records in the appended list. Instead include these four exact title/ID pairs beside their own explanations: Does a test seam relax when the stitches are released? (companion-test-scrap-stitch-release-20261001); Thread tension may be contributing (companion-issue-tension-pucker-20261001); Cause remains unresolved (companion-issue-unresolved-pucker-20261001); Compare a lower-tension sample (companion-remedy-sample-lower-tension-20261001). The tension hypothesis pair must not be omitted. Do not add numeric test dimensions not present in the authored records. This rule corrects prose and attribution only and confers no physical approval.
```

The full body was inspected after each rewrite. The verifier accepts equivalent explicit test-first/garment-prohibition/conditional-prerequisite wording, without weakening those meanings, and additionally rejects the newly observed false exclusion of tension. A semantic failure remains a failure even when other fields pass.

Sandy's page-specific rule was saved by the owner. Actual Context read at 2026-10-02T18:06:51Z returned hash `aabea16528645152…`: no numeric body citations, all exact piece/candidate/source IDs, correct five rows/four measurements and retained pending/unknown material facts. The entire body was reviewed. The other three entries still had their prior hashes; their page-specific rewrites were requested together. A repeated appended Sources heading in Sandy is cosmetic and does not change its correct inline identities.

Run `node --experimental-transform-types --env-file=.env.local scripts/verify-companion-context.mjs` from Stitches. It reads actual Content Lake and Context, preserves immutable entry snapshots and fails on a remaining mismatch. A saved instruction, active badge, or completed job is not a substitute for this read-back. The page-specific workflow is observed in the owner's screenshots; no undocumented control-plane API is used.
