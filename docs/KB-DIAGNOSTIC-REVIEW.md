# Stitches KB diagnostic review — October 1, 2026

The actual `stitches-garments` MCP now serves `sandy_skirt`, `tina_top` and `seam_puckering` under the saved Companion purpose. This establishes served entry presence, not a verified 32-document import count or a maker-reviewed product.

## Observed error and source correction

The first served diagnostic allowed a not-tested sample to proceed to the tension comparison. The authored graph requires the scrap-stitch-release test first, and allows the separate comparison only after `relaxes`. Two fields in Stitches `l4eeamth/development` were corrected with revision guards and a saved pre-write backup. Live read-back passed, and both distinct candidate fingerprints changed. All six diagnostic records remain pending review.

The owner triggered change detection (reported exactly two changed sources), then rebuilt only the diagnostic entry. The subsequent actual MCP read recovered the three-way branch, Coats attribution and pending-review disclosure. Its numbered references still mismatch its appended source list: the tension claim uses [1] while source 1 is the unresolved issue; test and remedy references also swap identities. Do not represent this entry as editorially verified until attribution is repaired and the served result is checked again.

## Source-scoped instruction ready for the dashboard

In this KB only, add a manual instruction and anchor it to these four sources:

- Cause remains unresolved
- Thread tension may be contributing
- Does a test seam relax when the stitches are released?
- Compare a lower-tension sample

Instruction text:

> Preserve the exact diagnostic branches: not-tested means perform the scrap-stitch-release test first; unchanged leaves the cause unresolved; only relaxes makes the separate lower-tension comparison eligible, and that comparison is on another scrap only. State pending review and the Coats technical bulletin origin. Attribute claims inline using the exact source record title and document ID, instead of numeric [n] markers whose appended Sources order must not be assumed. The tension hypothesis is “Thread tension may be contributing” (companion-issue-tension-pucker-20261001); the unresolved hypothesis is “Cause remains unresolved” (companion-issue-unresolved-pucker-20261001); the test is “Does a test seam relax when the stitches are released?” (companion-test-scrap-stitch-release-20261001); the comparison is “Compare a lower-tension sample” (companion-remedy-sample-lower-tension-20261001). Do not treat these as maker-approved instructions or authorize altering the actual garment.

After saving, rebuild only `seam_puckering` and inspect the served text. The application of this prepared instruction is verified below; do not repeat it for this unchanged entry.

### Verified application of this instruction

The owner reported saving the four-source instruction and completing the second diagnostic rewrite. The live MCP read at 2026-10-01T16:03:23Z (17:03 Lagos) now uses the correct title and record ID for each test, issue and remedy, contains no ambiguous inline numeric references, and preserves the safe branches, Coats origin and pending status. The complete served snapshot is `evidence/context-companion-review/seam_puckering-57df87467c98fa82.md`. This repairs diagnostic attribution; the separate Sandy/Tina numeric references still need review. Source review remains pending and maker/cutting readiness is not established.

A repeat actual read at 2026-10-01T16:12:13Z passed all six automated checks, including the new stable-source identity check, and returned the same diagnostic hash. The dated report is `evidence/context-companion-review/review-2026-10-01T16-12-13-590Z.json`. Planning citation review remains explicitly open in this report.

## Local verification

Run from the Stitches folder, with credentials already in `.env.local`:

```
node --experimental-transform-types --env-file=.env.local scripts/verify-companion-context.mjs
node --experimental-transform-types --env-file=.env.local scripts/correct-companion-diagnostic.mjs
```

The correction script defaults to dry-run and now reports zero changes. The verification script preserves actual hash-named entry snapshots and reports safety checks separately from citation identity review. Its checks recognize both the original paragraph branch and the rebuilt table branch; a wording change does not waive the test-first requirement. A passed automated check does not confer maker review or cutting readiness.

The ordinary CLI inspection timed out at its 120-second bound; a repeat from outside the Studio configuration timed out at 180 seconds. Browser and native computer-use initialization also timed out, including the newly opened window. No unobserved click, invented control-plane endpoint, or CLI mutation was used. Source correction used the documented Sanity client transaction/ifRevisionId API; the KB refresh/rebuild was performed by the owner.

References: [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases), [Keep a Knowledge Base current](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base), [Context CLI](https://www.sanity.io/docs/cli-reference/cli-context), [Sanity client revision guards](https://github.com/sanity-io/client#patch-a-document-only-if-revision-matches).
