# Construction KB review — October 2, 2026

## Latest served result after targeted rewrites

Current result at 18:19:54Z: planning identities/rows/measurements/material limits and construction IDs/flags/optional prerequisites pass. The diagnostic's unsupported exclusion of tension is gone and its three-way scrap branches pass; test and remedy record IDs are still absent. **14/15 checks pass; the full gate is not closed.** Diagnostic snapshot `seam_quality-af2a4a6c2fa83c6c.md` was fully reviewed. No further repeat rewrite is requested in this batch. The exact notebook/diagnostic graph is unaffected. The actual preparation tools for both repaired planning pages pass a separate zero-inference live rehearsal.

Follow-up at 18:06Z: the page-specific Sandy rewrite repaired attribution while preserving exact rows/measurements/material limits. Its hash is `aabea16528645152…`; full body reviewed. Remaining three page-specific rules are prepared and requested together. The failures below describe the prior five-entry result and remain current for Tina Planning, Seam Puckering and Tina Construction until their served hashes change and pass.

Actual MCP reads at 17:31Z and 17:47Z confirm new hashes for all five targeted entries. Sandy construction attribution, all construction IDs and Tina conditional prerequisite explanations now pass. Tina marks is no longer described as absent, but the entry incorrectly says Diagnostic: yes for that step; the exact record has diagnostic=false. Its appended Sources list also omits the marks title, even though the body now includes the ID. Both planning pages retain incorrect numeric body citations; the diagnostic preserves branches but omits its test ID. Four automated checks fail. Exact planning rows and required measurements still match the actual catalog.

The owner supplied screenshots confirming all five manual rules are Active and showing seven entries. This is not a missing-save conclusion. The owner then opened the observed Rewrite page dialog: it is based on the selected entry's sources, offers an optional explanation and a lower Rule field, and Save & rebuild applies the rule to that page. Prepared concrete rules in KB-PAGE-CORRECTIONS.md; Sandy is the first requested trial. Do not repeat blind full rebuilds. Runtime action eligibility remains based on exact records, and the preparation agent refuses the defective planning attribution. A passing local graph test cannot qualify the served KB.

The owner triggered a full rebuild after 15 new Stitches/development construction sources appeared. Actual MCP captured outline `5b64d68945a13dd5…`: seven leaves, two groups of three and one shared seam-quality entry. Consolidation is reasonable; count is not an acceptance test. New paths replace older planning/fabric/diagnostic paths. Exact Content Lake and the private manual learning workspace are separate from generated KB prose.

## Observed failures

- `construction/sandy_circle_skirt` uses `[1]` for closure-seam facts, but its appended Sources item 1 is the plan, not that step. Similar mismatches recur. Do not derive record identities from these numbers.
- `construction/tina_faux_wrap_top` claims the first markings step was not supplied as a standalone source, although `companion-making-tina-v1-marks` exists and passed published read-back.
- Tina describes a strict mandatory 1→2→…→8 chain. The authored graph has conditional dart, sleeve and lower-front nodes; disabled nodes carry their prerequisites through, rather than becoming completed or compulsory actions.
- Some “study” actions become imperatives to sew. All these records remain pending learning summaries, not complete physical instructions.

Actual immutable captures are under `evidence/context-construction-review`. Do not edit them or overwrite source facts to match a generated entry. A successful rebuild alone is not editorial approval.

## Source-scoped instruction ready for the dashboard

In Stitches KB `kbkvu1vrPsLG` → Instructions, create a rule selecting **only the 15 construction sources** below. Use this exact text:

> These records are pending-review construction LEARNING plans. Preserve their plan envelope, named pieces, orientation and checkpoint questions without converting a study action into an instruction to physically sew, trim, cut or alter a garment. In construction entries, attribute claims with the exact source title and record ID; do not generate numeric [n] citation markers, because appended Sources order is not a reliable record mapping. The Sandy plan record is companion-making-sandy-v1; it references five supplied constructionStep records. The Tina plan record is companion-making-tina-v1; it references eight supplied constructionStep records, INCLUDING Read asymmetric markings (companion-making-tina-v1-marks). This marks step must not be called absent: its sleeve x-notch is at the back, round notch at the front. Describe optional dart, sleeve and lower-front steps only when their authored condition applies. When a conditional node is absent from the confirmed version, recursively carry its prerequisites through to the next included step; do not require the omitted physical action or mark it completed. Preserve the authored prerequisite order among included nodes. Do not invent allowances, exact notch mates, closures outside the plan envelope, generated geometry, quantities, fit or material prescriptions. Unknowns require the selected source pattern or independent maker review. All checkpoints record understanding, not verified sewing or cut readiness.

Selected sources:

- Sandy: closure to hem — `companion-making-sandy-v1`
- Understand the closure seam — `companion-making-sandy-v1-closure-seam`
- Plan the opening — `companion-making-sandy-v1-opening`
- Connect skirt and straight band — `companion-making-sandy-v1-band`
- Understand the waistband finish — `companion-making-sandy-v1-band-finish`
- Compare hem finishes — `companion-making-sandy-v1-hem`
- Tina: markings to finishes — `companion-making-tina-v1`
- Read asymmetric markings — `companion-making-tina-v1-marks`
- Understand the optional dart — `companion-making-tina-v1-dart`
- Join the shoulder relationship — `companion-making-tina-v1-shoulders`
- Follow the neckline binding — `companion-making-tina-v1-neck`
- Place the flat sleeves — `companion-making-tina-v1-sleeves`
- Understand overlap and lower front — `companion-making-tina-v1-front-bottom`
- Connect sides and underarms — `companion-making-tina-v1-sides`
- Plan waist and arm finishes — `companion-making-tina-v1-finishes`

Save, then rebuild only **Sandy Circle Skirt Construction Sequence** and **Tina Faux-Wrap Top Construction Sequence**. No purpose change, dataset change or whole-KB rebuild is required for this rule. Verify actual served prose and provenance afterward. Keep this gate pending until that read-back passes; do not promote the manual workspace into guided-making authority.
