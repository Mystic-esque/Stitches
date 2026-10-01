# Visual references — current Companion 2.0 and historical Studio 1.0

The current concept is [stitches-companion.html](stitches-companion.html). Open it directly in a browser. It illustrates a premium project-first home, genuinely different project candidates, a technical pattern-connected workbench and a step-specific “I'm stuck” flow. The browser-only controls select pieces, toggle an illustrative change overlay and answer one diagnostic question. All pattern shapes and sewing advice are explicitly educational examples; they are not cut-ready and make no API calls. Run `node scripts/check-companion-reference.mjs` from the repository root to save isolated Chrome screenshots under `screenshots/companion/` and a `companion-verification.json` report. The source-qualification, guest state, live Sanity and agent behavior are specified in the docs and not simulated here.

The hero and two garment cards use locally saved original generated editorial photographs; see [ASSETS.md](ASSETS.md). They are not actual sewn Stitches samples or evidence that the illustrated flat pieces make those garments. The production catalog needs rights-cleared photos of qualified source designs.

The September 29 Studio 1.0 reference below is preserved for historical comparison. Its six cards and simplified pieces mode are **not** the current UI or collection requirement; do not port its scripted domain behavior into production.

Open stitches-studio.html directly, or run `node scripts/check-design-reference.mjs --serve` from the Stitches root and open http://127.0.0.1:4175. The server is local only.

Screens: #landing, #collection, #studio, #fabric, #make, #inspiration. Try collection filters; garment/pieces/assembly; front/back; piece selection; length/pocket changes; the scripted assistant example; mobile Design/Assistant sheets; three Make steps; and local photo preview/sample matching.

This is an inspectable product-design reference, not the new application. Art is original code-native SVG. No real pattern drafting, 3D, AI inference, content retrieval, fabric verification, project persistence or upload happens. Skirt cards are proposed concepts and open a concept view, not incorrect top controls. All sample analysis/results are labeled. The production behavior is specified in ../docs/DESIGN.md, ../docs/EXPERIENCE-CONTRACTS.md and ../devpost/spec.md.

`node scripts/check-design-reference.mjs` launches isolated local headless Chrome, checks six screens at five widths, exercises selected reference controls, checks reduced motion/no external requests, saves actual captures in screenshots/ and reports in verification.json. Browser captures are evidence of the reference only. They are deliberately outside the existing production/fixture evidence/screenshots directory.

Use this reference as the baseline for spacing, hierarchy, color, object-led composition and task focus. Do not import its sample geometry or scripted answers into production code. Fonts use system fallbacks; no external assets or dependencies are downloaded.
