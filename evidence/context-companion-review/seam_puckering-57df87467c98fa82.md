# Seam Puckering Diagnosis & Scrap Testing

Seam-puckering observation, thread-tension diagnostics, scrap-fabric sample testing procedure, conditional sample-only comparison, remedy steps, and applicability to Sandy and Tina garments

Seam puckering on Sandy circle skirt and Tina faux-wrap top is tracked under two pending-review issue patterns, both sourced from the Coats technical bulletin: *Eliminating Seam Puckering* (`companion-source-coats-pucker-20261001`).

## Diagnostic branch: scrap-stitch-release test

**Test record:** "Does a test seam relax when the stitches are released?" (`companion-test-scrap-stitch-release-20261001`) — status: **pending review**.

Use scrap material only — never the actual garment pieces. Sew a short sample with the same machine, thread, and settings as the target seam. Carefully release both threads along a small section without pulling or damaging the fabric; compare the released and still-stitched sections. Stop immediately if the sample fabric is being damaged.

Three possible outcomes govern what happens next:

| Outcome | Meaning | Next step |
|---|---|---|
| **not-tested** | No controlled sample has been run | Perform the scrap-stitch-release test first; do not proceed to tension comparison |
| **unchanged** | Ripples remain after stitches are removed | Cause remains unresolved; do not recommend a machine adjustment |
| **relaxes** | Ripples flatten when stitches are released | Thread tension may be contributing; lower-tension sample comparison becomes eligible |

## Issue pattern A — Thread tension may be contributing

**Record:** `companion-issue-tension-pucker-20261001` — status: **pending review**.

Observable symptom: ripples appear along a newly sewn test seam and relax when stitches are removed from a short sample section. Applies to both Sandy circle skirt and Tina faux-wrap top (planning candidates).

A relaxed sample suggests tension as a contributor but does not establish it as the only cause. **Do not unpick a finished garment from this result alone.**

When this issue is active (outcome = *relaxes*), the lower-tension sample comparison remedy becomes eligible (see below).

## Issue pattern B — Cause remains unresolved

**Record:** `companion-issue-unresolved-pucker-20261001` — status: **pending review**.

Observable symptom: a test seam still ripples after a short stitch section is removed, or no controlled sample has been tested at all. Applies to both Sandy circle skirt and Tina faux-wrap top.

Other causes to consider include material structure, feeding, and needle/thread choice. **Do not recommend a particular machine adjustment without another check.** Return to the scrap-stitch-release test or seek another cause.

## Remedy — Compare a lower-tension sample

**Record:** `companion-remedy-sample-lower-tension-20261001` — status: **pending review**.

**Eligibility requirement:** the scrap-stitch-release test result must be *relaxes*. If the result is *not-tested* or *unchanged*, this comparison is not eligible.

Safe action (scrap only): on another scrap seam, try a modestly lower upper-thread tension while maintaining a balanced stitch. Change one setting at a time and compare with the original sample.

Confirmation check: does the new sample lie flatter while both sides still form a balanced, secure stitch? If not, stop this path and seek another cause.

This is a test-sample experiment only — not authorization to alter, unpick, or restitch the finished garment.

## Applicability

Both planning candidates are explicitly linked to these records:
- Sandy circle skirt (`companion-candidate-sandy-20261001`)
- Tina faux-wrap top (`companion-candidate-tina-20261001`)

All four records carry **pending review** status. They support education and planning, not maker-approved patterns. Do not treat any step here as cleared for real-garment changes without measured, printed, maker-checked evidence.

## Sources

1. Cause remains unresolved — Dataset
2. Thread tension may be contributing — Dataset
3. Does a test seam relax when the stitches are released? — Dataset
4. Compare a lower-tension sample — Dataset

