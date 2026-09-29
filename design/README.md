# Studio 1.0 visual reference

Open stitches-studio.html directly, or run `node scripts/check-design-reference.mjs --serve` from the Stitches root and open http://127.0.0.1:4175. The server is local only.

Screens: #landing, #collection, #studio, #fabric, #make, #inspiration. Try collection filters; garment/pieces/assembly; front/back; piece selection; length/pocket changes; the scripted assistant example; mobile Design/Assistant sheets; three Make steps; and local photo preview/sample matching.

This is an inspectable product-design reference, not the new application. Art is original code-native SVG. No real pattern drafting, 3D, AI inference, content retrieval, fabric verification, project persistence or upload happens. Skirt cards are proposed concepts and open a concept view, not incorrect top controls. All sample analysis/results are labeled. The production behavior is specified in ../docs/DESIGN.md, ../docs/EXPERIENCE-CONTRACTS.md and ../devpost/spec.md.

`node scripts/check-design-reference.mjs` launches isolated local headless Chrome, checks six screens at five widths, exercises selected reference controls, checks reduced motion/no external requests, saves actual captures in screenshots/ and reports in verification.json. Browser captures are evidence of the reference only. They are deliberately outside the existing production/fixture evidence/screenshots directory.

Use this reference as the baseline for spacing, hierarchy, color, object-led composition and task focus. Do not import its sample geometry or scripted answers into production code. Fonts use system fallbacks; no external assets or dependencies are downloaded.
