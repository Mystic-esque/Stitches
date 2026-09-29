# Stitches — design system and experience specification

Studio 1.0 • September 29, 2026. This replaces the former reference as the current visual and interaction contract. The historical reference is preserved. The new interactive reference is ../design/stitches-studio.html. Its values and calculations are illustrative; it is a design artifact, not implementation evidence. EXPERIENCE-CONTRACTS.md specifies full screen states and journeys beyond the reference. The reference demonstrates one top workflow and six collection concepts, not qualified garment support.

## 1. Creative direction

**A modern atelier: expressive garments, precise tools, calm guidance.**

The garment is the visual hero. The interface feels designed for making: a generous work surface, tactile but clean materials, clear edge and piece relationships, and a useful assistant within reach. Premium means considered typography, excellent object rendering, coherent interactions, and finished states. Avoid ornamental metrics, generic dashboard cards, synthetic testimonials, oversized gradients, glass effects, decorative particle fields, and a chat-first home page.

Retain the warmth, serif identity, linen surfaces, olive actions, and terracotta changes from the existing app. Introduce deeper forest contrast, larger garment art, more editorial spacing, a tighter workspace, and more focused mobile views. Do not copy OpenAI branding or imply affiliation; the owner's comparison describes a quality bar.

## 2. Screenshot audit and decisions

Reviewed actual Explore desktop/mobile and Fit evidence screenshots, plus references/stitches-desktop.png.

| Observation | Decision | Verification |
| --- | --- | --- |
| Warm identity and quiet line work already distinguish the app | Preserve palette family and wordmark; deepen contrast | Compare side by side with historical reference |
| Current supporting labels are often visually tiny | 15–16px main text; 13px support; 12px only for metadata | Inspect actual 100% screenshots, not just resized thumbnails |
| Fit canvas extends down beside a long explanation column | Viewport-focused canvas; scroll inspector independently; collapse evidence | No large blank field caused by text length |
| Garment is mostly a flat shirt outline | Lighted construction object, front/back/side and disassembly; honest preview label | Same selected part and option state in 3D and 2D |
| Sidebar repeats garment/project information | One project header; narrow tool rail; optional piece tray | No duplicate garment summary above the active task |
| Sanity IDs, fingerprints, and caveats fill the work area | Plain status and short pattern-note links; details in evidence drawer | Important limits still visible at acceptance/export |
| Mobile is a long stack of desktop panels | Canvas + one task sheet; dedicated full-screen Make mode | Current step/action reachable without scrolling through project context |
| No discovery or meaningful starting decision | Landing, collection, details, inspiration match | A new visitor can choose a supported look without knowing pattern vocabulary |
| Existing note is technically persuasive but visually peripheral | In-context explanation connected to the selected seam/step | Source action opens exact supporting record trail |

## 3. Tokens

Use CSS variables in src/styles/tokens.css; no per-screen color inventions.

| Token | Value | Use |
| --- | --- | --- |
| paper | #F5F3ED | marketing and workspace base |
| surface | #FFFEFA | controls and inspector |
| ink | #242B25 | text |
| muted | #62695F | support text |
| forest | #294638 | primary action, deep feature panel |
| olive | #576448 | selected region and subtle accents |
| soft-olive | #E8EDDF | helpful context |
| terracotta | #A84E36 | changed geometry and deltas |
| pale-clay | #F6E7DE | change surface |
| rule | #D9DBD1 | boundaries |
| diagram-blue | #416A83 | optional second seam family, paired with label |
| focus | #256E8C | visible keyboard ring on light surfaces |

Use 4px spacing base, with 8/12/16/24/32/48/64/96 intervals. Control radius 8px; cards 12px; large image surfaces 16px; pills only for compact filters/status. Borders 1px. Soft shadow only for floating controls/dialogs: 0 8px 32px rgba(30,40,28,.08). Avoid card-within-card nesting beyond one level.

Typography: editorial Georgia initially (regular/italic; system-available), practical system sans (Segoe UI/Arial). Production may self-host Instrument Serif and Manrope only with recorded licenses and visual revalidation; changing fonts must not collapse the layout. Wordmark italic 34px. Landing display clamp(48px, 5.4vw, 80px), line-height 1.02, tracking -0.04em; section heading 40/44; studio title 24/28; panel heading 22/27; body 15/23; controls 14/20 semibold; support 13/19; eyebrow 11–12px uppercase with .12em tracking, never long paragraphs. Input text at least 16px on phones.

Touch actions >=44x44px; desktop primary buttons 44px high. Color is not a sole state signal. Contrast must be measured for actual token pairs; target WCAG AA text/UI requirements. Default light theme is the reference bar. Carry an accessible dark palette only after light behavior is complete; it must be deliberately tested, not automatically inverted.

## 4. Information architecture

Routes: / (landing), /collection, /garments/[slug], /inspiration, /projects, /studio/[projectId], /studio/[projectId]/make. Studio stage in URL search parameter: explore/design/fabric. Selected piece, scene mode, and revision may be linkable without leaking measurements.

Global navigation: wordmark, Collection, How it works, My projects, Open studio/Continue project. No avatar, login, pricing page, or decorative notification counter.

Studio navigation: collection back link, project title/rename, saved/revision status, stage switcher, project menu. Primary stages: Explore / Design / Fabric / Make. Viewing modes inside Explore/Design: Garment / Pieces / Assembly. Make includes Prepare, Cut, Sew, Finish. Use task-level navigation, not eight competing top-level tabs.

## 5. Landing page

First viewport at 1440x1000:
- 72px header; 56px horizontal margins within 1328px max width.
- Left ~45%: eyebrow A PERSONAL STUDIO FOR THINGS YOU MAKE; headline “See how it’s made. Make it yours.” with the second line in editorial italic; two-sentence promise; Find your next make primary; Explore a garment secondary; understated “A creative workspace. No account needed.” Photo entry also lives in the global navigation.
- Right ~55%: one large garment construction object against pale sage, with a second flat panel offset behind it, a fine seam path, and a small grounded piece note. The hero demonstrates what the app does. Avoid a stock person unrelated to the actual catalog.
- Below: editorial strip “Find your starting point.” and three representative looks. Continue with three concise product scenes: See the pieces / Make it yours / Follow it through.
- One dark forest section introduces the assistant with the signature brief and a tangible proposal/cloth/step outcome, clearly tied to actual implemented behavior at release.
- Footer: project, source credits, data/storage information, accessibility/help. No fabricated customers, logos, statistics, ratings, or guarantees.

Primary landing CTA opens collection. Photo CTA opens the actual analysis flow when implemented, with manual matching recovery. Never leave a dead CTA in the release.

## 6. Collection and garment detail

Desktop collection: restrained title/subtitle, search by garment or property, filter chips (All, Tops, Skirts, Fewer techniques, Pockets) plus a More filters sheet. Three columns at >=1100px, two at 700–1099px, one at small widths. Image ratio 4:5. Card has ample garment area, title, family/preset descriptor, technique/fabric summary, and one explore affordance. Images use a consistent camera, lighting, ground, and scale. Variation can change fabric color, but preset distinction must be structural.

Target content: three top looks (base, longline pocket, alternate supported sleeve) and three skirt looks (base, midi, short or another qualified shape). The reference names these Everyday, Weekender, Artist, Sunday, Promenade and Daybreak. Final names/options follow actual adapter capability. Do not call six variants six unrelated patterns or count color-only changes as new looks.

Detail: large viewer left, narrative/options right; included pieces below; expandable measurements/materials/techniques and source notes. Make this design creates a draft. Study-only content, if retained for education, belongs in a separate clearly labeled collection and does not count toward the six supported looks.

## 7. Studio shell

At 1440px: 64px header, 56px stage/project row, remaining height as work surface. Grid: 64px tool rail / flexible canvas / 352px inspector. Inspector may scroll internally; canvas does not grow because source text is long. At 1024px: 48px rail / canvas / 312px inspector; collapse secondary detail. At 768–1023px use canvas and a collapsible inspector drawer.

Rail actions: view, pieces, measurements, history (text labels/tooltips with keyboard access). Canvas top left holds Garment / Pieces / Assembly. Top right holds front/back/side, zoom, reset; avoid duplicate controls. Bottom floating tray contains piece thumbnails and selected identity. Selection is a project interaction, so opening the assistant or switching views preserves it.

Inspector has two modes: Design and Assistant. Design shows preset, length, sleeve option, pocket choice, measurements summary, and a compact impact card. A persistent bottom area contains the next meaningful action: Review change / Keep version / Continue to Fabric. Source and technical evidence live in a drawer opened through “Why this changes” or “View checks.”

Canvas background is plain paper or subtle drafting dots in Pieces mode. No decorative ruler unless it corresponds to real scale. Cursor behavior distinguishes orbit, pan, and selection. Drag affordances have numeric controls as alternatives.

## 8. Construction viewer and motion

Use Three.js for orbit/panel selection/explosion/assembly. It is an educational construction preview with authored pose relationships, not a drape simulator. Selected panel has a thin outline and a gentle opacity change; other panels recede to 45–65% opacity when isolating a seam. Matching edge colors use labels such as S1, not a rainbow of every piece.

Explode moves each stable panel along authored vectors; assembly follows step poses/prerequisites. Preserve material orientation and the inside/outside distinction. Timeline shows the current step name; branches must not imply false order. Never tween through inverted panels just to create a pleasing transition.

Timing: 120ms hover, 180ms panel transitions, 280–420ms view/explode transitions; no constant rotation. Reduced motion uses instant pose changes. Pause rendering when hidden/idle; default device-pixel ratio cap 1.5 on phones, 2 desktop, with performance-based fallback. A poster/SVG view appears before WebGL is ready and remains usable on failure.

The production mesh must derive from a versioned preview adapter and shared pattern parameters. IDs map to actual pieces/edges. No independent AI image may be shown as the current accurate result. Catalog/hero renders can be authored art, but their attribution/status and design version must be explicit.

## 9. Design, measurements, and review

Measurements open a focused sheet: diagram, one or a small related group of inputs, cm/in switch, concise method, and next missing item. Show progress by required fields, never by guessed personal data. A measured-by note is optional; no mandatory gender field.

Length and pocket changes visibly affect both scene and piece shapes. During drag, local preview says Updating checks; after the server returns, replace it with actual results. Review card: “Longer hem · 1 patch pocket”; “Front/back length updated”; “Pocket added before side seams”; fabric status. Show changed values with units, original/proposed toggles, and a lock state for preserved features.

Keep version is distinct from Ready to cut. A retained review draft may still have incomplete making checks. Confirmation is for keeping the user's design, not for routine sliders.

## 10. Assistant

Collapsed: compact “Ask Stitches” entry with context-sensitive prompts: Explain this seam / Make it longer / Help it fit my cloth. Expanded: short conversation, structured brief summary, action progress, alternative cards, and result with Show change / Review proposal. Use a single brief field, not a decorative mock chat.

Activity labels describe observable actions: “Reading construction notes,” “Checking 6 cut pieces,” “Trying a shorter hem.” Never display hidden reasoning. Sources appear as “Pattern notes · 2 sources”; clicking reveals title, version, date/status, and relation. User-facing messages avoid raw KB paths.

Constraint alternatives use a small comparison: what changes, what stays locked, actual fabric result, additional technique, and choose action. A cancelled run ends with a stable recoverable state. A provider error stays local to the assistant panel.

## 11. Fabric, cutting, and package

Fabric canvas is a cloth rectangle with real dimensions, selvage/fold, piece instances, and labels. Inspector contains width/length, nap/grain, prewash/shrinkage assumptions and layout status. Unplaced pieces sit in a visible tray. Feasible has the actual checked length and assumptions; search failure offers a bounded retry or options comparison.

Prepare-to-cut is a sequence, not a paragraph dump: confirm revision; inspect checks; download; print calibration; assemble pages; verify piece counts and marks; prepare cloth; place and cut. Export sheet lists included files and readiness. A review-only package is visibly labeled on every relevant sheet. A disabled cut-ready export names the missing gate and opens its details.

## 12. Make mode

Desktop: diagram about 55% / focused instruction, with step list available as a drawer rather than a mandatory third column. Phone: compact project/stage header, full-width diagram about 28–35svh, action title and short steps, expandable detail, Previous / Mark done & next within reach. A production fixed action bar is permitted only with reserved space so it never covers instructions; the reference uses in-flow actions. No collection sidebar or fabric swatch above the step.

Every step has purpose, pieces, orientation, seam/allowance from the current version, method, action, and a check before proceeding. “Show seam” highlights it; “Explain more” adds context; “I’m stuck” opens the assistant with this step already selected. Completed work remains revisitable. A revision change shows specific steps requiring review.

Finish view celebrates the actual completed project modestly, offers notes/photo and a new version. No automatic fit certificate or rating.

## 13. Inspiration flow

Upload surface with one preview; right pane asks “What do you like about it?” (shape, sleeve, pocket, neckline). Analyze yields editable observations with uncertain items labeled “Not clear.” Comparison cards state visible similarities and differences. Label result “Starting points inspired by your photo.” No “pattern detected” claim.

Use a loading state that preserves the image and cancellation. Manual attributes remain available after quota/failure. Server limits and retention are stated near the upload control; no sensitive details go into Sanity.

## 14. Responsive and accessibility contract

Phone studio: 56px compact header, project title, stage switcher, canvas at roughly 44svh, then one active task sheet. Piece tray scrolls within its own labeled region; the page does not. Assistant opens as an accessible sheet with focus management and return focus. Make has a dedicated layout, not the entire desktop stack.

Use semantic buttons, tabs, labels, dialogs and status regions. Keyboard equivalent for every canvas action; visible skip link; focus ring never clipped; drag has alternatives. Announce completed checks and errors, not every slider tick. Unit errors associate to fields. Maintain reading order when panels move. 200% zoom and 320px layout remain usable.

## 15. Asset and content specification

Every garment needs consistent front/back/three-quarter preview, piece thumbnails, stable selection masks/bindings, optional exploded scene, and authored step diagrams. Diagrams show right/wrong sides, motion arrows, seam line, and piece labels. Reuse a diagram grammar rather than inventing one each step. Record creator, license, version, review status, and alternative text in Sanity.

Commissioned/generated concept art is only for clearly identified editorial/reference use. Production gallery should render supported configurations from the real scene or use authorized photographs of that exact made design. Do not imply a photorealistic render proves physical fit.

## 16. Visual release rubric

Score 0–2 on each: hierarchy, garment quality, typography, spatial composition, interaction feedback, state clarity, mobile focus, accessibility, cross-screen consistency, useful content. Target >=18/20 with no zero. This is a design review aid, not a fake automated metric. Record actual reviewer notes/screenshots.

Blocking defects: broken/dead primary CTA; unsupported gallery item presented as buildable; clipped text/focus; horizontal page overflow; illegible controls; a current garment image that disagrees with options; giant blank canvas beside prose; mobile desktop-stack regression; unlabeled sample numbers; model/KB errors shown as success.

Capture landing, collection, studio with selected seam, design comparison, fabric failure/alternative, export review, and current mobile sewing step. Validate at 1440x1000, 1024x900, 768x1024, 390x844, 320x720; keyboard and reduced motion. Compare against the new reference at 100% size, not only thumbnails.

