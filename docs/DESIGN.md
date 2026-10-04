# Stitches Companion 2.0 — visual and interaction standard

This supersedes the September 29 Studio 1.0 reference. See ../design/stitches-companion.html for the current visual target and DIRECTION-REVIEW.md for why. The old ../design/stitches-studio.html and earlier screenshots remain historical explorations, not implementation contracts. Design does not establish garment/pattern validity.

## Creative direction
Stitches should feel like a knowledgeable maker beside the cutting table: warm editorial invitation outside the workbench, precise dark technical canvas within it, tactile fabric photography, disciplined typography, and calm next actions. The older “pattern connected” screen correctly showed why the tool matters—flat technical pieces, fold/cut notes, grain direction and changed-edge consequences. Preserve and improve that literacy. Do not replace it with a mannequin and a list of named parts.

The interface centers **a project and its next useful action**, not a gallery-as-product or a blank chat. The earlier dark screen is not a layout mandate: test the best arrangement for each task, including a single large technical piece or step-focused mobile sheet. Use clearly different garment silhouettes and making problems. Cards cannot be the same blouse recolored. A beautiful photograph is supporting context; it never certifies a cut pattern.

## Information architecture
Public: landing → distinct projects gallery → own-idea intake. Private guest: library → project workspace with Overview, Pattern, Materials, Make and Check focus views. A collapsible companion dock can sit beside the active work on desktop and become a help sheet on phone. It is a working partner, not the only content or a generic empty chat. A project can navigate freely; only validated operations change capability/readiness.

## Landing
A strong garment photograph and technical flat-piece detail share the hero, visually communicating “from the thing you imagine to the pieces and decisions that make it.” Headline: “From idea to the last stitch.” Support: “Understand the pattern, prepare your materials, and get help right where you are.” Primary action “Start a project”; secondary “See how it works.” Within one screen, show three proof moments: annotated piece/fold, a focused sew step, and a contextual “I'm stuck” diagnosis. No fake statistics, badges, AI omniscience or sign-up prompt.

The current reference now uses two original generated editorial garment photographs instead of SVG silhouettes in its hero/qualified-candidate cards; their provenance is in ../design/ASSETS.md. These are art-direction studies, **not** proof that the pictured designs have qualified patterns. Production imagery should come from rights-cleared photographs of the actual qualified garments, preferably front/back/detail and a maker's process. Technical SVG remains appropriate for flat-piece and seam diagrams.

## Gallery and intake
At least two **different** qualified construction projects, each with a distinct silhouette and educational challenge. Show a finished front view plus a small flat-piece inset, difficulty/technique, material fit, capabilities and source/rights. An editorial inspiration example may be planning-only and says “Bring a pattern to cut.” Color and length are options inside the project detail, not filler cards. Filters are capability/technique/material/equipment, not colorway. An upload is a clear optional branch: “Explore my reference” → consent → editable observations/unknowns → matching or planning project. No “instant pattern from photo.”

## Project overview
Top: project title, source and capability chip, current step, last action and next check. A thin progress rail spans Plan / Prepare / Make / Check / Continue; it is not a gamified completion percentage. Left/top context records confirmed garment, material, equipment and measurements with privacy cues; main area offers next eligible action and a visual project map. Change basis/history is visible. A planning-only project shows what it can do now and what source information is needed to unlock exact cutting.

## Pattern-connected workbench — signature
Desktop: three purposeful regions. Left narrow rail: finished garment view (front/back), piece inventory A/B/C with count and selection, project capability. Center large dark canvas: actual flat technical outlines and matching seam edges; explicit cut line versus stitching line; on-fold bracket, grain arrows, notches, mirror/cut quantity, labels, scale and measurement units. Right inspector: “why this shape,” current selection’s mating edge and next assembly step, chosen change’s before/after dimensions and effects. Never make the technical shapes too small to read. The inspector can switch to Sources, which distinguishes reviewed fact from inference.

Selecting garment region highlights its corresponding flat piece and relevant step. Selecting a seam shows both mating edges, side/orientation and source-backed allowance/ease. A supported adjustment overlays original dashed and proposed solid edges, highlights all changed shapes and presents affected pieces, fabric/cutting and instructions before Keep. A decorative color highlight without actual geometry/meaning is insufficient. Where the data is illustrative, show an “Educational diagram—do not cut” band and remove export action.

The production pattern board renders a versioned measured artifact, not hand-authored presentation SVG as its data model. Every selectable region/edge/notch carries a stable semantic binding back to the artifact and active source/step; keyboard and accessible names expose the same meaning. The static concept SVGs intentionally lack this engine binding and must remain visibly illustrative until W01/W05 qualification.

Use an optional 3D assembly tab only if it preserves exact IDs and provides educational value. Reduced-motion/keyboard/2D fallback must be equally informative. Do not make 3D the release gate or label it a fit simulator.

## Prepare
Present a readiness table organized by Pattern / Measurements / Material / Tools / Cutting. Each row states confirmed, missing, incompatible, checked or source-pending and why. For qualified patterns, a fabric layout can reveal fold/selvage/grain, cut counts and placement assumptions; distinction between “no placement found” and impossible is explicit. The source, print-scale check and physical review status stay visible. For planning-only projects, provide a practical checklist without invented numbers.

## Make
One focused step per view. Heading is an action, not a generic phase. Show exact involved pieces, which sides face, start/end seam markings, micro-actions in order, diagram, and “Check before you continue.” A maker can enlarge the diagram, compare technical piece and finished garment, switch between beginner/concise explanation, save a note, pause or mark done. “I'm stuck at this step” is persistent and opens a context-bearing panel. The next step is determined by authored prerequisites, not a hardcoded list.

## Check / “I'm stuck”
A side sheet begins with the actual step, affected pieces and what the maker has already done. Show a short symptom picker plus free text, then one discriminating question at a time (e.g., “Do these notch marks line up at the stitch line?”) and simple ways to check. Optional close-up photo can supplement observation after consent; no full-body image is required by default. Results appear as “Possible cause,” “Why this is plausible,” “Check next,” “Safe action,” and “When to stop/ask a person.” A remedy is confirmed only by the maker. Never show unexplained confidence percentages or authoritative fit certification.

## Assistant
The assistant is a collapsible contextual dock/activity rail, not a generic central chatbot. Its prompts are actions: “Check whether this piece is on fold,” “Compare two ways to finish this seam,” “What changed since I kept this version?” It displays real tool/check progress, task-bound context, relevant source IDs and gaps, with result cards for reviewable objects. It never implies an action completed merely because Gemini described it. Manual controls remain available on model outage.

## Visual language
Use a warm neutral shell (paper #F4F1E9, surface #FFFEFA, dark ink #232A27) with deep forest/navy technical canvas (#151E1D), sage (#A9BA99) for joined/checked, coral (#E68D75) for changed geometry, pale yellow (#E6D8A4) for fold/grain labels, and blue (#91B7CA) for a second seam family. Color is paired with text/shape, never alone. Typography: editorial serif for hero/project headings, highly legible sans for controls, monospaced labels for dimensions/IDs. Large high-contrast diagrams, deliberate whitespace, 44px touch targets and visible focus. Avoid glass cards, gratuitous gradients, rainbow tags, tiny technical notes and stock chatbot chrome. Assets require source/rights records. Do not use the unaesthetic illustrative blouse as the marketing hero.

## Responsive and access
At 1440/1024 desktop, pattern canvas dominates with collapsible rails. At 768 tablet, inspector becomes dockable. At 390/320 phone, one full-width focus at a time: garment / pieces / selected seam / active step; bottom task navigation and a contextual sheet. A user can still find fold, grain, count and changed edges on mobile. Controls have semantic labels, keyboard traversal, zoom, text alternatives for diagrams, adequate contrast and reduced-motion behavior. No critical fact lives only in hover or animation.

## Verification rubric
Compare actual production screenshots—not only the static reference—at 320, 390, 768, 1024, 1440; inspect diagram readability and overflow. Complete browse → project → selected pattern piece → prepare → active step → problem/test → continue, including unsupported/photo/model-offline states. Test with novice and experienced makers, record confusion and actual outcomes. Screenshot labels state whether they are design reference, fixture or live runtime.
# Workspace visual addendum (approved October 4, 2026)

The project surface uses a quiet, warm technical workspace: stable project header, focus navigation for Overview/Pattern/Materials/Make/Check, large instructional center and a collapsible contextual companion dock. On narrower screens the dock becomes a help sheet rather than compressing the pattern canvas. Source receipts and model traces are inspectable, not the default reading surface. Show only real controls, authored marks and actual state transitions; never borrow unsupported precision from the supplied concept mockups. A selected fold, mirrored pair, edge, prerequisite or test must be labelled in text as well as color. Touch controls target at least 44 px; verify keyboard, reduced motion, contrast and 1440/1024/768/390/320 layouts with actual captures. The staged interaction and future CAD/photo/3D design are specified in `WORKSPACE-AGENT-DIRECTION.md`.
