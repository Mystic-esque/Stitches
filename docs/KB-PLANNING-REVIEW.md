# Stitches planning-entry attribution correction

The actual Sandy and Tina entries preserve the planning facts but their inline [n] references do not consistently match the appended Sources titles. Apply the same stable source-identity approach that repaired the diagnostic. This is a prepared instruction; saving and actual served verification are separate steps.

In Stitches KB `kbkvu1vrPsLG` only, create a manual instruction and select these thirteen sources (the two planning candidates, nine pieces and two origins):

- Sandy circle skirt
- Skirt section
- Seamless skirt section
- Curved waistband
- Straight waistband
- Waistband interfacing
- FreeSewing Sandy Circle Skirt documentation
- Tina faux-wrap top
- Overlapping front
- Back
- Sleeve
- Front bottom
- FreeSewing Tina top documentation

Instruction text:

> Attribute each planning claim to its exact source record title and document ID from the supplied source. Do not generate numeric [n] markers in the body, because the appended Sources list order must not be assumed. For each cut-list row, cite that planningPiece record's exact ID; cite the planningCandidate record for its required measurements, material structure and cutting caveat, and name the original FreeSewing documentation. Preserve authored cut counts, fold/mirroring/material conditions and optional choices exactly. Do not combine mutually exclusive options or invent grainlines, seam allowances, dimensions, yardage, fit predictions, geometry or source IDs. Preserve pending review and plan-only status: these are educational records, not maker-approved patterns or cut-ready cutting instructions.

After Save, rebuild the three affected entries `fabric_constraints`, `sandy_skirt` and `tina_top` (one entry at a time). Leave the verified diagnostic unchanged; do not rebuild the whole KB. The implementing agent must then read all three complete served entries, compare their piece/measurement/condition/material facts to the exact development catalog, and check every stable record ID. Do not equate a dashboard success toast with served-result proof.

## Additional affected entry confirmed

The owner reported that Sanity's instruction check flagged Fabric & Material Constraints as well as the two planning entries. An actual Context MCP read on October 1 confirmed this shared page uses the selected planning sources and has mismatched numeric attributions: Sandy's woven claim cites [2], which its appended list labels Tina; Tina's knit claim cites [3], which the list labels Sandy documentation. The new instruction legitimately applies to this page too. This is an attribution contradiction, not evidence that the supplied instruction should be removed or the declared fabrics changed. All three rewrites remain pending served-result verification.

## Served review after the three rewrites

Actual Context reads at 2026-10-01T16:25:28Z confirm repaired source IDs in all three entries. All nine cut-list rows match the exact published catalog's conditions, counts, folds, materials and mirroring; both measurement lists are preserved. Sandy/Tina planning attribution checks pass. The diagnostic remains unchanged and passes its six checks.

The fabric entry adds a new unsourced Material structure implications section: no inherent stretch, critical grain direction, stretch required for fit, and sufficient stretch across the fourteen measurements. Those details are not in the selected exact planning/source records; a documentation link alone does not supply their missing numeric/applicability evidence. The full gate fails rather than trusting these additions. Snapshot: `evidence/context-companion-review/fabric_constraints-382a21dec81f9cb6.md`.

### Additional source-scoped material rule

Select only Sandy circle skirt, Tina faux-wrap top, FreeSewing Sandy Circle Skirt documentation and FreeSewing Tina top documentation. Save this additional rule and rebuild only Fabric & Material Constraints:

> For the Fabric & Material Constraints entry, report only the materialStructure, requiredMeasurements and cuttingCaveat facts explicitly authored in each planningCandidate record. Cite that exact candidate ID and its exact source title/ID. A source URL or locator is provenance, not additional source text. Do not add a Material structure implications section or infer inherent stretch, required stretch percentage, grain direction, drape, ease, fit, shrinkage, substitution, yardage or layout rules from the words woven or knit. When those facts are not authored in the supplied records, state that they are not specified and require source qualification. Preserve pending review, plan-only status and the existing prohibition on cutting from these records. Do not alter the authored woven/knit declarations or measurement lists.

The owner saved the four-source rule and completed the targeted rewrite. The actual MCP read at 2026-10-01T16:31:08Z passed all eleven checks. Full review of `fabric_constraints-5cfb6f3342087426.md` confirms the unsupported implications are removed, the authored declarations/lists/caveats remain, and missing stretch/grain/fit/layout facts are explicitly unknown. Sandy/Tina rows and source identities still pass and the verified diagnostic is unchanged. This is an editorial recovery, not maker/geometry qualification; the raw failed fabric snapshot remains preserved.
